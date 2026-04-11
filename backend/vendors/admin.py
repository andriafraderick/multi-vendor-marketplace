"""
vendors/admin.py
"""
from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import VendorProfile, CommissionRecord, VendorPayoutRequest


class CommissionInline(admin.TabularInline):
    model         = CommissionRecord
    extra         = 0
    readonly_fields = (
        "order_item", "gross_amount", "commission_rate",
        "commission_amount", "vendor_payout", "status", "created_at",
    )
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(VendorProfile)
class VendorProfileAdmin(admin.ModelAdmin):
    list_display  = (
        "store_name", "user_email", "status", "commission_rate",
        "total_sales", "total_orders", "average_rating",
        "logo_preview", "created_at",
    )
    list_filter   = ("status", "country", "stripe_onboarding_complete")
    search_fields = ("store_name", "user__email", "business_email")
    readonly_fields = (
        "id", "created_at", "updated_at", "approved_at",
        "total_sales", "total_orders", "average_rating",
        "total_reviews", "logo_preview",
    )
    ordering      = ("-created_at",)
    list_per_page = 25
    actions       = ["approve_vendors", "suspend_vendors", "reject_vendors"]
    inlines       = [CommissionInline]

    fieldsets = (
        ("Store Identity", {
            "fields": (
                "id", "user", "store_name", "slug",
                "logo", "logo_preview", "banner", "tagline", "description",
            ),
        }),
        ("Contact", {
            "fields": ("business_email", "business_phone", "website", "address", "city", "country"),
        }),
        ("Status & Approval", {
            "fields": ("status", "rejection_reason", "approved_at", "approved_by"),
        }),
        ("Commission & Payments", {
            "fields": ("commission_rate", "stripe_account_id", "stripe_onboarding_complete"),
        }),
        ("Statistics", {
            "fields": ("total_sales", "total_orders", "average_rating", "total_reviews"),
            "classes": ("collapse",),
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description   = "Owner Email"
    user_email.admin_order_field   = "user__email"

    def logo_preview(self, obj):
        if obj.logo:
            return format_html(
                '<img src="{}" style="width:50px;height:50px;'
                'object-fit:cover;border-radius:8px;" />',
                obj.logo.url,
            )
        return "—"
    logo_preview.short_description = "Logo"

    @admin.action(description="✅ Approve selected vendors")
    def approve_vendors(self, request, queryset):
        n = queryset.filter(status="pending").update(
            status="active",
            approved_at=timezone.now(),
            approved_by=request.user,
        )
        self.message_user(request, f"{n} vendor(s) approved.")

    @admin.action(description="🚫 Suspend selected vendors")
    def suspend_vendors(self, request, queryset):
        n = queryset.exclude(status="suspended").update(status="suspended")
        self.message_user(request, f"{n} vendor(s) suspended.")

    @admin.action(description="❌ Reject selected vendors")
    def reject_vendors(self, request, queryset):
        n = queryset.filter(status="pending").update(status="rejected")
        self.message_user(request, f"{n} vendor(s) rejected.")


@admin.register(CommissionRecord)
class CommissionRecordAdmin(admin.ModelAdmin):
    list_display  = (
        "vendor", "gross_amount", "commission_rate",
        "commission_amount", "vendor_payout", "status", "created_at",
    )
    list_filter   = ("status",)
    search_fields = ("vendor__store_name",)
    readonly_fields = (
        "id", "vendor", "order_item", "gross_amount", "commission_rate",
        "commission_amount", "vendor_payout", "created_at",
    )
    ordering = ("-created_at",)


@admin.register(VendorPayoutRequest)
class VendorPayoutRequestAdmin(admin.ModelAdmin):
    list_display  = ("vendor", "amount", "status", "requested_at", "processed_at")
    list_filter   = ("status",)
    search_fields = ("vendor__store_name",)
    readonly_fields = ("id", "vendor", "requested_at")
    ordering = ("-requested_at",)