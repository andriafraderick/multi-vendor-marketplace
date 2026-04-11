"""
orders/serializers.py
Serializers for Cart, Order, VendorOrder, OrderItem, Coupon.
"""
from rest_framework import serializers
from decimal import Decimal
from .models import (
    Cart, CartItem, Order, VendorOrder,
    OrderItem, OrderStatusHistory, Coupon,
)
from products.serializers import ProductListSerializer


# ── Cart ───────────────────────────────────────────────────────────────────────

class CartItemSerializer(serializers.ModelSerializer):
    product_name  = serializers.CharField(source="product.name",      read_only=True)
    product_slug  = serializers.CharField(source="product.slug",      read_only=True)
    product_price = serializers.DecimalField(
        source="product.price", max_digits=10, decimal_places=2, read_only=True
    )
    vendor_name   = serializers.CharField(source="product.vendor.store_name", read_only=True)
    variant_info  = serializers.SerializerMethodField()
    unit_price    = serializers.ReadOnlyField()
    line_total    = serializers.ReadOnlyField()
    primary_image = serializers.SerializerMethodField()
    in_stock      = serializers.SerializerMethodField()

    class Meta:
        model  = CartItem
        fields = (
            "id", "product", "product_name", "product_slug",
            "product_price", "vendor_name",
            "variant", "variant_info",
            "quantity", "unit_price", "line_total",
            "primary_image", "in_stock", "added_at",
        )
        read_only_fields = ("id", "added_at")

    def get_variant_info(self, obj):
        if obj.variant:
            return f"{obj.variant.name}: {obj.variant.value}"
        return None

    def get_primary_image(self, obj):
        img = obj.product.images.filter(is_primary=True).first() or obj.product.images.first()
        if img:
            request = self.context.get("request")
            return request.build_absolute_uri(img.image.url) if request else img.image.url
        return None

    def get_in_stock(self, obj):
        if obj.variant:
            return obj.variant.stock_quantity >= obj.quantity
        if obj.product.track_inventory:
            return obj.product.stock_quantity >= obj.quantity
        return True


class CartItemAddSerializer(serializers.Serializer):
    """Used when adding an item to the cart."""
    product_id = serializers.UUIDField()
    variant_id = serializers.UUIDField(required=False, allow_null=True)
    quantity   = serializers.IntegerField(min_value=1, max_value=100)

    def validate(self, attrs):
        from products.models import Product, ProductVariant

        # Validate product
        try:
            product = Product.objects.get(id=attrs["product_id"], status="active")
        except Product.DoesNotExist:
            raise serializers.ValidationError({"product_id": "Product not found or not available."})

        # Validate vendor is active
        if not product.vendor.is_active:
            raise serializers.ValidationError({"product_id": "This product's store is currently unavailable."})

        # Validate variant if provided
        variant = None
        if attrs.get("variant_id"):
            try:
                variant = ProductVariant.objects.get(
                    id=attrs["variant_id"], product=product, is_active=True
                )
            except ProductVariant.DoesNotExist:
                raise serializers.ValidationError({"variant_id": "Variant not found for this product."})

        # Stock check
        qty = attrs["quantity"]
        if product.track_inventory:
            available = variant.stock_quantity if variant else product.stock_quantity
            if available < qty:
                raise serializers.ValidationError(
                    {"quantity": f"Only {available} unit(s) available."}
                )

        attrs["product"] = product
        attrs["variant"] = variant
        return attrs


class CartSerializer(serializers.ModelSerializer):
    items     = CartItemSerializer(many=True, read_only=True)
    subtotal  = serializers.ReadOnlyField()
    total_items = serializers.ReadOnlyField()
    vendor_count = serializers.SerializerMethodField()

    class Meta:
        model  = Cart
        fields = ("id", "items", "subtotal", "total_items", "vendor_count", "updated_at")

    def get_vendor_count(self, obj):
        vendor_ids = obj.items.values_list("product__vendor", flat=True).distinct()
        return vendor_ids.count()


# ── Coupon ─────────────────────────────────────────────────────────────────────

class CouponValidateSerializer(serializers.Serializer):
    """Validate a coupon code and return the discount."""
    code     = serializers.CharField(max_length=50)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2)


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Coupon
        fields = (
            "id", "code", "description", "discount_type",
            "discount_value", "minimum_order",
            "valid_from", "valid_until",
        )


# ── Order Items ────────────────────────────────────────────────────────────────

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model  = OrderItem
        fields = (
            "id", "product", "variant",
            "product_name", "product_sku", "variant_info",
            "quantity", "unit_price", "line_total",
            "review_left",
        )
        read_only_fields = fields


# ── Vendor Order ───────────────────────────────────────────────────────────────

class VendorOrderSerializer(serializers.ModelSerializer):
    """
    Used by buyers — shows their vendor sub-orders inside a master order.
    """
    items        = OrderItemSerializer(many=True, read_only=True)
    vendor_name  = serializers.CharField(source="vendor.store_name", read_only=True)
    vendor_slug  = serializers.CharField(source="vendor.slug",       read_only=True)
    vendor_logo  = serializers.SerializerMethodField()

    class Meta:
        model  = VendorOrder
        fields = (
            "id", "vendor_name", "vendor_slug", "vendor_logo",
            "status", "subtotal", "shipping_cost", "vendor_total",
            "tracking_number", "shipping_carrier",
            "shipped_at", "delivered_at",
            "items", "created_at",
        )

    def get_vendor_logo(self, obj):
        if obj.vendor.logo:
            request = self.context.get("request")
            return request.build_absolute_uri(obj.vendor.logo.url) if request else obj.vendor.logo.url
        return None


