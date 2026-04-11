"""
analytics/models.py — Daily snapshots for vendor & admin dashboards,
                      product view logs
"""
from django.db import models
from django.conf import settings


class DailySalesSnapshot(models.Model):
    """
    Daily aggregated stats per vendor.
    Populated by a nightly Celery task.
    Powers Chart.js charts on the vendor dashboard.
    """
    vendor = models.ForeignKey(
        "vendors.VendorProfile", on_delete=models.CASCADE, related_name="daily_snapshots"
    )
    date   = models.DateField(db_index=True)

    # Revenue
    gross_revenue    = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_revenue      = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    commission_paid  = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    refunded_amount  = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Volume
    orders_count  = models.PositiveIntegerField(default=0)
    items_sold    = models.PositiveIntegerField(default=0)
    unique_buyers = models.PositiveIntegerField(default=0)

    # Top performer
    top_product       = models.ForeignKey(
        "products.Product", on_delete=models.SET_NULL, null=True, blank=True
    )
    top_product_units = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["vendor", "date"]
        ordering        = ["-date"]

    def __str__(self):
        return f"{self.vendor.store_name} — {self.date}"


class PlatformDailySnapshot(models.Model):
    """
    Platform-wide daily stats for the admin dashboard.
    """
    date = models.DateField(unique=True, db_index=True)

    gross_revenue    = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_commission = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_orders     = models.PositiveIntegerField(default=0)
    new_users        = models.PositiveIntegerField(default=0)
    new_vendors      = models.PositiveIntegerField(default=0)
    new_products     = models.PositiveIntegerField(default=0)
    active_vendors   = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return f"Platform Snapshot — {self.date}"


class ProductViewLog(models.Model):
    """
    Lightweight event log for product page views.
    Powers trending / recently-viewed features.
    """
    product     = models.ForeignKey(
        "products.Product", on_delete=models.CASCADE, related_name="view_logs"
    )
    user        = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    session_key = models.CharField(max_length=100, blank=True)
    ip_address  = models.GenericIPAddressField(null=True, blank=True)
    referrer    = models.URLField(blank=True)
    viewed_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-viewed_at"]
        indexes  = [models.Index(fields=["product", "viewed_at"])]

    def __str__(self):
        return f"View: {self.product.name} at {self.viewed_at}"