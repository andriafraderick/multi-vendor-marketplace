// src/pages/vendor/VendorDashboardPage.jsx
import { Box, Grid, Typography, CircularProgress, Divider } from "@mui/material";
import TrendingUpIcon     from "@mui/icons-material/TrendingUp";
import ShoppingBagIcon    from "@mui/icons-material/ShoppingBag";
import StarIcon           from "@mui/icons-material/Star";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import InventoryIcon      from "@mui/icons-material/Inventory2Outlined";
import PendingActionsIcon from "@mui/icons-material/PendingActions";

import { useGetVendorDashboardQuery }  from "@/store/api/vendorApi";
import { useGetVendorOrdersQuery }     from "@/store/api/orderApi";
import { useGetMyProductsQuery }       from "@/store/api/productApi";
import { useGetVendorCommissionsQuery } from "@/store/api/orderApi";

import GlassCard        from "@/components/ui/GlassCard";
import RevenueChart     from "@/components/charts/RevenueChart";
import OrdersChart      from "@/components/charts/OrdersChart";
import TopProductsChart from "@/components/charts/TopProductsChart";
import OrderStatusBadge from "@/components/vendor/OrderStatusBadge";

function KpiCard({ icon, label, value, sub, color = "#4318FF", trend }) {
  return (
    <GlassCard hover={false} sx={{ p: 3, height: "100%" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: "rgba(255,255,255,0.45)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              display: "block",
              mb: 0.75,
            }}
          >
            {label}
          </Typography>
          <Typography variant="h4" fontWeight={900} sx={{ color: "#fff", lineHeight: 1.1 }}>
            {value}
          </Typography>
          {sub && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
              {sub}
            </Typography>
          )}
          {trend !== undefined && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.75 }}>
              <Typography
                variant="caption"
                sx={{
                  color: trend >= 0 ? "#10B981" : "#F44336",
                  fontWeight: 700,
                }}
              >
                {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}% vs last month
              </Typography>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            width: 52, height: 52,
            borderRadius: "15px",
            background:   `linear-gradient(135deg, ${color}35, ${color}18)`,
            border:       `1px solid ${color}45`,
            display:      "flex",
            alignItems:   "center",
            justifyContent: "center",
            color,
            flexShrink:   0,
            ml:           1.5,
          }}
        >
          {icon}
        </Box>
      </Box>
    </GlassCard>
  );
}

export default function VendorDashboardPage() {
  const { data: dashboard,   isLoading: dLoading } = useGetVendorDashboardQuery();
  const { data: ordersData,  isLoading: oLoading } = useGetVendorOrdersQuery({ page: 1 });
  const { data: productsData                      } = useGetMyProductsQuery({ page: 1 });
  const { data: commissions                        } = useGetVendorCommissionsQuery({});

  const isLoading = dLoading || oLoading;

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: "#4318FF" }} size={48} />
      </Box>
    );
  }

  const stats    = dashboard?.quick_stats || {};
  const vendor   = dashboard?.profile     || {};
  const recentOrders   = (ordersData?.results  || []).slice(0, 5);
  const allOrders      = ordersData?.results   || [];
  const products       = productsData?.results || [];
  const commSummary    = commissions?.summary  || {};

  return (
    <Box sx={{ animation: "fadeInUp 0.4s ease" }}>

      {/* Greeting */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>
          {vendor.store_name} Dashboard 👋
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Here's an overview of your store performance
        </Typography>
      </Box>

      {/* Store status banner */}
      {vendor.status && vendor.status !== "active" && (
        <Box
          sx={{
            mb: 3, p: 2, borderRadius: "14px",
            background: "rgba(255,152,0,0.08)",
            border: "1px solid rgba(255,152,0,0.3)",
            display: "flex", alignItems: "center", gap: 1.5,
          }}
        >
          <PendingActionsIcon sx={{ color: "#FF9800" }} />
          <Box>
            <Typography fontWeight={700} sx={{ color: "#FF9800" }}>
              Store Status: {vendor.status}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {vendor.status === "pending"
                ? "Your store is awaiting admin approval. You can prepare your products in the meantime."
                : vendor.rejection_reason || "Contact support for more details."}
            </Typography>
          </Box>
        </Box>
      )}

      {/* ── KPI Row ──────────────────────────────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard
            icon={<TrendingUpIcon />}
            label="Total Revenue"
            value={`$${Number(stats.total_sales || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            sub={`Net: $${Number(commSummary.total_payout || 0).toFixed(2)}`}
            color="#4318FF"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard
            icon={<ShoppingBagIcon />}
            label="Total Orders"
            value={stats.total_orders || 0}
            sub={`${stats.pending_orders || 0} pending · ${stats.processing_orders || 0} processing`}
            color="#0075FF"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard
            icon={<StarIcon />}
            label="Avg Rating"
            value={`${Number(stats.average_rating || 0).toFixed(1)} ★`}
            sub={`From ${stats.total_reviews || 0} reviews`}
            color="#F59E0B"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <KpiCard
            icon={<InventoryIcon />}
            label="Active Products"
            value={products.filter((p) => p.status === "active").length || 0}
            sub={`${products.filter((p) => p.status === "pending").length || 0} pending approval`}
            color="#10B981"
          />
        </Grid>
      </Grid>

      {/* ── Charts Row ────────────────────────────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>

        {/* Revenue line chart */}
        <Grid item xs={12} lg={8}>
          <GlassCard hover={false} sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
              <Box>
                <Typography variant="h6" fontWeight={800}>Revenue Overview</Typography>
                <Typography variant="caption" color="text.secondary">Last 30 days</Typography>
              </Box>
              <Box
                sx={{
                  px: 1.5, py: 0.5, borderRadius: "8px",
                  background: "rgba(16,185,129,0.12)",
                  border: "1px solid rgba(16,185,129,0.3)",
                }}
              >
                <Typography variant="caption" sx={{ color: "#10B981", fontWeight: 700 }}>
                  Live
                </Typography>
              </Box>
            </Box>
            <RevenueChart snapshots={vendor.daily_snapshots || []} />
          </GlassCard>
        </Grid>

        {/* Orders doughnut */}
        <Grid item xs={12} lg={4}>
          <GlassCard hover={false} sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>Order Breakdown</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
              By status
            </Typography>
            <OrdersChart vendorOrders={allOrders} />
          </GlassCard>
        </Grid>
      </Grid>

      {/* ── Bottom Row ────────────────────────────────────────────────────── */}
      <Grid container spacing={3}>

        {/* Top products bar chart */}
        <Grid item xs={12} md={6}>
          <GlassCard hover={false} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>Top Products</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
              By units sold
            </Typography>
            <TopProductsChart products={products} />
          </GlassCard>
        </Grid>

        {/* Recent orders table */}
        <Grid item xs={12} md={6}>
          <GlassCard hover={false} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>Recent Orders</Typography>
            <Divider sx={{ mb: 2 }} />

            {recentOrders.length === 0 ? (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <Typography color="text.secondary" variant="body2">
                  No orders yet
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                {recentOrders.map((order, i) => (
                  <Box
                    key={order.id}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      py: 1.5,
                      borderBottom: i < recentOrders.length - 1
                        ? "1px solid rgba(255,255,255,0.06)"
                        : "none",
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        #{order.order?.order_number || "—"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(order.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Typography variant="body2" fontWeight={700}>
                        ${Number(order.vendor_total || 0).toFixed(2)}
                      </Typography>
                      <OrderStatusBadge status={order.status} />
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </GlassCard>
        </Grid>
      </Grid>
    </Box>
  );
}