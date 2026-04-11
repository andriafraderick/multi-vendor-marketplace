// src/pages/buyer/CheckoutPage.jsx
import { useState }    from "react";
import { useNavigate } from "react-router-dom";
import { useForm }     from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup        from "yup";
import {
  Container, Grid, Box, Typography,
  TextField, Button, Divider, Alert,
  CircularProgress, FormControlLabel, Checkbox, Chip,
} from "@mui/material";
import LockIcon     from "@mui/icons-material/LockOutlined";
import LocalShippingIcon from "@mui/icons-material/LocalShippingOutlined";
import { useSnackbar } from "notistack";

import {
  useGetCartQuery,
  useCheckoutMutation,
  useConfirmPaymentMutation,
  useValidateCouponMutation,
} from "@/store/api/orderApi";
import GlassCard      from "@/components/ui/GlassCard";
import GradientButton from "@/components/ui/GradientButton";

const addressSchema = {
  full_name:    yup.string().required("Full name is required"),
  street:       yup.string().required("Street address is required"),
  city:         yup.string().required("City is required"),
  state:        yup.string().required("State is required"),
  postal_code:  yup.string().required("Postal code is required"),
  country:      yup.string().required("Country is required"),
};

const schema = yup.object({
  shipping_full_name:   addressSchema.full_name,
  shipping_street:      addressSchema.street,
  shipping_city:        addressSchema.city,
  shipping_state:       addressSchema.state,
  shipping_postal_code: addressSchema.postal_code,
  shipping_country:     addressSchema.country,
  buyer_notes:          yup.string(),
});

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const { data: cart } = useGetCartQuery();
  const [checkout,        { isLoading: checkingOut }] = useCheckoutMutation();
  const [confirmPayment,  { isLoading: confirming  }] = useConfirmPaymentMutation();
  const [validateCoupon]  = useValidateCouponMutation();

  const [couponCode,    setCouponCode]    = useState("");
  const [couponData,    setCouponData]    = useState(null);
  const [couponError,   setCouponError]   = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [serverError,   setServerError]   = useState("");
  const [sameBilling,   setSameBilling]   = useState(true);

  const {
    register, handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const items    = cart?.items    || [];
  const subtotal = Number(cart?.subtotal || 0);
  const discount = couponData ? Number(couponData.discount_amount) : 0;
  const total    = subtotal - discount;

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponError("");
    try {
      const res = await validateCoupon({ code: couponCode, subtotal }).unwrap();
      setCouponData(res);
      enqueueSnackbar(`Coupon applied! You save $${res.discount_amount}`, { variant: "success" });
    } catch (err) {
      setCouponError(err?.data?.error || "Invalid coupon code");
      setCouponData(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const onSubmit = async (data) => {
    setServerError("");
    try {
      // 1. Create order
      const checkoutRes = await checkout({
        shipping_full_name:   data.shipping_full_name,
        shipping_street:      data.shipping_street,
        shipping_city:        data.shipping_city,
        shipping_state:       data.shipping_state,
        shipping_postal_code: data.shipping_postal_code,
        shipping_country:     data.shipping_country,
        billing_same_as_shipping: sameBilling,
        coupon_code:  couponCode || "",
        buyer_notes:  data.buyer_notes || "",
      }).unwrap();

      const order    = checkoutRes.order;
      const piId     = checkoutRes.stripe_pi_id;

      // 2. Confirm payment (dev mode — real Stripe in production)
      await confirmPayment({
        order_id:           order.id,
        payment_intent_id:  piId,
      }).unwrap();

      navigate(`/order-success/${order.order_number}`, { replace: true });
      enqueueSnackbar("Order placed successfully! 🎉", { variant: "success" });

    } catch (err) {
      const msg = err?.data?.error || err?.data?.detail || "Checkout failed. Please try again.";
      setServerError(msg);
    }
  };

  if (items.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h5" gutterBottom>Your cart is empty</Typography>
        <Button variant="contained" onClick={() => navigate("/products")}>Browse Products</Button>
      </Container>
    );
  }

  const AddressFields = ({ prefix }) => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField label="Full name" fullWidth {...register(`${prefix}full_name`)} error={!!errors[`${prefix}full_name`]} helperText={errors[`${prefix}full_name`]?.message} />
      </Grid>
      <Grid item xs={12}>
        <TextField label="Street address" fullWidth {...register(`${prefix}street`)} error={!!errors[`${prefix}street`]} helperText={errors[`${prefix}street`]?.message} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField label="City" fullWidth {...register(`${prefix}city`)} error={!!errors[`${prefix}city`]} helperText={errors[`${prefix}city`]?.message} />
      </Grid>
      <Grid item xs={6} sm={3}>
        <TextField label="State" fullWidth {...register(`${prefix}state`)} error={!!errors[`${prefix}state`]} helperText={errors[`${prefix}state`]?.message} />
      </Grid>
      <Grid item xs={6} sm={3}>
        <TextField label="Postal code" fullWidth {...register(`${prefix}postal_code`)} error={!!errors[`${prefix}postal_code`]} helperText={errors[`${prefix}postal_code`]?.message} />
      </Grid>
      <Grid item xs={12}>
        <TextField label="Country" fullWidth defaultValue="US" {...register(`${prefix}country`)} error={!!errors[`${prefix}country`]} helperText={errors[`${prefix}country`]?.message} />
      </Grid>
    </Grid>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}>
        <LockIcon sx={{ color: "#10B981" }} />
        <Typography variant="h4" fontWeight={800}>Secure Checkout</Typography>
      </Box>

      <Grid container spacing={4}>

        {/* Left — form */}
        <Grid item xs={12} md={7}>
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ display: "flex", flexDirection: "column", gap: 3 }}
          >
            {serverError && <Alert severity="error">{serverError}</Alert>}

            {/* Shipping */}
            <GlassCard hover={false} sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
                <LocalShippingIcon sx={{ color: "#4318FF" }} />
                <Typography variant="h6" fontWeight={700}>Shipping Address</Typography>
              </Box>
              <AddressFields prefix="shipping_" />
            </GlassCard>

            {/* Billing */}
            <GlassCard hover={false} sx={{ p: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={sameBilling}
                    onChange={(e) => setSameBilling(e.target.checked)}
                    sx={{ color: "#4318FF", "&.Mui-checked": { color: "#4318FF" } }}
                  />
                }
                label={<Typography fontWeight={600}>Billing address same as shipping</Typography>}
              />
              {!sameBilling && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>Billing Address</Typography>
                  <AddressFields prefix="billing_" />
                </Box>
              )}
            </GlassCard>

            {/* Notes */}
            <GlassCard hover={false} sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>Order Notes (optional)</Typography>
              <TextField
                label="Any special instructions?"
                multiline rows={3} fullWidth
                {...register("buyer_notes")}
              />
            </GlassCard>

            <GradientButton
              type="submit"
              fullWidth
              size="large"
              disabled={checkingOut || confirming}
              sx={{ py: 2, fontSize: "1.05rem" }}
            >
              {checkingOut || confirming ? (
                <CircularProgress size={22} sx={{ color: "#fff" }} />
              ) : (
                <>
                  <LockIcon sx={{ mr: 1, fontSize: 18 }} />
                  Place Order — ${total.toFixed(2)}
                </>
              )}
            </GradientButton>
          </Box>
        </Grid>

        {/* Right — order summary */}
        <Grid item xs={12} md={5}>
          <GlassCard hover={false} sx={{ p: 3, position: "sticky", top: 88 }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>Order Summary</Typography>
            <Divider sx={{ mb: 2 }} />

            {/* Items */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 2.5 }}>
              {items.map((item) => (
                <Box key={item.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flex: 1, minWidth: 0 }}>
                    <Box
                      sx={{
                        width: 44, height: 44, borderRadius: "8px", flexShrink: 0,
                        background: item.primary_image
                          ? `url(${item.primary_image}) center/cover`
                          : "rgba(255,255,255,0.06)",
                      }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>{item.product_name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Qty: {item.quantity}
                        {item.variant_info && ` · ${item.variant_info}`}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" fontWeight={700} sx={{ ml: 1, flexShrink: 0 }}>
                    ${Number(item.line_total).toFixed(2)}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Coupon */}
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", mb: 1, display: "block" }}>
                Coupon Code
              </Typography>
              {couponData ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Chip
                    label={`${couponData.code} — Save $${couponData.discount_amount}`}
                    onDelete={() => { setCouponData(null); setCouponCode(""); }}
                    sx={{
                      background: "rgba(16,185,129,0.15)",
                      border: "1px solid rgba(16,185,129,0.3)",
                      color: "#10B981", fontWeight: 700,
                    }}
                  />
                </Box>
              ) : (
                <Box sx={{ display: "flex", gap: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Enter code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    error={!!couponError}
                    helperText={couponError}
                    sx={{ flex: 1 }}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleValidateCoupon}
                    disabled={validatingCoupon || !couponCode}
                    sx={{ borderColor: "rgba(255,255,255,0.2)", whiteSpace: "nowrap", fontWeight: 600 }}
                  >
                    {validatingCoupon ? "…" : "Apply"}
                  </Button>
                </Box>
              )}
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Totals */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, mb: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography color="text.secondary">Subtotal</Typography>
                <Typography fontWeight={600}>${subtotal.toFixed(2)}</Typography>
              </Box>
              {discount > 0 && (
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography color="text.secondary">Discount</Typography>
                  <Typography fontWeight={600} sx={{ color: "#10B981" }}>-${discount.toFixed(2)}</Typography>
                </Box>
              )}
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography color="text.secondary">Shipping</Typography>
                <Typography fontWeight={600}>Free</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography color="text.secondary">Tax</Typography>
                <Typography fontWeight={600}>$0.00</Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="h6" fontWeight={800}>Total</Typography>
              <Typography variant="h6" fontWeight={900} sx={{ color: "#4318FF" }}>
                ${total.toFixed(2)}
              </Typography>
            </Box>
          </GlassCard>
        </Grid>
      </Grid>
    </Container>
  );
}