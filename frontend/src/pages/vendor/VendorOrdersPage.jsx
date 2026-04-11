// src/pages/vendor/VendorOrdersPage.jsx
import { useState }  from "react";
import {
  Box, Typography, TextField, InputAdornment,
  Select, MenuItem, FormControl, InputLabel,
  Button, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Divider,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useSnackbar } from "notistack";

import {
  useGetVendorOrdersQuery,
  useUpdateVendorOrderMutation,
} from "@/store/api/orderApi";
import GlassCard        from "@/components/ui/GlassCard";
import OrderStatusBadge from "@/components/vendor/OrderStatusBadge";
import EmptyState       from "@/components/ui/EmptyState";
import ShoppingBagIcon  from "@mui/icons-material/ShoppingBagOutlined";

const NEXT_STATUSES = {
  pending:    ["confirmed", "cancelled"],
  confirmed:  ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped:    ["delivered"],
};

export default function VendorOrdersPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [updateDialog, setUpdateDialog] = useState(null); // { order, nextStatus }
  const [tracking, setTracking]         = useState("");
  const [carrier,  setCarrier]          = useState("");
  const [note,     setNote]             = useState("");

  const { data, isLoading } = useGetVendorOrdersQuery({
    search: search || undefined,
    status: statusFilter || undefined,
  });
  const [updateOrder, { isLoading: updating }] = useUpdateVendorOrderMutation();

  const orders = data?.results || [];

  const openUpdateDialog = (order, nextStatus) => {
    setUpdateDialog({ order, nextStatus });
    setTracking("");
    setCarrier("");
    setNote("");
  };

  const handleUpdateOrder = async () => {
    if (!updateDialog) return;
    try {
      await updateOrder({
        id:               updateDialog.order.id,
        status:           updateDialog.nextStatus,
        tracking_number:  tracking,
        shipping_carrier: carrier,
        note,
      }).unwrap();
      enqueueSnackbar(`Order updated to "${updateDialog.nextStatus}"`, { variant: "success" });
      setUpdateDialog(null);
    } catch (err) {
      enqueueSnackbar(err?.data?.status?.[0] || "Failed to update order", { variant: "error" });
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>Orders</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Manage and fulfill your customer orders
        </Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder="Search order number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: "rgba(255,255,255,0.35)" }} />
              </InputAdornment>
            ),
          }}
          sx={{ width: 240, "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ borderRadius: "12px" }}
          >
            <MenuItem value="">All statuses</MenuItem>
            {["pending","confirmed","processing","shipped","delivered","cancelled"].map((s) => (
              <MenuItem key={s} value={s} sx={{ textTransform: "capitalize" }}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Order list */}
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress sx={{ color: "#4318FF" }} />
        </Box>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBagIcon sx={{ fontSize: 72 }} />}
          title="No orders found"
          description="Orders from customers will appear here."
        />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {orders.map((order) => {
            const nextStatuses = NEXT_STATUSES[order.status] || [];
            return (
              <GlassCard key={order.id} hover={false} sx={{ p: 3 }}>
                {/* Order header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2, mb: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={800}>
                      Order #{order.order?.order_number || order.id.slice(0, 8)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(order.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Typography variant="h6" fontWeight={900} sx={{ color: "#4318FF" }}>
                      ${Number(order.vendor_total || 0).toFixed(2)}
                    </Typography>
                    <OrderStatusBadge status={order.status} />
                  </Box>
                </Box>

                {/* Items */}
                <Box sx={{ mb: 2 }}>
                  {(order.items || []).map((item) => (
                    <Box
                      key={item.id}
                      sx={{
                        display: "flex", justifyContent: "space-between",
                        py: 1, borderBottom: "1px solid rgba(255,255,255,0.05)",
                        "&:last-child": { borderBottom: "none" },
                      }}
                    >
                      <Typography variant="body2">
                        {item.product_name} × {item.quantity}
                        {item.variant_info && ` (${item.variant_info})`}
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        ${Number(item.line_total).toFixed(2)}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* Tracking info */}
                {order.tracking_number && (
                  <Box
                    sx={{
                      mb: 2, p: 1.5, borderRadius: "10px",
                      background: "rgba(67,24,255,0.08)",
                      border: "1px solid rgba(67,24,255,0.2)",
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "#4318FF", fontWeight: 700 }}>
                      Tracking: {order.tracking_number}
                      {order.shipping_carrier && ` via ${order.shipping_carrier}`}
                    </Typography>
                  </Box>
                )}

                {/* Action buttons */}
                {nextStatuses.length > 0 && (
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {nextStatuses.map((next) => (
                      <Button
                        key={next}
                        size="small"
                        variant={next === "cancelled" ? "outlined" : "contained"}
                        onClick={() => openUpdateDialog(order, next)}
                        sx={{
                          borderRadius: "10px",
                          fontWeight: 700,
                          textTransform: "capitalize",
                          ...(next === "cancelled" ? {
                            borderColor: "rgba(244,67,54,0.4)",
                            color: "#F44336",
                            "&:hover": { borderColor: "#F44336", background: "rgba(244,67,54,0.08)" },
                          } : {
                            background: "linear-gradient(135deg, #4318FF, #0075FF)",
                          }),
                        }}
                      >
                        Mark as {next}
                      </Button>
                    ))}
                  </Box>
                )}
              </GlassCard>
            );
          })}
        </Box>
      )}

      {/* Update status dialog */}
      <Dialog
        open={!!updateDialog}
        onClose={() => setUpdateDialog(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: "rgba(15,12,41,0.98)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "20px",
          },
        }}
      >
        <DialogTitle fontWeight={800}>
          Update Order to "{updateDialog?.nextStatus}"
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
            {updateDialog?.nextStatus === "shipped" && (
              <>
                <TextField
                  label="Tracking Number"
                  fullWidth
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  placeholder="e.g. 1Z999AA10123456784"
                />
                <TextField
                  label="Shipping Carrier"
                  fullWidth
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="e.g. UPS, FedEx, USPS"
                />
              </>
            )}
            <TextField
              label="Note (optional)"
              fullWidth
              multiline
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note for this status change…"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1.5 }}>
          <Button
            onClick={() => setUpdateDialog(null)}
            variant="outlined"
            sx={{ borderColor: "rgba(255,255,255,0.15)", borderRadius: "12px" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateOrder}
            variant="contained"
            disabled={updating}
            sx={{
              background: "linear-gradient(135deg, #4318FF, #0075FF)",
              borderRadius: "12px", fontWeight: 700,
            }}
          >
            {updating ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Confirm Update"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}