// src/components/sidebar/SidebarItem.jsx
import { useNavigate } from "react-router-dom";
import { Box, Typography, Tooltip } from "@mui/material";

export default function SidebarItem({ label, icon, path, isActive, collapsed }) {
  const navigate = useNavigate();

  return (
    <Tooltip title={collapsed ? label : ""} placement="right">
      <Box
        onClick={() => navigate(path)}
        sx={{
          display:      "flex",
          alignItems:   "center",
          gap:          1.5,
          px:           collapsed ? 1.5 : 1.5,
          py:           1,
          mb:           0.5,
          borderRadius: "10px",
          cursor:       "pointer",
          position:     "relative",
          overflow:     "hidden",
          transition:   "background 200ms, transform 150ms",

          // Active state
          background: isActive
            ? "linear-gradient(135deg, rgba(67,24,255,0.25) 0%, rgba(0,117,255,0.15) 100%)"
            : "transparent",
          border: isActive
            ? "1px solid rgba(67,24,255,0.35)"
            : "1px solid transparent",

          "&:hover": {
            background: isActive
              ? "linear-gradient(135deg, rgba(67,24,255,0.30) 0%, rgba(0,117,255,0.20) 100%)"
              : "rgba(255,255,255,0.06)",
            transform:  "translateX(2px)",
          },

          // Active glow left bar
          "&::before": isActive
            ? {
                content:      '""',
                position:     "absolute",
                left:         0, top: "20%", bottom: "20%",
                width:        3,
                borderRadius: "0 4px 4px 0",
                background:   "linear-gradient(180deg, #4318FF, #0075FF)",
              }
            : {},
        }}
      >
        {/* Icon */}
        <Box
          sx={{
            display:     "flex",
            alignItems:  "center",
            justifyContent: "center",
            color:       isActive ? "#4318FF" : "rgba(255,255,255,0.5)",
            transition:  "color 200ms",
            minWidth:    24,
            "& svg":     { fontSize: 20 },
          }}
        >
          {icon}
        </Box>

        {/* Label */}
        {!collapsed && (
          <Typography
            variant="body2"
            fontWeight={isActive ? 700 : 500}
            sx={{
              color:      isActive ? "#fff" : "rgba(255,255,255,0.65)",
              transition: "color 200ms",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
}