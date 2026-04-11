// src/pages/buyer/ProductsPage.jsx
import { useState, useEffect } from "react";
import { useSearchParams }     from "react-router-dom";
import {
  Box, Container, Typography, Grid, TextField,
  InputAdornment, IconButton, Drawer, useMediaQuery,
  Badge, Button,
} from "@mui/material";
import SearchIcon      from "@mui/icons-material/Search";
import ClearIcon       from "@mui/icons-material/Clear";
import FilterListIcon  from "@mui/icons-material/FilterList";
import { useTheme }    from "@mui/material/styles";

import { useGetProductsQuery } from "@/store/api/productApi";
import ProductCard, { ProductCardSkeleton } from "@/components/product/ProductCard";
import ProductFilters  from "@/components/product/ProductFilters";
import Pagination      from "@/components/ui/Pagination";
import EmptyState      from "@/components/ui/EmptyState";
import SearchIcon2     from "@mui/icons-material/SearchOffOutlined";

const PAGE_SIZE    = 20;
const INIT_FILTERS = {
  category: "", condition: "", ordering: "-created_at",
  min_price: "", max_price: "", min_rating: "",
  is_featured: "", in_stock: "", free_shipping: "",
};

export default function ProductsPage() {
  const theme          = useTheme();
  const isMobile       = useMediaQuery(theme.breakpoints.down("md"));
  const [searchParams, setSearchParams] = useSearchParams();

  const [search,       setSearch]       = useState(searchParams.get("search") || "");
  const [searchInput,  setSearchInput]  = useState(search);
  const [page,         setPage]         = useState(1);
  const [mobileFilter, setMobileFilter] = useState(false);

  const [filters, setFilters] = useState({
    ...INIT_FILTERS,
    category:    searchParams.get("category")    || "",
    is_featured: searchParams.get("is_featured") || "",
  });

  // Build query params
  const queryParams = {
    page,
    search: search || undefined,
    ordering: filters.ordering,
    ...(filters.category    && { category:     filters.category }),
    ...(filters.condition   && { condition:    filters.condition }),
    ...(filters.min_price   && { min_price:    filters.min_price }),
    ...(filters.max_price   && { max_price:    filters.max_price }),
    ...(filters.min_rating  && { min_rating:   filters.min_rating }),
    ...(filters.is_featured && { is_featured:  true }),
    ...(filters.in_stock    && { in_stock:     true }),
    ...(filters.free_shipping && { free_shipping: true }),
  };

  const { data, isLoading, isFetching } = useGetProductsQuery(queryParams);

  const products  = data?.results || [];
  const totalCount = data?.count   || 0;
  const pageCount  = Math.ceil(totalCount / PAGE_SIZE);

  const handleFilterChange = (update) => {
    setFilters((prev) => ({ ...prev, ...update }));
    setPage(1);
  };

  const handleReset = () => {
    setFilters(INIT_FILTERS);
    setSearch("");
    setSearchInput("");
    setPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const activeFilterCount = Object.entries(filters)
    .filter(([k, v]) => v && k !== "ordering").length;

  const filtersPanel = (
    <ProductFilters
      filters={filters}
      onChange={handleFilterChange}
      onReset={handleReset}
    />
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>

      {/* Page header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Browse Products
        </Typography>
        <Typography color="text.secondary">
          {totalCount.toLocaleString()} products available
        </Typography>
      </Box>

      {/* Search bar */}
      <Box
        component="form"
        onSubmit={handleSearch}
        sx={{ mb: 4, maxWidth: 600 }}
      >
        <TextField
          fullWidth
          placeholder="Search products, brands, vendors…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "rgba(255,255,255,0.35)", fontSize: 20 }} />
              </InputAdornment>
            ),
            endAdornment: searchInput && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}
                >
                  <ClearIcon sx={{ fontSize: 16, color: "rgba(255,255,255,0.4)" }} />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "14px" } }}
        />
      </Box>

      <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>

        {/* Desktop filters sidebar */}
        {!isMobile && (
          <Box sx={{ width: 260, flexShrink: 0 }}>
            {filtersPanel}
          </Box>
        )}

        {/* Mobile filter drawer */}
        {isMobile && (
          <>
            <Button
              startIcon={
                <Badge badgeContent={activeFilterCount} color="primary">
                  <FilterListIcon />
                </Badge>
              }
              onClick={() => setMobileFilter(true)}
              variant="outlined"
              sx={{
                mb: 2, borderColor: "rgba(255,255,255,0.2)",
                borderRadius: "12px", fontWeight: 600,
              }}
            >
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>
            <Drawer
              anchor="left"
              open={mobileFilter}
              onClose={() => setMobileFilter(false)}
              PaperProps={{ sx: { width: 300, p: 2, pt: 3 } }}
            >
              {filtersPanel}
            </Drawer>
          </>
        )}

        {/* Product grid */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {isLoading || isFetching ? (
            <Grid container spacing={3}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Grid item key={i} xs={12} sm={6} lg={4} xl={3}>
                  <ProductCardSkeleton />
                </Grid>
              ))}
            </Grid>
          ) : products.length === 0 ? (
            <EmptyState
              icon={<SearchIcon2 />}
              title="No products found"
              description="Try adjusting your filters or search terms to find what you're looking for."
              actionLabel="Clear filters"
              onAction={handleReset}
            />
          ) : (
            <>
              <Grid container spacing={3}>
                {products.map((product) => (
                  <Grid item key={product.id} xs={12} sm={6} lg={4} xl={3}>
                    <ProductCard product={product} />
                  </Grid>
                ))}
              </Grid>
              <Pagination
                count={pageCount}
                page={page}
                onChange={setPage}
                total={totalCount}
                pageSize={PAGE_SIZE}
              />
            </>
          )}
        </Box>
      </Box>
    </Container>
  );
}