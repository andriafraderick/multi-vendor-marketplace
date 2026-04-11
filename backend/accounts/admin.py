"""
accounts/admin.py
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User, Address, EmailVerificationToken


class AddressInline(admin.TabularInline):
    model  = Address
    extra  = 0
    fields = ("address_type", "full_name", "city", "country", "is_default")


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display   = (
        "email", "get_full_name", "role",
        "is_active", "is_verified", "date_joined", "avatar_preview",
    )
    list_filter    = ("role", "is_active", "is_verified", "is_staff")
    search_fields  = ("email", "first_name", "last_name", "phone")
    ordering       = ("-date_joined",)
    readonly_fields = ("id", "date_joined", "last_login", "avatar_preview")
    list_per_page  = 30

    fieldsets = (
        ("Account",       {"fields": ("id", "email", "password")}),
        ("Personal Info", {"fields": ("first_name", "last_name", "phone", "avatar", "avatar_preview")}),
        ("Role & Status", {"fields": ("role", "is_active", "is_verified", "is_staff", "is_superuser")}),
        ("Permissions",   {"fields": ("groups", "user_permissions"), "classes": ("collapse",)}),
        ("Timestamps",    {"fields": ("date_joined", "last_login"), "classes": ("collapse",)}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "first_name", "last_name", "role", "password1", "password2"),
        }),
    )

    inlines = [AddressInline]

    def avatar_preview(self, obj):
        if obj.avatar:
            return format_html(
                '<img src="{}" style="width:40px;height:40px;'
                'border-radius:50%;object-fit:cover;" />',
                obj.avatar.url,
            )
        return "—"
    avatar_preview.short_description = "Avatar"


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display  = ("user", "address_type", "full_name", "city", "country", "is_default")
    list_filter   = ("address_type", "country", "is_default")
    search_fields = ("user__email", "full_name", "city")
    raw_id_fields = ("user",)