// src/pages/buyer/VendorStorePage.jsx
import { useParams, useNavigate } from "react-router-dom";
import {
  Container, Grid, Box, Typography,
  Button, Chip, Skeleton, Divider,
} from "@mui/material";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LanguageIcon   from "@mui/icons-material/Language";
import EmailIcon      from "@mui/icons-material/EmailOutlined";

import { useGetVendorBySlugQuery, useGetVendorProductsQuery } from "@/store/api/vendorApi";
import { useGetProductReviewsQuery } from "@/store/api/reviewApi";
import GlassCard  from "@/components/ui/GlassCard";
import StarRating from "@/components/ui/StarRating";
import ProductCard from "@/components/product/ProductCard";

export default function VendorStorePage() {
  const { slug }  = useParams();
  const navigate  = useNavigate();

  const { data: vendor,   isLoading: vLoading } = useGetVendorBySlugQuery(slug);
  const { data: products, isLoading: pLoading } = useGetVendorProductsQuery({ slug });
  // Vendor store reviews loaded via public endpoint
  const reviews = null; // Will be implemented with vendor review endpoint

  if (vLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Skeleton variant="rectangular" height={280} sx={{ borderRadius: "20px", bgcolor: "rgba(255,255,255,0.06)", mb: 2 }} />
        <Skeleton variant="text" height={48} width={300} sx={{ bgcolor: "rgba(255,255,255,0.06)" }} />
      </Container>
    );
  }

  if (!vendor) {
    return (
      <Container maxWidth="xl" sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h5" gutterBottom>Vendor not found</Typography>
        <Button variant="contained" onClick={() => navigate("/vendors")}>Back to Vendors</Button>
      </Container>
    );
  }

  const productList = products?.results || [];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>

      {/* Banner */}
      <Box
        sx={{
          height:       260,
          borderRadius: "20px",
          mb:           3,
          background:   vendor.banner
            ? `url(${vendor.banner}) center/cover`
            : "linear-gradient(135deg, rgba(67,24,255,0.25), rgba(0,117,255,0.15))",
          position: "relative",
          overflow: "hidden",
        }}
      />

      {/* Store header */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
            {/* Logo */}
            <Box
              sx={{
                width: 80, height: 80, borderRadius: "18px",
                border: "3px solid rgba(255,255,255,0.1)",
                background: vendor.logo
                  ? `url(${vendor.logo}) center/cover`
                  : "linear-gradient(135deg, #4318FF, #0075FF)",
                flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: "1.8rem", color: "#fff",
                mt: -6, boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              }}
            >
              {!vendor.logo && vendor.store_name?.[0]}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight={800}>{vendor.store_name}</Typography>
              {vendor.tagline && (
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>{vendor.tagline}</Typography>
              )}
              <Box sx={{ display: "flex", gap: 2, mt: 1.5, flexWrap: "wrap" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <StarRating rating={Number(vendor.average_rating)} size="medium" showNumber />
                  <Typography variant="body2" color="text.secondary">
                    ({vendor.total_reviews} reviews)
                  </Typography>
                </Box>
                <Chip
                  label={`${vendor.total_orders} orders`}
                  size="small"
                  sx={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                />
                {vendor.city && (
                  <Chip
                    label={`📍 ${vendor.city}`}
                    size="small"
                    sx={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                  />
                )}
              </Box>
            </Box>
          </Box>
        </Grid>

        {/* Contact info */}
        <Grid item xs={12} md={4}>
          <GlassCard hover={false} sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>Contact</Typography>
            {vendor.business_email && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <EmailIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.4)" }} />
                <Typography variant="body2" color="text.secondary">{vendor.business_email}</Typography>
              </Box>
            )}
            {vendor.website && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LanguageIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.4)" }} />
                <Typography
                  variant="body2"
                  component="a"
                  href={vendor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: "#4318FF", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                >
                  {vendor.website}
                </Typography>
              </Box>
            )}
          </GlassCard>
        </Grid>
      </Grid>

      {/* About */}
      {vendor.description && (
        <GlassCard hover={false} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>About this store</Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
            {vendor.description}
          </Typography>
        </GlassCard>
      )}

      {/* Products */}
      <Box sx={{ mb: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h5" fontWeight={800}>Products</Typography>
        <Typography variant="body2" color="text.secondary">
          {productList.length} items
        </Typography>
      </Box>
      {pLoading ? (
        <Grid container spacing={3}>
          {[1,2,3,4].map((i) => (
            <Grid item key={i} xs={12} sm={6} md={4} lg={3}>
              <Skeleton variant="rectangular" height={300} sx={{ borderRadius: "16px", bgcolor: "rgba(255,255,255,0.06)" }} />
            </Grid>
          ))}
        </Grid>
      ) : productList.length === 0 ? (
        <GlassCard hover={false} sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">No products yet</Typography>
        </GlassCard>
      ) : (
        <Grid container spacing={3} sx={{ mb: 5 }}>
          {productList.map((product) => (
            <Grid item key={product.id} xs={12} sm={6} md={4} lg={3}>
              <ProductCard product={product} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}