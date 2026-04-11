// src/pages/vendor/VendorAnalyticsPage.jsx
import { useState } from "react";
import {
  Box, Grid, Typography,
  ToggleButtonGroup, ToggleButton,
} from "@mui/material";
import { useGetVendorCommissionsQuery, useGetVendorOrdersQuery } from "@/store/api/orderApi";
import { useGetMyProductsQuery }   from "@/store/api/productApi";
import GlassCard        from "@/components/ui/GlassCard";
import RevenueChart     from "@/components/charts/RevenueChart";
import TopProductsChart from "@/components/charts/TopProductsChart";

function MetricRow({ label, value, sub, color = "#fff" }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.5, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <Box>
        <Typography variant="body2" fontWeight={600}>{label}</Typography>
        {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
      </Box>
      <Typography variant="body1" fontWeight={800} sx={{ color }}>{value}</Typography>
    </Box>
  );
}

export default function VendorAnalyticsPage() {
  const { data: dashboard }  = useGetVendorDashboardQuery();
  const { data: commData }   = useGetVendorCommissionsQuery({});
  const { data: productsData } = useGetMyProductsQuery({});
  const { data: ordersData } = useGetVendorOrdersQuery({});

  const vendor      = dashboard?.profile     || {};
  const stats       = dashboard?.quick_stats || {};
  const commSummary = commData?.summary      || {};
  const products    = productsData?.results  || [];
  const orders      = ordersData?.results    || [];

  const conversionRate = stats.total_orders && products.length
    ? ((stats.total_orders / Math.max(products.reduce((a, p) => a + (p.view_count || 0), 0), 1)) * 100).toFixed(2)
    : "0.00";

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>Analytics</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Detailed performance insights for your store
        </Typography>
      </Box>

      {/* Revenue chart */}
      <GlassCard hover={false} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={800} gutterBottom>Revenue Trend — Last 30 Days</Typography>
        <RevenueChart snapshots={vendor.daily_snapshots || []} />
      </GlassCard>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Financial summary */}
        <Grid item xs={12} md={6}>
          <GlassCard hover={false} sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Financial Summary</Typography>
            <MetricRow label="Gross Revenue"     value={`$${Number(commSummary.total_gross || 0).toFixed(2)}`}      color="#4318FF" />
            <MetricRow label="Platform Commission" value={`$${Number(commSummary.total_commission || 0).toFixed(2)}`} color="#F44336" sub={`${vendor.commission_rate || 10}% rate`} />
            <MetricRow label="Your Net Revenue"  value={`$${Number(commSummary.total_payout || 0).toFixed(2)}`}     color="#10B981" />
            <MetricRow label="Total Orders"      value={stats.total_orders || 0} />
            <MetricRow
              label="Avg Order Value"
              value={stats.total_orders
                ? `$${(Number(commSummary.total_gross || 0) / stats.total_orders).toFixed(2)}`
                : "$0.00"}
            />
          </GlassCard>
        </Grid>

        {/* Performance metrics */}
        <Grid item xs={12} md={6}>
          <GlassCard hover={false} sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Store Performance</Typography>
            <MetricRow label="Active Products"    value={products.filter((p) => p.status === "active").length}  color="#10B981" />
            <MetricRow label="Pending Approval"   value={products.filter((p) => p.status === "pending").length} color="#FF9800" />
            <MetricRow label="Total Views"         value={products.reduce((a, p) => a + (p.view_count || 0), 0).toLocaleString()} />
            <MetricRow label="Avg Product Rating"  value={`${Number(stats.average_rating || 0).toFixed(1)} ★`} color="#F59E0B" />
            <MetricRow label="Total Reviews"       value={stats.total_reviews || 0} />
          </GlassCard>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Top products */}
        <Grid item xs={12} md={8}>
          <GlassCard hover={false} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>Top Products by Sales</Typography>
            <TopProductsChart products={products} />
          </GlassCard>
        </Grid>

        {/* Order breakdown */}
        <Grid item xs={12} md={4}>
          <GlassCard hover={false} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>Order Status Mix</Typography>
            <OrdersChart vendorOrders={orders} />
          </GlassCard>
        </Grid>
      </Grid>
    </Box>
  );
}