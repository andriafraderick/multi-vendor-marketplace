# reviews/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import ProductReview, ReviewImage, ReviewFlag, VendorReview


class ReviewImageInline(admin.TabularInline):
    model = ReviewImage
    extra = 0
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


class ReviewFlagInline(admin.TabularInline):
    model = ReviewFlag
    extra = 0
    readonly_fields = ("flagged_by", "reason", "detail", "created_at")
    can_delete = False


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = (
        "product", "buyer_name", "rating_stars",
        "moderation_status", "is_verified_purchase",
        "helpful_count", "flag_count", "created_at",
    )
    list_filter = ("moderation_status", "rating", "is_verified_purchase")
    search_fields = ("product__name", "buyer__email", "title", "body")
    readonly_fields = (
        "id", "product", "buyer", "order_item",
        "is_verified_purchase", "helpful_count",
        "not_helpful_count", "created_at", "updated_at",
    )
    ordering = ("-created_at",)
    list_per_page = 30
    actions = ["approve_reviews", "reject_reviews"]
    inlines = [ReviewImageInline, ReviewFlagInline]

    fieldsets = (
        ("Review Content", {
            "fields": (
                "product", "buyer", "order_item",
                "rating", "title", "body", "pros", "cons",
            ),
        }),
        ("Moderation", {
            "fields": (
                "moderation_status", "moderation_note",
                "moderated_by", "moderated_at",
            ),
        }),
        ("Vendor Response", {
            "fields": ("vendor_response", "vendor_responded_at"),
        }),
        ("Stats", {
            "fields": (
                "helpful_count", "not_helpful_count",
                "is_verified_purchase", "is_edited",
            ),
            "classes": ("collapse",),
        }),
    )

    def buyer_name(self, obj):
        return obj.buyer.get_full_name()
    buyer_name.short_description = "Buyer"

    def rating_stars(self, obj):
        filled = "★" * obj.rating
        empty  = "☆" * (5 - obj.rating)
        color  = "#f59e0b" if obj.rating >= 3 else "#ef4444"
        return format_html(
            '<span style="color:{};">{}{}</span>', color, filled, empty
        )
    rating_stars.short_description = "Rating"

    def flag_count(self, obj):
        n = obj.flags.count()
        if n:
            return format_html(
                '<span style="color:red;font-weight:bold;">'
                "{} flag{}</span>", n, "s" if n != 1 else ""
            )
        return 0
    flag_count.short_description = "Flags"

    @admin.action(description="✅ Approve selected reviews")
    def approve_reviews(self, request, queryset):
        queryset.update(
            moderation_status="approved",
            moderated_by=request.user,
            moderated_at=timezone.now(),
        )
        self.message_user(request, "Reviews approved.")

    @admin.action(description="❌ Reject selected reviews")
    def reject_reviews(self, request, queryset):
        queryset.update(
            moderation_status="rejected",
            moderated_by=request.user,
            moderated_at=timezone.now(),
        )
        self.message_user(request, "Reviews rejected.")


@admin.register(VendorReview)
class VendorReviewAdmin(admin.ModelAdmin):
    list_display = ("vendor", "buyer_name", "rating", "is_approved", "created_at")
    list_filter  = ("is_approved", "rating")
    search_fields = ("vendor__store_name", "buyer__email")
    readonly_fields = ("id", "vendor", "buyer", "vendor_order", "created_at")
    ordering = ("-created_at",)

    def buyer_name(self, obj):
        return obj.buyer.get_full_name()
    buyer_name.short_description = "Buyer"

    def has_add_permission(self, request):
        # Created via API only — never through admin
        return False