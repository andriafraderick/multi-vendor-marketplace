// src/pages/auth/RegisterPage.jsx
import { useState }  from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useForm }   from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup      from "yup";
import {
  Box, Typography, TextField, Alert,
  Link, Divider, ToggleButtonGroup, ToggleButton,
} from "@mui/material";
import PersonOutlined   from "@mui/icons-material/PersonOutlined";
import StorefrontOutlined from "@mui/icons-material/StorefrontOutlined";

import {
  useRegisterBuyerMutation,
  useRegisterVendorMutation,
} from "@/store/api/authApi";
import { setCredentials }   from "@/store/slices/authSlice";
import GlassCard            from "@/components/ui/GlassCard";
import GradientButton       from "@/components/ui/GradientButton";

const buyerSchema = yup.object({
  first_name: yup.string().required("First name is required"),
  last_name:  yup.string().required("Last name is required"),
  email:      yup.string().email("Enter a valid email").required("Email is required"),
  password:   yup.string().min(8, "Minimum 8 characters").required("Password is required"),
  password2:  yup.string()
    .oneOf([yup.ref("password")], "Passwords do not match")
    .required("Please confirm your password"),
});

const vendorSchema = buyerSchema.concat(
  yup.object({
    store_name:  yup.string().min(3, "Store name must be at least 3 characters").required("Store name is required"),
    description: yup.string(),
  })
);

export default function RegisterPage() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const [role, setRole]         = useState("buyer");
  const [serverError, setServerError] = useState("");

  const [registerBuyer,  { isLoading: buyerLoading  }] = useRegisterBuyerMutation();
  const [registerVendor, { isLoading: vendorLoading }] = useRegisterVendorMutation();
  const isLoading = buyerLoading || vendorLoading;

  const schema = role === "vendor" ? vendorSchema : buyerSchema;

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(schema),
  });

  const handleRoleChange = (_, newRole) => {
    if (newRole) { setRole(newRole); reset(); setServerError(""); }
  };

  const onSubmit = async (data) => {
    setServerError("");
    try {
      const payload = { ...data, role };
      const fn      = role === "vendor" ? registerVendor : registerBuyer;
      const res     = await fn(payload).unwrap();
      dispatch(setCredentials({ user: res.user, tokens: res.user.tokens }));
      navigate(role === "vendor" ? "/vendor" : "/", { replace: true });
    } catch (err) {
      const firstError = Object.values(err?.data || {})[0];
      setServerError(
        Array.isArray(firstError)
          ? firstError[0]
          : typeof firstError === "string"
            ? firstError
            : "Registration failed. Please try again."
      );
    }
  };

  const field = (name, label, extra = {}) => (
    <TextField
      label={label}
      fullWidth
      {...register(name)}
      error={!!errors[name]}
      helperText={errors[name]?.message}
      {...extra}
    />
  );

  return (
    <Box sx={{ animation: "fadeInUp 0.5s ease" }}>
      <GlassCard hover={false} sx={{ p: { xs: 3, sm: 4 } }}>

        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Create account
          </Typography>
          <Typography color="text.secondary">
            Join the marketplace today
          </Typography>
        </Box>

        {/* Role selector */}
        <ToggleButtonGroup
          value={role}
          exclusive
          onChange={handleRoleChange}
          fullWidth
          sx={{ mb: 3 }}
        >
          {[
            { value: "buyer",  label: "I'm a Buyer",  icon: <PersonOutlined /> },
            { value: "vendor", label: "I'm a Seller", icon: <StorefrontOutlined /> },
          ].map(({ value, label, icon }) => (
            <ToggleButton
              key={value}
              value={value}
              sx={{
                py: 1.5, gap: 1,
                borderRadius: "10px !important",
                border: "1px solid rgba(255,255,255,0.12) !important",
                fontWeight: 600,
                color: "rgba(255,255,255,0.5)",
                transition: "all 200ms",
                "&.Mui-selected": {
                  background: "linear-gradient(135deg, rgba(67,24,255,0.25), rgba(0,117,255,0.15))",
                  borderColor: "rgba(67,24,255,0.5) !important",
                  color: "#fff",
                },
              }}
            >
              {icon} {label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        {serverError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {serverError}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <Box sx={{ display: "flex", gap: 2 }}>
            {field("first_name", "First name")}
            {field("last_name",  "Last name")}
          </Box>
          {field("email",    "Email address", { type: "email" })}
          {field("password", "Password",      { type: "password" })}
          {field("password2","Confirm password", { type: "password" })}

          {role === "vendor" && (
            <>
              <Divider>
                <Typography variant="caption" color="text.secondary">
                  Store Info
                </Typography>
              </Divider>
              {field("store_name",  "Store name")}
              {field("description", "Store description (optional)", {
                multiline: true, rows: 2,
              })}
            </>
          )}

          <GradientButton
            type="submit"
            fullWidth
            size="large"
            disabled={isLoading}
            sx={{ py: 1.5, mt: 1 }}
          >
            {isLoading ? "Creating account…" : "Create Account"}
          </GradientButton>
        </Box>

        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 3 }}>
          Already have an account?{" "}
          <Link
            component={RouterLink}
            to="/login"
            sx={{ color: "#4318FF", fontWeight: 600, "&:hover": { color: "#6B4FFF" } }}
          >
            Sign in
          </Link>
        </Typography>
      </GlassCard>
    </Box>
  );
}