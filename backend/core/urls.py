"""
core/urls.py — Root URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

admin.site.site_header = "Marketplace Admin"
admin.site.site_title  = "Marketplace"
admin.site.index_title = "Platform Management"

urlpatterns = [
    path("admin/", admin.site.urls),

    # API v1
    path("api/v1/auth/",      include("accounts.urls")),
    path("api/v1/vendors/",   include("vendors.urls")),
    path("api/v1/products/",  include("products.urls")),
    path("api/v1/orders/",    include("orders.urls")),
    path("api/v1/reviews/",   include("reviews.urls")),
    path("api/v1/analytics/", include("analytics.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)