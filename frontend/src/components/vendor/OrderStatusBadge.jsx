// src/components/vendor/OrderStatusBadge.jsx
import { Chip } from "@mui/material";

const STATUS_MAP = {
  pending:          { label: "Pending",          bg: "rgba(255,152,0,0.15)",   border: "rgba(255,152,0,0.4)",   color: "#FF9800" },
  confirmed:        { label: "Confirmed",        bg: "rgba(0,117,255,0.12)",   border: "rgba(0,117,255,0.35)",  color: "#0075FF" },
  processing:       { label: "Processing",       bg: "rgba(67,24,255,0.12)",   border: "rgba(67,24,255,0.35)",  color: "#4318FF" },
  shipped:          { label: "Shipped",          bg: "rgba(123,47,247,0.12)",  border: "rgba(123,47,247,0.35)", color: "#7B2FF7" },
  delivered:        { label: "Delivered",        bg: "rgba(16,185,129,0.15)",  border: "rgba(16,185,129,0.4)",  color: "#10B981" },
  cancelled:        { label: "Cancelled",        bg: "rgba(244,67,54,0.12)",   border: "rgba(244,67,54,0.35)",  color: "#F44336" },
  refunded:         { label: "Refunded",         bg: "rgba(239,83,80,0.10)",   border: "rgba(239,83,80,0.3)",   color: "#EF5350" },
  draft:            { label: "Draft",            bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)" },
  active:           { label: "Active",           bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.3)",  color: "#10B981" },
  pending_approval: { label: "Pending Approval", bg: "rgba(255,152,0,0.12)",  border: "rgba(255,152,0,0.35)",  color: "#FF9800" },
  rejected:         { label: "Rejected",         bg: "rgba(244,67,54,0.12)",   border: "rgba(244,67,54,0.3)",   color: "#F44336" },
  archived:         { label: "Archived",         bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.35)" },
};

export default function OrderStatusBadge({ status, size = "small" }) {
  const s = STATUS_MAP[status] || STATUS_MAP.pending;
  return (
    <Chip
      label={s.label}
      size={size}
      sx={{
        background:    s.bg,
        border:        `1px solid ${s.border}`,
        color:         s.color,
        fontWeight:    700,
        textTransform: "capitalize",
        letterSpacing: "0.02em",
      }}
    />
  );
}