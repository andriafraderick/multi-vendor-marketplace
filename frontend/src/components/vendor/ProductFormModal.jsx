// src/components/vendor/ProductFormModal.jsx
import { useEffect }   from "react";
import { useForm }     from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup        from "yup";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, TextField, Button, CircularProgress,
  FormControlLabel, Switch, Typography, Alert,
  MenuItem, Select, FormControl, InputLabel,
} from "@mui/material";
import { useSnackbar }          from "notistack";
import { useGetCategoriesQuery } from "@/store/api/productApi";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
} from "@/store/api/productApi";

const schema = yup.object({
  name:              yup.string().min(3).required("Product name is required"),
  description:       yup.string().min(20).required("Description is required"),
  short_description: yup.string().max(500),
  price:             yup.number().positive("Must be greater than 0").required("Price is required"),
  compare_at_price:  yup.number().positive().nullable().transform((v, o) => o === "" ? null : v),
  stock_quantity:    yup.number().integer().min(0).required("Stock is required"),
  category:          yup.string().required("Category is required"),
  condition:         yup.string().required("Condition is required"),
  tags:              yup.string(),
  free_shipping:     yup.boolean(),
  is_digital:        yup.boolean(),
  track_inventory:   yup.boolean(),
});

const CONDITIONS = [
  { value: "new",         label: "New"         },
  { value: "used",        label: "Used"        },
  { value: "refurbished", label: "Refurbished" },
];

export default function ProductFormModal({ open, onClose, product = null }) {
  const { enqueueSnackbar } = useSnackbar();
  const { data: catData }   = useGetCategoriesQuery();

  const categories = catData || [];
  const flatCategories = categories.reduce((acc, cat) => {
    acc.push(cat);
    (cat.subcategories || []).forEach((sub) => acc.push({ ...sub, name: `  ↳ ${sub.name}` }));
    return acc;
  }, []);

  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const isLoading = creating || updating;

  const {
    register, handleSubmit, reset, watch,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "", description: "", short_description: "",
      price: "", compare_at_price: "", stock_quantity: 0,
      category: "", condition: "new", tags: "",
      free_shipping: false, is_digital: false, track_inventory: true,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (product) {
      reset({
        name:              product.name              || "",
        description:       product.description       || "",
        short_description: product.short_description || "",
        price:             product.price             || "",
        compare_at_price:  product.compare_at_price  || "",
        stock_quantity:    product.stock_quantity    ?? 0,
        category:          product.category_id       || "",
        condition:         product.condition         || "new",
        tags:              product.tags              || "",
        free_shipping:     product.free_shipping     || false,
        is_digital:        product.is_digital        || false,
        track_inventory:   product.track_inventory   ?? true,
      });
    } else {
      reset();
    }
  }, [product, reset]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        price:            Number(data.price),
        compare_at_price: data.compare_at_price ? Number(data.compare_at_price) : null,
        stock_quantity:   Number(data.stock_quantity),
      };

      if (product) {
        await updateProduct({ id: product.id, ...payload }).unwrap();
        enqueueSnackbar("Product updated and resubmitted for approval.", { variant: "success" });
      } else {
        await createProduct(payload).unwrap();
        enqueueSnackbar("Product submitted for admin approval! 🎉", { variant: "success" });
      }
      onClose();
    } catch (err) {
      const msg = Object.values(err?.data || {})[0];
      enqueueSnackbar(Array.isArray(msg) ? msg[0] : msg || "Failed to save product", { variant: "error" });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background:     "rgba(15,12,41,0.98)",
          backdropFilter: "blur(20px)",
          border:         "1px solid rgba(255,255,255,0.12)",
          borderRadius:   "20px",
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, fontSize: "1.2rem", pb: 1 }}>
        {product ? "Edit Product" : "Add New Product"}
      </DialogTitle>

      <DialogContent dividers sx={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <Grid container spacing={2.5} sx={{ pt: 1 }}>

          {/* Name */}
          <Grid item xs={12}>
            <TextField
              label="Product Name *"
              fullWidth
              {...register("name")}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          </Grid>

          {/* Category + Condition */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.category}>
              <InputLabel>Category *</InputLabel>
              <Select
                label="Category *"
                defaultValue=""
                {...register("category")}
                sx={{ borderRadius: "12px" }}
              >
                <MenuItem value="">— Select category —</MenuItem>
                {flatCategories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.category && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                  {errors.category.message}
                </Typography>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Condition *</InputLabel>
              <Select
                label="Condition *"
                defaultValue="new"
                {...register("condition")}
                sx={{ borderRadius: "12px" }}
              >
                {CONDITIONS.map((c) => (
                  <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Price + Compare price */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Selling Price ($) *"
              type="number"
              fullWidth
              inputProps={{ step: "0.01", min: "0" }}
              {...register("price")}
              error={!!errors.price}
              helperText={errors.price?.message}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Compare-at Price ($)"
              type="number"
              fullWidth
              inputProps={{ step: "0.01", min: "0" }}
              {...register("compare_at_price")}
              error={!!errors.compare_at_price}
              helperText={errors.compare_at_price?.message || "Original price shown for discount display"}
            />
          </Grid>

          {/* Stock */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Stock Quantity *"
              type="number"
              fullWidth
              inputProps={{ min: "0" }}
              {...register("stock_quantity")}
              error={!!errors.stock_quantity}
              helperText={errors.stock_quantity?.message}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Tags"
              fullWidth
              {...register("tags")}
              helperText="Comma-separated: shoes, sneakers, sport"
            />
          </Grid>

          {/* Short description */}
          <Grid item xs={12}>
            <TextField
              label="Short Description"
              fullWidth
              multiline
              rows={2}
              {...register("short_description")}
              error={!!errors.short_description}
              helperText={errors.short_description?.message || "Shown on product cards (max 500 chars)"}
            />
          </Grid>

          {/* Full description */}
          <Grid item xs={12}>
            <TextField
              label="Full Description *"
              fullWidth
              multiline
              rows={5}
              {...register("description")}
              error={!!errors.description}
              helperText={errors.description?.message}
            />
          </Grid>

          {/* Toggles */}
          <Grid item xs={12}>
            <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
              {[
                { name: "free_shipping",   label: "Free Shipping" },
                { name: "is_digital",      label: "Digital Product" },
                { name: "track_inventory", label: "Track Inventory" },
              ].map(({ name, label }) => (
                <FormControlLabel
                  key={name}
                  control={
                    <Switch
                      {...register(name)}
                      defaultChecked={name === "track_inventory"}
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": { color: "#4318FF" },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#4318FF" },
                      }}
                    />
                  }
                  label={<Typography variant="body2" color="text.secondary">{label}</Typography>}
                />
              ))}
            </Box>
          </Grid>

          {!product && (
            <Grid item xs={12}>
              <Alert severity="info" sx={{ borderRadius: "10px" }}>
                After submission, your product will go to <strong>Pending Approval</strong>. 
                An admin will review and publish it.
              </Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, gap: 1.5 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ borderColor: "rgba(255,255,255,0.15)", borderRadius: "12px" }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          disabled={isLoading}
          sx={{
            background: "linear-gradient(135deg, #4318FF, #0075FF)",
            borderRadius: "12px", fontWeight: 700, px: 3,
          }}
        >
          {isLoading
            ? <CircularProgress size={18} sx={{ color: "#fff" }} />
            : product ? "Save Changes" : "Submit Product"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}