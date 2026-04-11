"""
reviews/models.py — ProductReview, ReviewImage, ReviewHelpfulness,
                    ReviewFlag, VendorReview
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid


class ProductReview(models.Model):
    """
    Buyer review on a product.
    Gated: buyer must have a completed OrderItem for that product.
    One review per buyer per OrderItem.
    """

    class ModerationStatus(models.TextChoices):
        PENDING  = "pending",  "Pending Review"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        FLAGGED  = "flagged",  "Flagged"

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product    = models.ForeignKey(
        "products.Product", on_delete=models.CASCADE, related_name="reviews"
    )
    buyer      = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="product_reviews"
    )
    order_item = models.OneToOneField(
        "orders.OrderItem", on_delete=models.CASCADE, related_name="review"
    )

    # Content
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    title  = models.CharField(max_length=200, blank=True)
    body   = models.TextField()
    pros   = models.CharField(max_length=500, blank=True)
    cons   = models.CharField(max_length=500, blank=True)

    # Moderation
    moderation_status = models.CharField(
        max_length=10, choices=ModerationStatus.choices, default=ModerationStatus.PENDING
    )
    moderation_note = models.TextField(blank=True)
    moderated_by    = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="moderated_reviews",
    )
    moderated_at = models.DateTimeField(null=True, blank=True)

    # Vendor response
    vendor_response      = models.TextField(blank=True)
    vendor_responded_at  = models.DateTimeField(null=True, blank=True)

    # Helpfulness votes
    helpful_count     = models.PositiveIntegerField(default=0)
    not_helpful_count = models.PositiveIntegerField(default=0)

    is_verified_purchase = models.BooleanField(default=True)
    is_edited            = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes  = [
            models.Index(fields=["product", "moderation_status"]),
            models.Index(fields=["buyer", "product"]),
        ]

    def __str__(self):
        return f"{self.buyer.get_full_name()} — {self.product.name} ({self.rating}★)"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self._update_product_rating()

    def _update_product_rating(self):
        from django.db.models import Avg, Count
        stats = ProductReview.objects.filter(
            product=self.product,
            moderation_status=self.ModerationStatus.APPROVED,
        ).aggregate(avg=Avg("rating"), count=Count("id"))
        self.product.average_rating = stats["avg"] or 0
        self.product.total_reviews  = stats["count"]
        self.product.save(update_fields=["average_rating", "total_reviews"])


class ReviewImage(models.Model):
    """Photos attached to a product review."""
    review     = models.ForeignKey(ProductReview, on_delete=models.CASCADE, related_name="images")
    image      = models.ImageField(upload_to="review_images/")
    caption    = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image on review {self.review.id}"


class ReviewHelpfulness(models.Model):
    """Did a user find this review helpful?"""
    review     = models.ForeignKey(
        ProductReview, on_delete=models.CASCADE, related_name="helpfulness_votes"
    )
    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    is_helpful = models.BooleanField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["review", "user"]

    def __str__(self):
        return f"{self.user.email} — {'helpful' if self.is_helpful else 'not helpful'}"


class ReviewFlag(models.Model):
    """Users can flag a review as inappropriate."""

    class Reason(models.TextChoices):
        SPAM          = "spam",          "Spam"
        INAPPROPRIATE = "inappropriate", "Inappropriate Content"
        FAKE          = "fake",          "Fake Review"
        IRRELEVANT    = "irrelevant",    "Irrelevant"
        OTHER         = "other",         "Other"

    review     = models.ForeignKey(ProductReview, on_delete=models.CASCADE, related_name="flags")
    flagged_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    reason     = models.CharField(max_length=20, choices=Reason.choices)
    detail     = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["review", "flagged_by"]

    def __str__(self):
        return f"Flag on review {self.review.id} — {self.reason}"


class VendorReview(models.Model):
    """
    Store-level review left after a completed VendorOrder.
    Separate from individual product reviews.
    """
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vendor       = models.ForeignKey(
        "vendors.VendorProfile", on_delete=models.CASCADE, related_name="reviews"
    )
    buyer        = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="vendor_reviews"
    )
    vendor_order = models.OneToOneField(
        "orders.VendorOrder", on_delete=models.CASCADE, related_name="vendor_review"
    )

    rating               = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    communication_rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    shipping_rating      = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    body                 = models.TextField(blank=True)
    is_approved          = models.BooleanField(default=True)
    created_at           = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering        = ["-created_at"]
        unique_together = ["vendor", "buyer", "vendor_order"]

    def __str__(self):
        return f"{self.buyer.get_full_name()} → {self.vendor.store_name} ({self.rating}★)"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self._update_vendor_rating()

    def _update_vendor_rating(self):
        from django.db.models import Avg, Count
        stats = VendorReview.objects.filter(
            vendor=self.vendor, is_approved=True
        ).aggregate(avg=Avg("rating"), count=Count("id"))
        self.vendor.average_rating = stats["avg"] or 0
        self.vendor.total_reviews  = stats["count"]
        self.vendor.save(update_fields=["average_rating", "total_reviews"])