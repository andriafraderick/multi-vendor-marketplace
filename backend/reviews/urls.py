"""
reviews/urls.py
"""
from django.urls import path
from .views import (
    # Public — read reviews
    ProductReviewListView,
    ProductRatingSummaryView,

    # Buyer — submit & manage reviews
    ProductReviewCreateView,
    ProductReviewDetailView,
    ReviewImageUploadView,
    ReviewHelpfulnessView,
    ReviewFlagView,
    MyReviewsView,
    PendingReviewsView,

    # Vendor — respond to reviews
    VendorReviewListView,
    VendorRespondToReviewView,

    # Admin — moderation
    AdminReviewListView,
    AdminReviewDetailView,
    AdminModerateReviewView,
    AdminBulkModerateView,
    AdminFlaggedReviewsView,

    # Vendor store reviews
    VendorStoreReviewListView,
    VendorStoreRatingSummaryView,
    VendorReviewCreateView,
)

app_name = "reviews"

urlpatterns = [

    # ── Public: product reviews ────────────────────────────────────────────────
    path(
        "products/<slug:product_slug>/",
        ProductReviewListView.as_view(),
        name="product-review-list",
    ),
    path(
        "products/<slug:product_slug>/summary/",
        ProductRatingSummaryView.as_view(),
        name="product-rating-summary",
    ),

    # ── Buyer: submit review ───────────────────────────────────────────────────
    path(
        "products/create/",
        ProductReviewCreateView.as_view(),
        name="product-review-create",
    ),

    # ── Buyer: manage own review ───────────────────────────────────────────────
    path(
        "<uuid:review_id>/",
        ProductReviewDetailView.as_view(),
        name="review-detail",
    ),
    path(
        "<uuid:review_id>/images/",
        ReviewImageUploadView.as_view(),
        name="review-images",
    ),
    path(
        "<uuid:review_id>/helpful/",
        ReviewHelpfulnessView.as_view(),
        name="review-helpful",
    ),
    path(
        "<uuid:review_id>/flag/",
        ReviewFlagView.as_view(),
        name="review-flag",
    ),

    # ── Buyer: my reviews & pending items ──────────────────────────────────────
    path(
        "my-reviews/",
        MyReviewsView.as_view(),
        name="my-reviews",
    ),
    path(
        "pending-items/",
        PendingReviewsView.as_view(),
        name="pending-reviews",
    ),

    # ── Vendor: respond to reviews ─────────────────────────────────────────────
    path(
        "vendor/my-reviews/",
        VendorReviewListView.as_view(),
        name="vendor-review-list",
    ),
    path(
        "vendor/<uuid:review_id>/respond/",
        VendorRespondToReviewView.as_view(),
        name="vendor-review-respond",
    ),

    # ── Admin: moderation ──────────────────────────────────────────────────────
    path(
        "admin/all/",
        AdminReviewListView.as_view(),
        name="admin-review-list",
    ),
    path(
        "admin/all/<uuid:review_id>/",
        AdminReviewDetailView.as_view(),
        name="admin-review-detail",
    ),
    path(
        "admin/<uuid:review_id>/moderate/",
        AdminModerateReviewView.as_view(),
        name="admin-review-moderate",
    ),
    path(
        "admin/bulk-moderate/",
        AdminBulkModerateView.as_view(),
        name="admin-review-bulk-moderate",
    ),
    path(
        "admin/flagged/",
        AdminFlaggedReviewsView.as_view(),
        name="admin-review-flagged",
    ),

    # ── Public: vendor store reviews ───────────────────────────────────────────
    path(
        "vendors/<slug:vendor_slug>/",
        VendorStoreReviewListView.as_view(),
        name="vendor-store-review-list",
    ),
    path(
        "vendors/<slug:vendor_slug>/summary/",
        VendorStoreRatingSummaryView.as_view(),
        name="vendor-store-rating-summary",
    ),
    path(
        "vendors/create/",
        VendorReviewCreateView.as_view(),
        name="vendor-review-create",
    ),
]