"""
orders/views.py
All order management views:
  - Cart (add, update, remove, clear)
  - Checkout (create order)
  - Stripe payment intent
  - Buyer order history and detail
  - Vendor order management
  - Admin order overview
  - Coupon validation
  - Commission records
"""
from decimal import Decimal
from rest_framework import status, generics, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.conf import settings

from .models import (
    Cart, CartItem, Order, VendorOrder,
    OrderItem, Coupon,
)
from vendors.models import CommissionRecord
from .serializers import (
    CartSerializer,
    CartItemSerializer,
    CartItemAddSerializer,
    CheckoutSerializer,
    OrderListSerializer,
    OrderDetailSerializer,
    VendorOrderSerializer,
    VendorOrderManageSerializer,
    CouponValidateSerializer,
    CouponSerializer,
    CommissionRecordSerializer,
)
from .services import (
    create_order_from_cart,
    confirm_payment,
    update_vendor_order_status,
    validate_coupon,
    apply_coupon,
)
from .filters import OrderFilter, VendorOrderFilter
from accounts.permissions import IsAdminUser, IsVendorActive, IsBuyer


# ═══════════════════════════════════════════════════════════════════════════════
# CART VIEWS
# ═══════════════════════════════════════════════════════════════════════════════

class CartView(APIView):
    """
    GET  /api/v1/orders/cart/    — Get current cart
    POST /api/v1/orders/cart/    — Add item to cart
    DELETE /api/v1/orders/cart/  — Clear entire cart
    """
    permission_classes = [IsAuthenticated]

    def _get_or_create_cart(self, user):
        cart, _ = Cart.objects.get_or_create(user=user)
        return cart

    def get(self, request):
        cart = self._get_or_create_cart(request.user)
        serializer = CartSerializer(cart, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        """Add or increment item in cart."""
        serializer = CartItemAddSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        cart    = self._get_or_create_cart(request.user)
        product = serializer.validated_data["product"]
        variant = serializer.validated_data["variant"]
        qty     = serializer.validated_data["quantity"]

        # Check if item already in cart — update quantity
        existing = CartItem.objects.filter(
            cart=cart, product=product, variant=variant
        ).first()

        if existing:
            new_qty = existing.quantity + qty
            # Re-check stock with combined quantity
            if product.track_inventory:
                available = variant.stock_quantity if variant else product.stock_quantity
                if available < new_qty:
                    return Response(
                        {"error": f"Only {available} unit(s) available in total."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            existing.quantity = new_qty
            existing.save(update_fields=["quantity"])
            cart_item = existing
            message   = "Cart updated."
        else:
            cart_item = CartItem.objects.create(
                cart=cart, product=product, variant=variant, quantity=qty
            )
            message = "Item added to cart."

        cart.refresh_from_db()
        return Response(
            {
                "message": message,
                "cart": CartSerializer(cart, context={"request": request}).data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request):
        """Clear all items from cart."""
        cart = self._get_or_create_cart(request.user)
        cart.items.all().delete()
        return Response({"message": "Cart cleared."})


class CartItemUpdateView(APIView):
    """
    PATCH  /api/v1/orders/cart/items/<id>/   — Update quantity
    DELETE /api/v1/orders/cart/items/<id>/   — Remove item
    """
    permission_classes = [IsAuthenticated]

    def _get_item(self, request, id):
        return get_object_or_404(CartItem, id=id, cart__user=request.user)

    def patch(self, request, id):
        item = self._get_item(request, id)
        qty  = request.data.get("quantity")

        if not qty or int(qty) < 1:
            return Response(
                {"error": "Quantity must be at least 1."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qty = int(qty)

        # Stock check
        if item.product.track_inventory:
            available = (
                item.variant.stock_quantity
                if item.variant
                else item.product.stock_quantity
            )
            if available < qty:
                return Response(
                    {"error": f"Only {available} unit(s) available."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        item.quantity = qty
        item.save(update_fields=["quantity"])

        cart = item.cart
        return Response(
            {
                "message": "Quantity updated.",
                "cart": CartSerializer(cart, context={"request": request}).data,
            }
        )

    def delete(self, request, id):
        item = self._get_item(request, id)
        cart = item.cart
        item.delete()
        return Response(
            {
                "message": "Item removed from cart.",
                "cart": CartSerializer(cart, context={"request": request}).data,
            }
        )


# ═══════════════════════════════════════════════════════════════════════════════
# COUPON VIEWS
# ═══════════════════════════════════════════════════════════════════════════════

class ValidateCouponView(APIView):
    """
    POST /api/v1/orders/coupons/validate/
    Validate a coupon code and preview the discount.
    Body: { "code": "SAVE10", "subtotal": "99.99" }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CouponValidateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        code     = serializer.validated_data["code"]
        subtotal = serializer.validated_data["subtotal"]

        coupon, error = validate_coupon(code, subtotal)
        if error:
            return Response({"valid": False, "error": error}, status=status.HTTP_400_BAD_REQUEST)

        discount = apply_coupon(coupon, subtotal)
        return Response({
            "valid":            True,
            "code":             coupon.code,
            "discount_type":    coupon.discount_type,
            "discount_value":   str(coupon.discount_value),
            "discount_amount":  str(discount),
            "new_total":        str(subtotal - discount),
            "description":      coupon.description,
        })


# ═══════════════════════════════════════════════════════════════════════════════
# CHECKOUT
# ═══════════════════════════════════════════════════════════════════════════════

class CheckoutView(APIView):
    """
    POST /api/v1/orders/checkout/
    Creates a full multi-vendor order from the user's cart.

    Flow:
      1. Validate checkout input
      2. Call create_order_from_cart() service
      3. Create Stripe PaymentIntent
      4. Return order + client_secret for frontend to confirm payment

    For development (no Stripe keys set), returns a mock client_secret.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data             = serializer.validated_data
        shipping_address = serializer.get_shipping_address()
        billing_address  = serializer.get_billing_address()
        coupon_code      = data.get("coupon_code", "")
        buyer_notes      = data.get("buyer_notes", "")

        # Create order
        try:
            order = create_order_from_cart(
                buyer            = request.user,
                shipping_address = shipping_address,
                billing_address  = billing_address,
                coupon_code      = coupon_code or None,
                buyer_notes      = buyer_notes,
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Stripe PaymentIntent
        client_secret   = None
        stripe_pi_id    = None
        stripe_error    = None

        stripe_secret = getattr(settings, "STRIPE_SECRET_KEY", None)
        if stripe_secret and stripe_secret.startswith("sk_"):
            try:
                import stripe
                stripe.api_key = stripe_secret
                intent = stripe.PaymentIntent.create(
                    amount      = int(order.total_amount * 100),  # cents
                    currency    = "usd",
                    metadata    = {
                        "order_id":     str(order.id),
                        "order_number": order.order_number,
                        "buyer_id":     str(request.user.id),
                    },
                )
                client_secret = intent["client_secret"]
                stripe_pi_id  = intent["id"]

                # Store PI id on order
                order.stripe_payment_intent_id = stripe_pi_id
                order.save(update_fields=["stripe_payment_intent_id"])

            except Exception as e:
                stripe_error = str(e)
        else:
            # Dev mode — no real Stripe
            client_secret = f"dev_secret_{order.order_number}"
            stripe_pi_id  = f"dev_pi_{order.order_number}"

        response_data = {
            "message":       "Order created successfully.",
            "order":         OrderDetailSerializer(order, context={"request": request}).data,
            "client_secret": client_secret,
            "stripe_pi_id":  stripe_pi_id,
        }

        if stripe_error:
            response_data["stripe_warning"] = (
                f"Order created but Stripe failed: {stripe_error}. "
                "You can retry payment confirmation."
            )

        return Response(response_data, status=status.HTTP_201_CREATED)


class ConfirmPaymentView(APIView):
    """
    POST /api/v1/orders/confirm-payment/
    Called after Stripe confirms the payment on the frontend.
    Body: { "order_id": "<uuid>", "payment_intent_id": "pi_xxx" }

    In development (no Stripe), call this directly to simulate payment.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        order_id          = request.data.get("order_id")
        payment_intent_id = request.data.get("payment_intent_id", "")

        if not order_id:
            return Response(
                {"error": "order_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order = get_object_or_404(
            Order,
            id=order_id,
            buyer=request.user,
            status=Order.Status.PENDING,
        )

        # In production, verify with Stripe that PI is actually paid
        stripe_secret = getattr(settings, "STRIPE_SECRET_KEY", None)
        if stripe_secret and stripe_secret.startswith("sk_") and not payment_intent_id.startswith("dev_"):
            try:
                import stripe
                stripe.api_key = stripe_secret
                intent = stripe.PaymentIntent.retrieve(payment_intent_id)
                if intent["status"] != "succeeded":
                    return Response(
                        {"error": f"Payment not completed. Status: {intent['status']}"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            except Exception as e:
                return Response(
                    {"error": f"Could not verify payment: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        order = confirm_payment(order, payment_intent_id)
        return Response(
            {
                "message": "Payment confirmed. Your order is now being processed.",
                "order":   OrderDetailSerializer(order, context={"request": request}).data,
            }
        )


# ═══════════════════════════════════════════════════════════════════════════════
# BUYER ORDER VIEWS
# ═══════════════════════════════════════════════════════════════════════════════

class BuyerOrderListView(generics.ListAPIView):
    """
    GET /api/v1/orders/my-orders/
    Buyer sees their own order history.
    """
    serializer_class   = OrderListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends    = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class    = OrderFilter
    ordering           = ["-created_at"]

    def get_queryset(self):
        return Order.objects.filter(
            buyer=self.request.user
        ).prefetch_related("vendor_orders__items")


class BuyerOrderDetailView(generics.RetrieveAPIView):
    """
    GET /api/v1/orders/my-orders/<order_number>/
    Full detail of a single buyer order.
    """
    serializer_class   = OrderDetailSerializer
    permission_classes = [IsAuthenticated]
    lookup_field       = "order_number"

    def get_queryset(self):
        return Order.objects.filter(
            buyer=self.request.user
        ).prefetch_related(
            "vendor_orders__items",
            "vendor_orders__vendor",
            "status_history",
        )


class BuyerCancelOrderView(APIView):
    """
    POST /api/v1/orders/my-orders/<order_number>/cancel/
    Buyer cancels a pending order (before payment confirmed).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, order_number):
        order = get_object_or_404(
            Order,
            order_number = order_number,
            buyer        = request.user,
        )

        if order.status not in [Order.Status.PENDING]:
            return Response(
                {"error": "Only pending orders can be cancelled by the buyer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Restore stock
        for vendor_order in order.vendor_orders.all():
            for item in vendor_order.items.all():
                if item.product and item.product.track_inventory:
                    if item.variant:
                        item.variant.stock_quantity += item.quantity
                        item.variant.save(update_fields=["stock_quantity"])
                    else:
                        item.product.stock_quantity += item.quantity
                        item.product.save(update_fields=["stock_quantity"])

        old_status    = order.status
        order.status  = Order.Status.CANCELLED
        order.save(update_fields=["status"])

        from .models import OrderStatusHistory
        OrderStatusHistory.objects.create(
            order      = order,
            old_status = old_status,
            new_status = Order.Status.CANCELLED,
            changed_by = request.user,
            note       = "Cancelled by buyer.",
        )

        return Response({"message": "Order cancelled successfully."})


# ═══════════════════════════════════════════════════════════════════════════════
# VENDOR ORDER MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

class VendorOrderListView(generics.ListAPIView):
    """
    GET /api/v1/orders/vendor/orders/
    Vendor sees only their own sub-orders.
    """
    serializer_class   = VendorOrderManageSerializer
    permission_classes = [IsAuthenticated, IsVendorActive]
    filter_backends    = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_class    = VendorOrderFilter
    search_fields      = ["order__order_number", "tracking_number"]
    ordering           = ["-created_at"]

    def get_queryset(self):
        return VendorOrder.objects.filter(
            vendor=self.request.user.vendor_profile
        ).prefetch_related("items").select_related("order")


class VendorOrderDetailView(generics.RetrieveAPIView):
    """
    GET /api/v1/orders/vendor/orders/<id>/
    Vendor sees full detail of one of their sub-orders.
    """
    serializer_class   = VendorOrderManageSerializer
    permission_classes = [IsAuthenticated, IsVendorActive]
    lookup_field       = "id"

    def get_queryset(self):
        return VendorOrder.objects.filter(
            vendor=self.request.user.vendor_profile
        ).prefetch_related("items").select_related("order", "vendor")


class VendorOrderUpdateView(APIView):
    """
    PATCH /api/v1/orders/vendor/orders/<id>/update/
    Vendor updates the status of their sub-order.
    Also handles shipping info.

    Body:
    {
        "status": "shipped",
        "tracking_number": "1Z999AA1012345678",
        "shipping_carrier": "UPS",
        "note": "Dispatched from warehouse"
    }
    """
    permission_classes = [IsAuthenticated, IsVendorActive]

    def patch(self, request, id):
        vendor_order = get_object_or_404(
            VendorOrder,
            id     = id,
            vendor = request.user.vendor_profile,
        )

        serializer = VendorOrderManageSerializer(
            vendor_order, data=request.data, partial=True
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        new_status       = serializer.validated_data.get("status", vendor_order.status)
        tracking_number  = request.data.get("tracking_number", "")
        shipping_carrier = request.data.get("shipping_carrier", "")
        note             = request.data.get("note", "")

        vendor_order = update_vendor_order_status(
            vendor_order     = vendor_order,
            new_status       = new_status,
            changed_by       = request.user,
            note             = note,
            tracking_number  = tracking_number,
            shipping_carrier = shipping_carrier,
        )

        return Response(
            {
                "message": f"Order status updated to '{new_status}'.",
                "vendor_order": VendorOrderManageSerializer(vendor_order).data,
            }
        )


class VendorCommissionListView(generics.ListAPIView):
    """
    GET /api/v1/orders/vendor/commissions/
    Vendor sees all their commission records.
    ?status=pending|confirmed|paid_out
    """
    serializer_class   = CommissionRecordSerializer
    permission_classes = [IsAuthenticated, IsVendorActive]
    filter_backends    = [filters.OrderingFilter]
    ordering           = ["-created_at"]

    def get_queryset(self):
        qs = CommissionRecord.objects.filter(
            vendor=self.request.user.vendor_profile
        ).select_related("order_item__vendor_order__order")

        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)

        return qs

    def list(self, request, *args, **kwargs):
        queryset   = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)

        # Summary totals
        from django.db.models import Sum
        totals = queryset.aggregate(
            total_gross      = Sum("gross_amount"),
            total_commission = Sum("commission_amount"),
            total_payout     = Sum("vendor_payout"),
        )

        return Response({
            "summary": {
                "total_gross":      str(totals["total_gross"]      or 0),
                "total_commission": str(totals["total_commission"] or 0),
                "total_payout":     str(totals["total_payout"]     or 0),
            },
            "results": serializer.data,
        })


# ═══════════════════════════════════════════════════════════════════════════════
# ADMIN ORDER VIEWS
# ═══════════════════════════════════════════════════════════════════════════════

class AdminOrderListView(generics.ListAPIView):
    """
    GET /api/v1/orders/admin/all/
    Admin sees all orders across all buyers.
    """
    serializer_class   = OrderListSerializer
    permission_classes = [IsAdminUser]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class    = OrderFilter
    search_fields      = ["order_number", "buyer__email", "buyer__first_name"]
    ordering           = ["-created_at"]

    def get_queryset(self):
        return Order.objects.all().prefetch_related(
            "vendor_orders__items"
        ).select_related("buyer")


class AdminOrderDetailView(generics.RetrieveAPIView):
    """
    GET /api/v1/orders/admin/all/<order_number>/
    Admin sees full detail of any order.
    """
    serializer_class   = OrderDetailSerializer
    permission_classes = [IsAdminUser]
    lookup_field       = "order_number"

    def get_queryset(self):
        return Order.objects.all().prefetch_related(
            "vendor_orders__items",
            "vendor_orders__vendor",
            "status_history",
        )


class AdminOrderStatusView(APIView):
    """
    PATCH /api/v1/orders/admin/all/<order_number>/status/
    Admin manually overrides an order's status.
    Body: { "status": "refunded", "note": "Customer requested refund" }
    """
    permission_classes = [IsAdminUser]

    def patch(self, request, order_number):
        order      = get_object_or_404(Order, order_number=order_number)
        new_status = request.data.get("status")
        note       = request.data.get("note", "Admin status override.")

        valid_statuses = [s[0] for s in Order.Status.choices]
        if new_status not in valid_statuses:
            return Response(
                {"error": f"Invalid status. Choose from: {valid_statuses}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_status   = order.status
        order.status = new_status
        order.save(update_fields=["status"])

        from .models import OrderStatusHistory
        OrderStatusHistory.objects.create(
            order      = order,
            old_status = old_status,
            new_status = new_status,
            changed_by = request.user,
            note       = note,
        )

        return Response(
            {
                "message": f"Order status updated to '{new_status}'.",
                "order":   OrderDetailSerializer(order, context={"request": request}).data,
            }
        )


class AdminCommissionOverviewView(APIView):
    """
    GET /api/v1/orders/admin/commissions/
    Admin sees platform-wide commission summary + per-vendor breakdown.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        from django.db.models import Sum, Count
        from vendors.models import CommissionRecord

        # Platform totals
        totals = CommissionRecord.objects.aggregate(
            total_gross      = Sum("gross_amount"),
            total_commission = Sum("commission_amount"),
            total_payout     = Sum("vendor_payout"),
            total_records    = Count("id"),
        )

        # Per vendor breakdown
        vendor_breakdown = CommissionRecord.objects.values(
            "vendor__store_name",
            "vendor__id",
        ).annotate(
            gross      = Sum("gross_amount"),
            commission = Sum("commission_amount"),
            payout     = Sum("vendor_payout"),
            count      = Count("id"),
        ).order_by("-commission")

        return Response({
            "platform_totals": {
                "total_gross":      str(totals["total_gross"]      or 0),
                "total_commission": str(totals["total_commission"] or 0),
                "total_payout":     str(totals["total_payout"]     or 0),
                "total_records":    totals["total_records"],
            },
            "vendor_breakdown": list(vendor_breakdown),
        })