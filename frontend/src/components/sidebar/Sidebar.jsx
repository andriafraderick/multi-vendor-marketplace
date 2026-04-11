// src/components/sidebar/Sidebar.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Box, Typography, Avatar, Divider, Tooltip, IconButton } from "@mui/material";
import DashboardIcon    from "@mui/icons-material/DashboardOutlined";
import InventoryIcon    from "@mui/icons-material/Inventory2Outlined";
import ShoppingBagIcon  from "@mui/icons-material/ShoppingBagOutlined";
import AnalyticsIcon    from "@mui/icons-material/BarChartOutlined";
import StarIcon         from "@mui/icons-material/StarOutlined";
import PaymentIcon      from "@mui/icons-material/AccountBalanceWalletOutlined";
import SettingsIcon     from "@mui/icons-material/SettingsOutlined";
import PeopleIcon       from "@mui/icons-material/PeopleOutlined";
import StorefrontIcon   from "@mui/icons-material/StorefrontOutlined";
import RateReviewIcon   from "@mui/icons-material/RateReviewOutlined";
import ChevronLeftIcon  from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import { selectCurrentUser }        from "@/store/slices/authSlice";
import { selectSidebarOpen, toggleSidebar } from "@/store/slices/uiSlice";
import SidebarItem from "./SidebarItem";

const VENDOR_MENU = [
  { label: "Dashboard",  icon: <DashboardIcon />,   path: "/vendor" },
  { label: "Products",   icon: <InventoryIcon />,   path: "/vendor/products" },
  { label: "Orders",     icon: <ShoppingBagIcon />, path: "/vendor/orders" },
  { label: "Analytics",  icon: <AnalyticsIcon />,   path: "/vendor/analytics" },
  { label: "Reviews",    icon: <StarIcon />,         path: "/vendor/reviews" },
  { label: "Payouts",    icon: <PaymentIcon />,      path: "/vendor/payouts" },
  { label: "Settings",   icon: <SettingsIcon />,     path: "/vendor/settings" },
];

const ADMIN_MENU = [
  { label: "Dashboard",  icon: <DashboardIcon />,   path: "/admin" },
  { label: "Vendors",    icon: <StorefrontIcon />,  path: "/admin/vendors" },
  { label: "Products",   icon: <InventoryIcon />,   path: "/admin/products" },
  { label: "Orders",     icon: <ShoppingBagIcon />, path: "/admin/orders" },
  { label: "Reviews",    icon: <RateReviewIcon />,  path: "/admin/reviews" },
  { label: "Users",      icon: <PeopleIcon />,      path: "/admin/users" },
  { label: "Settings",   icon: <SettingsIcon />,    path: "/admin/settings" },
];

export default function Sidebar({ role }) {
  const dispatch  = useDispatch();
  const location  = useLocation();
  const user      = useSelector(selectCurrentUser);
  const isOpen    = useSelector(selectSidebarOpen);
  const menuItems = role === "admin" ? ADMIN_MENU : VENDOR_MENU;

  return (
    <Box
      sx={{
        height:         "100vh",
        position:       "fixed",
        top:            0,
        left:           0,
        width:          isOpen ? 260 : 72,
        display:        "flex",
        flexDirection:  "column",
        background:     "rgba(15, 12, 41, 0.97)",
        backdropFilter: "blur(20px)",
        borderRight:    "1px solid rgba(255,255,255,0.08)",
        transition:     "width 300ms cubic-bezier(0.4,0,0.2,1)",
        overflow:       "hidden",
        zIndex:         1100,
      }}
    >
      {/* Logo area */}
      <Box
        sx={{
          display:    "flex",
          alignItems: "center",
          gap:        1.5,
          p:          2.5,
          minHeight:  70,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Box
          sx={{
            minWidth:       36, height: 36,
            borderRadius:   "10px",
            background:     "linear-gradient(135deg, #4318FF, #0075FF)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            fontWeight:     800,
            fontSize:       "0.9rem",
            color:          "#fff",
            boxShadow:      "0 4px 14px rgba(67,24,255,0.5)",
            flexShrink:     0,
          }}
        >
          M
        </Box>
        {isOpen && (
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{
              background: "linear-gradient(135deg, #fff, rgba(255,255,255,0.7))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor:  "transparent",
              whiteSpace: "nowrap",
              overflow:   "hidden",
            }}
          >
            Marketplace
          </Typography>
        )}
      </Box>

      {/* Nav items */}
      <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", py: 1.5, px: 1 }}>
        {menuItems.map((item) => (
          <SidebarItem
            key={item.path}
            {...item}
            isActive={
              item.path === "/vendor" || item.path === "/admin"
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path)
            }
            collapsed={!isOpen}
          />
        ))}
      </Box>

      {/* User info at bottom */}
      <Box
        sx={{
          p:          isOpen ? 2 : 1,
          borderTop:  "1px solid rgba(255,255,255,0.06)",
          display:    "flex",
          alignItems: "center",
          gap:        1.5,
        }}
      >
        <Avatar
          src={user?.avatar}
          sx={{
            width:      36, height: 36,
            flexShrink: 0,
            background: "linear-gradient(135deg, #4318FF, #0075FF)",
            fontSize:   "0.8rem",
            fontWeight: 700,
          }}
        >
          {user?.first_name?.[0]}
        </Avatar>
        {isOpen && (
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {user?.first_name} {user?.last_name}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "rgba(255,255,255,0.4)", textTransform: "capitalize" }}
            >
              {role}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Collapse toggle */}
      <Box
        sx={{
          display:    "flex",
          justifyContent: isOpen ? "flex-end" : "center",
          p:          1,
          borderTop:  "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Tooltip title={isOpen ? "Collapse" : "Expand"} placement="right">
          <IconButton
            onClick={() => dispatch(toggleSidebar())}
            size="small"
            sx={{
              color:      "rgba(255,255,255,0.4)",
              background: "rgba(255,255,255,0.05)",
              "&:hover":  {
                color:      "#fff",
                background: "rgba(255,255,255,0.1)",
              },
            }}
          >
            {isOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}