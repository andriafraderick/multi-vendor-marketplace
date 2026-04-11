// src/pages/admin/AdminProductsPage.jsx
import { useState }   from "react";
import {
  Box, Typography, TextField, InputAdornment,
  IconButton, Chip, Button, Tooltip,
  Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Grid,
} from "@mui/material";
import SearchIcon      from "@mui/icons-material/Search";
import ClearIcon       from "@mui/icons-material/Clear";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon      from "@mui/icons-material/Cancel";
import StarIcon        from "@mui/icons-material/Star";
import StarBorderIcon  from "@mui/icons-material/StarBorder";
import CloseIcon       from "@mui/icons-material/Close";
import InventoryIcon   from "@mui/icons-material/Inventory2Outlined";
import { useSnackbar } from "notistack";

import {
  useGetAllProductsAdminQuery,
  useUpdateProductStatusMutation,
} from "@/store/api/productApi";
import AdminDataTable from "@/components/admin/AdminDataTable";
import OrderStatusBadge from "@/components/vendor/OrderStatusBadge";
import GradientButton from "@/components/ui/GradientButton";
import ConfirmDialog  from "@/components/admin/ConfirmDialog";
import StatCard       from "@/components/admin/StatCard";

export default function AdminProductsPage() {
  const [search,          setSearch]          = useState("");
  const [statusFilter,    setStatusFilter]    = useState("pending");
  const [selected,        setSelected]        = useState(null);
  const [detailOpen,      setDetailOpen]      = useState(false);
  const [rejectReason,    setRejectReason]    = useState("");
  const [confirmAction,   setConfirmAction]   = useState(null);
  const [confirmOpen,     setConfirmOpen]     = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const { data, isLoading } = useGetAllProductsAdminQuery({
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const [updateStatus, { isLoading: updating }] = useUpdateProductStatusMutation();

  const products = data?.results || [];

  const statusCounts = {
    all:      data?.count || 0,
    pending:  products.filter((p) => p.status === "pending").length,
    active:   products.filter((p) => p.status === "active").length,
    rejected: products.filter((p) => p.status === "rejected").length,
    archived: products.filter((p) => p.status === "archived").length,
  };

  const doAction = async (product, action) => {
    try {
      const payload = { id: product.id };
      if (action === "approve")  payload.status = "active";
      if (action === "reject")   { payload.status = "rejected"; payload.rejection_reason = rejectReason; }
      if (action === "archive")  payload.status = "archived";
      if (action === "feature")  payload.status = "active";
      await updateStatus(payload).unwrap();
      enqueueSnackbar(`Product ${action}d. ✅`, { variant: "success" });
      setConfirmOpen(false);
      setDetailOpen(false);
    } catch {
      enqueueSnackbar("Action failed.", { variant: "error" });
    }
  };

  const handleAction = (product, action) => {
    setSelected(product);
    setConfirmAction(action);
    setRejectReason("");
    setConfirmOpen(true);
  };

  const STATUS_TABS = ["all", "pending", "active", "rejected", "archived"];

  const columns = [
    {
      field: "name", headerName: "Product", minWidth: 180,
      renderCell: (r) => (
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <Box sx={{
            width: 36, height: 36, flexShrink: 0, borderRadius: "8px",
            background: r.primary_image
              ? `url(${r.primary_image}) center/cover`
              : "linear-gradient(135deg, rgba(67,24,255,0.2), rgba(0,117,255,0.1))",
          }} />
          <Box>
            <Typography variant="body2" fontWeight={700} noWrap sx={{ maxWidth: 140 }}>{r.name}</Typography>
            <Typography variant="caption" color="text.secondary">{r.sku || "—"}</Typography>
          </Box>
        </Box>
      ),
    },
    { field: "vendor_name",  headerName: "Vendor",   renderCell: (r) => r.vendor_name || "—" },
    { field: "category_name", headerName: "Category", renderCell: (r) => r.category_name || "—" },
    {
      field: "price", headerName: "Price", align: "right",
      renderCell: (r) => <Typography fontWeight={700} sx={{ color: "#4318FF" }}>${Number(r.price).toFixed(2)}</Typography>,
    },
    { field: "stock_quantity", headerName: "Stock",  align: "center" },
    {
      field: "status", headerName: "Status",
      renderCell: (r) => <OrderStatusBadge status={r.status === "pending" ? "pending_approval" : r.status} />,
    },
    {
      field: "actions", headerName: "Actions", align: "right", minWidth: 160,
      renderCell: (r) => (
        <Box sx={{ display: "flex", gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
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
          {r.status === "active" && !r.is_featured && (
            <Tooltip title="Feature">
              <IconButton size="small" onClick={() => handleAction(r, "feature")}
                sx={{ color: "#F59E0B", "&:hover": { background: "rgba(245,158,11,0.1)" } }}>
                <StarBorderIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {r.is_featured && (
            <Tooltip title="Featured">
              <IconButton size="small" sx={{ color: "#F59E0B" }}>
                <StarIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Button size="small" onClick={() => { setSelected(r); setDetailOpen(true); }}
            sx={{ color: "#4318FF", fontWeight: 600, fontSize: "0.72rem" }}>
            View
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={900}>Product Management</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Review and approve vendor product listings
        </Typography>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: "Total Products", value: data?.count || 0, color: "#4318FF" },
          { label: "Pending Review", value: statusCounts.pending,  color: "#FF9800" },
          { label: "Active",         value: statusCounts.active,   color: "#10B981" },
          { label: "Rejected",       value: statusCounts.rejected, color: "#F44336" },
        ].map(({ label, value, color }) => (
          <Grid item key={label} xs={12} sm={6} lg={3}>
            <StatCard icon={<InventoryIcon />} label={label} value={value} color={color} isLoading={isLoading} />
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
                cursor: "pointer", fontWeight: 600,
                background: statusFilter === s ? "rgba(67,24,255,0.2)" : "rgba(255,255,255,0.06)",
                border:     statusFilter === s ? "1px solid rgba(67,24,255,0.5)" : "1px solid rgba(255,255,255,0.1)",
                color:      statusFilter === s ? "#fff" : "rgba(255,255,255,0.6)",
                textTransform: "capitalize", transition: "all 200ms",
              }}
            />
          ))}
        </Box>
        <Box sx={{ ml: "auto", maxWidth: 280, flex: 1 }}>
          <TextField
            size="small" fullWidth placeholder="Search products…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: "rgba(255,255,255,0.35)" }} /></InputAdornment>,
              endAdornment: search && <InputAdornment position="end"><IconButton size="small" onClick={() => setSearch("")}><ClearIcon sx={{ fontSize: 14 }} /></IconButton></InputAdornment>,
            }}
          />
        </Box>
      </Box>

      <AdminDataTable columns={columns} rows={products} isLoading={isLoading} emptyText="No products found." />

      {/* Product detail dialog */}
      <Dialog
        open={detailOpen} onClose={() => setDetailOpen(false)}
        maxWidth="sm" fullWidth
        PaperProps={{ sx: { background: "rgba(15,12,41,0.97)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "20px" } }}
      >
        {selected && (
          <>
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography fontWeight={800}>{selected.name}</Typography>
              <IconButton size="small" onClick={() => setDetailOpen(false)}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ borderColor: "rgba(255,255,255,0.08)" }}>
              {selected.primary_image && (
                <Box sx={{ height: 200, borderRadius: "12px", mb: 2, background: `url(${selected.primary_image}) center/cover`, }} />
              )}
              {[
                ["Vendor",    selected.vendor_name || "—"],
                ["Category",  selected.category_name || "—"],
                ["Price",     `$${Number(selected.price).toFixed(2)}`],
                ["Compare",   selected.compare_at_price ? `$${Number(selected.compare_at_price).toFixed(2)}` : "—"],
                ["Stock",     selected.stock_quantity],
                ["Condition", selected.condition],
                ["Status",    <OrderStatusBadge status={selected.status === "pending" ? "pending_approval" : selected.status} />],
                ["Featured",  selected.is_featured ? "✅ Yes" : "No"],
              ].map(([k, v]) => (
                <Box key={k} sx={{ display: "flex", justifyContent: "space-between", py: 1, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <Typography variant="body2" color="text.secondary">{k}</Typography>
                  {typeof v === "string" || typeof v === "number"
                    ? <Typography variant="body2" fontWeight={600}>{v}</Typography>
                    : v}
                </Box>
              ))}
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">Description</Typography>
                <Typography variant="body2" sx={{ mt: 0.5, color: "rgba(255,255,255,0.7)", lineHeight: 1.8 }}>
                  {selected.description?.slice(0, 300)}{selected.description?.length > 300 ? "…" : ""}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2.5, gap: 1, borderTop: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap" }}>
              {selected.status === "pending" && (
                <>
                  <Button onClick={() => handleAction(selected, "reject")} variant="outlined"
                    sx={{ borderColor: "rgba(244,67,54,0.4)", color: "#F44336", borderRadius: "10px" }}>
                    Reject
                  </Button>
                  <GradientButton onClick={() => handleAction(selected, "approve")} sx={{ px: 3 }}>
                    Approve
                  </GradientButton>
                </>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => doAction(selected, confirmAction)}
        isLoading={updating}
        title={confirmAction === "approve" ? "Approve Product?" : confirmAction === "reject" ? "Reject Product?" : "Confirm Action?"}
        description={
          confirmAction === "approve"
            ? `"${selected?.name}" will go live on the marketplace.`
            : confirmAction === "reject"
            ? `"${selected?.name}" will be rejected. Provide a reason below.`
            : `Confirm this action on "${selected?.name}".`
        }
        confirmLabel={confirmAction === "approve" ? "Approve" : confirmAction === "reject" ? "Reject" : "Confirm"}
        confirmColor={confirmAction === "approve" ? "#10B981" : "#F44336"}
      >
        {confirmAction === "reject" && (
          <TextField
            label="Rejection Reason" multiline rows={2} size="small" fullWidth
            value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        )}
      </ConfirmDialog>
    </Box>
  );
}