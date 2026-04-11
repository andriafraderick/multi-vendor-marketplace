// src/pages/admin/AdminOrdersPage.jsx
import { useState }  from "react";
import {
  Box, Typography, TextField, InputAdornment,
  IconButton, Chip, Button, Select, MenuItem,
  FormControl, InputLabel, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress,
  Grid,
} from "@mui/material";
import SearchIcon  from "@mui/icons-material/Search";
import ClearIcon   from "@mui/icons-material/Clear";
import CloseIcon   from "@mui/icons-material/Close";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import { useSnackbar } from "notistack";

import {
  useGetAllOrdersAdminQuery,
  useUpdateOrderStatusAdminMutation,
  useGetCommissionOverviewQuery,
} from "@/store/api/orderApi";
import AdminDataTable from "@/components/admin/AdminDataTable";
import OrderStatusBadge from "@/components/vendor/OrderStatusBadge";
import GlassCard     from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import StatCard      from "@/components/admin/StatCard";

const ORDER_STATUSES = [
  "pending", "payment_confirmed", "processing",
  "partially_shipped", "shipped", "delivered",
  "cancelled", "refunded", "disputed",
];

export default function AdminOrdersPage() {
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected,     setSelected]     = useState(null);
  const [detailOpen,   setDetailOpen]   = useState(false);
  const [newStatus,    setNewStatus]    = useState("");
  const [adminNote,    setAdminNote]    = useState("");
  const { enqueueSnackbar } = useSnackbar();

  const { data, isLoading }              = useGetAllOrdersAdminQuery({ search: search || undefined, status: statusFilter !== "all" ? statusFilter : undefined });
  const { data: commData }               = useGetCommissionOverviewQuery();
  const [updateStatus, { isLoading: updating }] = useUpdateOrderStatusAdminMutation();

  const orders = data?.results || [];
  const totals = commData?.platform_totals || {};

  const handleUpdateStatus = async () => {
    if (!newStatus) { enqueueSnackbar("Select a status.", { variant: "warning" }); return; }
    try {
      await updateStatus({ orderNumber: selected.order_number, status: newStatus, note: adminNote }).unwrap();
      enqueueSnackbar("Order status updated. ✅", { variant: "success" });
      setDetailOpen(false);
    } catch {
      enqueueSnackbar("Update failed.", { variant: "error" });
    }
  };

  const STATUS_TABS = ["all", "pending", "processing", "shipped", "delivered", "cancelled", "refunded"];

  const columns = [
    {
      field: "order_number", headerName: "Order #", minWidth: 120,
      renderCell: (r) => <Typography variant="body2" fontWeight={800}>#{r.order_number}</Typography>,
    },
    {
      field: "buyer", headerName: "Buyer",
      renderCell: (r) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>{r.buyer?.email || "—"}</Typography>
        </Box>
      ),
    },
    {
      field: "status", headerName: "Status", minWidth: 140,
      renderCell: (r) => <OrderStatusBadge status={r.status} />,
    },
    {
      field: "vendor_count", headerName: "Vendors", align: "center",
      renderCell: (r) => (
        <Chip label={r.vendor_count} size="small"
          sx={{ background: "rgba(67,24,255,0.15)", border: "1px solid rgba(67,24,255,0.3)", color: "#4318FF", fontWeight: 700, minWidth: 30 }} />
      ),
    },
    {
      field: "total_amount", headerName: "Total", align: "right",
      renderCell: (r) => <Typography fontWeight={800} sx={{ color: "#4318FF" }}>${Number(r.total_amount).toFixed(2)}</Typography>,
    },
    {
      field: "paid_at", headerName: "Paid",
      renderCell: (r) => r.paid_at ? new Date(r.paid_at).toLocaleDateString() : <Typography variant="caption" sx={{ color: "#FF9800" }}>Unpaid</Typography>,
    },
    {
      field: "created_at", headerName: "Date",
      renderCell: (r) => new Date(r.created_at).toLocaleDateString(),
    },
    {
      field: "actions", headerName: "", align: "right",
      renderCell: (r) => (
        <Button size="small" onClick={() => { setSelected(r); setNewStatus(r.status); setAdminNote(""); setDetailOpen(true); }}
          sx={{ color: "#4318FF", fontWeight: 600, fontSize: "0.72rem" }}>
          Manage
        </Button>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={900}>Order Management</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Monitor all platform orders and override statuses
        </Typography>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: "Total Orders",  value: data?.count || 0,                                    color: "#4318FF" },
          { label: "Total Revenue", value: `$${Number(totals.total_gross || 0).toFixed(2)}`,    color: "#10B981" },
          { label: "Commission",    value: `$${Number(totals.total_commission || 0).toFixed(2)}`, color: "#FF9800" },
          { label: "Total Payout",  value: `$${Number(totals.total_payout || 0).toFixed(2)}`,   color: "#0075FF" },
        ].map(({ label, value, color }) => (
          <Grid item key={label} xs={12} sm={6} lg={3}>
            <StatCard icon={<ShoppingBagIcon />} label={label} value={value} color={color} isLoading={isLoading} />
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {STATUS_TABS.map((s) => (
            <Chip key={s} label={s === "all" ? "All" : s.replace(/_/g, " ")}
              onClick={() => setStatusFilter(s)}
              sx={{
                cursor: "pointer", fontWeight: 600, textTransform: "capitalize",
                background: statusFilter === s ? "rgba(67,24,255,0.2)" : "rgba(255,255,255,0.06)",
                border:     statusFilter === s ? "1px solid rgba(67,24,255,0.5)" : "1px solid rgba(255,255,255,0.1)",
                color:      statusFilter === s ? "#fff" : "rgba(255,255,255,0.6)",
                transition: "all 200ms",
              }}
            />
          ))}
        </Box>
        <Box sx={{ ml: "auto", maxWidth: 280, flex: 1 }}>
          <TextField
            size="small" fullWidth placeholder="Search order number or email…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: "rgba(255,255,255,0.35)" }} /></InputAdornment>,
              endAdornment: search && <InputAdornment position="end"><IconButton size="small" onClick={() => setSearch("")}><ClearIcon sx={{ fontSize: 14 }} /></IconButton></InputAdornment>,
            }}
          />
        </Box>
      </Box>

      <AdminDataTable columns={columns} rows={orders} isLoading={isLoading} emptyText="No orders found." />

      {/* Order detail / manage dialog */}
      <Dialog
        open={detailOpen} onClose={() => setDetailOpen(false)}
        maxWidth="sm" fullWidth
        PaperProps={{ sx: { background: "rgba(15,12,41,0.97)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "20px" } }}
      >
        {selected && (
          <>
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
              <Box>
                <Typography fontWeight={800}>Order #{selected.order_number}</Typography>
                <Box sx={{ mt: 0.5 }}><OrderStatusBadge status={selected.status} /></Box>
              </Box>
              <IconButton size="small" onClick={() => setDetailOpen(false)}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ borderColor: "rgba(255,255,255,0.08)" }}>
              {[
                ["Buyer",    selected.buyer?.email || "—"],
                ["Total",    `$${Number(selected.total_amount).toFixed(2)}`],
                ["Paid",     selected.paid_at ? new Date(selected.paid_at).toLocaleDateString() : "Not paid"],
                ["Vendors",  selected.vendor_count],
                ["Items",    selected.item_count],
                ["Created",  new Date(selected.created_at).toLocaleDateString()],
                ["Stripe PI", selected.stripe_payment_intent_id || "—"],
              ].map(([k, v]) => (
                <Box key={k} sx={{ display: "flex", justifyContent: "space-between", py: 1, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <Typography variant="body2" color="text.secondary">{k}</Typography>
                  <Typography variant="body2" fontWeight={600}>{v}</Typography>
                </Box>
              ))}

              <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography variant="subtitle2" fontWeight={700}>Override Status</Typography>
                <FormControl fullWidth size="small">
                  <InputLabel>New Status</InputLabel>
                  <Select value={newStatus} label="New Status"
                    onChange={(e) => setNewStatus(e.target.value)}
                    sx={{ borderRadius: "10px" }}>
                    {ORDER_STATUSES.map((s) => (
                      <MenuItem key={s} value={s} sx={{ textTransform: "capitalize" }}>
                        {s.replace(/_/g, " ")}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Admin Note" multiline rows={2} size="small" fullWidth
                  value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Reason for manual override…"
                />
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2.5, gap: 1, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <Button onClick={() => setDetailOpen(false)} variant="outlined"
                sx={{ borderColor: "rgba(255,255,255,0.15)", borderRadius: "10px" }}>
                Close
              </Button>
              <GradientButton onClick={handleUpdateStatus} disabled={updating || newStatus === selected.status}>
                {updating ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Update Status"}
              </GradientButton>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}