"""
accounts/emails.py
Helper functions to send transactional emails.
Uses Django's built-in email backend (configured in settings).
"""
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import uuid


def send_verification_email(user):
    """
    Create a fresh verification token and email it to the user.
    Call this at registration and when user requests a resend.
    """
    from .models import EmailVerificationToken

    # Delete any existing token for this user
    EmailVerificationToken.objects.filter(user=user).delete()

    # Create a new token valid for 24 hours
    token = EmailVerificationToken.objects.create(
        user=user,
        token=uuid.uuid4(),
        expires_at=timezone.now() + timedelta(hours=24),
    )

    verification_url = (
        f"{settings.FRONTEND_URL}/verify-email/{token.token}"
        if hasattr(settings, "FRONTEND_URL")
        else f"http://localhost:5173/verify-email/{token.token}"
    )

    send_mail(
        subject="Verify your email — Marketplace",
        message=(
            f"Hi {user.first_name},\n\n"
            f"Please verify your email address by clicking the link below:\n\n"
            f"{verification_url}\n\n"
            f"This link expires in 24 hours.\n\n"
            f"If you didn't create an account, ignore this email.\n\n"
            f"— The Marketplace Team"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,  # Don't crash registration if email fails
    )
    return token


def send_password_reset_email(user):
    """
    Create a password reset token and email it to the user.
    Token is valid for 1 hour.
    """
    from .models import PasswordResetToken

    # Invalidate all previous tokens for this user
    PasswordResetToken.objects.filter(user=user, is_used=False).update(is_used=True)

    token = PasswordResetToken.objects.create(
        user=user,
        token=uuid.uuid4(),
        expires_at=timezone.now() + timedelta(hours=1),
    )

    reset_url = (
        f"{settings.FRONTEND_URL}/reset-password/{token.token}"
        if hasattr(settings, "FRONTEND_URL")
        else f"http://localhost:5173/reset-password/{token.token}"
    )

    send_mail(
        subject="Reset your password — Marketplace",
        message=(
            f"Hi {user.first_name},\n\n"
            f"You requested a password reset. Click the link below:\n\n"
            f"{reset_url}\n\n"
            f"This link expires in 1 hour.\n\n"
            f"If you didn't request this, ignore this email — "
            f"your password has not been changed.\n\n"
            f"— The Marketplace Team"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )
    return token


def send_vendor_status_email(vendor_profile):
    """Notify a vendor when their store application status changes."""
    user = vendor_profile.user
    status = vendor_profile.status

    if status == "active":
        subject = "🎉 Your vendor account is approved!"
        message = (
            f"Hi {user.first_name},\n\n"
            f"Great news! Your store '{vendor_profile.store_name}' "
            f"has been approved and is now live on the Marketplace.\n\n"
            f"Log in to your vendor dashboard to start listing products.\n\n"
            f"— The Marketplace Team"
        )
    elif status == "rejected":
        subject = "Your vendor application was not approved"
        reason = vendor_profile.rejection_reason or "No reason provided."
        message = (
            f"Hi {user.first_name},\n\n"
            f"Unfortunately, your store '{vendor_profile.store_name}' "
            f"was not approved at this time.\n\n"
            f"Reason: {reason}\n\n"
            f"You may reapply after addressing the issue.\n\n"
            f"— The Marketplace Team"
        )
    elif status == "suspended":
        subject = "Your vendor account has been suspended"
        message = (
            f"Hi {user.first_name},\n\n"
            f"Your store '{vendor_profile.store_name}' has been suspended. "
            f"Please contact support for more information.\n\n"
            f"— The Marketplace Team"
        )
    else:
        return  # Don't send for other statuses

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )