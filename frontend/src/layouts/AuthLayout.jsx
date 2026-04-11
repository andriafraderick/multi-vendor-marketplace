// src/layouts/AuthLayout.jsx
import { Outlet, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Box } from "@mui/material";
import {
  selectIsAuthenticated,
  selectUserRole,
} from "@/store/slices/authSlice";

export default function AuthLayout() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const role            = useSelector(selectUserRole);

  // Already logged in — redirect to appropriate dashboard
  if (isAuthenticated) {
    if (role === "vendor") return <Navigate to="/vendor" replace />;
    if (role === "admin")  return <Navigate to="/admin"  replace />;
    return <Navigate to="/" replace />;
  }

  return (
    <Box
      sx={{
        minHeight:       "100vh",
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        background:
          "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
        position: "relative",
        overflow: "hidden",
        p: 2,
      }}
    >
      {/* Decorative blobs */}
      <Box
        sx={{
          position: "absolute", top: "-20%", left: "-10%",
          width: "50vw", height: "50vw",
          background: "radial-gradient(circle, rgba(67,24,255,0.15) 0%, transparent 70%)",
          borderRadius: "50%", pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute", bottom: "-20%", right: "-10%",
          width: "45vw", height: "45vw",
          background: "radial-gradient(circle, rgba(0,117,255,0.12) 0%, transparent 70%)",
          borderRadius: "50%", pointerEvents: "none",
        }}
      />

      {/* Page content */}
      <Box sx={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 480 }}>
        <Outlet />
      </Box>
    </Box>
  );
}