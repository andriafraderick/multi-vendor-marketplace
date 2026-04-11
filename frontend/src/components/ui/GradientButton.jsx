// src/components/ui/GradientButton.jsx
import { Button } from "@mui/material";

/**
 * Pre-styled gradient button.
 * variant: "primary" (blue) | "purple" (purple-pink) | "outline"
 */
export default function GradientButton({
  children,
  variant = "primary",
  sx = {},
  ...props
}) {
  const gradients = {
    primary: {
      background: "linear-gradient(135deg, #4318FF 0%, #0075FF 100%)",
      boxShadow:  "0 4px 20px rgba(67, 24, 255, 0.4)",
      "&:hover": {
        background: "linear-gradient(135deg, #5B2FFF 0%, #1A8AFF 100%)",
        boxShadow:  "0 8px 30px rgba(67, 24, 255, 0.55)",
        transform:  "translateY(-2px)",
      },
    },
    purple: {
      background: "linear-gradient(135deg, #7B2FF7 0%, #F72585 100%)",
      boxShadow:  "0 4px 20px rgba(123, 47, 247, 0.4)",
      "&:hover": {
        boxShadow: "0 8px 30px rgba(123, 47, 247, 0.55)",
        transform: "translateY(-2px)",
      },
    },
    outline: {
      background:  "rgba(255,255,255,0.05)",
      border:      "1px solid rgba(255,255,255,0.2)",
      backdropFilter: "blur(10px)",
      "&:hover": {
        background:  "rgba(255,255,255,0.09)",
        borderColor: "rgba(67,24,255,0.6)",
        transform:   "translateY(-2px)",
      },
    },
  };

  return (
    <Button
      disableElevation
      sx={{
        borderRadius: "12px",
        fontWeight:   700,
        textTransform: "none",
        color:        "#fff",
        transition:   "transform 150ms, box-shadow 150ms, background 200ms",
        "&:active":   { transform: "scale(0.97)" },
        ...gradients[variant],
        ...sx,
      }}
      {...props}
    >
      {children}
    </Button>
  );
}