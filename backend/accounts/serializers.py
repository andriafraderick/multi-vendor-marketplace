"""
accounts/serializers.py
All serializers for registration, login, profile, address,
email verification, and password reset.
"""
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from .models import User, Address, EmailVerificationToken, PasswordResetToken


# ── Registration ───────────────────────────────────────────────────────────────

class RegisterSerializer(serializers.ModelSerializer):
    """
    Handles new user registration.
    Role can be 'buyer' (default) or 'vendor'.
    Admins are created via manage.py createsuperuser only.
    """
    password  = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, label="Confirm password")

    class Meta:
        model  = User
        fields = (
            "email", "first_name", "last_name",
            "phone", "role", "password", "password2",
        )
        extra_kwargs = {
            "first_name": {"required": True},
            "last_name":  {"required": True},
        }

    def validate_role(self, value):
        # Prevent self-assigning admin role via API
        if value == User.Role.ADMIN:
            raise serializers.ValidationError("Cannot register as admin.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password2": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class VendorRegisterSerializer(RegisterSerializer):
    """
    Extended registration for vendors.
    Automatically creates a VendorProfile with status=pending.
    """
    store_name  = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, allow_blank=True)
    tagline     = serializers.CharField(max_length=255, required=False, allow_blank=True)

    class Meta(RegisterSerializer.Meta):
        fields = RegisterSerializer.Meta.fields + ("store_name", "description", "tagline")

    def validate_role(self, value):
        # For this serializer role is always vendor
        return User.Role.VENDOR

    def create(self, validated_data):
        store_name  = validated_data.pop("store_name")
        description = validated_data.pop("description", "")
        tagline     = validated_data.pop("tagline", "")

        validated_data["role"] = User.Role.VENDOR
        validated_data.pop("password2")
        password = validated_data.pop("password")

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        # Create pending vendor profile
        from vendors.models import VendorProfile
        VendorProfile.objects.create(
            user=user,
            store_name=store_name,
            description=description,
            tagline=tagline,
        )

        return user


# ── Login ──────────────────────────────────────────────────────────────────────

class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email    = attrs.get("email", "").lower().strip()
        password = attrs.get("password")

        user = authenticate(request=self.context.get("request"), username=email, password=password)

        if not user:
            raise serializers.ValidationError(
                {"non_field_errors": "Invalid email or password."}
            )
        if not user.is_active:
            raise serializers.ValidationError(
                {"non_field_errors": "This account has been deactivated."}
            )

        attrs["user"] = user
        return attrs


# ── User Profile ───────────────────────────────────────────────────────────────

class UserProfileSerializer(serializers.ModelSerializer):
    """Read / update the authenticated user's own profile."""
    full_name = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = (
            "id", "email", "first_name", "last_name",
            "full_name", "phone", "avatar", "role",
            "is_verified", "date_joined",
        )
        read_only_fields = ("id", "email", "role", "is_verified", "date_joined", "full_name")

    def get_full_name(self, obj):
        return obj.get_full_name()


class UpdateProfileSerializer(serializers.ModelSerializer):
    """Allows user to update name, phone, avatar only."""

    class Meta:
        model  = User
        fields = ("first_name", "last_name", "phone", "avatar")


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password2 = serializers.CharField(write_only=True, label="Confirm new password")

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password2"]:
            raise serializers.ValidationError({"new_password2": "Passwords do not match."})
        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user


# ── Address ────────────────────────────────────────────────────────────────────

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Address
        fields = (
            "id", "address_type", "full_name", "street_address",
            "city", "state", "postal_code", "country", "is_default",
        )

    def create(self, validated_data):
        user = self.context["request"].user
        return Address.objects.create(user=user, **validated_data)


# ── Email Verification ─────────────────────────────────────────────────────────

class VerifyEmailSerializer(serializers.Serializer):
    token = serializers.UUIDField()

    def validate_token(self, value):
        try:
            token_obj = EmailVerificationToken.objects.get(token=value, is_used=False)
        except EmailVerificationToken.DoesNotExist:
            raise serializers.ValidationError("Invalid or already used verification link.")

        if token_obj.is_expired:
            raise serializers.ValidationError("This verification link has expired. Request a new one.")

        self.token_obj = token_obj
        return value

    def save(self):
        token_obj = self.token_obj
        user = token_obj.user
        user.is_verified = True
        user.save(update_fields=["is_verified"])
        token_obj.is_used = True
        token_obj.save(update_fields=["is_used"])
        return user


class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            user = User.objects.get(email=value.lower().strip())
        except User.DoesNotExist:
            # Don't reveal if email exists or not (security)
            return value
        if user.is_verified:
            raise serializers.ValidationError("This email is already verified.")
        self.user = user
        return value


# ── Password Reset ─────────────────────────────────────────────────────────────

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        # We store the user if found, but always return 200 to the client
        # to prevent email enumeration attacks
        try:
            self.user = User.objects.get(email=value.lower().strip(), is_active=True)
        except User.DoesNotExist:
            self.user = None
        return value


class ResetPasswordSerializer(serializers.Serializer):
    token        = serializers.UUIDField()
    new_password  = serializers.CharField(write_only=True, validators=[validate_password])
    new_password2 = serializers.CharField(write_only=True, label="Confirm password")

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password2"]:
            raise serializers.ValidationError({"new_password2": "Passwords do not match."})

        try:
            token_obj = PasswordResetToken.objects.get(
                token=attrs["token"], is_used=False
            )
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError({"token": "Invalid or already used reset link."})

        if token_obj.is_expired:
            raise serializers.ValidationError({"token": "This reset link has expired. Request a new one."})

        self.token_obj = token_obj
        return attrs

    def save(self):
        token_obj = self.token_obj
        user = token_obj.user
        user.set_password(self.validated_data["new_password"])
        user.save()
        token_obj.is_used = True
        token_obj.save(update_fields=["is_used"])
        return user


# ── Minimal public-facing user serializer (used by other apps) ────────────────

class PublicUserSerializer(serializers.ModelSerializer):
    """Minimal user info safe to expose publicly (e.g. on reviews)."""
    full_name = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ("id", "full_name", "avatar")

    def get_full_name(self, obj):
        return obj.get_full_name()