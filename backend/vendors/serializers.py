"""
vendors/serializers.py
Serializers for VendorProfile, PayoutRequest.
"""
from rest_framework import serializers
from .models import VendorProfile, VendorPayoutRequest, CommissionRecord


class VendorProfilePublicSerializer(serializers.ModelSerializer):
    """
    Public-facing vendor profile (shown on storefront pages).
    No sensitive financial data.
    """
    owner_name = serializers.SerializerMethodField()

    class Meta:
        model  = VendorProfile
        fields = (
            "id", "store_name", "slug", "logo", "banner",
            "description", "tagline",
            "business_email", "business_phone", "website",
            "city", "country",
            "average_rating", "total_reviews", "total_orders",
            "owner_name", "created_at",
        )

    def get_owner_name(self, obj):
        return obj.user.get_full_name()


class VendorProfileDashboardSerializer(serializers.ModelSerializer):
    """
    Private vendor dashboard view — includes financial and status fields.
    Shown only to the vendor themselves.
    """
    owner_email = serializers.EmailField(source="user.email",          read_only=True)
    owner_name  = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model  = VendorProfile
        fields = (
            "id", "store_name", "slug", "logo", "banner",
            "description", "tagline",
            "business_email", "business_phone", "website",
            "address", "city", "country",
            "status", "status_display",
            "commission_rate",
            "stripe_account_id", "stripe_onboarding_complete",
            "total_sales", "total_orders",
            "average_rating", "total_reviews",
            "owner_email", "owner_name",
            "created_at", "updated_at",
        )
        read_only_fields = (
            "id", "slug", "status", "commission_rate",
            "stripe_onboarding_complete",
            "total_sales", "total_orders",
            "average_rating", "total_reviews",
            "owner_email", "owner_name",
            "created_at", "updated_at",
        )

    def get_owner_name(self, obj):
        return obj.user.get_full_name()


class VendorProfileUpdateSerializer(serializers.ModelSerializer):
    """Vendor updates their own store info."""

    class Meta:
        model  = VendorProfile
        fields = (
            "store_name", "logo", "banner",
            "description", "tagline",
            "business_email", "business_phone", "website",
            "address", "city", "country",
        )

    def validate_store_name(self, value):
        qs = VendorProfile.objects.filter(store_name=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This store name is already taken.")
        return value


class VendorPayoutRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model  = VendorPayoutRequest
        fields = (
            "id", "amount", "status",
            "notes", "requested_at", "processed_at",
        )
        read_only_fields = ("id", "status", "requested_at", "processed_at")

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Payout amount must be greater than 0.")
        return value


class AdminVendorListSerializer(serializers.ModelSerializer):
    """Admin view of vendors — includes status and financial data."""
    owner_email = serializers.EmailField(source="user.email", read_only=True)
    owner_name  = serializers.SerializerMethodField()

    class Meta:
        model  = VendorProfile
        fields = (
            "id", "store_name", "slug",
            "status", "commission_rate",
            "total_sales", "total_orders",
            "average_rating", "total_reviews",
            "owner_email", "owner_name",
            "stripe_onboarding_complete",
            "created_at",
        )

    def get_owner_name(self, obj):
        return obj.user.get_full_name()


class AdminVendorDetailSerializer(serializers.ModelSerializer):
    """Admin full detail of a vendor."""
    owner_email = serializers.EmailField(source="user.email", read_only=True)
    owner_name  = serializers.SerializerMethodField()

    class Meta:
        model  = VendorProfile
        fields = "__all__"

    def get_owner_name(self, obj):
        return obj.user.get_full_name()


class AdminVendorStatusSerializer(serializers.ModelSerializer):
    """Admin changes vendor status."""

    class Meta:
        model  = VendorProfile
        fields = ("status", "rejection_reason", "commission_rate")

    def validate_status(self, value):
        allowed = ["active", "suspended", "rejected", "pending"]
        if value not in allowed:
            raise serializers.ValidationError(f"Status must be one of: {allowed}")
        return value