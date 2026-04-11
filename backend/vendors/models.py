"""
vendors/models.py — VendorProfile, CommissionRecord, VendorPayoutRequest
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid


class VendorProfile(models.Model):

    class Status(models.TextChoices):
        PENDING   = "pending",   "Pending Approval"
        ACTIVE    = "active",    "Active"
        SUSPENDED = "suspended", "Suspended"
        REJECTED  = "rejected",  "Rejected"

    # Identity
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user        = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="vendor_profile",
    )
    store_name  = models.CharField(max_length=200, unique=True)
    slug        = models.SlugField(max_length=220, unique=True, blank=True)
    logo        = models.ImageField(upload_to="vendor_logos/",   blank=True, null=True)
    banner      = models.ImageField(upload_to="vendor_banners/", blank=True, null=True)
    description = models.TextField(blank=True)
    tagline     = models.CharField(max_length=255, blank=True)

    # Contact
    business_email = models.EmailField(blank=True)
    business_phone = models.CharField(max_length=20, blank=True)
    website        = models.URLField(blank=True)
    address        = models.TextField(blank=True)
    city           = models.CharField(max_length=100, blank=True)
    country        = models.CharField(max_length=100, blank=True)

    # Status & Approval
    status           = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    rejection_reason = models.TextField(blank=True)
    approved_at      = models.DateTimeField(null=True, blank=True)
    approved_by      = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="approved_vendors",
    )

    # Commission
    commission_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=10.00,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Platform commission percentage (0–100)",
    )

    # Stripe Payout
    stripe_account_id          = models.CharField(max_length=100, blank=True)
    stripe_onboarding_complete = models.BooleanField(default=False)

    # Denormalized stats (updated by signals / tasks)
    total_sales    = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_orders   = models.PositiveIntegerField(default=0)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    total_reviews  = models.PositiveIntegerField(default=0)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering     = ["-created_at"]
        verbose_name = "Vendor Profile"

    def __str__(self):
        return f"{self.store_name} ({self.status})"

    @property
    def is_active(self):
        return self.status == self.Status.ACTIVE

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.store_name)
        super().save(*args, **kwargs)


class CommissionRecord(models.Model):
    """
    Tracks platform commission earned per order item.
    Auto-created when an order is confirmed.
    """

    class Status(models.TextChoices):
        PENDING   = "pending",   "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        PAID_OUT  = "paid_out",  "Paid Out"
        REFUNDED  = "refunded",  "Refunded"

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vendor     = models.ForeignKey(
        VendorProfile, on_delete=models.CASCADE, related_name="commission_records"
    )
    order_item = models.OneToOneField(
        "orders.OrderItem", 
        on_delete=models.CASCADE,
        related_name="commission",
    )

    # Financials (snapshot at time of sale)
    gross_amount      = models.DecimalField(max_digits=10, decimal_places=2)
    commission_rate   = models.DecimalField(max_digits=5,  decimal_places=2)
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2)
    vendor_payout     = models.DecimalField(max_digits=10, decimal_places=2)

    status             = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    paid_out_at        = models.DateTimeField(null=True, blank=True)
    stripe_transfer_id = models.CharField(max_length=100, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering     = ["-created_at"]
        verbose_name = "Commission Record"

    def __str__(self):
        return f"{self.vendor.store_name} — ${self.commission_amount} commission"

    def save(self, *args, **kwargs):
        # Auto-calculate on every save
        if self.gross_amount and self.commission_rate:
            self.commission_amount = (self.gross_amount * self.commission_rate) / 100
            self.vendor_payout     = self.gross_amount - self.commission_amount
        super().save(*args, **kwargs)


class VendorPayoutRequest(models.Model):
    """Vendor requests a payout of accumulated earnings."""

    class Status(models.TextChoices):
        PENDING    = "pending",    "Pending"
        PROCESSING = "processing", "Processing"
        COMPLETED  = "completed",  "Completed"
        FAILED     = "failed",     "Failed"

    id                 = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vendor             = models.ForeignKey(VendorProfile, on_delete=models.CASCADE, related_name="payout_requests")
    amount             = models.DecimalField(max_digits=10, decimal_places=2)
    status             = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    stripe_transfer_id = models.CharField(max_length=100, blank=True)
    notes              = models.TextField(blank=True)
    requested_at       = models.DateTimeField(auto_now_add=True)
    processed_at       = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-requested_at"]

    def __str__(self):
        return f"{self.vendor.store_name} — ${self.amount} ({self.status})"