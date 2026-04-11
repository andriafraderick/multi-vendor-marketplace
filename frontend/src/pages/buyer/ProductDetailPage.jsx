// src/pages/buyer/ProductDetailPage.jsx
import { useState }      from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Container, Grid, Box, Typography, Button, Chip,
  Divider, Select, MenuItem, FormControl, InputLabel,
  Tab, Tabs, Alert, Skeleton, CircularProgress,
} from "@mui/material";
import ShoppingCartIcon   from "@mui/icons-material/ShoppingCart";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon       from "@mui/icons-material/Favorite";
import StorefrontIcon     from "@mui/icons-material/StorefrontOutlined";
import LocalShippingIcon  from "@mui/icons-material/LocalShippingOutlined";
import VerifiedIcon       from "@mui/icons-material/VerifiedOutlined";
import { useSnackbar }    from "notistack";

import { useGetProductBySlugQuery }     from "@/store/api/productApi";
import { useAddToCartMutation }         from "@/store/api/orderApi";
import { useGetProductReviewsQuery, useGetProductRatingSummaryQuery } from "@/store/api/reviewApi";
import { openCart }                     from "@/store/slices/cartSlice";
import { selectIsAuthenticated }        from "@/store/slices/authSlice";

import ProductImageGallery from "@/components/product/ProductImageGallery";
import StarRating          from "@/components/ui/StarRating";
import GlassCard           from "@/components/ui/GlassCard";
import GradientButton      from "@/components/ui/GradientButton";

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

