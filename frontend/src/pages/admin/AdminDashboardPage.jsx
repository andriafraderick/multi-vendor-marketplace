// src/pages/admin/AdminDashboardPage.jsx
import { Box, Grid, Typography, CircularProgress, Divider, Chip } from "@mui/material";
import TrendingUpIcon   from "@mui/icons-material/TrendingUp";
import StorefrontIcon   from "@mui/icons-material/Storefront";
import PeopleIcon       from "@mui/icons-material/People";
import InventoryIcon    from "@mui/icons-material/Inventory2Outlined";
import ShoppingBagIcon  from "@mui/icons-material/ShoppingBag";
import AttachMoneyIcon  from "@mui/icons-material/AttachMoney";

import { useGetCommissionOverviewQuery } from "@/store/api/orderApi";
import { useGetAllVendorsAdminQuery }    from "@/store/api/vendorApi";
import { useGetAllProductsAdminQuery }   from "@/store/api/productApi";
import { useGetAllOrdersAdminQuery }     from "@/store/api/orderApi";

import StatCard      from "@/components/admin/StatCard";
import GlassCard     from "@/components/ui/GlassCard";
import AdminDataTable from "@/components/admin/AdminDataTable";
import OrderStatusBadge from "@/components/vendor/OrderStatusBadge";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function VendorCommissionChart({ data = [] }) {
  const top = data.slice(0, 8);
  const chartData = {
    labels: top.map((v) =>
      v.vendor__store_name?.length > 14
        ? v.vendor__store_name.slice(0, 14) + "…"
        : v.vendor__store_name
    ),
    datasets: [
      {
        label:           "Commission ($)",
        data:            top.map((v) => parseFloat(v.commission || 0)),
        backgroundColor: "rgba(67,24,255,0.7)",
        borderRadius:    6,
        borderSkipped:   false,
      },
      {
        label:           "Payout ($)",
        data:            top.map((v) => parseFloat(v.payout || 0)),
        backgroundColor: "rgba(16,185,129,0.6)",
        borderRadius:    6,
        borderSkipped:   false,
      },
    ],
  };

  const options = {
    responsive:          true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color:       "rgba(255,255,255,0.6)",
          font:        { family: "Inter", size: 12, weight: "600" },
          boxWidth:    12, boxHeight: 12, borderRadius: 3,
        },
      },
      tooltip: {
        backgroundColor: "rgba(15,12,41,0.95)",
        borderColor:     "rgba(255,255,255,0.12)",
        borderWidth:     1,
        titleColor:      "#fff",
        bodyColor:       "rgba(255,255,255,0.7)",
        padding:         10, cornerRadius: 8,
        callbacks: { label: (ctx) => ` $${ctx.parsed.y.toFixed(2)}` },
      },
    },
    scales: {
      x: {
        grid:  { display: false },
        ticks: { color: "rgba(255,255,255,0.5)", font: { size: 11 } },
      },
      y: {
        grid:  { color: "rgba(255,255,255,0.05)", drawBorder: false },
        ticks: { color: "rgba(255,255,255,0.4)", font: { size: 11 }, callback: (v) => `$${v}` },
      },
    },
  };

  return (
    <GlassCard hover={false} sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Commission by Vendor
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Top 8 vendors · commission vs payout
      </Typography>
      <Box sx={{ height: 280, mt: 2 }}>
        <Bar options={options} data={chartData} />
      </Box>
    </GlassCard>
  );
}

