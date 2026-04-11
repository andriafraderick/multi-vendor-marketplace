"""
orders/services.py

Core business logic for:
  - Converting a cart into a multi-vendor order
  - Distributing order items to each vendor (VendorOrder)
  - Auto-calculating commission per OrderItem
  - Stripe payment intent creation
  - Coupon validation and application
"""
from decimal import Decimal
from django.db import transaction
from django.utils import timezone

from .models import (
    Cart, CartItem, Order, VendorOrder,
    OrderItem, OrderStatusHistory, Coupon,
)
from vendors.models import CommissionRecord


# ── Coupon Helpers ─────────────────────────────────────────────────────────────

def validate_coupon(code, subtotal, vendor=None):
    """
    Validate a coupon code.
    Returns (coupon, error_message).
    If valid: (Coupon instance, None)
    If invalid: (None, error string)
    """
    try:
        coupon = Coupon.objects.get(code=code.upper().strip(), is_active=True)
    except Coupon.DoesNotExist:
        return None, "Invalid coupon code."

    now = timezone.now()
    if now < coupon.valid_from:
        return None, "This coupon is not yet active."
    if now > coupon.valid_until:
        return None, "This coupon has expired."
    if coupon.usage_limit and coupon.used_count >= coupon.usage_limit:
        return None, "This coupon has reached its usage limit."
    if subtotal < coupon.minimum_order:
        return None, f"Minimum order of ${coupon.minimum_order} required for this coupon."
    if coupon.applicable_to_vendor and vendor and coupon.applicable_to_vendor != vendor:
        return None, "This coupon is not valid for this vendor."

    return coupon, None


def apply_coupon(coupon, subtotal):
    """
    Calculate the discount amount from a coupon.
    Returns Decimal discount amount.
    """
    if coupon.discount_type == "percentage":
        discount = (subtotal * coupon.discount_value) / Decimal("100")
    else:
        discount = coupon.discount_value

    # Discount cannot exceed subtotal
    return min(discount, subtotal)


# ── Cart Validation ────────────────────────────────────────────────────────────

def validate_cart(cart):
    """
    Validate all items in the cart before checkout.
    Returns (is_valid, list_of_errors, validated_items)

    validated_items is a list of dicts:
    {
        cart_item, product, variant,
        unit_price, quantity, line_total, vendor
    }
    """
    errors  = []
    items   = []

    cart_items = CartItem.objects.filter(
        cart=cart
    ).select_related(
        "product__vendor", "variant"
    )

    if not cart_items.exists():
        return False, ["Your cart is empty."], []

    for cart_item in cart_items:
        product = cart_item.product
        variant = cart_item.variant
        qty     = cart_item.quantity

        # Product must be active
        if product.status != "active":
            errors.append(f"'{product.name}' is no longer available.")
            continue

        # Vendor must be active
        if not product.vendor.is_active:
            errors.append(f"'{product.name}' is from a store that is currently unavailable.")
            continue

        # Stock check
        if product.track_inventory:
            available = variant.stock_quantity if variant else product.stock_quantity
            if available < qty:
                errors.append(
                    f"'{product.name}' only has {available} unit(s) in stock "
                    f"(you requested {qty})."
                )
                continue

        unit_price = variant.final_price if variant else product.price
        line_total = unit_price * qty

        items.append({
            "cart_item":  cart_item,
            "product":    product,
            "variant":    variant,
            "unit_price": unit_price,
            "quantity":   qty,
            "line_total": line_total,
            "vendor":     product.vendor,
        })

    return len(errors) == 0, errors, items


# ── Order Distribution ─────────────────────────────────────────────────────────

def group_items_by_vendor(validated_items):
    """
    Group validated cart items by vendor.
    Returns dict: { vendor_profile: [item_dict, ...] }
    """
    groups = {}
    for item in validated_items:
        vendor = item["vendor"]
        if vendor not in groups:
            groups[vendor] = []
        groups[vendor].append(item)
    return groups


