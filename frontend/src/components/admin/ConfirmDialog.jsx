// src/components/admin/ConfirmDialog.jsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  CircularProgress,
  Box,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title        = "Are you sure?",
  description  = "This action cannot be undone.",
  confirmLabel = "Confirm",
  confirmColor = "#F44336",
  isLoading    = false,
  children,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          background:     "rgba(15,12,41,0.97)",
          backdropFilter: "blur(20px)",
          border:         "1px solid rgba(255,255,255,0.12)",
          borderRadius:   "20px",
        },
      }}
    >
      <DialogTitle sx={{ textAlign: "center", pt: 4 }}>
        <Box
          sx={{
            width:          64,
            height:         64,
            borderRadius:   "50%",
            background:     "rgba(244,67,54,0.12)",
            border:         "1px solid rgba(244,67,54,0.3)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            mx:             "auto",
            mb:             2,
          }}
        >
          <WarningAmberIcon sx={{ fontSize: 32, color: "#F44336" }} />
        </Box>
        <Typography variant="h6" fontWeight={800}>
          {title}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ textAlign: "center", pb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
        {children}
      </DialogContent>

      <DialogActions
        sx={{ p: 3, gap: 1.5, justifyContent: "center" }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={isLoading}
          sx={{
            borderColor:  "rgba(255,255,255,0.15)",
            borderRadius: "10px",
            minWidth:     100,
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={isLoading}
          sx={{
            background:   confirmColor,
            borderRadius: "10px",
            fontWeight:   700,
            minWidth:     100,
            "&:hover":    {
              background: confirmColor,
              filter:     "brightness(1.1)",
            },
          }}
        >
          {isLoading ? (
            <CircularProgress size={18} sx={{ color: "#fff" }} />
          ) : (
            confirmLabel
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}