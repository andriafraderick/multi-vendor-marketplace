from django.contrib import admin
from .models import DailySalesSnapshot, PlatformDailySnapshot, ProductViewLog


@admin.register(DailySalesSnapshot)
class DailySalesSnapshotAdmin(admin.ModelAdmin):
    list_display  = ("vendor", "date", "gross_revenue", "net_revenue", "orders_count", "items_sold")
    list_filter   = ("date",)
    search_fields = ("vendor__store_name",)
    ordering      = ("-date",)
    readonly_fields = ("created_at",)


@admin.register(PlatformDailySnapshot)
class PlatformDailySnapshotAdmin(admin.ModelAdmin):
    list_display  = ("date", "gross_revenue", "total_commission", "total_orders", "new_users", "new_vendors")
    ordering      = ("-date",)
    readonly_fields = ("created_at",)


@admin.register(ProductViewLog)
class ProductViewLogAdmin(admin.ModelAdmin):
    list_display  = ("product", "user", "ip_address", "viewed_at")
    list_filter   = ("viewed_at",)
    search_fields = ("product__name", "user__email")
    ordering      = ("-viewed_at",)
    readonly_fields = ("viewed_at",)