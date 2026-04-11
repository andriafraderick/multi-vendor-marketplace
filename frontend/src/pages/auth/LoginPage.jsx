// src/pages/auth/LoginPage.jsx
import { useState }        from "react";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { useDispatch }     from "react-redux";
import { useForm }         from "react-hook-form";
import { yupResolver }     from "@hookform/resolvers/yup";
import * as yup            from "yup";
import {
  Box, Typography, TextField, Button,
  InputAdornment, IconButton, Alert, Link, Divider,
} from "@mui/material";
import EmailOutlined    from "@mui/icons-material/EmailOutlined";
import LockOutlined     from "@mui/icons-material/LockOutlined";
import Visibility       from "@mui/icons-material/Visibility";
import VisibilityOff    from "@mui/icons-material/VisibilityOff";

import { useLoginUserMutation } from "@/store/api/authApi";
import { setCredentials }       from "@/store/slices/authSlice";
import GlassCard                from "@/components/ui/GlassCard";
import GradientButton           from "@/components/ui/GradientButton";

const schema = yup.object({
  email:    yup.string().email("Enter a valid email").required("Email is required"),
  password: yup.string().min(6, "Password is too short").required("Password is required"),
});

export default function LoginPage() {
  const dispatch      = useDispatch();
  const navigate      = useNavigate();
  const location      = useLocation();
  const from          = location.state?.from?.pathname || null;

  const [showPassword, setShowPassword] = useState(false);
  const [serverError,  setServerError]  = useState("");

  const [loginUser, { isLoading }] = useLoginUserMutation();

  const {
    register, handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    setServerError("");
    try {
      const res = await loginUser(data).unwrap();
      dispatch(setCredentials({ user: res.user, tokens: res.user.tokens }));

      // Redirect: back to where they came from, or role-based dashboard
      if (from) {
        navigate(from, { replace: true });
      } else {
        const role = res.user.role;
        if (role === "vendor") navigate("/vendor",  { replace: true });
        else if (role === "admin") navigate("/admin", { replace: true });
        else navigate("/", { replace: true });
      }
    } catch (err) {
      const msg =
        err?.data?.non_field_errors?.[0] ||
        err?.data?.detail ||
        "Login failed. Please check your credentials.";
      setServerError(msg);
    }
  };

  return (
    <Box sx={{ animation: "fadeInUp 0.5s ease" }}>
      <GlassCard hover={false} sx={{ p: { xs: 3, sm: 4 } }}>

        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Welcome back
          </Typography>
          <Typography color="text.secondary">
            Sign in to your account to continue
          </Typography>
        </Box>

        {serverError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {serverError}
          </Alert>
        )}

        {/* Form */}
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
        >
          <TextField
            label="Email address"
            type="email"
            fullWidth
            autoComplete="email"
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailOutlined sx={{ color: "rgba(255,255,255,0.3)", fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            fullWidth
            autoComplete="current-password"
            {...register("password")}
            error={!!errors.password}
            helperText={errors.password?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlined sx={{ color: "rgba(255,255,255,0.3)", fontSize: 18 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((v) => !v)}
                    edge="end"
                    size="small"
                  >
                    {showPassword
                      ? <VisibilityOff sx={{ fontSize: 18, color: "rgba(255,255,255,0.4)" }} />
                      : <Visibility   sx={{ fontSize: 18, color: "rgba(255,255,255,0.4)" }} />
                    }
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ textAlign: "right", mt: -1 }}>
            <Link
              component={RouterLink}
              to="/forgot-password"
              variant="body2"
              sx={{ color: "#4318FF", "&:hover": { color: "#6B4FFF" } }}
            >
              Forgot password?
            </Link>
          </Box>

          <GradientButton
            type="submit"
            fullWidth
            size="large"
            disabled={isLoading}
            sx={{ py: 1.5, mt: 0.5 }}
          >
            {isLoading ? "Signing in…" : "Sign In"}
          </GradientButton>
        </Box>

        <Divider sx={{ my: 3 }}>
          <Typography variant="caption" color="text.secondary">
            OR
          </Typography>
        </Divider>

        <Typography variant="body2" color="text.secondary" textAlign="center">
          Don't have an account?{" "}
          <Link
            component={RouterLink}
            to="/register"
            sx={{ color: "#4318FF", fontWeight: 600, "&:hover": { color: "#6B4FFF" } }}
          >
            Create one
          </Link>
        </Typography>
      </GlassCard>
    </Box>
  );
}