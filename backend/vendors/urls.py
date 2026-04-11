"""
vendors/urls.py
"""
from django.urls import path
from .views import (
    # Public storefront
    VendorStoreListView,
    VendorStoreDetailView,
    VendorStoreProductsView,

    # Vendor dashboard
    VendorDashboardView,
    VendorProfileUpdateView,
    VendorPayoutRequestView,

    # Admin vendor management
    AdminVendorListView,
    AdminVendorDetailView,
    AdminVendorStatusView,
    AdminPayoutListView,
    AdminPayoutProcessView,
)

app_name = "vendors"

urlpatterns = [

    # ── Public storefront ─────────────────────────────────────────────────────
    path("",
         VendorStoreListView.as_view(),
         name="vendor-list"),

    path("<slug:slug>/",
         VendorStoreDetailView.as_view(),
         name="vendor-detail"),

    path("<slug:slug>/products/",
         VendorStoreProductsView.as_view(),
         name="vendor-products"),

    # ── Vendor dashboard ──────────────────────────────────────────────────────
    path("dashboard/",
         VendorDashboardView.as_view(),
         name="vendor-dashboard"),

    path("dashboard/profile/",
         VendorProfileUpdateView.as_view(),
         name="vendor-profile-update"),

    path("dashboard/payouts/",
         VendorPayoutRequestView.as_view(),
         name="vendor-payouts"),

    # ── Admin vendor management ───────────────────────────────────────────────
    path("admin/all/",
         AdminVendorListView.as_view(),
         name="admin-vendor-list"),

    path("admin/all/<uuid:id>/",
         AdminVendorDetailView.as_view(),
         name="admin-vendor-detail"),

    path("admin/all/<uuid:id>/status/",
         AdminVendorStatusView.as_view(),
         name="admin-vendor-status"),

    path("admin/payouts/",
         AdminPayoutListView.as_view(),
         name="admin-payout-list"),

    path("admin/payouts/<uuid:id>/process/",
         AdminPayoutProcessView.as_view(),
         name="admin-payout-process"),
]