class VendorOrderManageSerializer(serializers.ModelSerializer):
    """
    Used by vendors — to update their own sub-order status.
    """
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model  = VendorOrder
        fields = (
            "id", "status", "subtotal", "vendor_total",
            "tracking_number", "shipping_carrier",
            "shipped_at", "delivered_at",
            "vendor_notes", "items", "created_at", "updated_at",
        )
        read_only_fields = (
            "id", "subtotal", "vendor_total",
            "shipped_at", "delivered_at", "created_at", "updated_at",
        )

    def validate_status(self, value):
        allowed_transitions = {
            "pending":    ["confirmed", "cancelled"],
            "confirmed":  ["processing", "cancelled"],
            "processing": ["shipped",    "cancelled"],
            "shipped":    ["delivered"],
            "delivered":  [],
            "cancelled":  [],
            "refunded":   [],
        }
        current = self.instance.status if self.instance else "pending"
        if value not in allowed_transitions.get(current, []):
            raise serializers.ValidationError(
                f"Cannot transition from '{current}' to '{value}'. "
                f"Allowed: {allowed_transitions.get(current, [])}"
            )
        return value


# ── Order Status History ───────────────────────────────────────────────────────

class OrderStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model  = OrderStatusHistory
        fields = ("id", "old_status", "new_status", "changed_by_name", "note", "created_at")

    def get_changed_by_name(self, obj):
        if obj.changed_by:
            return obj.changed_by.get_full_name()
        return "System"


# ── Master Order ───────────────────────────────────────────────────────────────

class OrderListSerializer(serializers.ModelSerializer):
    """Lightweight order list — buyer's order history."""
    vendor_count  = serializers.SerializerMethodField()
    item_count    = serializers.SerializerMethodField()

    class Meta:
        model  = Order
        fields = (
            "id", "order_number", "status",
            "subtotal", "shipping_cost", "tax_amount",
            "discount_amount", "total_amount",
            "vendor_count", "item_count",
            "paid_at", "created_at",
        )

    def get_vendor_count(self, obj):
        return obj.vendor_orders.count()

    def get_item_count(self, obj):
        return sum(vo.items.count() for vo in obj.vendor_orders.all())


class OrderDetailSerializer(serializers.ModelSerializer):
    """Full order detail — includes all vendor orders and status history."""
    vendor_orders  = VendorOrderSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model  = Order
        fields = (
            "id", "order_number", "status",
            "subtotal", "shipping_cost", "tax_amount",
            "discount_amount", "total_amount",
            "shipping_address", "billing_address",
            "stripe_payment_intent_id", "payment_method", "paid_at",
            "buyer_notes",
            "vendor_orders", "status_history",
            "created_at", "updated_at",
        )


# ── Checkout ───────────────────────────────────────────────────────────────────

class CheckoutSerializer(serializers.Serializer):
    """
    Input serializer for POST /orders/checkout/
    Validates all checkout fields before creating the order.
    """
    # Shipping address
    shipping_full_name     = serializers.CharField(max_length=200)
    shipping_street        = serializers.CharField(max_length=255)
    shipping_city          = serializers.CharField(max_length=100)
    shipping_state         = serializers.CharField(max_length=100)
    shipping_postal_code   = serializers.CharField(max_length=20)
    shipping_country       = serializers.CharField(max_length=100, default="US")

    # Billing (optional — defaults to shipping)
    billing_same_as_shipping = serializers.BooleanField(default=True)
    billing_full_name        = serializers.CharField(max_length=200,  required=False, allow_blank=True)
    billing_street           = serializers.CharField(max_length=255,  required=False, allow_blank=True)
    billing_city             = serializers.CharField(max_length=100,  required=False, allow_blank=True)
    billing_state            = serializers.CharField(max_length=100,  required=False, allow_blank=True)
    billing_postal_code      = serializers.CharField(max_length=20,   required=False, allow_blank=True)
    billing_country          = serializers.CharField(max_length=100,  required=False, allow_blank=True)

    # Optional
    coupon_code  = serializers.CharField(max_length=50,   required=False, allow_blank=True)
    buyer_notes  = serializers.CharField(max_length=1000, required=False, allow_blank=True)

    def get_shipping_address(self):
        d = self.validated_data
        return {
            "full_name":    d["shipping_full_name"],
            "street":       d["shipping_street"],
            "city":         d["shipping_city"],
            "state":        d["shipping_state"],
            "postal_code":  d["shipping_postal_code"],
            "country":      d["shipping_country"],
        }

    def get_billing_address(self):
        d = self.validated_data
        if d.get("billing_same_as_shipping", True):
            return self.get_shipping_address()
        return {
            "full_name":   d.get("billing_full_name", ""),
            "street":      d.get("billing_street", ""),
            "city":        d.get("billing_city", ""),
            "state":       d.get("billing_state", ""),
            "postal_code": d.get("billing_postal_code", ""),
            "country":     d.get("billing_country", "US"),
        }


# ── Commission (Vendor view) ───────────────────────────────────────────────────

class CommissionRecordSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(
        source="order_item.product_name", read_only=True
    )
    order_number = serializers.CharField(
        source="order_item.vendor_order.order.order_number", read_only=True
    )

    class Meta:
        from vendors.models import CommissionRecord
        model  = CommissionRecord
        fields = (
            "id", "order_number", "product_name",
            "gross_amount", "commission_rate",
            "commission_amount", "vendor_payout",
            "status", "paid_out_at", "created_at",
        )
        read_only_fields = fields