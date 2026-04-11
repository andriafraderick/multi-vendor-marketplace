// src/pages/buyer/OrderSuccessPage.jsx
import { useParams, useNavigate } from "react-router-dom";
import { Container, Box, Typography, Button, Divider } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useGetOrderDetailQuery } from "@/store/api/orderApi";
import GlassCard from "@/components/ui/GlassCard";

export default function OrderSuccessPage() {
  const { orderNumber } = useParams();
  const navigate        = useNavigate();
  const { data: order } = useGetOrderDetailQuery(orderNumber);

  return (
    <Container maxWidth="md" sx={{ py: 8, textAlign: "center" }}>
      {/* Success icon */}
      <Box
        sx={{
          width:        100, height: 100,
          borderRadius: "50%",
          background:   "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.1))",
          border:       "2px solid rgba(16,185,129,0.4)",
          display:      "flex",
          alignItems:   "center",
          justifyContent: "center",
          mx:           "auto",
          mb:           3,
          animation:    "pulse-glow 2s ease-in-out infinite",
        }}
      >
        <CheckCircleIcon sx={{ fontSize: 52, color: "#10B981" }} />
      </Box>

      <Typography variant="h3" fontWeight={900} gutterBottom>
        Order Placed! 🎉
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 1 }}>
        Thank you for your purchase. Your order is being processed.
      </Typography>
      <Typography
        variant="h6"
        fontWeight={700}
        sx={{
          color: "#4318FF", mb: 4,
          background: "rgba(67,24,255,0.1)",
          border: "1px solid rgba(67,24,255,0.3)",
          borderRadius: "12px", px: 3, py: 1.5,
          display: "inline-block",
        }}
      >
        Order #{orderNumber}
      </Typography>

      {/* Order items summary */}
      {order && (
        <GlassCard hover={false} sx={{ p: 3, mb: 4, textAlign: "left" }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>Order Summary</Typography>
          <Divider sx={{ mb: 2 }} />
          {order.vendor_orders?.map((vo) => (
            <Box key={vo.id} sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ color: "#4318FF", fontWeight: 600, mb: 1 }}>
                📦 {vo.vendor_name}
              </Typography>
              {vo.items?.map((item) => (
                <Box key={item.id} sx={{ display: "flex", justifyContent: "space-between", py: 0.75 }}>
                  <Typography variant="body2">
                    {item.product_name} × {item.quantity}
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    ${Number(item.line_total).toFixed(2)}
                  </Typography>
                </Box>
              ))}
            </Box>
          ))}
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography fontWeight={800}>Total</Typography>
            <Typography fontWeight={900} sx={{ color: "#4318FF" }}>
              ${Number(order.total_amount || 0).toFixed(2)}
            </Typography>
          </Box>
        </GlassCard>
      )}

      <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
        <Button
          variant="contained"
          onClick={() => navigate("/my-orders")}
          sx={{ background: "linear-gradient(135deg, #4318FF, #0075FF)", borderRadius: "12px", fontWeight: 700, px: 3 }}
        >
          View My Orders
        </Button>
        <Button
          variant="outlined"
          onClick={() => navigate("/products")}
          sx={{ borderColor: "rgba(255,255,255,0.2)", borderRadius: "12px", fontWeight: 700, px: 3 }}
        >
          Continue Shopping
        </Button>
      </Box>
    </Container>
  );
}