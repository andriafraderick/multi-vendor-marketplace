"""
orders/models.py — Cart, Order, VendorOrder (order distribution),
                   OrderItem, OrderStatusHistory, Coupon
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
import uuid


class Cart(models.Model):
    """Persistent cart, one per user."""
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user       = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cart"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart — {self.user.email}"

    @property
    def total_items(self):
        return sum(item.quantity for item in self.items.all())

    @property
    def subtotal(self):
        return sum(item.line_total for item in self.items.all())


class CartItem(models.Model):
    cart     = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product  = models.ForeignKey("products.Product", on_delete=models.CASCADE)
    variant  = models.ForeignKey(
        "products.ProductVariant", on_delete=models.SET_NULL, null=True, blank=True
    )
    quantity = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["cart", "product", "variant"]

    def __str__(self):
        return f"{self.quantity}× {self.product.name}"

    @property
    def unit_price(self):
        return self.variant.final_price if self.variant else self.product.price

    @property
    def line_total(self):
        return self.unit_price * self.quantity


class Order(models.Model):
    """
    Master order placed at checkout.
    One checkout → one Order → N VendorOrders (one per vendor in cart).
    """

    class Status(models.TextChoices):
        PENDING           = "pending",           "Pending Payment"
        PAYMENT_CONFIRMED = "payment_confirmed",  "Payment Confirmed"
        PROCESSING        = "processing",         "Processing"
        PARTIALLY_SHIPPED = "partially_shipped",  "Partially Shipped"
        SHIPPED           = "shipped",            "Shipped"
        DELIVERED         = "delivered",          "Delivered"
        CANCELLED         = "cancelled",          "Cancelled"
        REFUNDED          = "refunded",           "Refunded"
        DISPUTED          = "disputed",           "Disputed"

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_number = models.CharField(max_length=20, unique=True, blank=True)
    buyer        = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name="orders",
    )
    status       = models.CharField(max_length=25, choices=Status.choices, default=Status.PENDING)

    # Financials
    subtotal        = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_cost   = models.DecimalField(max_digits=8,  decimal_places=2, default=0)
    tax_amount      = models.DecimalField(max_digits=8,  decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=8,  decimal_places=2, default=0)
    total_amount    = models.DecimalField(max_digits=10, decimal_places=2)

    # Address snapshots (JSON so they never change after order)
    shipping_address = models.JSONField()
    billing_address  = models.JSONField(blank=True, null=True)

    # Payment
    stripe_payment_intent_id = models.CharField(max_length=100, blank=True)
    payment_method           = models.CharField(max_length=50, blank=True)
    paid_at                  = models.DateTimeField(null=True, blank=True)

    # Notes
    buyer_notes = models.TextField(blank=True)
    admin_notes = models.TextField(blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes  = [
            models.Index(fields=["buyer", "status"]),
            models.Index(fields=["status", "created_at"]),
        ]

    def __str__(self):
        return f"Order #{self.order_number} — {self.buyer}"

    def save(self, *args, **kwargs):
        if not self.order_number:
            import random
            self.order_number = f"ORD-{random.randint(100000, 999999)}"
        super().save(*args, **kwargs)


class VendorOrder(models.Model):
    """
    Sub-order for one vendor within a master Order.
    Vendors only ever see their own VendorOrder, never the full Order.
    """

    class Status(models.TextChoices):
        PENDING    = "pending",    "Pending"
        CONFIRMED  = "confirmed",  "Confirmed"
        PROCESSING = "processing", "Processing"
        SHIPPED    = "shipped",    "Shipped"
        DELIVERED  = "delivered",  "Delivered"
        CANCELLED  = "cancelled",  "Cancelled"
        REFUNDED   = "refunded",   "Refunded"

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order        = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="vendor_orders")
    vendor       = models.ForeignKey(
        "vendors.VendorProfile", on_delete=models.CASCADE, related_name="vendor_orders"
    )
    status       = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)

    # Financials
    subtotal      = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_cost = models.DecimalField(max_digits=8,  decimal_places=2, default=0)
    vendor_total  = models.DecimalField(max_digits=10, decimal_places=2)

    # Shipping
    tracking_number  = models.CharField(max_length=100, blank=True)
    shipping_carrier = models.CharField(max_length=100, blank=True)
    shipped_at       = models.DateTimeField(null=True, blank=True)
    delivered_at     = models.DateTimeField(null=True, blank=True)

    vendor_notes = models.TextField(blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"VendorOrder — {self.vendor.store_name} / Order #{self.order.order_number}"


class OrderItem(models.Model):
    """One product line inside a VendorOrder."""
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vendor_order = models.ForeignKey(VendorOrder, on_delete=models.CASCADE, related_name="items")
    product      = models.ForeignKey(
        "products.Product", on_delete=models.SET_NULL, null=True, related_name="order_items"
    )
    variant = models.ForeignKey(
        "products.ProductVariant", on_delete=models.SET_NULL, null=True, blank=True
    )

    # Snapshot of product at purchase time
    product_name = models.CharField(max_length=255)
    product_sku  = models.CharField(max_length=100, blank=True)
    variant_info = models.CharField(max_length=200, blank=True)

    quantity   = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    line_total = models.DecimalField(max_digits=10, decimal_places=2)

    # Prevents multiple reviews for the same item
    review_left = models.BooleanField(default=False)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.quantity}× {self.product_name}"

    def save(self, *args, **kwargs):
        self.line_total = self.unit_price * self.quantity
        super().save(*args, **kwargs)


class OrderStatusHistory(models.Model):
    """Full audit trail of every status change on an order."""
    order      = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="status_history")
    old_status = models.CharField(max_length=25, blank=True)
    new_status = models.CharField(max_length=25)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    note       = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order #{self.order.order_number}: {self.old_status} → {self.new_status}"


class Coupon(models.Model):
    """Discount codes usable at checkout."""

    class DiscountType(models.TextChoices):
        PERCENTAGE = "percentage", "Percentage"
        FIXED      = "fixed",      "Fixed Amount"

    code           = models.CharField(max_length=50, unique=True)
    description    = models.CharField(max_length=255, blank=True)
    discount_type  = models.CharField(max_length=15, choices=DiscountType.choices)
    discount_value = models.DecimalField(max_digits=8, decimal_places=2)
    minimum_order  = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    usage_limit    = models.PositiveIntegerField(null=True, blank=True)
    used_count     = models.PositiveIntegerField(default=0)
    valid_from     = models.DateTimeField()
    valid_until    = models.DateTimeField()
    is_active      = models.BooleanField(default=True)
    applicable_to_vendor = models.ForeignKey(
        "vendors.VendorProfile", on_delete=models.SET_NULL, null=True, blank=True,
        help_text="Leave blank for platform-wide coupon",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Coupon {self.code} ({self.discount_type}: {self.discount_value})"