// src/pages/buyer/OrderHistoryPage.jsx
import { useNavigate }  from "react-router-dom";
import {
  Container, Box, Typography, Chip,
  Button, CircularProgress, Divider,
} from "@mui/material";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBagOutlined";
import ArrowForward    from "@mui/icons-material/ArrowForward";
import { useGetMyOrdersQuery } from "@/store/api/orderApi";
import GlassCard  from "@/components/ui/GlassCard";
import EmptyState from "@/components/ui/EmptyState";

const STATUS_COLORS = {
  pending:           { bg: "rgba(255,152,0,0.15)",  border: "rgba(255,152,0,0.4)",  color: "#FF9800" },
  payment_confirmed: { bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.35)", color: "#10B981" },
  processing:        { bg: "rgba(0,117,255,0.12)",   border: "rgba(0,117,255,0.35)", color: "#0075FF" },
  partially_shipped: { bg: "rgba(123,47,247,0.12)",  border: "rgba(123,47,247,0.35)",color: "#7B2FF7" },
  shipped:           { bg: "rgba(67,24,255,0.12)",   border: "rgba(67,24,255,0.35)", color: "#4318FF" },
  delivered:         { bg: "rgba(16,185,129,0.15)",  border: "rgba(16,185,129,0.4)", color: "#10B981" },
  cancelled:         { bg: "rgba(244,67,54,0.12)",   border: "rgba(244,67,54,0.35)", color: "#F44336" },
  refunded:          { bg: "rgba(244,67,54,0.10)",   border: "rgba(244,67,54,0.3)",  color: "#EF5350" },
};

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useGetMyOrdersQuery();
  const orders = data?.results || [];

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, display: "flex", justifyContent: "center" }}>
        <CircularProgress sx={{ color: "#4318FF" }} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>My Orders</Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        {orders.length} order{orders.length !== 1 ? "s" : ""} placed
      </Typography>

      {orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBagIcon sx={{ fontSize: 72 }} />}
          title="No orders yet"
          description="When you place an order, it will appear here."
          actionLabel="Start Shopping"
          onAction={() => navigate("/products")}
        />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {orders.map((order) => {
            const s = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
            return (
              <GlassCard key={order.id} hover={false} sx={{ p: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 0.75 }}>
                      <Typography variant="h6" fontWeight={800}>
                        #{order.order_number}
                      </Typography>
                      <Chip
                        label={order.status.replace(/_/g, " ")}
                        size="small"
                        sx={{
                          background: s.bg, border: `1px solid ${s.border}`,
                          color: s.color, fontWeight: 700,
                          textTransform: "capitalize",
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(order.created_at).toLocaleDateString("en-US", {
                        year: "numeric", month: "long", day: "numeric",
                      })}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {order.item_count} item{order.item_count !== 1 ? "s" : ""} from {order.vendor_count} seller{order.vendor_count !== 1 ? "s" : ""}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="h5" fontWeight={900} sx={{ color: "#4318FF" }}>
                      ${Number(order.total_amount).toFixed(2)}
                    </Typography>
                    <Button
                      size="small"
                      endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
                      onClick={() => navigate(`/my-orders/${order.order_number}`)}
                      sx={{
                        mt: 1,
                        color: "#4318FF", fontWeight: 600,
                        "&:hover": { background: "rgba(67,24,255,0.1)" },
                      }}
                    >
                      View Details
                    </Button>
                  </Box>
                </Box>
              </GlassCard>
            );
          })}
        </Box>
      )}
    </Container>
  );
}