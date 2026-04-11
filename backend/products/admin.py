"""
products/admin.py
"""
from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import (
    Category, Product, ProductImage,
    ProductVariant, ProductAttribute, Wishlist,
)


class ProductImageInline(admin.TabularInline):
    model         = ProductImage
    extra         = 1
    fields        = ("image", "alt_text", "sort_order", "is_primary", "image_preview")
    readonly_fields = ("image_preview",)

    def image_preview(self, obj):
        if obj.pk and obj.image:
            return format_html(
                '<img src="{}" style="width:60px;height:60px;'
                'object-fit:cover;border-radius:4px;" />',
                obj.image.url,
            )
        return "—"
    image_preview.short_description = "Preview"


class ProductVariantInline(admin.TabularInline):
    model  = ProductVariant
    extra  = 0
    fields = ("name", "value", "sku", "price_modifier", "stock_quantity", "is_active")


class ProductAttributeInline(admin.TabularInline):
    model  = ProductAttribute
    extra  = 1
    fields = ("key", "value")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display      = ("name", "parent", "is_active", "sort_order", "product_count")
    list_filter       = ("is_active", "parent")
    search_fields     = ("name",)
    prepopulated_fields = {"slug": ("name",)}
    ordering          = ("sort_order", "name")

    def product_count(self, obj):
        return obj.products.filter(status="active").count()
    product_count.short_description = "Active Products"


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display    = (
        "name", "vendor", "category", "price", "stock_quantity",
        "status", "average_rating", "total_sales", "thumbnail", "created_at",
    )
    list_filter     = ("status", "condition", "is_featured", "is_digital", "category")
    search_fields   = ("name", "sku", "vendor__store_name")
    readonly_fields = (
        "id", "slug", "sku", "average_rating", "total_reviews",
        "total_sales", "view_count", "created_at", "updated_at", "published_at",
    )
    ordering        = ("-created_at",)
    list_per_page   = 25
    actions         = ["approve_products", "archive_products", "feature_products"]
    inlines         = [ProductImageInline, ProductVariantInline, ProductAttributeInline]

    fieldsets = (
        ("Identity", {
            "fields": ("id", "vendor", "category", "name", "slug", "sku", "condition"),
        }),
        ("Content", {
            "fields": ("description", "short_description", "tags", "meta_title", "meta_description"),
        }),
        ("Pricing", {
            "fields": ("price", "compare_at_price", "cost_price"),
        }),
        ("Inventory & Shipping", {
            "fields": (
                "stock_quantity", "low_stock_threshold", "track_inventory",
                "weight", "requires_shipping", "free_shipping",
            ),
        }),
        ("Status", {
            "fields": ("status", "rejection_reason", "is_featured", "is_digital", "published_at"),
        }),
        ("Statistics", {
            "fields": ("average_rating", "total_reviews", "total_sales", "view_count"),
            "classes": ("collapse",),
        }),
    )

    def thumbnail(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if img:
            return format_html(
                '<img src="{}" style="width:40px;height:40px;'
                'object-fit:cover;border-radius:4px;" />',
                img.image.url,
            )
        return "—"
    thumbnail.short_description = "Image"

    @admin.action(description="✅ Approve selected products")
    def approve_products(self, request, queryset):
        n = queryset.filter(status="pending").update(
            status="active", published_at=timezone.now()
        )
        self.message_user(request, f"{n} product(s) approved.")

    @admin.action(description="📦 Archive selected products")
    def archive_products(self, request, queryset):
        n = queryset.update(status="archived")
        self.message_user(request, f"{n} product(s) archived.")

    @admin.action(description="⭐ Feature selected products")
    def feature_products(self, request, queryset):
        n = queryset.update(is_featured=True)
        self.message_user(request, f"{n} product(s) featured.")