// src/components/ui/EmptyState.jsx
import { Box, Typography, Button } from "@mui/material";

export default function EmptyState({
  icon,
  title       = "Nothing here",
  description = "",
  actionLabel,
  onAction,
  sx          = {},
}) {
  return (
    <Box
      sx={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        textAlign:      "center",
        py:             10,
        px:             4,
        ...sx,
      }}
    >
      {icon && (
        <Box sx={{ mb: 2, color: "rgba(255,255,255,0.12)", fontSize: 72 }}>
          {icon}
        </Box>
      )}
      <Typography variant="h6" fontWeight={700} gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 360, lineHeight: 1.7 }}
        >
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button
          variant="contained"
          onClick={onAction}
          sx={{
            mt:         3,
            background: "linear-gradient(135deg, #4318FF, #0075FF)",
            borderRadius: "12px",
            fontWeight: 700,
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}