"""
accounts/urls.py
"""
from django.urls import path
from .views import (
    BuyerRegisterView,
    VendorRegisterView,
    LoginView,
    LogoutView,
    TokenRefreshView,
    MeView,
    ChangePasswordView,
    VerifyEmailView,
    ResendVerificationView,
    ForgotPasswordView,
    ResetPasswordView,
    AddressListCreateView,
    AddressDetailView,
)

app_name = "accounts"

urlpatterns = [
    # Registration
    path("register/buyer/",  BuyerRegisterView.as_view(),  name="register-buyer"),
    path("register/vendor/", VendorRegisterView.as_view(), name="register-vendor"),

    # Login / Logout / Token
    path("login/",         LoginView.as_view(),        name="login"),
    path("logout/",        LogoutView.as_view(),       name="logout"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),

    # Profile
    path("me/",              MeView.as_view(),             name="me"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),

    # Email verification
    path("verify-email/",        VerifyEmailView.as_view(),        name="verify-email"),
    path("resend-verification/", ResendVerificationView.as_view(), name="resend-verification"),

    # Password reset
    path("forgot-password/", ForgotPasswordView.as_view(), name="forgot-password"),
    path("reset-password/",  ResetPasswordView.as_view(),  name="reset-password"),

    # Addresses
    path("addresses/",           AddressListCreateView.as_view(), name="address-list"),
    path("addresses/<int:pk>/",  AddressDetailView.as_view(),     name="address-detail"),
]