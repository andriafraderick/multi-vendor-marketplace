// src/pages/vendor/VendorSettingsPage.jsx
import { useState, useEffect } from "react";
import {
  Box, Typography, Grid, TextField, Button,
  CircularProgress, Divider, Alert, Avatar,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useGetVendorDashboardQuery, useUpdateVendorProfileMutation } from "@/store/api/vendorApi";
import GlassCard from "@/components/ui/GlassCard";

export default function VendorSettingsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { data: dashboard } = useGetVendorDashboardQuery();
  const [updateProfile, { isLoading: saving }] = useUpdateVendorProfileMutation();

  const vendor = dashboard?.profile || {};

  const [form, setForm] = useState({
    store_name: "", tagline: "", description: "",
    business_email: "", business_phone: "", website: "",
    address: "", city: "", country: "",
  });

  useEffect(() => {
    if (vendor.store_name) {
      setForm({
        store_name:     vendor.store_name     || "",
        tagline:        vendor.tagline        || "",
        description:    vendor.description    || "",
        business_email: vendor.business_email || "",
        business_phone: vendor.business_phone || "",
        website:        vendor.website        || "",
        address:        vendor.address        || "",
        city:           vendor.city           || "",
        country:        vendor.country        || "",
      });
    }
  }, [vendor.store_name]);

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    try {
      await updateProfile(form).unwrap();
      enqueueSnackbar("Store settings saved! ✅", { variant: "success" });
    } catch (err) {
      const msg = Object.values(err?.data || {})[0];
      enqueueSnackbar(Array.isArray(msg) ? msg[0] : msg || "Failed to save settings.", { variant: "error" });
    }
  };

  const field = (name, label, extra = {}) => (
    <TextField
      label={label}
      fullWidth
      value={form[name]}
      onChange={handleChange(name)}
      {...extra}
    />
  );

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>Store Settings</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Manage your store profile and contact information
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Store identity */}
        <Grid item xs={12} md={8}>
          <GlassCard hover={false} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>Store Identity</Typography>
            <Divider sx={{ mb: 2.5 }} />
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                {field("store_name", "Store Name *")}
              </Grid>
              <Grid item xs={12}>
                {field("tagline", "Tagline", { helperText: "One-liner shown on your store page" })}
              </Grid>
              <Grid item xs={12}>
                {field("description", "Store Description", { multiline: true, rows: 4, helperText: "Tell buyers about your store, what you sell, and your story." })}
              </Grid>
            </Grid>
          </GlassCard>

          <GlassCard hover={false} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>Contact Information</Typography>
            <Divider sx={{ mb: 2.5 }} />
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                {field("business_email", "Business Email", { type: "email" })}
              </Grid>
              <Grid item xs={12} sm={6}>
                {field("business_phone", "Business Phone")}
              </Grid>
              <Grid item xs={12}>
                {field("website", "Website", { type: "url", placeholder: "https://yourstore.com" })}
              </Grid>
            </Grid>
          </GlassCard>

          <GlassCard hover={false} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>Location</Typography>
            <Divider sx={{ mb: 2.5 }} />
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                {field("address", "Address")}
              </Grid>
              <Grid item xs={12} sm={6}>
                {field("city", "City")}
              </Grid>
              <Grid item xs={12} sm={6}>
                {field("country", "Country")}
              </Grid>
            </Grid>
          </GlassCard>

          <Button
            variant="contained"
            size="large"
            onClick={handleSave}
            disabled={saving}
            sx={{
              background: "linear-gradient(135deg, #4318FF, #0075FF)",
              borderRadius: "14px", fontWeight: 700, px: 4, py: 1.5,
            }}
          >
            {saving ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Save Settings"}
          </Button>
        </Grid>

        {/* Store stats sidebar */}
        <Grid item xs={12} md={4}>
          <GlassCard hover={false} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>Store Overview</Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ textAlign: "center", mb: 3 }}>
              <Avatar
                src={vendor.logo}
                sx={{
                  width: 80, height: 80, mx: "auto", mb: 1.5,
                  background: "linear-gradient(135deg, #4318FF, #0075FF)",
                  fontSize: "2rem", fontWeight: 800,
                  border: "3px solid rgba(255,255,255,0.1)",
                }}
              >
                {vendor.store_name?.[0]}
              </Avatar>
              <Typography variant="h6" fontWeight={800}>{vendor.store_name}</Typography>
              <Typography variant="caption" color="text.secondary">{vendor.owner_email}</Typography>
            </Box>

            {[
              { label: "Commission Rate", value: `${vendor.commission_rate || 10}%`,       color: "#FF9800" },
              { label: "Total Orders",    value: vendor.total_orders   || 0,              color: "#0075FF" },
              { label: "Total Revenue",   value: `$${Number(vendor.total_sales || 0).toFixed(2)}`, color: "#4318FF" },
              { label: "Avg Rating",      value: `${Number(vendor.average_rating || 0).toFixed(1)} ★`, color: "#F59E0B" },
              { label: "Total Reviews",   value: vendor.total_reviews  || 0,              color: "#fff"   },
            ].map(({ label, value, color }) => (
              <Box key={label} sx={{ display: "flex", justifyContent: "space-between", py: 1.25, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color }}>{value}</Typography>
              </Box>
            ))}

            {!vendor.stripe_onboarding_complete && (
              <Alert severity="warning" sx={{ mt: 2.5, borderRadius: "10px" }}>
                Connect your Stripe account to receive payouts.
              </Alert>
            )}
          </GlassCard>
        </Grid>
      </Grid>
    </Box>
  );
}