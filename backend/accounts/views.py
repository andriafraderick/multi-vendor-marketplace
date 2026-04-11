"""
accounts/views.py
All authentication and account management views.
"""
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.utils import timezone

from .models import User, Address
from .serializers import (
    RegisterSerializer,
    VendorRegisterSerializer,
    LoginSerializer,
    UserProfileSerializer,
    UpdateProfileSerializer,
    ChangePasswordSerializer,
    AddressSerializer,
    VerifyEmailSerializer,
    ResendVerificationSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
)
from .emails import send_verification_email, send_password_reset_email
from .permissions import IsOwnerOrAdmin


# ── Helpers ────────────────────────────────────────────────────────────────────

def get_tokens_for_user(user):
    """Generate JWT access + refresh token pair for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access":  str(refresh.access_token),
    }


def user_response_data(user, tokens=None):
    """
    Builds the standard user data payload returned after login/register.
    Optionally includes tokens.
    """
    data = {
        "id":         str(user.id),
        "email":      user.email,
        "first_name": user.first_name,
        "last_name":  user.last_name,
        "full_name":  user.get_full_name(),
        "role":       user.role,
        "is_verified": user.is_verified,
        "avatar":     user.avatar.url if user.avatar else None,
    }

    # Attach vendor profile info if applicable
    if user.role == "vendor":
        try:
            vp = user.vendor_profile
            data["vendor"] = {
                "id":         str(vp.id),
                "store_name": vp.store_name,
                "slug":       vp.slug,
                "status":     vp.status,
                "logo":       vp.logo.url if vp.logo else None,
            }
        except Exception:
            data["vendor"] = None

    if tokens:
        data["tokens"] = tokens

    return data


# ── Registration ───────────────────────────────────────────────────────────────

class BuyerRegisterView(APIView):
    """
    POST /api/v1/auth/register/buyer/
    Register a new buyer account.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()
        user.role = "buyer"
        user.save(update_fields=["role"])

        # Send verification email
        send_verification_email(user)

        tokens = get_tokens_for_user(user)
        return Response(
            {
                "message": "Account created. Please check your email to verify your account.",
                "user": user_response_data(user, tokens),
            },
            status=status.HTTP_201_CREATED,
        )


class VendorRegisterView(APIView):
    """
    POST /api/v1/auth/register/vendor/
    Register a new vendor account + pending store.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VendorRegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()

        # Send verification email
        send_verification_email(user)

        tokens = get_tokens_for_user(user)
        return Response(
            {
                "message": (
                    "Vendor account created. Your store application is pending admin approval. "
                    "Please verify your email."
                ),
                "user": user_response_data(user, tokens),
            },
            status=status.HTTP_201_CREATED,
        )


# ── Login / Logout ─────────────────────────────────────────────────────────────

class LoginView(APIView):
    """
    POST /api/v1/auth/login/
    Authenticate user, return JWT tokens + user data.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data["user"]

        # Update last login timestamp
        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])

        tokens = get_tokens_for_user(user)
        return Response(
            {
                "message": "Login successful.",
                "user": user_response_data(user, tokens),
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """
    POST /api/v1/auth/logout/
    Blacklist the refresh token to invalidate the session.
    Body: { "refresh": "<refresh_token>" }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")

        if not refresh_token:
            return Response(
                {"error": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {"message": "Logged out successfully."},
                status=status.HTTP_200_OK,
            )
        except TokenError:
            return Response(
                {"error": "Invalid or expired refresh token."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class TokenRefreshView(APIView):
    """
    POST /api/v1/auth/token/refresh/
    Get a new access token using a valid refresh token.
    Body: { "refresh": "<refresh_token>" }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"error": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            return Response(
                {
                    "access":  str(token.access_token),
                    "refresh": str(token),  # Rotated refresh token
                },
                status=status.HTTP_200_OK,
            )
        except TokenError:
            return Response(
                {"error": "Invalid or expired refresh token. Please log in again."},
                status=status.HTTP_401_UNAUTHORIZED,
            )


# ── Profile ────────────────────────────────────────────────────────────────────

class MeView(APIView):
    """
    GET  /api/v1/auth/me/  — Get current user's profile
    PUT  /api/v1/auth/me/  — Update current user's profile
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response({"user": user_response_data(request.user)})

    def put(self, request):
        serializer = UpdateProfileSerializer(
            request.user, data=request.data, partial=True
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(
            {
                "message": "Profile updated.",
                "user": user_response_data(request.user),
            }
        )


class ChangePasswordView(APIView):
    """
    POST /api/v1/auth/change-password/
    Change password for authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response({"message": "Password changed successfully."})


# ── Email Verification ─────────────────────────────────────────────────────────

class VerifyEmailView(APIView):
    """
    POST /api/v1/auth/verify-email/
    Body: { "token": "<uuid>" }
    Marks user as verified.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.save()
        tokens = get_tokens_for_user(user)
        return Response(
            {
                "message": "Email verified successfully.",
                "user": user_response_data(user, tokens),
            }
        )


class ResendVerificationView(APIView):
    """
    POST /api/v1/auth/resend-verification/
    Body: { "email": "user@example.com" }
    Resends verification email.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Send only if user was found and is not yet verified
        if hasattr(serializer, "user"):
            send_verification_email(serializer.user)

        # Always return 200 to prevent email enumeration
        return Response(
            {"message": "If this email exists and is unverified, a new link has been sent."},
            status=status.HTTP_200_OK,
        )


# ── Password Reset ─────────────────────────────────────────────────────────────

class ForgotPasswordView(APIView):
    """
    POST /api/v1/auth/forgot-password/
    Body: { "email": "user@example.com" }
    Sends a password reset link. Always returns 200 (security).
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Send only if user was actually found
        if hasattr(serializer, "user") and serializer.user:
            send_password_reset_email(serializer.user)

        return Response(
            {"message": "If an account with that email exists, a reset link has been sent."},
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(APIView):
    """
    POST /api/v1/auth/reset-password/
    Body: { "token": "<uuid>", "new_password": "...", "new_password2": "..." }
    Resets the user's password using the token from email.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response({"message": "Password has been reset. You can now log in."})


# ── Addresses ──────────────────────────────────────────────────────────────────

class AddressListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/auth/addresses/         — List all my addresses
    POST /api/v1/auth/addresses/         — Create a new address
    """
    serializer_class   = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/v1/auth/addresses/<id>/  — Get address
    PUT    /api/v1/auth/addresses/<id>/  — Update address
    DELETE /api/v1/auth/addresses/<id>/  — Delete address
    """
    serializer_class   = AddressSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)