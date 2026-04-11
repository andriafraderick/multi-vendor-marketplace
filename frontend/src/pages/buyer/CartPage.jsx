// src/pages/buyer/CartPage.jsx
import { useNavigate } from "react-router-dom";
import {
  Container, Grid, Box, Typography,
  Button, IconButton, Divider, CircularProgress,
} from "@mui/material";
import AddIcon      from "@mui/icons-material/Add";
import RemoveIcon   from "@mui/icons-material/Remove";
import DeleteIcon   from "@mui/icons-material/DeleteOutline";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBagOutlined";
import ArrowForward from "@mui/icons-material/ArrowForward";

import {
  useGetCartQuery,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
} from "@/store/api/orderApi";
import GlassCard      from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";
import EmptyState     from "@/components/ui/EmptyState";

export default function CartPage() {
  const navigate     = useNavigate();
  const { data: cart, isLoading } = useGetCartQuery();
  const [updateItem]  = useUpdateCartItemMutation();
  const [removeItem]  = useRemoveCartItemMutation();
  const [clearCart, { isLoading: clearing }] = useClearCartMutation();

  const items    = cart?.items    || [];
  const subtotal = cart?.subtotal || "0.00";

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress sx={{ color: "#4318FF" }} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Your Cart
        {items.length > 0 && (
          <Typography
            component="span"
            sx={{
              ml: 1.5, px: 1.5, py: 0.25,
              borderRadius: "20px", fontSize: "1rem",
              fontWeight: 700,
              background: "linear-gradient(135deg, #4318FF, #0075FF)",
            }}
          >
            {items.length}
          </Typography>
        )}
      </Typography>

      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBagIcon sx={{ fontSize: 72 }} />}
          title="Your cart is empty"
          description="Browse our products and add something you love."
          actionLabel="Browse Products"
          onAction={() => navigate("/products")}
        />
      ) : (
        <Grid container spacing={4} sx={{ mt: 1 }}>

          {/* Cart items */}
          <Grid item xs={12} md={8}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {items.map((item) => (
                <GlassCard key={item.id} hover={false} sx={{ p: 2.5 }}>
                  <Box sx={{ display: "flex", gap: 2.5 }}>
                    {/* Image */}
                    <Box
                      onClick={() => navigate(`/products/${item.product_slug}`)}
                      sx={{
                        width: 100, height: 100, flexShrink: 0,
                        borderRadius: "12px",
                        background: item.primary_image
                          ? `url(${item.primary_image}) center/cover`
                          : "linear-gradient(135deg, rgba(67,24,255,0.2), rgba(0,117,255,0.1))",
                        cursor: "pointer",
                        transition: "transform 200ms",
                        "&:hover": { transform: "scale(1.04)" },
                      }}
                    />

                    {/* Info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
                          <Typography
                            variant="subtitle1"
                            fontWeight={700}
                            noWrap
                            sx={{ cursor: "pointer", "&:hover": { color: "#4318FF" } }}
                            onClick={() => navigate(`/products/${item.product_slug}`)}
                          >
                            {item.product_name}
                          </Typography>
                          <Typography variant="body2" sx={{ color: "#4318FF", fontWeight: 600 }}>
                            {item.vendor_name}
                          </Typography>
                          {item.variant_info && (
                            <Typography variant="caption" color="text.secondary">
                              {item.variant_info}
                            </Typography>
                          )}
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => removeItem(item.id)}
                          sx={{ color: "rgba(255,255,255,0.3)", "&:hover": { color: "#F44336" } }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1.5 }}>
                        {/* Qty control */}
                        <Box
                          sx={{
                            display: "flex", alignItems: "center",
                            border: "1px solid rgba(255,255,255,0.15)",
                            borderRadius: "10px", overflow: "hidden",
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => updateItem({ id: item.id, quantity: Math.max(1, item.quantity - 1) })}
                            disabled={item.quantity <= 1}
                            sx={{ borderRadius: 0, p: 0.75 }}
                          >
                            <RemoveIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                          <Typography
                            sx={{
                              px: 2, fontWeight: 700,
                              borderLeft: "1px solid rgba(255,255,255,0.1)",
                              borderRight: "1px solid rgba(255,255,255,0.1)",
                            }}
                          >
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => updateItem({ id: item.id, quantity: item.quantity + 1 })}
                            sx={{ borderRadius: 0, p: 0.75 }}
                          >
                            <AddIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Box>

                        <Typography variant="h6" fontWeight={800}>
                          ${Number(item.line_total).toFixed(2)}
                        </Typography>
                      </Box>

                      {!item.in_stock && (
                        <Typography variant="caption" sx={{ color: "#F44336", fontWeight: 700 }}>
                          ⚠ This item is no longer in stock
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </GlassCard>
              ))}

              {/* Clear cart */}
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => clearCart()}
                  disabled={clearing}
                  sx={{
                    borderColor: "rgba(244,67,54,0.3)",
                    color: "rgba(244,67,54,0.7)",
                    "&:hover": { borderColor: "#F44336", color: "#F44336", background: "rgba(244,67,54,0.06)" },
                  }}
                >
                  {clearing ? "Clearing…" : "Clear cart"}
                </Button>
              </Box>
            </Box>
          </Grid>

          {/* Order summary */}
          <Grid item xs={12} md={4}>
            <GlassCard hover={false} sx={{ p: 3, position: "sticky", top: 88 }}>
              <Typography variant="h6" fontWeight={800} gutterBottom>
                Order Summary
              </Typography>
              <Divider sx={{ mb: 2.5 }} />

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 2.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography color="text.secondary">Subtotal ({cart?.total_items} items)</Typography>
                  <Typography fontWeight={700}>${Number(subtotal).toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography color="text.secondary">Shipping</Typography>
                  <Typography fontWeight={600} sx={{ color: "#10B981" }}>Calculated at checkout</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography color="text.secondary">Tax</Typography>
                  <Typography fontWeight={600}>Calculated at checkout</Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 2.5 }} />

              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
                <Typography variant="h6" fontWeight={800}>Estimated Total</Typography>
                <Typography variant="h6" fontWeight={900} sx={{ color: "#4318FF" }}>
                  ${Number(subtotal).toFixed(2)}
                </Typography>
              </Box>

              <GradientButton
                fullWidth
                size="large"
                endIcon={<ArrowForward />}
                onClick={() => navigate("/checkout")}
                sx={{ py: 1.75, fontSize: "1rem", mb: 1.5 }}
              >
                Proceed to Checkout
              </GradientButton>

              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate("/products")}
                sx={{
                  borderColor: "rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.6)",
                  borderRadius: "12px",
                }}
              >
                Continue Shopping
              </Button>

              {/* Vendor count note */}
              {(cart?.vendor_count || 0) > 1 && (
                <Box
                  sx={{
                    mt: 2, p: 1.5, borderRadius: "10px",
                    background: "rgba(255,152,0,0.08)",
                    border: "1px solid rgba(255,152,0,0.2)",
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#FF9800" }}>
                    ℹ️ Your cart has items from {cart.vendor_count} different sellers. Each seller will fulfill their own items separately.
                  </Typography>
                </Box>
              )}
            </GlassCard>
          </Grid>
        </Grid>
      )}
    </Container>
  );
}