@transaction.atomic
def create_order_from_cart(
    buyer,
    shipping_address,
    billing_address=None,
    coupon_code=None,
    buyer_notes="",
):
    """
    Master function: converts a cart into a full multi-vendor order.

    Steps:
      1. Validate cart items
      2. Apply coupon if provided
      3. Create master Order
      4. Group items by vendor → create one VendorOrder per vendor
      5. Create OrderItems inside each VendorOrder
      6. Create CommissionRecord per OrderItem
      7. Deduct stock
      8. Clear the cart
      9. Log initial status
      10. Return the order

    Uses @transaction.atomic so if anything fails, everything rolls back.
    """

    # ── 1. Get & validate cart ────────────────────────────────────────────────
    try:
        cart = Cart.objects.get(user=buyer)
    except Cart.DoesNotExist:
        raise ValueError("No cart found for this user.")

    is_valid, errors, validated_items = validate_cart(cart)
    if not is_valid:
        raise ValueError(" | ".join(errors))

    # ── 2. Calculate subtotal ─────────────────────────────────────────────────
    subtotal = sum(item["line_total"] for item in validated_items)

    # ── 3. Apply coupon ───────────────────────────────────────────────────────
    discount_amount = Decimal("0.00")
    coupon_obj      = None

    if coupon_code:
        coupon_obj, error = validate_coupon(coupon_code, subtotal)
        if error:
            raise ValueError(error)
        discount_amount = apply_coupon(coupon_obj, subtotal)

    # ── 4. Calculate totals ───────────────────────────────────────────────────
    # Simple flat shipping for now — vendor-level shipping in future
    shipping_cost = Decimal("0.00")
    tax_rate      = Decimal("0.00")   # Tax can be added per region
    tax_amount    = (subtotal - discount_amount) * tax_rate
    total_amount  = subtotal - discount_amount + shipping_cost + tax_amount

    # ── 5. Create master Order ────────────────────────────────────────────────
    order = Order.objects.create(
        buyer            = buyer,
        status           = Order.Status.PENDING,
        subtotal         = subtotal,
        shipping_cost    = shipping_cost,
        tax_amount       = tax_amount,
        discount_amount  = discount_amount,
        total_amount     = total_amount,
        shipping_address = shipping_address,
        billing_address  = billing_address or shipping_address,
        buyer_notes      = buyer_notes,
    )

    # ── 6. Group items by vendor ──────────────────────────────────────────────
    vendor_groups = group_items_by_vendor(validated_items)

    for vendor, items in vendor_groups.items():

        vendor_subtotal = sum(item["line_total"] for item in items)

        # ── 7. Create VendorOrder ─────────────────────────────────────────────
        vendor_order = VendorOrder.objects.create(
            order        = order,
            vendor       = vendor,
            status       = VendorOrder.Status.PENDING,
            subtotal     = vendor_subtotal,
            shipping_cost = Decimal("0.00"),
            vendor_total  = vendor_subtotal,
        )

        for item in items:
            # ── 8. Create OrderItem ───────────────────────────────────────────
            order_item = OrderItem.objects.create(
                vendor_order = vendor_order,
                product      = item["product"],
                variant      = item["variant"],
                product_name = item["product"].name,
                product_sku  = item["product"].sku,
                variant_info = (
                    f"{item['variant'].name}: {item['variant'].value}"
                    if item["variant"] else ""
                ),
                quantity     = item["quantity"],
                unit_price   = item["unit_price"],
                line_total   = item["line_total"],
            )

            # ── 9. Create CommissionRecord ────────────────────────────────────
            CommissionRecord.objects.create(
                vendor            = vendor,
                order_item        = order_item,
                gross_amount      = item["line_total"],
                commission_rate   = vendor.commission_rate,
                # commission_amount and vendor_payout are auto-calculated in model.save()
                commission_amount = Decimal("0"),
                vendor_payout     = Decimal("0"),
            )

            # ── 10. Deduct stock ──────────────────────────────────────────────
            if item["product"].track_inventory:
                if item["variant"]:
                    item["variant"].stock_quantity -= item["quantity"]
                    item["variant"].save(update_fields=["stock_quantity"])
                else:
                    item["product"].stock_quantity -= item["quantity"]
                    item["product"].save(update_fields=["stock_quantity"])

            # ── 11. Increment product total_sales ─────────────────────────────
            item["product"].total_sales += item["quantity"]
            item["product"].save(update_fields=["total_sales"])

    # ── 12. Update coupon usage ───────────────────────────────────────────────
    if coupon_obj:
        coupon_obj.used_count += 1
        coupon_obj.save(update_fields=["used_count"])

    # ── 13. Log status history ────────────────────────────────────────────────
    OrderStatusHistory.objects.create(
        order      = order,
        old_status = "",
        new_status = Order.Status.PENDING,
        changed_by = buyer,
        note       = "Order created.",
    )

    # ── 14. Clear cart ────────────────────────────────────────────────────────
    cart.items.all().delete()

    return order