export default function AdminDashboardPage() {
  const { data: commData,    isLoading: cL } = useGetCommissionOverviewQuery();
  const { data: vendorData,  isLoading: vL } = useGetAllVendorsAdminQuery({ status: "pending" });
  const { data: productData, isLoading: pL } = useGetAllProductsAdminQuery({ status: "pending" });
  const { data: orderData,   isLoading: oL } = useGetAllOrdersAdminQuery({});

  const isLoading = cL || vL || pL || oL;
  const totals    = commData?.platform_totals  || {};
  const breakdown = commData?.vendor_breakdown || [];

  const pendingVendors  = vendorData?.results  || [];
  const pendingProducts = productData?.results || [];
  const recentOrders    = (orderData?.results  || []).slice(0, 6);

  const vendorCols = [
    { field: "store_name", headerName: "Store",  renderCell: (r) => <Typography variant="body2" fontWeight={700}>{r.store_name}</Typography> },
    { field: "owner_email", headerName: "Owner" },
    { field: "created_at",  headerName: "Applied",
      renderCell: (r) => new Date(r.created_at).toLocaleDateString() },
  ];

  const productCols = [
    { field: "name",   headerName: "Product", renderCell: (r) => <Typography variant="body2" fontWeight={700} noWrap sx={{ maxWidth: 180 }}>{r.name}</Typography> },
    { field: "vendor", headerName: "Vendor",  renderCell: (r) => r.vendor_name || "—" },
    { field: "price",  headerName: "Price",   renderCell: (r) => `$${Number(r.price).toFixed(2)}` },
  ];

  const orderCols = [
    { field: "order_number", headerName: "Order #",
      renderCell: (r) => <Typography variant="body2" fontWeight={700}>#{r.order_number}</Typography> },
    { field: "buyer",   headerName: "Buyer",  renderCell: (r) => r.buyer?.email || "—" },
    { field: "status",  headerName: "Status", renderCell: (r) => <OrderStatusBadge status={r.status} /> },
    { field: "total",   headerName: "Total",  align: "right",
      renderCell: (r) => <Typography fontWeight={700} sx={{ color: "#4318FF" }}>${Number(r.total_amount).toFixed(2)}</Typography> },
    { field: "date",    headerName: "Date",
      renderCell: (r) => new Date(r.created_at).toLocaleDateString() },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={900}>Admin Dashboard</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Platform overview · all vendors · all orders
        </Typography>
      </Box>

      {/* KPI cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} xl={2}>
          <StatCard icon={<TrendingUpIcon />} label="Gross Revenue"
            value={`$${Number(totals.total_gross || 0).toLocaleString()}`}
            color="#4318FF" isLoading={cL} trend={14} />
        </Grid>
        <Grid item xs={12} sm={6} xl={2}>
          <StatCard icon={<AttachMoneyIcon />} label="Commission"
            value={`$${Number(totals.total_commission || 0).toLocaleString()}`}
            color="#10B981" isLoading={cL} trend={9} />
        </Grid>
        <Grid item xs={12} sm={6} xl={2}>
          <StatCard icon={<ShoppingBagIcon />} label="Total Orders"
            value={orderData?.count || 0}
            color="#0075FF" isLoading={oL} />
        </Grid>
        <Grid item xs={12} sm={6} xl={2}>
          <StatCard icon={<StorefrontIcon />} label="Pending Vendors"
            value={vendorData?.count || pendingVendors.length}
            color="#FF9800" isLoading={vL}
            sub="awaiting approval" />
        </Grid>
        <Grid item xs={12} sm={6} xl={2}>
          <StatCard icon={<InventoryIcon />} label="Pending Products"
            value={productData?.count || pendingProducts.length}
            color="#7B2FF7" isLoading={pL}
            sub="awaiting review" />
        </Grid>
        <Grid item xs={12} sm={6} xl={2}>
          <StatCard icon={<AttachMoneyIcon />} label="Total Payouts"
            value={`$${Number(totals.total_payout || 0).toLocaleString()}`}
            color="#F59E0B" isLoading={cL} />
        </Grid>
      </Grid>

      {/* Charts + tables row 1 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <VendorCommissionChart data={breakdown} />
        </Grid>

        <Grid item xs={12} lg={4}>
          <GlassCard hover={false} sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Platform Split
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {[
              { label: "Total Sales",   value: `$${Number(totals.total_gross      || 0).toFixed(2)}`, color: "#4318FF" },
              { label: "Commission",    value: `$${Number(totals.total_commission || 0).toFixed(2)}`, color: "#10B981" },
              { label: "Vendor Payout", value: `$${Number(totals.total_payout     || 0).toFixed(2)}`, color: "#FF9800" },
              { label: "Transactions",  value: totals.total_records || 0,                              color: "#0075FF" },
            ].map(({ label, value, color }) => (
              <Box
                key={label}
                sx={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", py: 1.75,
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  "&:last-child": { borderBottom: "none" },
                }}
              >
                <Typography variant="body2" color="text.secondary">{label}</Typography>
                <Typography variant="h6" fontWeight={800} sx={{ color }}>
                  {value}
                </Typography>
              </Box>
            ))}
          </GlassCard>
        </Grid>
      </Grid>

      {/* Tables row 2 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={6}>
          <AdminDataTable
            title="Pending Vendor Applications"
            columns={vendorCols}
            rows={pendingVendors.slice(0, 5)}
            isLoading={vL}
            emptyText="No pending vendors 🎉"
          />
        </Grid>
        <Grid item xs={12} lg={6}>
          <AdminDataTable
            title="Pending Product Approvals"
            columns={productCols}
            rows={pendingProducts.slice(0, 5)}
            isLoading={pL}
            emptyText="No pending products 🎉"
          />
        </Grid>
      </Grid>

      {/* Recent orders */}
      <AdminDataTable
        title="Recent Orders"
        columns={orderCols}
        rows={recentOrders}
        isLoading={oL}
        emptyText="No orders yet"
      />
    </Box>
  );
}