"""
accounts/models.py — Custom User Model with Role-Based Access
"""
from django.contrib.auth.models import (
    AbstractBaseUser, BaseUserManager, PermissionsMixin
)
from django.db import models
from django.utils import timezone
import uuid


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "admin")
        extra_fields.setdefault("is_verified", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Central user model.
    role determines access level across the entire platform.
    """

    class Role(models.TextChoices):
        BUYER  = "buyer",  "Buyer"
        VENDOR = "vendor", "Vendor"
        ADMIN  = "admin",  "Admin"

    # Identity
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email      = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=100)
    last_name  = models.CharField(max_length=100)
    avatar     = models.ImageField(upload_to="avatars/", blank=True, null=True)
    phone      = models.CharField(max_length=20, blank=True)

    # Role & Status
    role        = models.CharField(max_length=10, choices=Role.choices, default=Role.BUYER)
    is_active   = models.BooleanField(default=True)
    is_staff    = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)

    # Timestamps
    date_joined = models.DateTimeField(default=timezone.now)
    last_login  = models.DateTimeField(blank=True, null=True)
    updated_at  = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD  = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    class Meta:
        verbose_name        = "User"
        verbose_name_plural = "Users"
        ordering            = ["-date_joined"]

    def __str__(self):
        return f"{self.get_full_name()} ({self.email}) — {self.role}"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def is_buyer(self):
        return self.role == self.Role.BUYER

    @property
    def is_vendor(self):
        return self.role == self.Role.VENDOR

    @property
    def is_admin_user(self):
        return self.role == self.Role.ADMIN


class Address(models.Model):
    """Shipping / billing addresses saved by buyers."""

    class AddressType(models.TextChoices):
        SHIPPING = "shipping", "Shipping"
        BILLING  = "billing",  "Billing"

    user         = models.ForeignKey(User, on_delete=models.CASCADE, related_name="addresses")
    address_type = models.CharField(max_length=10, choices=AddressType.choices)
    full_name    = models.CharField(max_length=200)
    street_address = models.CharField(max_length=255)
    city         = models.CharField(max_length=100)
    state        = models.CharField(max_length=100)
    postal_code  = models.CharField(max_length=20)
    country      = models.CharField(max_length=100, default="US")
    is_default   = models.BooleanField(default=False)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Addresses"
        ordering = ["-is_default", "-created_at"]

    def __str__(self):
        return f"{self.full_name} — {self.city}, {self.country}"

    def save(self, *args, **kwargs):
        # Only one default address per type per user
        if self.is_default:
            Address.objects.filter(
                user=self.user,
                address_type=self.address_type,
                is_default=True,
            ).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)


class EmailVerificationToken(models.Model):
    """One-time token sent to verify a user's email address."""
    user       = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="verification_token"
    )
    token      = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used    = models.BooleanField(default=False)

    def __str__(self):
        return f"Verification token for {self.user.email}"

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at


class PasswordResetToken(models.Model):
    """One-time token for password reset flow."""
    user       = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="reset_tokens"
    )
    token      = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used    = models.BooleanField(default=False)

    def __str__(self):
        return f"Reset token for {self.user.email}"

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at