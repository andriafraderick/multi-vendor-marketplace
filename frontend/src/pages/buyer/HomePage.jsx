// src/pages/buyer/HomePage.jsx
import { Box, Typography, Button, Grid, Chip, Container } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowForward    from "@mui/icons-material/ArrowForward";
import { useGetFeaturedProductsQuery } from "@/store/api/productApi";
import GlassCard      from "@/components/ui/GlassCard";
import StarRating     from "@/components/ui/StarRating";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

function ProductCard({ product }) {
  const navigate = useNavigate();
  return (
    <GlassCard
      glow
      active
      onClick={() => navigate(`/products/${product.slug}`)}
      sx={{ overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}
    >
      {/* Image */}
      <Box
        sx={{
          height:     200,
          background: product.primary_image
            ? `url(${product.primary_image}) center/cover no-repeat`
            : "linear-gradient(135deg, rgba(67,24,255,0.2), rgba(0,117,255,0.1))",
          position:   "relative",
          flexShrink: 0,
        }}
      >
        {product.discount_percentage > 0 && (
          <Chip
            label={`-${product.discount_percentage}%`}
            size="small"
            sx={{
              position:   "absolute",
              top:        10,
              left:       10,
              background: "linear-gradient(135deg, #4318FF, #0075FF)",
              color:      "#fff",
              fontWeight: 800,
              fontSize:   "0.7rem",
            }}
          />
        )}
        {!product.is_in_stock && (
          <Box
            sx={{
              position:       "absolute",
              inset:          0,
              background:     "rgba(0,0,0,0.6)",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="caption" fontWeight={700} color="error">
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
            color:         "#4318FF",
            fontWeight:    600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {product.vendor_name}
        </Typography>

        <Typography
          variant="subtitle1"
          fontWeight={700}
          sx={{ mt: 0.25, mb: 0.5, flex: 1 }}
          className="truncate-2"
        >
          {product.name}
        </Typography>

        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}
        >
          <StarRating rating={Number(product.average_rating || 0)} />
          <Typography variant="caption" color="text.secondary">
            ({product.total_reviews || 0})
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h6" fontWeight={800}>
            ${Number(product.price).toFixed(2)}
          </Typography>
          {product.compare_at_price && (
            <Typography
              variant="body2"
              sx={{
                color:          "rgba(255,255,255,0.35)",
                textDecoration: "line-through",
              }}
            >
              ${Number(product.compare_at_price).toFixed(2)}
            </Typography>
          )}
        </Box>
      </Box>
    </GlassCard>
  );
}

export default function HomePage() {
  const navigate = useNavigate();

  // getFeaturedProducts uses transformResponse so data is always an array
  const { data: featured = [], isLoading } = useGetFeaturedProductsQuery();

  return (
    <Box>
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          minHeight:  "92vh",
          display:    "flex",
          alignItems: "center",
          position:   "relative",
          overflow:   "hidden",
          px:         { xs: 3, md: 8 },
        }}
      >
        {/* Decorative blobs */}
        {[
          { top: "10%", left: "60%", color: "rgba(67,24,255,0.2)",  size: "50vw" },
          { top: "50%", left: "20%", color: "rgba(0,117,255,0.12)", size: "35vw" },
          { top: "-5%", left: "80%", color: "rgba(123,47,247,0.15)",size: "25vw" },
        ].map((blob, i) => (
          <Box
            key={i}
            sx={{
              position:      "absolute",
              top:           blob.top,
              left:          blob.left,
              width:         blob.size,
              height:        blob.size,
              borderRadius:  "50%",
              background:    `radial-gradient(circle, ${blob.color} 0%, transparent 70%)`,
              pointerEvents: "none",
            }}
          />
        ))}

        {/* Hero text */}
        <Box
          sx={{ maxWidth: 680, position: "relative", zIndex: 1 }}
        >
          <Chip
            label="🎉 New products daily"
            size="small"
            sx={{
              mb:         2,
              background: "rgba(67,24,255,0.2)",
              border:     "1px solid rgba(67,24,255,0.4)",
              color:      "rgba(255,255,255,0.85)",
              fontWeight: 600,
            }}
          />

          <Typography
            variant="h1"
            sx={{
              fontSize:   { xs: "2.5rem", md: "4rem", lg: "5rem" },
              fontWeight: 900,
              lineHeight: 1.1,
              mb:         2.5,
              background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.75) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor:  "transparent",
            }}
          >
            Shop from the{" "}
            <Box
              component="span"
              sx={{
                background:           "linear-gradient(135deg, #4318FF, #0075FF)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor:  "transparent",
              }}
            >
              best vendors
            </Box>{" "}
            worldwide
          </Typography>

          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ mb: 4, fontWeight: 400, lineHeight: 1.7, maxWidth: 520 }}
          >
            Discover unique products from thousands of independent sellers.
            All in one place, with buyer protection on every order.
          </Typography>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/products")}
              endIcon={<ArrowForward />}
              sx={{
                background:   "linear-gradient(135deg, #4318FF, #0075FF)",
                boxShadow:    "0 8px 30px rgba(67,24,255,0.5)",
                borderRadius: "14px",
                px:           4,
                py:           1.75,
                fontSize:     "1rem",
                fontWeight:   700,
                "&:hover": {
                  boxShadow: "0 12px 40px rgba(67,24,255,0.65)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              Browse Products
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate("/vendors")}
              sx={{
                borderColor:  "rgba(255,255,255,0.2)",
                borderRadius: "14px",
                px:           4,
                py:           1.75,
                fontSize:     "1rem",
                fontWeight:   700,
                "&:hover": {
                  borderColor: "rgba(67,24,255,0.6)",
                  background:  "rgba(67,24,255,0.1)",
                },
              }}
            >
              View Vendors
            </Button>
          </Box>

          {/* Stats */}
          <Box sx={{ display: "flex", gap: 4, mt: 5, flexWrap: "wrap" }}>
            {[
              { value: "10K+", label: "Products"   },
              { value: "500+", label: "Vendors"    },
              { value: "50K+", label: "Buyers"     },
              { value: "4.8★", label: "Avg Rating" },
            ].map(({ value, label }) => (
              <Box key={label}>
                <Typography
                  variant="h5"
                  fontWeight={800}
                  sx={{ color: "#4318FF" }}
                >
                  {value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* ── Featured Products ──────────────────────────────────────────────── */}
      <Container maxWidth="xl" sx={{ pb: 10 }}>
        <Box
          sx={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            mb:             4,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={800}>
              Featured Products
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Hand-picked by our team
            </Typography>
          </Box>
          <Button
            onClick={() => navigate("/products?is_featured=true")}
            endIcon={<ArrowForward />}
            sx={{ color: "#4318FF", fontWeight: 600 }}
          >
            View all
          </Button>
        </Box>

        {isLoading ? (
          <LoadingSpinner fullPage />
        ) : featured.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography color="text.secondary">
              No featured products yet. Add some from the admin panel!
            </Typography>
            <Button
              variant="outlined"
              onClick={() => navigate("/products")}
              sx={{ mt: 2, borderColor: "rgba(255,255,255,0.2)" }}
            >
              Browse All Products
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {featured.slice(0, 8).map((product) => (
              <Grid item key={product.id} xs={12} sm={6} md={4} lg={3}>
                <ProductCard product={product} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}