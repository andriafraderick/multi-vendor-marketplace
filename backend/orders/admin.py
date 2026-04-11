# orders/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Cart, CartItem, Order, VendorOrder,
    OrderItem, OrderStatusHistory, Coupon,
)


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = (
        "product", "variant", "product_name",
        "product_sku", "variant_info",
        "quantity", "unit_price", "line_total",
    )
    can_delete = False


class VendorOrderInline(admin.TabularInline):
    model = VendorOrder
    extra = 0
    readonly_fields = (
        "vendor", "status", "subtotal",
        "vendor_total", "tracking_number", "shipped_at",
    )
    show_change_link = True
    can_delete = False


class OrderStatusHistoryInline(admin.TabularInline):
    model = OrderStatusHistory
    extra = 0
    readonly_fields = (
        "old_status", "new_status",
        "changed_by", "note", "created_at",
    )
    can_delete = False


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display  = ("user", "total_items", "subtotal", "updated_at")
    search_fields = ("user__email",)
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_number", "buyer_email", "status",
        "total_amount", "vendor_count", "paid_at", "created_at",
    )
    list_filter   = ("status", "created_at")
    search_fields = (
        "order_number", "buyer__email",
        "stripe_payment_intent_id",
    )
    readonly_fields = (
        "id", "order_number", "buyer",
        "subtotal", "shipping_cost", "tax_amount",
        "discount_amount", "total_amount",
        "stripe_payment_intent_id", "paid_at",
        "created_at", "updated_at",
    )
    ordering      = ("-created_at",)
    list_per_page = 30
    inlines       = [VendorOrderInline, OrderStatusHistoryInline]

    def buyer_email(self, obj):
        return obj.buyer.email if obj.buyer else "—"
    buyer_email.short_description = "Buyer"

    def vendor_count(self, obj):
        n = obj.vendor_orders.count()
        return format_html(
            "<b>{}</b> vendor{}", n, "s" if n != 1 else ""
        )
    vendor_count.short_description = "Vendors"


@admin.register(VendorOrder)
class VendorOrderAdmin(admin.ModelAdmin):
    list_display = (
        "id", "order_number_display", "vendor", "status",
        "vendor_total", "tracking_number", "shipped_at", "created_at",
    )
    list_filter   = ("status", "vendor")
    search_fields = (
        "order__order_number",
        "vendor__store_name",
        "tracking_number",
    )
    readonly_fields = (
        "id", "order", "vendor",
        "subtotal", "vendor_total", "created_at",
    )
    ordering = ("-created_at",)
    inlines  = [OrderItemInline]

    def order_number_display(self, obj):
        return obj.order.order_number
    order_number_display.short_description = "Order #"
    order_number_display.admin_order_field = "order__order_number"


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = (
        "code", "discount_type", "discount_value",
        "used_count", "usage_limit",
        "valid_from", "valid_until", "is_active",
    )
    list_filter   = ("discount_type", "is_active")
    search_fields = ("code",)
    ordering      = ("-created_at",)