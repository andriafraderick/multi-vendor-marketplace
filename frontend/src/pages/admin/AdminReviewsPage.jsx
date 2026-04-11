// src/pages/admin/AdminReviewsPage.jsx
import { useState }  from "react";
import {
  Box, Typography, Chip, Button, TextField,
  InputAdornment, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, Grid,
} from "@mui/material";
import SearchIcon  from "@mui/icons-material/Search";
import ClearIcon   from "@mui/icons-material/Clear";
import CloseIcon   from "@mui/icons-material/Close";
import FlagIcon    from "@mui/icons-material/Flag";
import RateReviewIcon from "@mui/icons-material/RateReview";
import { useSnackbar } from "notistack";

import {
  useGetAllReviewsAdminQuery,
  useGetFlaggedReviewsQuery,
  useModerateReviewMutation,
} from "@/store/api/reviewApi";
import AdminDataTable from "@/components/admin/AdminDataTable";
import StarRating    from "@/components/ui/StarRating";
import GlassCard     from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import StatCard      from "@/components/admin/StatCard";
import OrderStatusBadge from "@/components/vendor/OrderStatusBadge";

const MOD_STATUS = {
  pending:  { bg: "rgba(255,152,0,0.15)",  border: "rgba(255,152,0,0.4)",  color: "#FF9800" },
  approved: { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)", color: "#10B981" },
  rejected: { bg: "rgba(244,67,54,0.12)",  border: "rgba(244,67,54,0.3)",  color: "#F44336" },
  flagged:  { bg: "rgba(247,37,133,0.12)", border: "rgba(247,37,133,0.3)", color: "#F72585" },
};

