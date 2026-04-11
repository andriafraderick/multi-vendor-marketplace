"""
orders/urls.py
"""
from django.urls import path
from .views import (
    # Cart
    CartView,
    CartItemUpdateView,

    # Coupon
    ValidateCouponView,

    # Checkout & payment
    CheckoutView,
    ConfirmPaymentView,

    # Buyer orders
    BuyerOrderListView,
    BuyerOrderDetailView,
    BuyerCancelOrderView,

    # Vendor orders
    VendorOrderListView,
    VendorOrderDetailView,
    VendorOrderUpdateView,
    VendorCommissionListView,

    # Admin orders
    AdminOrderListView,
    AdminOrderDetailView,
    AdminOrderStatusView,
    AdminCommissionOverviewView,
)

app_name = "orders"

urlpatterns = [

    # ── Cart ──────────────────────────────────────────────────────────────────
    path("cart/",               CartView.as_view(),           name="cart"),
    path("cart/items/<int:id>/", CartItemUpdateView.as_view(), name="cart-item"),

    # ── Coupons ───────────────────────────────────────────────────────────────
    path("coupons/validate/",   ValidateCouponView.as_view(), name="coupon-validate"),

    # ── Checkout & Payment ────────────────────────────────────────────────────
    path("checkout/",           CheckoutView.as_view(),        name="checkout"),
    path("confirm-payment/",    ConfirmPaymentView.as_view(),  name="confirm-payment"),

    # ── Buyer Orders ──────────────────────────────────────────────────────────
    path("my-orders/",
         BuyerOrderListView.as_view(),
         name="buyer-order-list"),

    path("my-orders/<str:order_number>/",
         BuyerOrderDetailView.as_view(),
         name="buyer-order-detail"),

    path("my-orders/<str:order_number>/cancel/",
         BuyerCancelOrderView.as_view(),
         name="buyer-order-cancel"),

    # ── Vendor Orders ─────────────────────────────────────────────────────────
    path("vendor/orders/",
         VendorOrderListView.as_view(),
         name="vendor-order-list"),

    path("vendor/orders/<uuid:id>/",
         VendorOrderDetailView.as_view(),
         name="vendor-order-detail"),

    path("vendor/orders/<uuid:id>/update/",
         VendorOrderUpdateView.as_view(),
         name="vendor-order-update"),

    path("vendor/commissions/",
         VendorCommissionListView.as_view(),
         name="vendor-commissions"),

    # ── Admin Orders ──────────────────────────────────────────────────────────
    path("admin/all/",
         AdminOrderListView.as_view(),
         name="admin-order-list"),

    path("admin/all/<str:order_number>/",
         AdminOrderDetailView.as_view(),
         name="admin-order-detail"),

    path("admin/all/<str:order_number>/status/",
         AdminOrderStatusView.as_view(),
         name="admin-order-status"),

    path("admin/commissions/",
         AdminCommissionOverviewView.as_view(),
         name="admin-commissions"),
]