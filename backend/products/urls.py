# products/urls.py
from django.urls import path
from .views import (
    CategoryListView,
    CategoryDetailView,
    CategoryCreateView,
    CategoryUpdateView,
    ProductListView,
    FeaturedProductListView,
    ProductDetailView,
    RelatedProductsView,
    VendorProductListCreateView,
    VendorProductDetailView,
    ProductImageUploadView,
    ProductVariantListCreateView,
    ProductVariantDetailView,
    AdminProductListView,
    AdminProductStatusView,
    AdminFeatureProductView,
    WishlistView,
    WishlistRemoveView,
    WishlistCheckView,
)

app_name = "products"

urlpatterns = [

    # ── Must come BEFORE <slug:slug> catch-all ─────────────────────────────

    # Categories
    path("categories/",
         CategoryListView.as_view(),       name="category-list"),
    path("categories/create/",
         CategoryCreateView.as_view(),     name="category-create"),
    path("categories/<slug:slug>/manage/",
         CategoryUpdateView.as_view(),     name="category-manage"),
    path("categories/<slug:slug>/",
         CategoryDetailView.as_view(),     name="category-detail"),

    # Featured
    path("featured/",
         FeaturedProductListView.as_view(), name="product-featured"),

    # Wishlist
    path("wishlist/",
         WishlistView.as_view(),           name="wishlist"),
    path("wishlist/check/<uuid:product_id>/",
         WishlistCheckView.as_view(),      name="wishlist-check"),
    path("wishlist/<uuid:product_id>/",
         WishlistRemoveView.as_view(),     name="wishlist-remove"),

    # Vendor product management
    path("vendor/my-products/",
         VendorProductListCreateView.as_view(), name="vendor-product-list"),
    path("vendor/my-products/<uuid:id>/images/",
         ProductImageUploadView.as_view(),      name="vendor-product-images"),
    path("vendor/my-products/<uuid:id>/variants/",
         ProductVariantListCreateView.as_view(), name="vendor-product-variants"),
    path("vendor/my-products/<uuid:id>/variants/<uuid:variant_id>/",
         ProductVariantDetailView.as_view(),    name="vendor-product-variant-detail"),
    path("vendor/my-products/<uuid:id>/",
         VendorProductDetailView.as_view(),     name="vendor-product-detail"),

    # Admin
    path("admin/all/",
         AdminProductListView.as_view(),    name="admin-product-list"),
    path("admin/<uuid:id>/status/",
         AdminProductStatusView.as_view(),  name="admin-product-status"),
    path("admin/<uuid:id>/feature/",
         AdminFeatureProductView.as_view(), name="admin-product-feature"),

    # ── Product list root ──────────────────────────────────────────────────
    path("",
         ProductListView.as_view(), name="product-list"),

    # ── Slug routes LAST (catch-all) ───────────────────────────────────────
    path("<slug:slug>/related/",
         RelatedProductsView.as_view(), name="product-related"),
    path("<slug:slug>/",
         ProductDetailView.as_view(),   name="product-detail"),
]