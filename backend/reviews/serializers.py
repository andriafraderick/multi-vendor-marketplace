"""
reviews/serializers.py
Serializers for ProductReview, VendorReview, ReviewImage,
ReviewHelpfulness, ReviewFlag.
"""
from rest_framework import serializers
from django.utils import timezone
from .models import (
    ProductReview, ReviewImage,
    ReviewHelpfulness, ReviewFlag, VendorReview,
)


# ── Review Image ───────────────────────────────────────────────────────────────

class ReviewImageSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ReviewImage
        fields = ("id", "image", "caption", "uploaded_at")
        read_only_fields = ("id", "uploaded_at")


# ── Product Review ─────────────────────────────────────────────────────────────

class ProductReviewSerializer(serializers.ModelSerializer):
    """
    Full product review — shown on product detail page.
    Includes buyer info, images, helpfulness counts.
    """
    buyer_name   = serializers.SerializerMethodField()
    buyer_avatar = serializers.SerializerMethodField()
    images       = ReviewImageSerializer(many=True, read_only=True)
    helpfulness  = serializers.SerializerMethodField()
    user_vote    = serializers.SerializerMethodField()

    class Meta:
        model  = ProductReview
        fields = (
            "id",
            "buyer_name", "buyer_avatar",
            "rating", "title", "body", "pros", "cons",
            "images",
            "vendor_response", "vendor_responded_at",
            "helpful_count", "not_helpful_count",
            "helpfulness", "user_vote",
            "is_verified_purchase", "is_edited",
            "moderation_status",
            "created_at", "updated_at",
        )

    def get_buyer_name(self, obj):
        return obj.buyer.get_full_name()

    def get_buyer_avatar(self, obj):
        if obj.buyer.avatar:
            request = self.context.get("request")
            return (
                request.build_absolute_uri(obj.buyer.avatar.url)
                if request else obj.buyer.avatar.url
            )
        return None

    def get_helpfulness(self, obj):
        return {
            "helpful":     obj.helpful_count,
            "not_helpful": obj.not_helpful_count,
            "total":       obj.helpful_count + obj.not_helpful_count,
        }

    def get_user_vote(self, obj):
        """Returns the authenticated user's vote on this review, if any."""
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        vote = ReviewHelpfulness.objects.filter(
            review=obj, user=request.user
        ).first()
        if vote:
            return "helpful" if vote.is_helpful else "not_helpful"
        return None


