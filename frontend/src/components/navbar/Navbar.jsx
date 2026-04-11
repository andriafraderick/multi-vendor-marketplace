// src/components/navbar/Navbar.jsx
import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  AppBar, Toolbar, Box, IconButton, Typography,
  Avatar, Menu, MenuItem, Badge, Tooltip,
  Button, Divider,
} from "@mui/material";
import MenuIcon              from "@mui/icons-material/Menu";
import ShoppingCartOutlined  from "@mui/icons-material/ShoppingCartOutlined";
import NotificationsOutlined from "@mui/icons-material/NotificationsOutlined";
import PersonOutlined        from "@mui/icons-material/PersonOutlined";
import LogoutOutlined        from "@mui/icons-material/LogoutOutlined";
import DashboardOutlined     from "@mui/icons-material/DashboardOutlined";
import SettingsOutlined      from "@mui/icons-material/SettingsOutlined";

import { useLogoutUserMutation }  from "@/store/api/authApi";
import { logout }                 from "@/store/slices/authSlice";
import { toggleCart }             from "@/store/slices/cartSlice";
import { toggleSidebar, toggleMobileSidebar } from "@/store/slices/uiSlice";
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectUserRole,
} from "@/store/slices/authSlice";
import { selectCartItemCount }    from "@/store/slices/cartSlice";

export default function Navbar({ isDashboard = false }) {
  const dispatch        = useDispatch();
  const navigate        = useNavigate();
  const [logoutUser]    = useLogoutUserMutation();

  const user            = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const role            = useSelector(selectUserRole);
  const cartCount       = useSelector(selectCartItemCount);

  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen  = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = ()  => setAnchorEl(null);

  const handleLogout = async () => {
    handleMenuClose();
    const refresh = localStorage.getItem("refreshToken");
    try { await logoutUser(refresh); } catch (_) {}
    dispatch(logout());
    navigate("/login");
  };

  const getDashboardPath = () =>
    role === "vendor" ? "/vendor" : role === "admin" ? "/admin" : "/";

  return (
    <AppBar position="fixed" sx={{ zIndex: 1100 }}>
      <Toolbar sx={{ gap: 1, minHeight: "70px !important" }}>

        {/* Sidebar toggle */}
        <IconButton
          onClick={() =>
            isDashboard
              ? dispatch(toggleSidebar())
              : dispatch(toggleMobileSidebar())
          }
          sx={{
            color: "rgba(255,255,255,0.7)",
            display: isDashboard ? "flex" : { xs: "flex", md: "none" },
            "&:hover": { color: "#fff", background: "rgba(255,255,255,0.08)" },
          }}
        >
          <MenuIcon />
        </IconButton>

        {/* Logo */}
        <Box
          component={RouterLink}
          to="/"
          sx={{
            display:        "flex",
            alignItems:     "center",
            gap:            1,
            textDecoration: "none",
            mr:             2,
          }}
        >
          <Box
            sx={{
              width:        34, height: 34,
              borderRadius: "10px",
              background:   "linear-gradient(135deg, #4318FF, #0075FF)",
              display:      "flex",
              alignItems:   "center",
              justifyContent: "center",
              fontWeight:   800,
              fontSize:     "0.9rem",
              color:        "#fff",
              boxShadow:    "0 4px 14px rgba(67,24,255,0.5)",
            }}
          >
            M
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight:  800,
              background:  "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              display:    { xs: "none", sm: "block" },
            }}
          >
            Marketplace
          </Typography>
        </Box>

        {/* Nav links (public) */}
        {!isDashboard && (
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 0.5, flex: 1 }}>
            {[
              { label: "Products", to: "/products" },
              { label: "Vendors",  to: "/vendors"  },
            ].map(({ label, to }) => (
              <Button
                key={to}
                component={RouterLink}
                to={to}
                sx={{
                  color:     "rgba(255,255,255,0.7)",
                  fontWeight: 500,
                  "&:hover": { color: "#fff", background: "rgba(255,255,255,0.06)" },
                }}
              >
                {label}
              </Button>
            ))}
          </Box>
        )}

        <Box sx={{ flex: 1 }} />

        {/* Cart icon (buyers only) */}
        {(!isDashboard || role === "buyer") && (
          <Tooltip title="Cart">
            <IconButton
              onClick={() => dispatch(toggleCart())}
              sx={{
                color: "rgba(255,255,255,0.7)",
                "&:hover": { color: "#fff", background: "rgba(255,255,255,0.08)" },
              }}
            >
              <Badge badgeContent={cartCount} color="primary">
                <ShoppingCartOutlined />
              </Badge>
            </IconButton>
          </Tooltip>
        )}

        {/* Notifications */}
        {isAuthenticated && (
          <Tooltip title="Notifications">
            <IconButton
              sx={{
                color: "rgba(255,255,255,0.7)",
                "&:hover": { color: "#fff", background: "rgba(255,255,255,0.08)" },
              }}
            >
              <Badge badgeContent={0} color="error">
                <NotificationsOutlined />
              </Badge>
            </IconButton>
          </Tooltip>
        )}

        {/* User avatar / login button */}
        {isAuthenticated ? (
          <>
            <Tooltip title="Account">
              <IconButton onClick={handleMenuOpen} sx={{ p: 0.5 }}>
                <Avatar
                  src={user?.avatar}
                  alt={user?.first_name}
                  sx={{
                    width:      36, height: 36,
                    background: "linear-gradient(135deg, #4318FF, #0075FF)",
                    fontSize:   "0.85rem",
                    fontWeight: 700,
                    cursor:     "pointer",
                    transition: "transform 200ms, box-shadow 200ms",
                    "&:hover": {
                      transform:  "scale(1.08)",
                      boxShadow:  "0 0 0 3px rgba(67,24,255,0.4)",
                    },
                  }}
                >
                  {user?.first_name?.[0]}
                </Avatar>
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={anchorEl}
              open={menuOpen}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              sx={{ mt: 1 }}
            >
              {/* User info header */}
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  {user?.first_name} {user?.last_name}
                </Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
                  {user?.email}
                </Typography>
              </Box>
              <Divider sx={{ my: 0.5 }} />

              <MenuItem
                onClick={() => { handleMenuClose(); navigate(getDashboardPath()); }}
                sx={{ gap: 1.5 }}
              >
                <DashboardOutlined fontSize="small" />
                Dashboard
              </MenuItem>

              <MenuItem
                onClick={() => { handleMenuClose(); navigate("/settings"); }}
                sx={{ gap: 1.5 }}
              >
                <SettingsOutlined fontSize="small" />
                Settings
              </MenuItem>

              <Divider sx={{ my: 0.5 }} />

              <MenuItem
                onClick={handleLogout}
                sx={{ gap: 1.5, color: "#F44336" }}
              >
                <LogoutOutlined fontSize="small" />
                Log out
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              component={RouterLink}
              to="/login"
              variant="outlined"
              size="small"
              sx={{ borderColor: "rgba(255,255,255,0.2)" }}
            >
              Login
            </Button>
            <Button
              component={RouterLink}
              to="/register"
              variant="contained"
              size="small"
            >
              Sign Up
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}