"""
core/urls.py — Root URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# Apply admin customization from settings
admin.site.site_header  = getattr(settings, "ADMIN_SITE_HEADER",  "Admin")
admin.site.site_title   = getattr(settings, "ADMIN_SITE_TITLE",   "Admin")
admin.site.index_title  = getattr(settings, "ADMIN_INDEX_TITLE",  "Dashboard")

urlpatterns = [
    path("admin/",              admin.site.urls),
    path("api/v1/auth/",        include("accounts.urls",  namespace="accounts")),
    path("api/v1/vendors/",     include("vendors.urls",   namespace="vendors")),
    path("api/v1/products/",    include("products.urls",  namespace="products")),
    path("api/v1/orders/",      include("orders.urls",    namespace="orders")),
    path("api/v1/reviews/",     include("reviews.urls",   namespace="reviews")),
    path("api/v1/analytics/",   include("analytics.urls", namespace="analytics")),
]

# Serve media files in local development only
if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=getattr(settings, "MEDIA_ROOT", None),
    )
