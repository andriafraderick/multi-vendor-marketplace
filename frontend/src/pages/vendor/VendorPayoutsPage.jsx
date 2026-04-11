// src/pages/vendor/VendorPayoutsPage.jsx
import { useState } from "react";
import {
  Box, Typography, Grid, TextField, Button,
  CircularProgress, Chip, Divider,
} from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import { useSnackbar } from "notistack";

import {
  useGetPayoutRequestsQuery,
  useCreatePayoutRequestMutation,
} from "@/store/api/vendorApi";
import { useGetVendorCommissionsQuery } from "@/store/api/orderApi";
import GlassCard      from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import EmptyState     from "@/components/ui/EmptyState";
import OrderStatusBadge from "@/components/vendor/OrderStatusBadge";

const PAYOUT_STATUS = {
  pending:    { bg: "rgba(255,152,0,0.15)",  border: "rgba(255,152,0,0.4)",  color: "#FF9800" },
  processing: { bg: "rgba(0,117,255,0.12)",  border: "rgba(0,117,255,0.35)", color: "#0075FF" },
  completed:  { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.4)", color: "#10B981" },
  failed:     { bg: "rgba(244,67,54,0.12)",  border: "rgba(244,67,54,0.35)", color: "#F44336" },
};

export default function VendorPayoutsPage() {
  const [amount, setAmount] = useState("");
  const [notes,  setNotes]  = useState("");
  const { enqueueSnackbar } = useSnackbar();

  const { data: payoutsData,     isLoading: payLoading  } = useGetPayoutRequestsQuery();
  const { data: commissionsData, isLoading: commLoading } = useGetVendorCommissionsQuery({});
  const [createPayout, { isLoading: creating }] = useCreatePayoutRequestMutation();

  const payouts   = payoutsData?.results || [];
  const summary   = commissionsData?.summary || {};
  const available = Number(summary.total_payout || 0);

  const handleRequest = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      enqueueSnackbar("Enter a valid amount.", { variant: "warning" });
      return;
    }
    if (amt > available) {
      enqueueSnackbar(`Maximum available: $${available.toFixed(2)}`, { variant: "error" });
      return;
    }
    try {
      await createPayout({ amount: amt, notes }).unwrap();
      enqueueSnackbar("Payout request submitted! ✅", { variant: "success" });
      setAmount("");
      setNotes("");
    } catch (err) {
      enqueueSnackbar(err?.data?.error || "Failed to submit request.", { variant: "error" });
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={900}>Payouts</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Request your earnings and view payout history
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: "Total Earned",      value: `$${Number(summary.total_gross      || 0).toFixed(2)}`, color: "#4318FF" },
          { label: "Platform Fees",     value: `$${Number(summary.total_commission || 0).toFixed(2)}`, color: "#FF9800" },
          { label: "Available Balance", value: `$${available.toFixed(2)}`,                             color: "#10B981" },
        ].map(({ label, value, color }) => (
          <Grid item key={label} xs={12} sm={4}>
            <GlassCard hover={false} sx={{ p: 3 }}>
              <Typography
                variant="caption"
                sx={{
                  color:         "rgba(255,255,255,0.45)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight:    700,
                }}
              >
                {label}
              </Typography>
              <Typography variant="h4" fontWeight={900} sx={{ mt: 0.5, color }}>
                {value}
              </Typography>
            </GlassCard>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Request form */}
        <Grid item xs={12} md={4}>
          <GlassCard hover={false} sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
              <AccountBalanceIcon sx={{ color: "#4318FF" }} />
              <Typography variant="h6" fontWeight={700}>Request Payout</Typography>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Amount ($)"
                type="number"
                fullWidth
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputProps={{ min: 1, max: available, step: "0.01" }}
                helperText={`Available: $${available.toFixed(2)}`}
              />
              <TextField
                label="Notes (optional)"
                multiline
                rows={2}
                fullWidth
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <Box
                sx={{
                  p:          2,
                  borderRadius: "10px",
                  background: "rgba(67,24,255,0.07)",
                  border:     "1px solid rgba(67,24,255,0.2)",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Payouts are processed within 2–5 business days via Stripe.
                  Make sure your Stripe account is connected in settings.
                </Typography>
              </Box>

              <GradientButton
                fullWidth
                onClick={handleRequest}
                disabled={
                  creating ||
                  !amount  ||
                  parseFloat(amount) <= 0 ||
                  parseFloat(amount) > available
                }
              >
                {creating
                  ? <CircularProgress size={18} sx={{ color: "#fff" }} />
                  : "Request Payout"}
              </GradientButton>
            </Box>
          </GlassCard>
        </Grid>

        {/* Payout history */}
        <Grid item xs={12} md={8}>
          <GlassCard hover={false} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Payout History
            </Typography>

            {payLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress sx={{ color: "#4318FF" }} size={32} />
              </Box>
            ) : payouts.length === 0 ? (
              <EmptyState
                title="No payouts yet"
                description="Your payout requests will appear here."
                sx={{ py: 6 }}
              />
            ) : (
              <Box>
                {payouts.map((p, idx) => {
                  const s = PAYOUT_STATUS[p.status] || PAYOUT_STATUS.pending;
                  return (
                    <Box key={p.id}>
                      <Box
                        sx={{
                          display:        "flex",
                          justifyContent: "space-between",
                          alignItems:     "center",
                          py:             2,
                          flexWrap:       "wrap",
                          gap:            1,
                        }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight={700}>
                            ${Number(p.amount).toFixed(2)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Requested {new Date(p.requested_at).toLocaleDateString()}
                            {p.processed_at &&
                              ` · Processed ${new Date(p.processed_at).toLocaleDateString()}`}
                          </Typography>
                          {p.notes && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block" }}
                            >
                              {p.notes}
                            </Typography>
                          )}
                        </Box>
                        <Chip
                          label={p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                          size="small"
                          sx={{
                            background: s.bg,
                            border:     `1px solid ${s.border}`,
                            color:      s.color,
                            fontWeight: 700,
                          }}
                        />
                      </Box>
                      {idx < payouts.length - 1 && <Divider />}
                    </Box>
                  );
                })}
              </Box>
            )}
          </GlassCard>
        </Grid>
      </Grid>
    </Box>
  );
}