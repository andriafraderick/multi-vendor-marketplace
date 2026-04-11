// src/pages/vendor/VendorProductsPage.jsx
import { useState }  from "react";
import {
  Box, Typography, Button, Grid, TextField,
  InputAdornment, IconButton, Chip, Tooltip,
  CircularProgress,
} from "@mui/material";
import AddIcon      from "@mui/icons-material/Add";
import SearchIcon   from "@mui/icons-material/Search";
import EditIcon     from "@mui/icons-material/EditOutlined";
import DeleteIcon   from "@mui/icons-material/DeleteOutline";
import ImageIcon    from "@mui/icons-material/ImageOutlined";
import { useSnackbar } from "notistack";

import { useGetMyProductsQuery, useDeleteProductMutation } from "@/store/api/productApi";
import GlassCard         from "@/components/ui/GlassCard";
import GradientButton    from "@/components/ui/GradientButton";
import OrderStatusBadge  from "@/components/vendor/OrderStatusBadge";
import ProductFormModal  from "@/components/vendor/ProductFormModal";
import EmptyState        from "@/components/ui/EmptyState";

export default function VendorProductsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [search,      setSearch]      = useState("");
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const { data, isLoading } = useGetMyProductsQuery({ search: search || undefined });
  const [deleteProduct]     = useDeleteProductMutation();

  const products = data?.results || [];

  const handleEdit = (product) => {
    setEditProduct(product);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditProduct(null);
    setModalOpen(true);
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Archive "${product.name}"? It will no longer be visible to buyers.`)) return;
    try {
      await deleteProduct(product.id).unwrap();
      enqueueSnackbar("Product archived successfully.", { variant: "success" });
    } catch {
      enqueueSnackbar("Failed to archive product.", { variant: "error" });
    }
  };

  const statusColor = {
    active:   "#10B981",
    pending:  "#FF9800",
    draft:    "rgba(255,255,255,0.4)",
    archived: "rgba(255,255,255,0.25)",
    rejected: "#F44336",
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>My Products</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {products.length} product{products.length !== 1 ? "s" : ""}
          </Typography>
        </Box>
        <GradientButton startIcon={<AddIcon />} onClick={handleAdd}>
          Add Product
        </GradientButton>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 3, maxWidth: 420 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search your products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: "rgba(255,255,255,0.35)" }} />
              </InputAdornment>
            ),
          }}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
        />
      </Box>

      {/* Summary chips */}
      <Box sx={{ display: "flex", gap: 1, mb: 3, flexWrap: "wrap" }}>
        {["active", "pending", "draft", "rejected", "archived"].map((s) => {
          const count = products.filter((p) => p.status === s).length;
          if (!count) return null;
          return (
            <Chip
              key={s}
              label={`${s}: ${count}`}
              size="small"
              sx={{
                background: `${statusColor[s]}18`,
                border: `1px solid ${statusColor[s]}40`,
                color: statusColor[s],
                fontWeight: 700,
                textTransform: "capitalize",
              }}
            />
          );
        })}
      </Box>

      {/* Product list */}
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress sx={{ color: "#4318FF" }} />
        </Box>
      ) : products.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Add your first product to start selling on the marketplace."
          actionLabel="Add Product"
          onAction={handleAdd}
        />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {products.map((product) => (
            <GlassCard key={product.id} hover={false} sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", gap: 2.5, alignItems: "center" }}>
                {/* Image thumbnail */}
                <Box
                  sx={{
                    width: 72, height: 72, borderRadius: "12px", flexShrink: 0,
                    background: product.primary_image
                      ? `url(${product.primary_image}) center/cover`
                      : "rgba(67,24,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {!product.primary_image && <ImageIcon sx={{ color: "rgba(255,255,255,0.2)", fontSize: 28 }} />}
                </Box>

                {/* Info */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", mb: 0.5 }}>
                    <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ maxWidth: 300 }}>
                      {product.name}
                    </Typography>
                    <OrderStatusBadge status={product.status} />
                  </Box>
                  <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                    <Typography variant="h6" fontWeight={800} sx={{ color: "#4318FF" }}>
                      ${Number(product.price).toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Stock: <strong style={{ color: product.stock_quantity === 0 ? "#F44336" : product.stock_quantity <= 5 ? "#FF9800" : "#fff" }}>
                        {product.stock_quantity}
                      </strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sold: <strong style={{ color: "#fff" }}>{product.total_sales}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Rating: <strong style={{ color: "#F59E0B" }}>{Number(product.average_rating).toFixed(1)} ★</strong>
                    </Typography>
                  </Box>
                </Box>

                {/* Actions */}
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Tooltip title="Edit product">
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(product)}
                      sx={{
                        background: "rgba(67,24,255,0.12)",
                        border: "1px solid rgba(67,24,255,0.25)",
                        color: "#4318FF",
                        "&:hover": { background: "rgba(67,24,255,0.25)" },
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Archive product">
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(product)}
                      sx={{
                        background: "rgba(244,67,54,0.08)",
                        border: "1px solid rgba(244,67,54,0.2)",
                        color: "rgba(244,67,54,0.7)",
                        "&:hover": { background: "rgba(244,67,54,0.18)", color: "#F44336" },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </GlassCard>
          ))}
        </Box>
      )}

      {/* Product form modal */}
      <ProductFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditProduct(null); }}
        product={editProduct}
      />
    </Box>
  );
}