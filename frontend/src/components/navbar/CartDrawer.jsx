// src/components/navbar/CartDrawer.jsx
import { useNavigate }   from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Drawer, Box, Typography, IconButton,
  Button, Divider, Avatar, CircularProgress,
} from "@mui/material";
import CloseIcon    from "@mui/icons-material/Close";
import AddIcon      from "@mui/icons-material/Add";
import RemoveIcon   from "@mui/icons-material/Remove";
import DeleteIcon   from "@mui/icons-material/DeleteOutline";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";

import { closeCart, selectCartOpen }   from "@/store/slices/cartSlice";
import { selectIsAuthenticated }       from "@/store/slices/authSlice";
import {
  useGetCartQuery,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
} from "@/store/api/orderApi";

export default function CartDrawer() {
  const dispatch        = useDispatch();
  const navigate        = useNavigate();
  const isOpen          = useSelector(selectCartOpen);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const { data: cart, isLoading } = useGetCartQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [updateItem] = useUpdateCartItemMutation();
  const [removeItem] = useRemoveCartItemMutation();

  const items    = cart?.items    || [];
  const subtotal = cart?.subtotal || "0.00";

  const handleQtyChange = async (itemId, newQty) => {
    if (newQty < 1) return;
    await updateItem({ id: itemId, quantity: newQty });
  };

  const handleRemove = async (itemId) => {
    await removeItem(itemId);
  };

  const handleCheckout = () => {
    dispatch(closeCart());
    navigate("/checkout");
  };

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={() => dispatch(closeCart())}
      sx={{
        "& .MuiDrawer-paper": {
          width:   { xs: "100vw", sm: 420 },
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display:    "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2.5,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          Your Cart
          {items.length > 0 && (
            <Typography
              component="span"
              sx={{
                ml: 1.5,
                px: 1, py: 0.25,
                borderRadius: "20px",
                fontSize: "0.75rem",
                fontWeight: 700,
                background: "linear-gradient(135deg, #4318FF, #0075FF)",
              }}
            >
              {items.length}
            </Typography>
          )}
        </Typography>
        <IconButton onClick={() => dispatch(closeCart())}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
        {isLoading ? (
          <Box sx={{ display:"flex", justifyContent:"center", mt: 8 }}>
            <CircularProgress sx={{ color: "#4318FF" }} />
          </Box>
        ) : !isAuthenticated ? (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <ShoppingBagOutlinedIcon sx={{ fontSize: 64, color: "rgba(255,255,255,0.15)", mb: 2 }} />
            <Typography color="text.secondary" mb={2}>
              Log in to see your cart
            </Typography>
            <Button
              variant="contained"
              onClick={() => { dispatch(closeCart()); navigate("/login"); }}
            >
              Login
            </Button>
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <ShoppingBagOutlinedIcon sx={{ fontSize: 64, color: "rgba(255,255,255,0.15)", mb: 2 }} />
            <Typography color="text.secondary">
              Your cart is empty
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {items.map((item) => (
              <Box
                key={item.id}
                sx={{
                  display:      "flex",
                  gap:          1.5,
                  p:            1.5,
                  borderRadius: "12px",
                  background:   "rgba(255,255,255,0.04)",
                  border:       "1px solid rgba(255,255,255,0.08)",
                  transition:   "background 200ms",
                  "&:hover":    { background: "rgba(255,255,255,0.07)" },
                }}
              >
                {/* Product image */}
                <Avatar
                  src={item.primary_image}
                  variant="rounded"
                  sx={{ width: 64, height: 64, borderRadius: "10px" }}
                />

                {/* Product info */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    noWrap
                    title={item.product_name}
                  >
                    {item.product_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.vendor_name}
                  </Typography>
                  {item.variant_info && (
                    <Typography
                      variant="caption"
                      sx={{
                        display:    "block",
                        color:      "rgba(255,255,255,0.4)",
                        fontSize:   "0.7rem",
                      }}
                    >
                      {item.variant_info}
                    </Typography>
                  )}
                  <Box
                    sx={{
                      display:    "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mt: 0.75,
                    }}
                  >
                    {/* Quantity control */}
                    <Box
                      sx={{
                        display:    "flex",
                        alignItems: "center",
                        gap:        0.5,
                        background: "rgba(255,255,255,0.06)",
                        borderRadius: "8px",
                        p:          "2px 6px",
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleQtyChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        sx={{ p: 0.25 }}
                      >
                        <RemoveIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{ minWidth: 20, textAlign: "center" }}
                      >
                        {item.quantity}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleQtyChange(item.id, item.quantity + 1)}
                        sx={{ p: 0.25 }}
                      >
                        <AddIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>

                    {/* Price + delete */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{ color: "#4318FF" }}
                      >
                        ${Number(item.line_total).toFixed(2)}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleRemove(item.id)}
                        sx={{
                          color: "rgba(255,255,255,0.3)",
                          "&:hover": { color: "#F44336" },
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Footer */}
      {items.length > 0 && (
        <Box
          sx={{
            p:          2.5,
            borderTop:  "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography color="text.secondary">Subtotal</Typography>
            <Typography fontWeight={700} fontSize="1.1rem">
              ${Number(subtotal).toFixed(2)}
            </Typography>
          </Box>
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleCheckout}
            sx={{ borderRadius: "12px", py: 1.5, fontWeight: 700 }}
          >
            Proceed to Checkout
          </Button>
        </Box>
      )}
    </Drawer>
  );
}