function RatingBar({ star, percent }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.75 }}>
      <Typography variant="caption" sx={{ minWidth: 16, color: "rgba(255,255,255,0.5)", textAlign: "right" }}>
        {star}★
      </Typography>
      <Box sx={{ flex: 1, height: 6, borderRadius: "999px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <Box
          sx={{
            width: `${percent}%`, height: "100%", borderRadius: "999px",
            background: "linear-gradient(90deg, #F59E0B, #FBBF24)",
            transition: "width 600ms cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </Box>
      <Typography variant="caption" sx={{ minWidth: 28, color: "rgba(255,255,255,0.4)" }}>
        {percent}%
      </Typography>
    </Box>
  );
}

export default function ProductDetailPage() {
  const { slug }    = useParams();
  const navigate    = useNavigate();
  const dispatch    = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [qty,       setQty]       = useState(1);
  const [variantId, setVariantId] = useState("");
  const [tab,       setTab]       = useState(0);
  const [wishlisted, setWishlisted] = useState(false);

  const { data: product, isLoading, isError } = useGetProductBySlugQuery(slug);
  const { data: reviews  = { results: [] }  } = useGetProductReviewsQuery({ slug }, { skip: !product });
  const { data: summary  = {}              } = useGetProductRatingSummaryQuery(slug, { skip: !product });
  const [addToCart, { isLoading: addingCart }] = useAddToCartMutation();

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={460} sx={{ borderRadius: "20px", bgcolor: "rgba(255,255,255,0.06)" }} />
          </Grid>
          <Grid item xs={12} md={6}>
            {[200, 120, 80, 160, 100].map((w, i) => (
              <Skeleton key={i} variant="text" width={`${w}px`} height={i === 0 ? 48 : 32} sx={{ bgcolor: "rgba(255,255,255,0.06)", mb: 1.5 }} />
            ))}
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (isError || !product) {
    return (
      <Container maxWidth="xl" sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h5" gutterBottom>Product not found</Typography>
        <Button variant="contained" onClick={() => navigate("/products")} sx={{ mt: 2 }}>
          Back to Products
        </Button>
      </Container>
    );
  }

  const selectedVariant = product.variants?.find((v) => v.id === variantId);
  const displayPrice    = selectedVariant
    ? Number(product.price) + Number(selectedVariant.price_modifier)
    : Number(product.price);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      enqueueSnackbar("Please login to add items to cart", { variant: "info" });
      navigate("/login");
      return;
    }
    try {
      await addToCart({
        product_id: product.id,
        variant_id: variantId || undefined,
        quantity:   qty,
      }).unwrap();
      dispatch(openCart());
      enqueueSnackbar(`${product.name} added to cart 🛒`, { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err?.data?.error || "Could not add to cart", { variant: "error" });
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 5 }}>
      <Grid container spacing={5}>

        {/* ── Image Gallery ──────────────────────────────────────────────── */}
        <Grid item xs={12} md={6} lg={5}>
          <ProductImageGallery images={product.images || []} />
        </Grid>

        {/* ── Product Info ────────────────────────────────────────────────── */}
        <Grid item xs={12} md={6} lg={7}>

          {/* Breadcrumb */}
          <Box sx={{ display: "flex", gap: 0.5, mb: 2, flexWrap: "wrap" }}>
            <Typography
              variant="caption"
              sx={{ color: "#4318FF", cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
              onClick={() => navigate("/products")}
            >
              Products
            </Typography>
            {product.category_name && (
              <>
                <Typography variant="caption" color="text.secondary">/</Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#4318FF", cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                  onClick={() => navigate(`/products?category=${product.category_slug}`)}
                >
                  {product.category_name}
                </Typography>
              </>
            )}
          </Box>

          {/* Vendor */}
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, cursor: "pointer" }}
            onClick={() => navigate(`/vendors/${product.vendor_slug}`)}
          >
            <StorefrontIcon sx={{ fontSize: 16, color: "#4318FF" }} />
            <Typography
              variant="body2"
              sx={{ color: "#4318FF", fontWeight: 600, "&:hover": { textDecoration: "underline" } }}
            >
              {product.vendor_name}
            </Typography>
            <StarRating rating={Number(product.vendor_rating)} size="small" showNumber />
          </Box>

          {/* Title */}
          <Typography variant="h3" fontWeight={800} sx={{ mb: 1.5, lineHeight: 1.2 }}>
            {product.name}
          </Typography>

          {/* Rating row */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <StarRating rating={Number(product.average_rating)} size="medium" showNumber />
              <Typography variant="body2" color="text.secondary">
                ({product.total_reviews} reviews)
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {product.total_sales} sold
            </Typography>
            <Chip
              label={product.condition}
              size="small"
              sx={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                textTransform: "capitalize",
                fontWeight: 600,
              }}
            />
          </Box>

          {/* Price */}
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, mb: 3 }}>
            <Typography variant="h3" fontWeight={900} sx={{ color: "#fff" }}>
              ${displayPrice.toFixed(2)}
            </Typography>
            {product.compare_at_price && (
              <Typography
                variant="h5"
                sx={{ color: "rgba(255,255,255,0.3)", textDecoration: "line-through", fontWeight: 400 }}
              >
                ${Number(product.compare_at_price).toFixed(2)}
              </Typography>
            )}
            {product.discount_percentage > 0 && (
              <Chip
                label={`Save ${product.discount_percentage}%`}
                size="small"
                sx={{
                  background: "linear-gradient(135deg, #4318FF, #0075FF)",
                  color: "#fff", fontWeight: 800,
                }}
              />
            )}
          </Box>

          {/* Short description */}
          {product.short_description && (
            <Typography color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
              {product.short_description}
            </Typography>
          )}

          {/* Variant selector */}
          {product.variants?.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Select option</InputLabel>
                <Select
                  value={variantId}
                  label="Select option"
                  onChange={(e) => setVariantId(e.target.value)}
                  sx={{ borderRadius: "12px" }}
                >
                  <MenuItem value="">— No variant —</MenuItem>
                  {product.variants
                    .filter((v) => v.is_active)
                    .map((v) => (
                      <MenuItem key={v.id} value={v.id} disabled={v.stock_quantity === 0}>
                        {v.name}: {v.value}
                        {v.price_modifier > 0 && ` (+$${v.price_modifier})`}
                        {v.price_modifier < 0 && ` (-$${Math.abs(v.price_modifier)})`}
                        {v.stock_quantity === 0 && " — Out of stock"}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {/* Quantity + Add to cart */}
          <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center", flexWrap: "wrap" }}>
            {/* Qty picker */}
            <Box
              sx={{
                display: "flex", alignItems: "center",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "12px", overflow: "hidden",
              }}
            >
              <Button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                sx={{ minWidth: 42, color: "rgba(255,255,255,0.6)", borderRadius: 0 }}
              >
                −
              </Button>
              <Typography
                sx={{
                  px: 2, py: 1,
                  minWidth: 48, textAlign: "center",
                  fontWeight: 700, borderLeft: "1px solid rgba(255,255,255,0.1)",
                  borderRight: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {qty}
              </Typography>
              <Button
                onClick={() => setQty((q) => q + 1)}
                sx={{ minWidth: 42, color: "rgba(255,255,255,0.6)", borderRadius: 0 }}
              >
                +
              </Button>
            </Box>

            <GradientButton
              size="large"
              disabled={!product.is_in_stock || addingCart}
              onClick={handleAddToCart}
              sx={{ flex: 1, py: 1.5, fontSize: "1rem" }}
            >
              {addingCart ? (
                <CircularProgress size={20} sx={{ color: "#fff" }} />
              ) : !product.is_in_stock ? (
                "Out of Stock"
              ) : (
                <>
                  <ShoppingCartIcon sx={{ mr: 1, fontSize: 20 }} />
                  Add to Cart
                </>
              )}
            </GradientButton>

            <Button
              variant="outlined"
              onClick={() => setWishlisted((w) => !w)}
              sx={{
                minWidth: 52, height: 52,
                borderColor: wishlisted ? "rgba(247,37,133,0.5)" : "rgba(255,255,255,0.15)",
                color: wishlisted ? "#F72585" : "rgba(255,255,255,0.5)",
                borderRadius: "12px",
                "&:hover": {
                  borderColor: "rgba(247,37,133,0.5)",
                  color: "#F72585",
                  background: "rgba(247,37,133,0.08)",
                },
              }}
            >
              {wishlisted ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </Button>
          </Box>

          {/* Stock status */}
          {product.is_low_stock && product.is_in_stock && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Only a few left in stock — order soon!
            </Alert>
          )}

          {/* Trust badges */}
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
            {[
              { icon: <VerifiedIcon sx={{ fontSize: 16 }} />,       label: "Buyer Protection" },
              { icon: <LocalShippingIcon sx={{ fontSize: 16 }} />,  label: product.free_shipping ? "Free Shipping" : "Tracked Shipping" },
            ].map(({ icon, label }) => (
              <Box
                key={label}
                sx={{
                  display: "flex", alignItems: "center", gap: 0.75,
                  px: 1.5, py: 0.75,
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Box sx={{ color: "#10B981" }}>{icon}</Box>
                <Typography variant="caption" fontWeight={600} color="text.secondary">
                  {label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Attributes */}
          {product.attributes?.length > 0 && (
            <>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                {product.attributes.map((attr) => (
                  <Box key={attr.id}>
                    <Typography variant="caption" color="text.secondary">{attr.key}</Typography>
                    <Typography variant="body2" fontWeight={600}>{attr.value}</Typography>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Grid>
      </Grid>

      {/* ── Tabs: Description / Reviews / Specs ─────────────────────────── */}
      <Box sx={{ mt: 6 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            "& .MuiTabs-indicator": {
              background: "linear-gradient(90deg, #4318FF, #0075FF)",
              height: 3, borderRadius: "3px 3px 0 0",
            },
          }}
        >
          <Tab label="Description"  />
          <Tab label={`Reviews (${product.total_reviews})`} />
          {product.attributes?.length > 0 && <Tab label="Specifications" />}
        </Tabs>

        {/* Description tab */}
        <TabPanel value={tab} index={0}>
          <GlassCard hover={false} sx={{ p: 4 }}>
            <Typography
              color="text.secondary"
              sx={{ lineHeight: 1.9, whiteSpace: "pre-line" }}
            >
              {product.description}
            </Typography>
          </GlassCard>
        </TabPanel>

        {/* Reviews tab */}
        <TabPanel value={tab} index={1}>
          <Grid container spacing={4}>
            {/* Rating summary */}
            {summary.total_reviews > 0 && (
              <Grid item xs={12} md={4}>
                <GlassCard hover={false} sx={{ p: 3, textAlign: "center" }}>
                  <Typography variant="h2" fontWeight={900} sx={{ color: "#F59E0B" }}>
                    {Number(summary.average_rating || 0).toFixed(1)}
                  </Typography>
                  <StarRating rating={Number(summary.average_rating)} size="large" />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {summary.total_reviews} reviews
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  {[5, 4, 3, 2, 1].map((star) => (
                    <RatingBar
                      key={star}
                      star={star}
                      percent={summary.rating_breakdown?.[star] || 0}
                    />
                  ))}
                </GlassCard>
              </Grid>
            )}

            {/* Review list */}
            <Grid item xs={12} md={summary.total_reviews > 0 ? 8 : 12}>
              {reviews.results?.length === 0 ? (
                <GlassCard hover={false} sx={{ p: 4, textAlign: "center" }}>
                  <Typography color="text.secondary">
                    No reviews yet. Be the first to review this product!
                  </Typography>
                </GlassCard>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {reviews.results.map((review) => (
                    <GlassCard key={review.id} hover={false} sx={{ p: 3 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 38, height: 38, borderRadius: "50%",
                              background: "linear-gradient(135deg, #4318FF, #0075FF)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontWeight: 700, fontSize: "0.9rem",
                            }}
                          >
                            {review.buyer_name?.[0]}
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700}>
                              {review.buyer_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(review.created_at).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <StarRating rating={review.rating} />
                          {review.is_verified_purchase && (
                            <Chip
                              label="Verified"
                              size="small"
                              sx={{
                                background: "rgba(16,185,129,0.15)",
                                border: "1px solid rgba(16,185,129,0.3)",
                                color: "#10B981", fontWeight: 700, height: 20, fontSize: "0.65rem",
                              }}
                            />
                          )}
                        </Box>
                      </Box>

                      {review.title && (
                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                          {review.title}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                        {review.body}
                      </Typography>

                      {review.vendor_response && (
                        <Box
                          sx={{
                            mt: 2, p: 2, borderRadius: "10px",
                            background: "rgba(67,24,255,0.1)",
                            border: "1px solid rgba(67,24,255,0.2)",
                          }}
                        >
                          <Typography variant="caption" sx={{ color: "#4318FF", fontWeight: 700 }}>
                            Seller Response
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {review.vendor_response}
                          </Typography>
                        </Box>
                      )}
                    </GlassCard>
                  ))}
                </Box>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        {/* Specs tab */}
        {product.attributes?.length > 0 && (
          <TabPanel value={tab} index={2}>
            <GlassCard hover={false} sx={{ p: 4 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }, gap: 3 }}>
                {product.attributes.map((attr) => (
                  <Box
                    key={attr.id}
                    sx={{
                      p: 2, borderRadius: "10px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                      {attr.key}
                    </Typography>
                    <Typography variant="body1" fontWeight={700} sx={{ mt: 0.5 }}>
                      {attr.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </GlassCard>
          </TabPanel>
        )}
      </Box>
    </Container>
  );
}