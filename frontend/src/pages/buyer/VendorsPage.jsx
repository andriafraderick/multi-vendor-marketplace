// src/pages/buyer/VendorsPage.jsx
import { useState }  from "react";
import { useNavigate } from "react-router-dom";
import {
  Container, Grid, Box, Typography,
  TextField, InputAdornment, IconButton,
} from "@mui/material";
import SearchIcon  from "@mui/icons-material/Search";
import ClearIcon   from "@mui/icons-material/Clear";
import StorefrontIcon from "@mui/icons-material/Storefront";

import { useGetVendorsQuery } from "@/store/api/vendorApi";
import GlassCard   from "@/components/ui/GlassCard";
import StarRating  from "@/components/ui/StarRating";
import EmptyState  from "@/components/ui/EmptyState";
import { ProductCardSkeleton } from "@/components/product/ProductCard";


export default function VendorsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useGetVendorsQuery({ search: search || undefined });
  const vendors = data?.results || [];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          All Vendors
        </Typography>
        <Typography color="text.secondary">
          Discover {data?.count || 0} independent sellers
        </Typography>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 4, maxWidth: 500 }}>
        <TextField
          fullWidth
          placeholder="Search stores…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "rgba(255,255,255,0.35)", fontSize: 20 }} />
              </InputAdornment>
            ),
            endAdornment: search && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearch("")}>
                  <ClearIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.4)" }} />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "14px" } }}
        />
      </Box>

      {isLoading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item key={i} xs={12} sm={6} md={4}>
              <ProductCardSkeleton />
            </Grid>
          ))}
        </Grid>
      ) : vendors.length === 0 ? (
        <EmptyState
          icon={<StorefrontIcon sx={{ fontSize: 72 }} />}
          title="No vendors found"
          description="Try a different search term."
        />
      ) : (
        <Grid container spacing={3}>
          {vendors.map((vendor) => (
            <Grid item key={vendor.id} xs={12} sm={6} md={4} lg={3}>
              <GlassCard
                glow
                active
                onClick={() => navigate(`/vendors/${vendor.slug}`)}
                sx={{ overflow: "hidden" }}
              >
                {/* Banner */}
                <Box
                  sx={{
                    height:     140,
                    background: vendor.banner
                      ? `url(${vendor.banner}) center/cover`
                      : "linear-gradient(135deg, rgba(67,24,255,0.2), rgba(0,117,255,0.1))",
                    position:  "relative",
                  }}
                >
                  {/* Logo */}
                  <Box
                    sx={{
                      position:     "absolute",
                      bottom:       -24,
                      left:         20,
                      width:        56, height: 56,
                      borderRadius: "14px",
                      border:       "3px solid rgba(15,12,41,0.9)",
                      background:   vendor.logo
                        ? `url(${vendor.logo}) center/cover`
                        : "linear-gradient(135deg, #4318FF, #0075FF)",
                      display:      "flex",
                      alignItems:   "center",
                      justifyContent: "center",
                      fontWeight:   800, fontSize: "1.2rem",
                      color:        "#fff",
                    }}
                  >
                    {!vendor.logo && vendor.store_name?.[0]}
                  </Box>
                </Box>

                <Box sx={{ pt: 4, px: 2.5, pb: 2.5 }}>
                  <Typography variant="h6" fontWeight={800} noWrap>
                    {vendor.store_name}
                  </Typography>
                  {vendor.tagline && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mb: 1.5, display: "block" }}
                    >
                      {vendor.tagline}
                    </Typography>
                  )}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                    <StarRating rating={Number(vendor.average_rating)} showNumber />
                    <Typography variant="caption" color="text.secondary">
                      ({vendor.total_reviews})
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="caption" color="text.secondary">
                      {vendor.total_orders} orders
                    </Typography>
                    {vendor.city && (
                      <Typography variant="caption" color="text.secondary">
                        📍 {vendor.city}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </GlassCard>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}