class ProductReviewCreateSerializer(serializers.ModelSerializer):
    """
    Used by buyers to submit a review.
    Validates that they have a completed, unreviewed OrderItem for this product.
    """
    order_item_id = serializers.UUIDField(write_only=True)

    class Meta:
        model  = ProductReview
        fields = (
            "order_item_id",
            "rating", "title", "body", "pros", "cons",
        )

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate_body(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError(
                "Review must be at least 10 characters long."
            )
        return value.strip()

    def validate(self, attrs):
        from orders.models import OrderItem
        request        = self.context["request"]
        order_item_id  = attrs["order_item_id"]

        # Verify the OrderItem belongs to the buyer
        try:
            order_item = OrderItem.objects.get(
                id                          = order_item_id,
                vendor_order__order__buyer  = request.user,
            )
        except OrderItem.DoesNotExist:
            raise serializers.ValidationError(
                {"order_item_id": "Order item not found or does not belong to you."}
            )

        # Order must be delivered
        if order_item.vendor_order.status != "delivered":
            raise serializers.ValidationError(
                {"order_item_id": "You can only review items from delivered orders."}
            )

        # Prevent duplicate reviews
        if order_item.review_left:
            raise serializers.ValidationError(
                {"order_item_id": "You have already reviewed this item."}
            )

        # Prevent duplicate via model check
        if ProductReview.objects.filter(
            buyer=request.user, order_item=order_item
        ).exists():
            raise serializers.ValidationError(
                {"order_item_id": "You have already reviewed this item."}
            )

        attrs["order_item"] = order_item
        attrs["product"]    = order_item.product
        return attrs

    def create(self, validated_data):
        validated_data.pop("order_item_id")
        order_item = validated_data.pop("order_item")
        buyer      = self.context["request"].user

        review = ProductReview.objects.create(
            buyer      = buyer,
            order_item = order_item,
            **validated_data,
        )

        # Mark order item as reviewed so it cannot be reviewed again
        order_item.review_left = True
        order_item.save(update_fields=["review_left"])

        return review


class ProductReviewUpdateSerializer(serializers.ModelSerializer):
    """Buyer edits their own review (rating + text only)."""

    class Meta:
        model  = ProductReview
        fields = ("rating", "title", "body", "pros", "cons")

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate_body(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError(
                "Review must be at least 10 characters long."
            )
        return value.strip()

    def update(self, instance, validated_data):
        instance.is_edited = True
        # Reset to pending moderation when edited
        instance.moderation_status = ProductReview.ModerationStatus.PENDING
        return super().update(instance, validated_data)


# ── Vendor Response ────────────────────────────────────────────────────────────

class VendorResponseSerializer(serializers.Serializer):
    """Vendor responds to a product review on their store."""
    vendor_response = serializers.CharField(min_length=10, max_length=2000)

    def validate_vendor_response(self, value):
        return value.strip()


# ── Review Helpfulness ─────────────────────────────────────────────────────────

class ReviewHelpfulnessSerializer(serializers.Serializer):
    """
    Buyer votes a review as helpful or not.
    Body: { "is_helpful": true }
    """
    is_helpful = serializers.BooleanField()


# ── Review Flag ────────────────────────────────────────────────────────────────

class ReviewFlagSerializer(serializers.ModelSerializer):
    """User flags a review as inappropriate."""

    class Meta:
        model  = ReviewFlag
        fields = ("id", "reason", "detail", "created_at")
        read_only_fields = ("id", "created_at")

    def validate_reason(self, value):
        valid = [r[0] for r in ReviewFlag.Reason.choices]
        if value not in valid:
            raise serializers.ValidationError(
                f"Reason must be one of: {valid}"
            )
        return value

    def create(self, validated_data):
        request = self.context["request"]
        review  = self.context["review"]

        # Prevent duplicate flags from same user
        existing = ReviewFlag.objects.filter(
            review=review, flagged_by=request.user
        ).exists()
        if existing:
            raise serializers.ValidationError(
                {"detail": "You have already flagged this review."}
            )

        flag = ReviewFlag.objects.create(
            review     = review,
            flagged_by = request.user,
            **validated_data,
        )

        # Auto-escalate if many flags
        flag_count = review.flags.count()
        if flag_count >= 3:
            review.moderation_status = ProductReview.ModerationStatus.FLAGGED
            review.save(update_fields=["moderation_status"])

        return flag


# ── Admin Moderation ───────────────────────────────────────────────────────────

class AdminReviewModerationSerializer(serializers.ModelSerializer):
    """Admin approves, rejects, or flags a product review."""
    buyer_name   = serializers.SerializerMethodField()
    product_name = serializers.CharField(source="product.name", read_only=True)
    flag_count   = serializers.SerializerMethodField()
    flags        = serializers.SerializerMethodField()
    images       = ReviewImageSerializer(many=True, read_only=True)

    class Meta:
        model  = ProductReview
        fields = (
            "id",
            "buyer_name", "product_name",
            "rating", "title", "body", "pros", "cons",
            "images",
            "moderation_status", "moderation_note",
            "vendor_response",
            "helpful_count", "not_helpful_count",
            "is_verified_purchase", "is_edited",
            "flag_count", "flags",
            "created_at", "updated_at",
        )
        read_only_fields = (
            "id", "buyer_name", "product_name",
            "rating", "title", "body",
            "helpful_count", "not_helpful_count",
            "is_verified_purchase", "is_edited",
            "flag_count", "flags", "images",
            "created_at", "updated_at",
        )

    def get_buyer_name(self, obj):
        return obj.buyer.get_full_name()

    def get_flag_count(self, obj):
        return obj.flags.count()

    def get_flags(self, obj):
        return obj.flags.values("reason", "detail", "created_at")


class AdminModerationActionSerializer(serializers.Serializer):
    """
    Input for admin moderation action.
    Body: { "action": "approve", "note": "Looks good." }
    """
    action = serializers.ChoiceField(
        choices=["approve", "reject", "flag", "unflag"]
    )
    note   = serializers.CharField(
        required=False, allow_blank=True, max_length=500
    )


# ── Product Rating Summary ─────────────────────────────────────────────────────

class RatingSummarySerializer(serializers.Serializer):
    """
    Aggregated rating breakdown for a product.
    Returns star distribution (5★: 40%, 4★: 30%, etc.)
    """
    average_rating  = serializers.FloatField()
    total_reviews   = serializers.IntegerField()
    rating_breakdown = serializers.DictField()
    verified_count  = serializers.IntegerField()
    with_images_count = serializers.IntegerField()


# ── Vendor Review ──────────────────────────────────────────────────────────────

class VendorReviewSerializer(serializers.ModelSerializer):
    """Public vendor review shown on vendor storefront."""
    buyer_name   = serializers.SerializerMethodField()
    buyer_avatar = serializers.SerializerMethodField()

    class Meta:
        model  = VendorReview
        fields = (
            "id",
            "buyer_name", "buyer_avatar",
            "rating",
            "communication_rating",
            "shipping_rating",
            "body",
            "is_approved",
            "created_at",
        )

    def get_buyer_name(self, obj):
        return obj.buyer.get_full_name()

    def get_buyer_avatar(self, obj):
        if obj.buyer.avatar:
            request = self.context.get("request")
            return (
                request.build_absolute_uri(obj.buyer.avatar.url)
                if request else obj.buyer.avatar.url
            )
        return None


class VendorReviewCreateSerializer(serializers.ModelSerializer):
    """
    Buyer leaves a vendor-level review after a completed VendorOrder.
    One per VendorOrder per buyer.
    """
    vendor_order_id = serializers.UUIDField(write_only=True)

    class Meta:
        model  = VendorReview
        fields = (
            "vendor_order_id",
            "rating",
            "communication_rating",
            "shipping_rating",
            "body",
        )

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate(self, attrs):
        from orders.models import VendorOrder
        request         = self.context["request"]
        vendor_order_id = attrs["vendor_order_id"]

        # Check VendorOrder belongs to buyer and is delivered
        try:
            vendor_order = VendorOrder.objects.get(
                id                   = vendor_order_id,
                order__buyer         = request.user,
            )
        except VendorOrder.DoesNotExist:
            raise serializers.ValidationError(
                {"vendor_order_id": "Order not found or does not belong to you."}
            )

        if vendor_order.status != "delivered":
            raise serializers.ValidationError(
                {"vendor_order_id": "You can only review vendors from delivered orders."}
            )

        # Prevent duplicate
        if VendorReview.objects.filter(
            buyer=request.user, vendor_order=vendor_order
        ).exists():
            raise serializers.ValidationError(
                {"vendor_order_id": "You have already reviewed this vendor for this order."}
            )

        attrs["vendor_order"] = vendor_order
        attrs["vendor"]       = vendor_order.vendor
        return attrs

    def create(self, validated_data):
        validated_data.pop("vendor_order_id")
        buyer = self.context["request"].user
        return VendorReview.objects.create(buyer=buyer, **validated_data)