export default function AdminReviewsPage() {
  const [tab,          setTab]          = useState("pending");
  const [search,       setSearch]       = useState("");
  const [selected,     setSelected]     = useState(null);
  const [detailOpen,   setDetailOpen]   = useState(false);
  const [modNote,      setModNote]      = useState("");
  const { enqueueSnackbar } = useSnackbar();

  const { data: allReviews,     isLoading: aL } = useGetAllReviewsAdminQuery({ status: tab !== "flagged" ? tab : undefined, search: search || undefined });
  const { data: flaggedReviews, isLoading: fL } = useGetFlaggedReviewsQuery(undefined, { skip: tab !== "flagged" });
  const [moderateReview, { isLoading: moderating }] = useModerateReviewMutation();

  const reviews = tab === "flagged"
    ? (flaggedReviews?.results || flaggedReviews || [])
    : (allReviews?.results || []);

  const handleModerate = async (action) => {
    try {
      await moderateReview({ reviewId: selected.id, action, note: modNote }).unwrap();
      enqueueSnackbar(`Review ${action}d. ✅`, { variant: "success" });
      setDetailOpen(false);
    } catch {
      enqueueSnackbar("Moderation failed.", { variant: "error" });
    }
  };

  const TABS = [
    { key: "pending",  label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "flagged",  label: "🚩 Flagged" },
    { key: "rejected", label: "Rejected" },
  ];

  const columns = [
    {
      field: "product_name", headerName: "Product", minWidth: 160,
      renderCell: (r) => <Typography variant="body2" fontWeight={700} noWrap sx={{ maxWidth: 150 }}>{r.product_name || "—"}</Typography>,
    },
    {
      field: "buyer_name", headerName: "Buyer",
      renderCell: (r) => r.buyer_name || "—",
    },
    {
      field: "rating", headerName: "Rating",
      renderCell: (r) => <StarRating rating={r.rating} showNumber />,
    },
    {
      field: "body", headerName: "Review",
      renderCell: (r) => (
        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
          {r.body}
        </Typography>
      ),
    },
    {
      field: "moderation_status", headerName: "Status",
      renderCell: (r) => {
        const s = MOD_STATUS[r.moderation_status] || MOD_STATUS.pending;
        return (
          <Chip
            label={r.moderation_status}
            size="small"
            sx={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontWeight: 700, textTransform: "capitalize" }}
          />
        );
      },
    },
    {
      field: "flag_count", headerName: "Flags", align: "center",
      renderCell: (r) => r.flag_count > 0 ? (
        <Chip label={r.flag_count} size="small" icon={<FlagIcon sx={{ fontSize: "0.8rem !important", color: "#F72585 !important" }} />}
          sx={{ background: "rgba(247,37,133,0.12)", border: "1px solid rgba(247,37,133,0.3)", color: "#F72585", fontWeight: 700 }} />
      ) : 0,
    },
    {
      field: "created_at", headerName: "Date",
      renderCell: (r) => new Date(r.created_at).toLocaleDateString(),
    },
    {
      field: "actions", headerName: "", align: "right",
      renderCell: (r) => (
        <Button size="small" onClick={() => { setSelected(r); setModNote(""); setDetailOpen(true); }}
          sx={{ color: "#4318FF", fontWeight: 600, fontSize: "0.72rem" }}>
          Review
        </Button>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={900}>Review Moderation</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Approve, reject, and manage all product reviews
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: "Total Reviews",  value: allReviews?.count || 0, color: "#4318FF" },
          { label: "Pending",        value: (allReviews?.results || []).filter((r) => r.moderation_status === "pending").length,  color: "#FF9800" },
          { label: "Approved",       value: (allReviews?.results || []).filter((r) => r.moderation_status === "approved").length, color: "#10B981" },
          { label: "Flagged",        value: (flaggedReviews?.results || flaggedReviews || []).length, color: "#F72585" },
        ].map(({ label, value, color }) => (
          <Grid item key={label} xs={12} sm={6} lg={3}>
            <StatCard icon={<RateReviewIcon />} label={label} value={value} color={color} />
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Box sx={{ display: "flex", gap: 1, mb: 3, flexWrap: "wrap" }}>
        {TABS.map(({ key, label }) => (
          <Chip key={key} label={label} onClick={() => setTab(key)}
            sx={{
              cursor: "pointer", fontWeight: 600,
              background: tab === key ? "rgba(67,24,255,0.2)" : "rgba(255,255,255,0.06)",
              border:     tab === key ? "1px solid rgba(67,24,255,0.5)" : "1px solid rgba(255,255,255,0.1)",
              color:      tab === key ? "#fff" : "rgba(255,255,255,0.6)",
              transition: "all 200ms",
            }}
          />
        ))}
        <Box sx={{ ml: "auto", maxWidth: 280, flex: 1 }}>
          <TextField
            size="small" fullWidth placeholder="Search reviews…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: "rgba(255,255,255,0.35)" }} /></InputAdornment>,
              endAdornment: search && <InputAdornment position="end"><IconButton size="small" onClick={() => setSearch("")}><ClearIcon sx={{ fontSize: 14 }} /></IconButton></InputAdornment>,
            }}
          />
        </Box>
      </Box>

      <AdminDataTable columns={columns} rows={reviews} isLoading={aL || fL} emptyText="No reviews found." />

      {/* Review detail + moderation dialog */}
      <Dialog
        open={detailOpen} onClose={() => setDetailOpen(false)}
        maxWidth="sm" fullWidth
        PaperProps={{ sx: { background: "rgba(15,12,41,0.97)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "20px" } }}
      >
        {selected && (
          <>
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography fontWeight={800}>Review by {selected.buyer_name}</Typography>
              <IconButton size="small" onClick={() => setDetailOpen(false)}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <GlassCard hover={false} sx={{ p: 2.5, mb: 2.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
                  <Typography variant="body2" fontWeight={700}>{selected.product_name}</Typography>
                  <StarRating rating={selected.rating} showNumber />
                </Box>
                {selected.title && <Typography fontWeight={700} gutterBottom>{selected.title}</Typography>}
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>{selected.body}</Typography>
                {selected.flag_count > 0 && (
                  <Box sx={{ mt: 2, p: 1.5, borderRadius: "8px", background: "rgba(247,37,133,0.08)", border: "1px solid rgba(247,37,133,0.2)" }}>
                    <Typography variant="caption" sx={{ color: "#F72585" }}>
                      🚩 {selected.flag_count} flag{selected.flag_count !== 1 ? "s" : ""} reported
                    </Typography>
                  </Box>
                )}
              </GlassCard>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography variant="subtitle2" fontWeight={700}>Moderation Note</Typography>
                <TextField
                  label="Note (optional)" multiline rows={2} size="small" fullWidth
                  value={modNote} onChange={(e) => setModNote(e.target.value)}
                />
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2.5, gap: 1, flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              {selected.moderation_status !== "rejected" && (
                <Button onClick={() => handleModerate("reject")} variant="outlined" disabled={moderating}
                  sx={{ borderColor: "rgba(244,67,54,0.4)", color: "#F44336", borderRadius: "10px" }}>
                  Reject
                </Button>
              )}
              {selected.moderation_status === "flagged" && (
                <Button onClick={() => handleModerate("unflag")} variant="outlined" disabled={moderating}
                  sx={{ borderColor: "rgba(255,152,0,0.4)", color: "#FF9800", borderRadius: "10px" }}>
                  Unflag
                </Button>
              )}
              {selected.moderation_status !== "approved" && (
                <GradientButton onClick={() => handleModerate("approve")} disabled={moderating}>
                  {moderating ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Approve"}
                </GradientButton>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}