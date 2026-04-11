"""
reviews/filters.py
Filtersets for product and vendor reviews.
"""
import django_filters
from .models import ProductReview, VendorReview


class ProductReviewFilter(django_filters.FilterSet):
    min_rating    = django_filters.NumberFilter(field_name="rating", lookup_expr="gte")
    max_rating    = django_filters.NumberFilter(field_name="rating", lookup_expr="lte")
    rating        = django_filters.NumberFilter(field_name="rating", lookup_expr="exact")
    verified_only = django_filters.BooleanFilter(field_name="is_verified_purchase")
    has_images    = django_filters.BooleanFilter(method="filter_has_images")
    date_from     = django_filters.DateFilter(field_name="created_at", lookup_expr="gte")
    date_to       = django_filters.DateFilter(field_name="created_at", lookup_expr="lte")

    class Meta:
        model  = ProductReview
        fields = [
            "rating", "min_rating", "max_rating",
            "verified_only", "has_images",
            "date_from", "date_to",
        ]

    def filter_has_images(self, queryset, name, value):
        if value:
            return queryset.filter(images__isnull=False).distinct()
        return queryset.filter(images__isnull=True)


class VendorReviewFilter(django_filters.FilterSet):
    min_rating = django_filters.NumberFilter(field_name="rating", lookup_expr="gte")
    max_rating = django_filters.NumberFilter(field_name="rating", lookup_expr="lte")
    rating     = django_filters.NumberFilter(field_name="rating", lookup_expr="exact")

    class Meta:
        model  = VendorReview
        fields = ["rating", "min_rating", "max_rating"]