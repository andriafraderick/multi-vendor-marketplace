// src/routes/index.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { Box, CircularProgress, Button, Typography } from "@mui/material";
import { useSelector } from "react-redux";

import ProtectedRoute  from "./ProtectedRoute.jsx";
import RoleRoute       from "./RoleRoute.jsx";
import MainLayout      from "../layouts/MainLayout.jsx";
import DashboardLayout from "../layouts/DashboardLayout.jsx";
import AuthLayout      from "../layouts/AuthLayout.jsx";

// Auth
import LoginPage    from "../pages/auth/LoginPage.jsx";
import RegisterPage from "../pages/auth/RegisterPage.jsx";

// Buyer
import HomePage         from "../pages/buyer/HomePage.jsx";
import ProductsPage     from "../pages/buyer/ProductsPage.jsx";
import ProductDetailPage from "../pages/buyer/ProductDetailPage.jsx";
import VendorsPage      from "../pages/buyer/VendorsPage.jsx";
import VendorStorePage  from "../pages/buyer/VendorStorePage.jsx";
import CartPage         from "../pages/buyer/CartPage.jsx";
import CheckoutPage     from "../pages/buyer/CheckoutPage.jsx";
import OrderSuccessPage from "../pages/buyer/OrderSuccessPage.jsx";
import OrderHistoryPage from "../pages/buyer/OrderHistoryPage.jsx";

// Vendor
import VendorDashboardPage from "../pages/vendor/VendorDashboardPage.jsx";
import VendorProductsPage  from "../pages/vendor/VendorProductsPage.jsx";
import VendorOrdersPage    from "../pages/vendor/VendorOrdersPage.jsx";
import VendorAnalyticsPage from "../pages/vendor/VendorAnalyticsPage.jsx";
import VendorReviewsPage   from "../pages/vendor/VendorReviewsPage.jsx";
import VendorPayoutsPage   from "../pages/vendor/VendorPayoutsPage.jsx";
import VendorSettingsPage  from "../pages/vendor/VendorSettingsPage.jsx";

// Admin
import AdminDashboardPage from "../pages/admin/AdminDashboardPage.jsx";
import AdminVendorsPage   from "../pages/admin/AdminVendorsPage.jsx";
import AdminProductsPage  from "../pages/admin/AdminProductsPage.jsx";
import AdminOrdersPage    from "../pages/admin/AdminOrdersPage.jsx";
import AdminReviewsPage   from "../pages/admin/AdminReviewsPage.jsx";
import AdminUsersPage     from "../pages/admin/AdminUsersPage.jsx";
import AdminSettingsPage  from "../pages/admin/AdminSettingsPage.jsx";

function PageLoader() {
  return (
    <Box sx={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
    }}>
      <CircularProgress sx={{ color: "#4318FF" }} size={48} />
    </Box>
  );
}

function UnauthorizedPage() {
  return (
    <Box sx={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "100vh", gap: 2,
      background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
      color: "#fff",
    }}>
      <Typography variant="h1" sx={{ fontSize: "6rem", fontWeight: 900, color: "#4318FF" }}>403</Typography>
      <Typography variant="h5" fontWeight={700}>Access Denied</Typography>
      <Typography color="text.secondary">You don't have permission to view this page.</Typography>
      <Button variant="outlined" onClick={() => window.history.back()}
        sx={{ borderColor: "rgba(255,255,255,0.2)", borderRadius: "12px" }}>
        Go Back
      </Button>
    </Box>
  );
}

function NotFoundPage() {
  return (
    <Box sx={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", minHeight: "100vh", gap: 2,
      background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
      color: "#fff",
    }}>
      <Typography variant="h1" sx={{ fontSize: "6rem", fontWeight: 900, color: "#4318FF" }}>404</Typography>
      <Typography variant="h5" fontWeight={700}>Page Not Found</Typography>
      <Button variant="contained" href="/"
        sx={{ background: "linear-gradient(135deg, #4318FF, #0075FF)", borderRadius: "12px" }}>
        Go Home
      </Button>
    </Box>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Auth */}
      <Route element={<AuthLayout />}>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Public */}
      <Route element={<MainLayout />}>
        <Route index                              element={<HomePage />} />
        <Route path="/products"                   element={<ProductsPage />} />
        <Route path="/products/:slug"             element={<ProductDetailPage />} />
        <Route path="/vendors"                    element={<VendorsPage />} />
        <Route path="/vendors/:slug"              element={<VendorStorePage />} />
        <Route path="/cart"                       element={<CartPage />} />
        <Route path="/checkout"
          element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="/order-success/:orderNumber"
          element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>} />
        <Route path="/my-orders"
          element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>} />
      </Route>

      {/* Vendor */}
      <Route path="/vendor"
        element={<RoleRoute allowedRoles={["vendor"]}><DashboardLayout role="vendor" /></RoleRoute>}>
        <Route index            element={<VendorDashboardPage />} />
        <Route path="products"  element={<VendorProductsPage />} />
        <Route path="orders"    element={<VendorOrdersPage />} />
        <Route path="analytics" element={<VendorAnalyticsPage />} />
        <Route path="reviews"   element={<VendorReviewsPage />} />
        <Route path="payouts"   element={<VendorPayoutsPage />} />
        <Route path="settings"  element={<VendorSettingsPage />} />
      </Route>

      {/* Admin */}
      <Route path="/admin"
        element={<RoleRoute allowedRoles={["admin"]}><DashboardLayout role="admin" /></RoleRoute>}>
        <Route index            element={<AdminDashboardPage />} />
        <Route path="vendors"   element={<AdminVendorsPage />} />
        <Route path="products"  element={<AdminProductsPage />} />
        <Route path="orders"    element={<AdminOrdersPage />} />
        <Route path="reviews"   element={<AdminReviewsPage />} />
        <Route path="users"     element={<AdminUsersPage />} />
        <Route path="settings"  element={<AdminSettingsPage />} />
      </Route>

      {/* Fallbacks */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*"             element={<NotFoundPage />} />
    </Routes>
  );
}