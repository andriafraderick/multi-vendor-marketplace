"""
orders/filters.py
Filtersets for orders and vendor orders.
"""
import django_filters
from .models import Order, VendorOrder


class OrderFilter(django_filters.FilterSet):
    status       = django_filters.ChoiceFilter(choices=Order.Status.choices)
    date_from    = django_filters.DateFilter(field_name="created_at", lookup_expr="gte")
    date_to      = django_filters.DateFilter(field_name="created_at", lookup_expr="lte")
    min_total    = django_filters.NumberFilter(field_name="total_amount", lookup_expr="gte")
    max_total    = django_filters.NumberFilter(field_name="total_amount", lookup_expr="lte")

    class Meta:
        model  = Order
        fields = ["status", "date_from", "date_to", "min_total", "max_total"]


class VendorOrderFilter(django_filters.FilterSet):
    status    = django_filters.ChoiceFilter(choices=VendorOrder.Status.choices)
    date_from = django_filters.DateFilter(field_name="created_at", lookup_expr="gte")
    date_to   = django_filters.DateFilter(field_name="created_at", lookup_expr="lte")

    class Meta:
        model  = VendorOrder
        fields = ["status", "date_from", "date_to"]