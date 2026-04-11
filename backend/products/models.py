"""
products/models.py — Category, Product, ProductImage, ProductVariant,
                     ProductAttribute, Wishlist
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
import uuid


class Category(models.Model):
    """Hierarchical categories (supports parent → child nesting)."""
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name        = models.CharField(max_length=150)
    slug        = models.SlugField(max_length=170, unique=True)
    description = models.TextField(blank=True)
    icon        = models.CharField(max_length=50, blank=True, help_text="MUI icon name")
    image       = models.ImageField(upload_to="categories/", blank=True, null=True)
    parent      = models.ForeignKey(
        "self", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="subcategories",
    )
    is_active   = models.BooleanField(default=True)
    sort_order  = models.PositiveIntegerField(default=0)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ["sort_order", "name"]

    def __str__(self):
        return f"{self.parent.name} > {self.name}" if self.parent else self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Product(models.Model):
    """Core product model. Belongs to a vendor."""

    class Status(models.TextChoices):
        DRAFT    = "draft",    "Draft"
        PENDING  = "pending",  "Pending Approval"
        ACTIVE   = "active",   "Active"
        REJECTED = "rejected", "Rejected"
        ARCHIVED = "archived", "Archived"

    class Condition(models.TextChoices):
        NEW         = "new",         "New"
        USED        = "used",        "Used"
        REFURBISHED = "refurbished", "Refurbished"

    # Identity
    id       = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vendor   = models.ForeignKey(
        "vendors.VendorProfile", on_delete=models.CASCADE, related_name="products"
    )
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, related_name="products"
    )

    # Details
    name              = models.CharField(max_length=255)
    slug              = models.SlugField(max_length=280, unique=True, blank=True)
    description       = models.TextField()
    short_description = models.CharField(max_length=500, blank=True)
    sku               = models.CharField(max_length=100, unique=True, blank=True)
    condition         = models.CharField(max_length=15, choices=Condition.choices, default=Condition.NEW)

    # Pricing
    price            = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    compare_at_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Original price shown for discount display",
    )
    cost_price       = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Vendor cost (private)",
    )

    # Inventory
    stock_quantity     = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    low_stock_threshold = models.PositiveIntegerField(default=5)
    track_inventory    = models.BooleanField(default=True)

    # Shipping
    weight            = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, help_text="kg")
    requires_shipping = models.BooleanField(default=True)
    free_shipping     = models.BooleanField(default=False)

    # Status & Visibility
    status           = models.CharField(max_length=15, choices=Status.choices, default=Status.DRAFT)
    rejection_reason = models.TextField(blank=True)
    is_featured      = models.BooleanField(default=False)
    is_digital       = models.BooleanField(default=False)

    # SEO
    meta_title       = models.CharField(max_length=255, blank=True)
    meta_description = models.CharField(max_length=500, blank=True)
    tags             = models.CharField(max_length=500, blank=True, help_text="Comma-separated")

    # Denormalized stats
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    total_reviews  = models.PositiveIntegerField(default=0)
    total_sales    = models.PositiveIntegerField(default=0)
    view_count     = models.PositiveIntegerField(default=0)

    # Timestamps
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes  = [
            models.Index(fields=["status", "is_featured"]),
            models.Index(fields=["vendor", "status"]),
            models.Index(fields=["category", "status"]),
        ]

    def __str__(self):
        return f"{self.name} — {self.vendor.store_name}"

    @property
    def is_in_stock(self):
        return True if not self.track_inventory else self.stock_quantity > 0

    @property
    def is_low_stock(self):
        return 0 < self.stock_quantity <= self.low_stock_threshold

    @property
    def discount_percentage(self):
        if self.compare_at_price and self.compare_at_price > self.price:
            return round(
                ((self.compare_at_price - self.price) / self.compare_at_price) * 100
            )
        return 0

    def save(self, *args, **kwargs):
        if not self.slug:
            import random, string
            from django.utils.text import slugify
            suffix    = "".join(random.choices(string.ascii_lowercase + string.digits, k=6))
            self.slug = f"{slugify(self.name)}-{suffix}"
        if not self.sku:
            import random, string
            self.sku = "".join(random.choices(string.ascii_uppercase + string.digits, k=10))
        super().save(*args, **kwargs)


class ProductImage(models.Model):
    """Multiple ordered images per product."""
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product    = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image      = models.ImageField(upload_to="products/")
    alt_text   = models.CharField(max_length=255, blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "created_at"]

    def __str__(self):
        return f"Image #{self.sort_order} for {self.product.name}"

    def save(self, *args, **kwargs):
        if self.is_primary:
            ProductImage.objects.filter(
                product=self.product, is_primary=True
            ).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)


class ProductVariant(models.Model):
    """
    Optional per-product variants (e.g. Size: M, Color: Red).
    Each variant has its own price modifier and stock.
    """
    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product        = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="variants")
    name           = models.CharField(max_length=100, help_text="e.g. 'Size / Color'")
    value          = models.CharField(max_length=100, help_text="e.g. 'M / Red'")
    sku            = models.CharField(max_length=100, unique=True, blank=True)
    price_modifier = models.DecimalField(
        max_digits=8, decimal_places=2, default=0,
        help_text="Added to base price (can be negative)",
    )
    stock_quantity = models.IntegerField(default=0)
    is_active      = models.BooleanField(default=True)

    class Meta:
        unique_together = ["product", "name", "value"]

    def __str__(self):
        return f"{self.product.name} — {self.name}: {self.value}"

    @property
    def final_price(self):
        return self.product.price + self.price_modifier


class ProductAttribute(models.Model):
    """Key-value spec sheet entries (e.g. Material: Cotton)."""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="attributes")
    key     = models.CharField(max_length=100)
    value   = models.CharField(max_length=255)

    class Meta:
        unique_together = ["product", "key"]

    def __str__(self):
        return f"{self.product.name}: {self.key} = {self.value}"


class Wishlist(models.Model):
    """Buyers save products they want to buy later."""
    user      = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="wishlist"
    )
    product   = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="wishlisted_by")
    added_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["user", "product"]

    def __str__(self):
        return f"{self.user.email} → {self.product.name}"