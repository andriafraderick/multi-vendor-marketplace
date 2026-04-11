// src/pages/admin/AdminVendorsPage.jsx
import { useState }   from "react";
import {
  Box, Typography, TextField, InputAdornment,
  IconButton, Chip, Button, Select, MenuItem,
  FormControl, InputLabel, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress,
  Grid, Divider, Tooltip,
} from "@mui/material";
import SearchIcon    from "@mui/icons-material/Search";
import ClearIcon     from "@mui/icons-material/Clear";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon    from "@mui/icons-material/Cancel";
import BlockIcon     from "@mui/icons-material/Block";
import CloseIcon     from "@mui/icons-material/Close";
import { useSnackbar } from "notistack";

import {
  useGetAllVendorsAdminQuery,
  useUpdateVendorStatusMutation,
} from "@/store/api/vendorApi";
import AdminDataTable from "@/components/admin/AdminDataTable";
import GlassCard      from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import OrderStatusBadge from "@/components/vendor/OrderStatusBadge";
import ConfirmDialog  from "@/components/admin/ConfirmDialog";
import StatCard       from "@/components/admin/StatCard";
import StorefrontIcon from "@mui/icons-material/Storefront";

export default function AdminVendorsPage() {
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected,     setSelected]     = useState(null);
  const [detailOpen,   setDetailOpen]   = useState(false);
  const [confirmOpen,  setConfirmOpen]  = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [commissionRate,  setCommissionRate]   = useState("");
  const { enqueueSnackbar } = useSnackbar();

  const { data, isLoading } = useGetAllVendorsAdminQuery({
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const [updateStatus, { isLoading: updating }] = useUpdateVendorStatusMutation();

  const vendors = data?.results || [];

  const statusCounts = {
    all:       vendors.length,
    pending:   vendors.filter((v) => v.status === "pending").length,
    active:    vendors.filter((v) => v.status === "active").length,
    suspended: vendors.filter((v) => v.status === "suspended").length,
    rejected:  vendors.filter((v) => v.status === "rejected").length,
  };

  const handleAction = (vendor, action) => {
    setSelected(vendor);
    setPendingAction(action);
    setRejectionReason("");
    setCommissionRate(vendor.commission_rate || "10");
    setDetailOpen(false);

    if (action === "approve") {
      setConfirmOpen(true);
    } else {
      setConfirmOpen(true);
    }
  };

  const handleConfirm = async () => {
    if (!selected || !pendingAction) return;
    try {
      const payload = { id: selected.id };
      if (pendingAction === "approve") {
        payload.status = "active";
        payload.commission_rate = parseFloat(commissionRate);
      } else if (pendingAction === "suspend") {
        payload.status = "suspended";
      } else if (pendingAction === "reject") {
        payload.status = "rejected";
        payload.rejection_reason = rejectionReason;
      } else if (pendingAction === "activate") {
        payload.status = "active";
      }
      await updateStatus(payload).unwrap();
      enqueueSnackbar(`Vendor ${pendingAction}d successfully.`, { variant: "success" });
      setConfirmOpen(false);
    } catch {
      enqueueSnackbar("Action failed. Please try again.", { variant: "error" });
    }
  };

  const STATUS_TABS = ["all", "pending", "active", "suspended", "rejected"];

  const columns = [
    {
      field: "store_name", headerName: "Store", minWidth: 160,
      renderCell: (r) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 32, height: 32, borderRadius: "8px", flexShrink: 0,
              background: r.logo
                ? `url(${r.logo}) center/cover`
                : "linear-gradient(135deg, #4318FF, #0075FF)",
              display: "flex", alignItems: "center",
              justifyContent: "center", fontWeight: 700,
              fontSize: "0.8rem", color: "#fff",
            }}
          >
            {!r.logo && r.store_name?.[0]}
          </Box>
          <Box>
            <Typography variant="body2" fontWeight={700}>{r.store_name}</Typography>
            <Typography variant="caption" color="text.secondary">{r.owner_email}</Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: "status", headerName: "Status", width: 130,
      renderCell: (r) => <OrderStatusBadge status={r.status} />,
    },
    {
      field: "commission_rate", headerName: "Rate", width: 80, align: "center",
      renderCell: (r) => (
        <Chip
          label={`${r.commission_rate}%`}
          size="small"
          sx={{ background: "rgba(255,152,0,0.15)", border: "1px solid rgba(255,152,0,0.3)", color: "#FF9800", fontWeight: 700 }}
        />
      ),
    },
    {
      field: "total_sales", headerName: "Revenue", align: "right",
      renderCell: (r) => <Typography fontWeight={700} sx={{ color: "#4318FF" }}>${Number(r.total_sales || 0).toFixed(2)}</Typography>,
    },
    {
      field: "total_orders", headerName: "Orders", align: "center",
      renderCell: (r) => r.total_orders || 0,
    },
    {
      field: "average_rating", headerName: "Rating", align: "center",
      renderCell: (r) => (
        <Typography variant="body2" sx={{ color: "#F59E0B", fontWeight: 700 }}>
          {Number(r.average_rating || 0).toFixed(1)} ★
        </Typography>
      ),
    },
    {
      field: "created_at", headerName: "Joined",
      renderCell: (r) => new Date(r.created_at).toLocaleDateString(),
    },
    {
      field: "actions", headerName: "Actions", align: "right", minWidth: 160,
      renderCell: (r) => (
        <Box sx={{ display: "flex", gap: 0.75 }} onClick={(e) => e.stopPropagation()}>
          {r.status === "pending" && (
            <>
              <Tooltip title="Approve">
                <IconButton size="small" onClick={() => handleAction(r, "approve")}
                  sx={{ color: "#10B981", "&:hover": { background: "rgba(16,185,129,0.1)" } }}>
                  <CheckCircleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reject">
                <IconButton size="small" onClick={() => handleAction(r, "reject")}
                  sx={{ color: "#F44336", "&:hover": { background: "rgba(244,67,54,0.1)" } }}>
                  <CancelIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
          {r.status === "active" && (
            <Tooltip title="Suspend">
              <IconButton size="small" onClick={() => handleAction(r, "suspend")}
                sx={{ color: "#FF9800", "&:hover": { background: "rgba(255,152,0,0.1)" } }}>
                <BlockIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {(r.status === "suspended" || r.status === "rejected") && (
            <Tooltip title="Activate">
              <IconButton size="small" onClick={() => handleAction(r, "activate")}
                sx={{ color: "#10B981", "&:hover": { background: "rgba(16,185,129,0.1)" } }}>
                <CheckCircleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Button
            size="small"
            onClick={() => { setSelected(r); setDetailOpen(true); }}
            sx={{ color: "#4318FF", fontWeight: 600, fontSize: "0.72rem" }}
          >
            View
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={900}>Vendor Management</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Approve, monitor, and manage all vendor stores
        </Typography>
      </Box>

      {/* Summary cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: "Total Vendors", value: vendors.length,                                color: "#4318FF" },
          { label: "Active",        value: statusCounts.active,                           color: "#10B981" },
          { label: "Pending",       value: statusCounts.pending,                          color: "#FF9800" },
          { label: "Suspended",     value: statusCounts.suspended,                        color: "#F44336" },
        ].map(({ label, value, color }) => (
          <Grid item key={label} xs={12} sm={6} lg={3}>
            <StatCard icon={<StorefrontIcon />} label={label} value={value} color={color} />
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {STATUS_TABS.map((s) => (
            <Chip
              key={s}
              label={`${s.charAt(0).toUpperCase() + s.slice(1)} (${statusCounts[s] ?? 0})`}
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
        <Box sx={{ ml: "auto", maxWidth: 300, flex: 1 }}>
          <TextField
            size="small" fullWidth
            placeholder="Search vendors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: "rgba(255,255,255,0.35)" }} /></InputAdornment>,
              endAdornment: search && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch("")}><ClearIcon sx={{ fontSize: 14 }} /></IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>

      <AdminDataTable
        columns={columns}
        rows={vendors}
        isLoading={isLoading}
        emptyText="No vendors found."
      />

      {/* Vendor detail dialog */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="sm" fullWidth
        PaperProps={{ sx: { background: "rgba(15,12,41,0.97)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "20px" } }}
      >
        {selected && (
          <>
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography fontWeight={800}>{selected.store_name}</Typography>
              <IconButton size="small" onClick={() => setDetailOpen(false)}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {[
                  ["Owner",       selected.owner_email],
                  ["Status",      <OrderStatusBadge status={selected.status} />],
                  ["Commission",  `${selected.commission_rate}%`],
                  ["Total Sales", `$${Number(selected.total_sales || 0).toFixed(2)}`],
                  ["Orders",      selected.total_orders || 0],
                  ["Rating",      `${Number(selected.average_rating || 0).toFixed(1)} ★ (${selected.total_reviews || 0} reviews)`],
                  ["Stripe",      selected.stripe_onboarding_complete ? "✅ Connected" : "❌ Not connected"],
                  ["Joined",      new Date(selected.created_at).toLocaleDateString()],
                ].map(([k, v]) => (
                  <Box key={k} sx={{ display: "flex", justifyContent: "space-between", py: 0.75, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <Typography variant="body2" color="text.secondary">{k}</Typography>
                    <Box sx={{ fontWeight: 600 }}>{typeof v === "string" || typeof v === "number" ? <Typography variant="body2" fontWeight={600}>{v}</Typography> : v}</Box>
                  </Box>
                ))}
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2.5, gap: 1, borderTop: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap" }}>
              {selected.status === "pending" && (
                <>
                  <Button onClick={() => handleAction(selected, "reject")} variant="outlined" sx={{ borderColor: "rgba(244,67,54,0.4)", color: "#F44336", borderRadius: "10px" }}>Reject</Button>
                  <GradientButton onClick={() => handleAction(selected, "approve")} sx={{ px: 3 }}>Approve</GradientButton>
                </>
              )}
              {selected.status === "active" && (
                <Button onClick={() => handleAction(selected, "suspend")} variant="outlined" sx={{ borderColor: "rgba(255,152,0,0.4)", color: "#FF9800", borderRadius: "10px" }}>Suspend</Button>
              )}
              {(selected.status === "suspended" || selected.status === "rejected") && (
                <GradientButton onClick={() => handleAction(selected, "activate")} sx={{ px: 3 }}>Reactivate</GradientButton>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        isLoading={updating}
        title={
          pendingAction === "approve"  ? "Approve Vendor?"  :
          pendingAction === "suspend"  ? "Suspend Vendor?"  :
          pendingAction === "reject"   ? "Reject Vendor?"   :
          "Reactivate Vendor?"
        }
        description={
          pendingAction === "approve"  ? `Approve "${selected?.store_name}"? They will be notified and their store will go live.` :
          pendingAction === "suspend"  ? `Suspend "${selected?.store_name}"? Their products will be hidden from buyers.` :
          pendingAction === "reject"   ? `Reject "${selected?.store_name}"? Please provide a reason below.` :
          `Reactivate "${selected?.store_name}"? Their store will go live again.`
        }
        confirmLabel={
          pendingAction === "approve" ? "Approve"   :
          pendingAction === "suspend" ? "Suspend"   :
          pendingAction === "reject"  ? "Reject"    :
          "Reactivate"
        }
        confirmColor={
          pendingAction === "approve" || pendingAction === "activate" ? "#10B981" :
          pendingAction === "suspend" ? "#FF9800" : "#F44336"
        }
      >
        {pendingAction === "approve" && (
          <TextField
            label="Commission Rate (%)"
            type="number"
            size="small"
            value={commissionRate}
            onChange={(e) => setCommissionRate(e.target.value)}
            inputProps={{ min: 0, max: 50, step: 0.5 }}
            sx={{ mt: 2, width: "100%" }}
          />
        )}
        {pendingAction === "reject" && (
          <TextField
            label="Rejection Reason"
            multiline rows={2} size="small" fullWidth
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        )}
      </ConfirmDialog>
    </Box>
  );
}