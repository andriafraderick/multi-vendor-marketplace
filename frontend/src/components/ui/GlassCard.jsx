// src/components/ui/GlassCard.jsx
import { Box } from "@mui/material";

/**
 * Reusable glassmorphism card component.
 * Props:
 *   hover   — enables lift on hover (default true)
 *   active  — enables scale on click (default false)
 *   glow    — adds blue glow on hover (default false)
 *   sx      — extra MUI sx styles
 */
export default function GlassCard({
  children,
  hover  = true,
  active = false,
  glow   = false,
  sx     = {},
  onClick,
  ...props
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        background:     "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border:         "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius:   "16px",
        transition:
          "transform 250ms cubic-bezier(0.4,0,0.2,1), box-shadow 250ms, border-color 250ms",

        ...(hover && {
          cursor: "pointer",
          "&:hover": {
            transform:   "translateY(-4px)",
            boxShadow:   glow
              ? "0 16px 48px rgba(67, 24, 255, 0.35)"
              : "0 12px 32px rgba(0,0,0,0.4)",
            borderColor: glow
              ? "rgba(67, 24, 255, 0.4)"
              : "rgba(255,255,255,0.2)",
          },
        }),

        ...(active && {
          "&:active": {
            transform: "scale(1.02)",
            zIndex:    10,
            position:  "relative",
          },
        }),

        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
}