"""
products/filters.py
Django-filter filterset for the product list endpoint.
Supports filtering by price range, category, vendor, rating, etc.
"""
import django_filters
from .models import Product, Category


class ProductFilter(django_filters.FilterSet):
    # Price range
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")

    # Rating
    min_rating = django_filters.NumberFilter(field_name="average_rating", lookup_expr="gte")

    # Category — can filter by slug or id
    category      = django_filters.CharFilter(field_name="category__slug", lookup_expr="exact")
    category_id   = django_filters.UUIDFilter(field_name="category__id")

    # Vendor
    vendor        = django_filters.CharFilter(field_name="vendor__slug", lookup_expr="exact")
    vendor_id     = django_filters.UUIDFilter(field_name="vendor__id")

    # Flags
    is_featured   = django_filters.BooleanFilter()
    is_digital    = django_filters.BooleanFilter()
    free_shipping = django_filters.BooleanFilter()
    in_stock      = django_filters.BooleanFilter(method="filter_in_stock")

    # Condition
    condition = django_filters.ChoiceFilter(choices=Product.Condition.choices)

    class Meta:
        model  = Product
        fields = [
            "min_price", "max_price", "min_rating",
            "category", "category_id",
            "vendor", "vendor_id",
            "is_featured", "is_digital",
            "free_shipping", "in_stock", "condition",
        ]

    def filter_in_stock(self, queryset, name, value):
        if value:
            return queryset.filter(stock_quantity__gt=0)
        return queryset.filter(stock_quantity=0)