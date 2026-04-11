// src/components/ui/LoadingSpinner.jsx
import { Box, CircularProgress, Typography } from "@mui/material";

export default function LoadingSpinner({ message = "Loading...", fullPage = false }) {
  return (
    <Box
      sx={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        gap:            2,
        ...(fullPage && { minHeight: "60vh" }),
      }}
    >
      <CircularProgress
        sx={{
          color: "#4318FF",
          filter: "drop-shadow(0 0 12px rgba(67,24,255,0.6))",
        }}
        size={44}
        thickness={4}
      />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );
}