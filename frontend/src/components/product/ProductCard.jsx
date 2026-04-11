// src/components/product/ProductCard.jsx
import { useState }     from "react";
import { useNavigate }  from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Box, Typography, Chip, IconButton, Tooltip, Skeleton,
} from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon       from "@mui/icons-material/Favorite";
import ShoppingCartIcon   from "@mui/icons-material/AddShoppingCart";
import LocalShippingIcon  from "@mui/icons-material/LocalShippingOutlined";

import { useAddToWishlistMutation, useRemoveFromWishlistMutation } from "@/store/api/productApi";
import { useAddToCartMutation }    from "@/store/api/orderApi";
import { openCart }                from "@/store/slices/cartSlice";
import { selectIsAuthenticated }   from "@/store/slices/authSlice";
import GlassCard                   from "@/components/ui/GlassCard";
import StarRating                  from "@/components/ui/StarRating";
import { useSnackbar }             from "notistack";

export default function ProductCard({ product, inWishlist = false }) {
  const navigate        = useNavigate();
  const dispatch        = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [wishlisted, setWishlisted] = useState(inWishlist);
  const [addingCart, setAddingCart] = useState(false);

  const [addToWishlist]      = useAddToWishlistMutation();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();
  const [addToCart]          = useAddToCartMutation();

  const handleWishlist = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      enqueueSnackbar("Login to save to wishlist", { variant: "info" });
      return;
    }
    try {
      if (wishlisted) {
        await removeFromWishlist(product.id).unwrap();
        setWishlisted(false);
        enqueueSnackbar("Removed from wishlist", { variant: "info" });
      } else {
        await addToWishlist(product.id).unwrap();
        setWishlisted(true);
        enqueueSnackbar("Added to wishlist ❤️", { variant: "success" });
      }
    } catch {
      enqueueSnackbar("Something went wrong", { variant: "error" });
    }
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      enqueueSnackbar("Login to add to cart", { variant: "info" });
      return;
    }
    if (!product.is_in_stock) return;
    setAddingCart(true);
    try {
      await addToCart({ product_id: product.id, quantity: 1 }).unwrap();
      dispatch(openCart());
      enqueueSnackbar("Added to cart 🛒", { variant: "success" });
    } catch (err) {
      const msg = err?.data?.error || "Could not add to cart";
      enqueueSnackbar(msg, { variant: "error" });
    } finally {
      setAddingCart(false);
    }
  };

  return (
    <GlassCard
      glow
      active
      onClick={() => navigate(`/products/${product.slug}`)}
      sx={{
        height:   "100%",
        display:  "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Image */}
      <Box
        sx={{
          height:     220,
          background: product.primary_image
            ? `url(${product.primary_image}) center/cover no-repeat`
            : "linear-gradient(135deg, rgba(67,24,255,0.15), rgba(0,117,255,0.08))",
          position:  "relative",
          flexShrink: 0,
        }}
      >
        {/* Badges */}
        <Box sx={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 0.75, flexWrap: "wrap" }}>
          {product.discount_percentage > 0 && (
            <Chip
              label={`-${product.discount_percentage}%`}
              size="small"
              sx={{
                background: "linear-gradient(135deg, #4318FF, #0075FF)",
                color: "#fff", fontWeight: 800, fontSize: "0.7rem",
                height: 22,
              }}
            />
          )}
          {product.is_featured && (
            <Chip
              label="Featured"
              size="small"
              sx={{
                background: "linear-gradient(135deg, #7B2FF7, #F72585)",
                color: "#fff", fontWeight: 700, fontSize: "0.68rem",
                height: 22,
              }}
            />
          )}
          {product.free_shipping && (
            <Chip
              icon={<LocalShippingIcon sx={{ fontSize: "0.85rem !important" }} />}
              label="Free Ship"
              size="small"
              sx={{
                background: "rgba(16,185,129,0.2)",
                border: "1px solid rgba(16,185,129,0.4)",
                color: "#10B981", fontWeight: 700, fontSize: "0.68rem",
                height: 22,
              }}
            />
          )}
        </Box>

        {/* Action buttons top-right */}
        <Box
          sx={{
            position: "absolute", top: 8, right: 8,
            display: "flex", flexDirection: "column", gap: 0.5,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Tooltip title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}>
            <IconButton
              size="small"
              onClick={handleWishlist}
              sx={{
                background:  "rgba(15,12,41,0.75)",
                backdropFilter: "blur(10px)",
                border:      "1px solid rgba(255,255,255,0.12)",
                color:       wishlisted ? "#F72585" : "rgba(255,255,255,0.6)",
                transition:  "all 200ms",
                "&:hover": {
                  background: "rgba(247,37,133,0.15)",
                  borderColor: "rgba(247,37,133,0.4)",
                  color: "#F72585",
                  transform: "scale(1.1)",
                },
              }}
            >
              {wishlisted ? <FavoriteIcon sx={{ fontSize: 16 }} /> : <FavoriteBorderIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Tooltip>
          <Tooltip title={!product.is_in_stock ? "Out of stock" : "Add to cart"}>
            <span>
              <IconButton
                size="small"
                onClick={handleAddToCart}
                disabled={!product.is_in_stock || addingCart}
                sx={{
                  background:  "rgba(15,12,41,0.75)",
                  backdropFilter: "blur(10px)",
                  border:      "1px solid rgba(255,255,255,0.12)",
                  color:       "rgba(255,255,255,0.6)",
                  transition:  "all 200ms",
                  "&:hover": {
                    background: "rgba(67,24,255,0.2)",
                    borderColor: "rgba(67,24,255,0.5)",
                    color: "#fff",
                    transform: "scale(1.1)",
                  },
                  "&.Mui-disabled": { opacity: 0.4 },
                }}
              >
                <ShoppingCartIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {/* Out of stock overlay */}
        {!product.is_in_stock && (
          <Box
            sx={{
              position: "absolute", inset: 0,
              background: "rgba(0,0,0,0.55)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Typography
              variant="caption"
              fontWeight={800}
              sx={{
                color: "#fff",
                background: "rgba(244,67,54,0.8)",
                px: 2, py: 0.5,
                borderRadius: "6px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Out of Stock
            </Typography>
          </Box>
        )}
      </Box>

      {/* Content */}
      <Box sx={{ p: 2, flex: 1, display: "flex", flexDirection: "column" }}>
        <Typography
          variant="caption"
          sx={{
            color: "#4318FF", fontWeight: 600,
            textTransform: "uppercase", letterSpacing: "0.05em",
          }}
        >
          {product.vendor_name}
        </Typography>

        <Typography
          variant="subtitle1"
          fontWeight={700}
          sx={{ mt: 0.25, mb: 0.5, flex: 1 }}
          className="truncate-2"
          title={product.name}
        >
          {product.name}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.5 }}>
          <StarRating rating={Number(product.average_rating)} />
          <Typography variant="caption" color="text.secondary">
            ({product.total_reviews})
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
            <Typography variant="h6" fontWeight={800}>
              ${Number(product.price).toFixed(2)}
            </Typography>
            {product.compare_at_price && (
              <Typography
                variant="body2"
                sx={{ color: "rgba(255,255,255,0.3)", textDecoration: "line-through" }}
              >
                ${Number(product.compare_at_price).toFixed(2)}
              </Typography>
            )}
          </Box>
          {product.is_low_stock && product.is_in_stock && (
            <Typography
              variant="caption"
              sx={{ color: "#FF9800", fontWeight: 600 }}
            >
              Low stock
            </Typography>
          )}
        </Box>
      </Box>
    </GlassCard>
  );
}

// Skeleton loader version
export function ProductCardSkeleton() {
  return (
    <Box
      sx={{
        borderRadius: "16px",
        overflow: "hidden",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Skeleton variant="rectangular" height={220} sx={{ bgcolor: "rgba(255,255,255,0.06)" }} />
      <Box sx={{ p: 2 }}>
        <Skeleton variant="text" width="40%" sx={{ bgcolor: "rgba(255,255,255,0.06)", mb: 0.5 }} />
        <Skeleton variant="text" width="80%" sx={{ bgcolor: "rgba(255,255,255,0.06)", mb: 0.5 }} />
        <Skeleton variant="text" width="60%" sx={{ bgcolor: "rgba(255,255,255,0.06)", mb: 1 }} />
        <Skeleton variant="text" width="30%" sx={{ bgcolor: "rgba(255,255,255,0.06)" }} />
      </Box>
    </Box>
  );
}