@transaction.atomic
def confirm_payment(order, payment_intent_id, payment_method="card"):
    """
    Called after Stripe confirms payment.
    Updates order + all vendor orders to confirmed/processing.
    Confirms all commission records.
    """
    # Update master order
    order.status                   = Order.Status.PAYMENT_CONFIRMED
    order.stripe_payment_intent_id = payment_intent_id
    order.payment_method           = payment_method
    order.paid_at                  = timezone.now()
    order.save()

    # Update all vendor orders to processing
    order.vendor_orders.all().update(status=VendorOrder.Status.CONFIRMED)

    # Confirm all commission records for this order
    CommissionRecord.objects.filter(
        order_item__vendor_order__order=order
    ).update(status=CommissionRecord.Status.CONFIRMED)

    # Update vendor total_orders and total_sales stats
    for vendor_order in order.vendor_orders.all():
        vendor = vendor_order.vendor
        vendor.total_orders += 1
        vendor.total_sales  += vendor_order.vendor_total
        vendor.save(update_fields=["total_orders", "total_sales"])

    # Log status change
    OrderStatusHistory.objects.create(
        order      = order,
        old_status = Order.Status.PENDING,
        new_status = Order.Status.PAYMENT_CONFIRMED,
        note       = f"Payment confirmed. Stripe ID: {payment_intent_id}",
    )

    return order


@transaction.atomic
def update_vendor_order_status(vendor_order, new_status, changed_by, note="", tracking_number="", shipping_carrier=""):
    """
    Vendor updates their sub-order status (e.g. to shipped).
    Also checks if all vendor orders are shipped/delivered and
    updates the master order status accordingly.
    """
    old_status = vendor_order.status
    vendor_order.status = new_status

    if new_status == VendorOrder.Status.SHIPPED:
        vendor_order.shipped_at      = timezone.now()
        vendor_order.tracking_number = tracking_number
        vendor_order.shipping_carrier = shipping_carrier

    elif new_status == VendorOrder.Status.DELIVERED:
        vendor_order.delivered_at = timezone.now()

    vendor_order.save()

    # Check master order status based on all vendor orders
    master_order      = vendor_order.order
    all_vendor_orders = master_order.vendor_orders.all()
    all_statuses      = set(vo.status for vo in all_vendor_orders)

    if all_statuses == {VendorOrder.Status.DELIVERED}:
        master_order.status = Order.Status.DELIVERED
        master_order.save(update_fields=["status"])
    elif VendorOrder.Status.SHIPPED in all_statuses:
        all_shipped = all(
            s in [VendorOrder.Status.SHIPPED, VendorOrder.Status.DELIVERED]
            for s in all_statuses
        )
        if all_shipped:
            master_order.status = Order.Status.SHIPPED
        else:
            master_order.status = Order.Status.PARTIALLY_SHIPPED
        master_order.save(update_fields=["status"])

    # Log
    OrderStatusHistory.objects.create(
        order      = master_order,
        old_status = old_status,
        new_status = new_status,
        changed_by = changed_by,
        note       = note or f"Vendor order updated by {changed_by.get_full_name()}.",
    )

    return vendor_order