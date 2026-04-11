// src/pages/vendor/VendorReviewsPage.jsx
import { useState } from "react";
import {
  Box, Typography, TextField, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, CircularProgress, Chip,
} from "@mui/material";
import ReplyIcon from "@mui/icons-material/ReplyOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { useSnackbar } from "notistack";
import { useGetVendorReviewsQuery, useRespondToReviewMutation } from "@/store/api/reviewApi";
import GlassCard      from "@/components/ui/GlassCard";
import StarRating     from "@/components/ui/StarRating";
import EmptyState     from "@/components/ui/EmptyState";
import GradientButton from "@/components/ui/GradientButton";

export default function VendorReviewsPage() {
  const { enqueueSnackbar }           = useSnackbar();
  const [responded, setResponded]     = useState("");
  const [responseDialog, setResponseDialog] = useState(null);
  const [responseText, setResponseText]     = useState("");

  const { data, isLoading } = useGetVendorReviewsQuery({ responded: responded || undefined });
  const [respondToReview, { isLoading: responding }] = useRespondToReviewMutation();

  const reviews = data?.results || [];

  const openResponseDialog = (review) => {
    setResponseDialog(review);
    setResponseText(review.vendor_response || "");
  };

  const handleRespond = async () => {
    if (!responseDialog || responseText.trim().length < 10) {
      enqueueSnackbar("Response must be at least 10 characters.", { variant: "warning" });
      return;
    }
    try {
      await respondToReview({ reviewId: responseDialog.id, response: responseText }).unwrap();
      enqueueSnackbar("Response published!", { variant: "success" });
      setResponseDialog(null);
    } catch {
      enqueueSnackbar("Failed to submit response.", { variant: "error" });
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>Customer Reviews</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Respond to feedback to build trust with buyers
        </Typography>
      </Box>

      {/* Filter */}
      <Box sx={{ display: "flex", gap: 1.5, mb: 3 }}>
        {[
          { value: "",      label: "All Reviews"    },
          { value: "false", label: "Needs Response" },
          { value: "true",  label: "Responded"      },
        ].map(({ value, label }) => (
          <Chip
            key={value}
            label={label}
            onClick={() => setResponded(value)}
            sx={{
              cursor: "pointer",
              background: responded === value ? "rgba(67,24,255,0.2)" : "rgba(255,255,255,0.06)",
              border: responded === value ? "1px solid rgba(67,24,255,0.5)" : "1px solid rgba(255,255,255,0.1)",
              color: responded === value ? "#fff" : "rgba(255,255,255,0.65)",
              fontWeight: responded === value ? 700 : 400,
              transition: "all 200ms",
            }}
          />
        ))}
      </Box>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress sx={{ color: "#4318FF" }} />
        </Box>
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={<StarBorderIcon sx={{ fontSize: 72 }} />}
          title="No reviews yet"
          description="Customer reviews will appear here once buyers rate your products."
        />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {reviews.map((review) => (
            <GlassCard key={review.id} hover={false} sx={{ p: 3 }}>
              {/* Reviewer info + rating */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                  <Avatar
                    src={review.buyer_avatar}
                    sx={{
                      width: 40, height: 40,
                      background: "linear-gradient(135deg, #4318FF, #0075FF)",
                      fontWeight: 700,
                    }}
                  >
                    {review.buyer_name?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>{review.buyer_name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(review.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <StarRating rating={review.rating} showNumber />
                  {review.is_verified_purchase && (
                    <Chip
                      label="Verified"
                      size="small"
                      sx={{
                        background: "rgba(16,185,129,0.15)",
                        border: "1px solid rgba(16,185,129,0.3)",
                        color: "#10B981", fontWeight: 700, height: 20, fontSize: "0.65rem",
                      }}
                    />
                  )}
                </Box>
              </Box>

              {/* Review content */}
              {review.title && (
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>{review.title}</Typography>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8, mb: 2 }}>
                {review.body}
              </Typography>

              {/* Existing vendor response */}
              {review.vendor_response && (
                <Box
                  sx={{
                    mb: 2, p: 2, borderRadius: "10px",
                    background: "rgba(67,24,255,0.08)",
                    border: "1px solid rgba(67,24,255,0.2)",
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#4318FF", fontWeight: 700, display: "block", mb: 0.5 }}>
                    Your Response
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {review.vendor_response}
                  </Typography>
                </Box>
              )}

              {/* Reply button */}
              <Button
                size="small"
                startIcon={<ReplyIcon />}
                onClick={() => openResponseDialog(review)}
                sx={{
                  color: "#4318FF",
                  background: "rgba(67,24,255,0.08)",
                  border: "1px solid rgba(67,24,255,0.2)",
                  borderRadius: "10px",
                  fontWeight: 600,
                  "&:hover": { background: "rgba(67,24,255,0.16)" },
                }}
              >
                {review.vendor_response ? "Edit Response" : "Reply to Review"}
              </Button>
            </GlassCard>
          ))}
        </Box>
      )}

      {/* Response dialog */}
      <Dialog
        open={!!responseDialog}
        onClose={() => setResponseDialog(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: "rgba(15,12,41,0.98)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "20px",
          },
        }}
      >
        <DialogTitle fontWeight={800}>Respond to Review</DialogTitle>
        <DialogContent>
          {responseDialog && (
            <Box sx={{ mb: 2, p: 2, borderRadius: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <StarRating rating={responseDialog.rating} size="small" showNumber />
                <Typography variant="caption" color="text.secondary">— {responseDialog.buyer_name}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">{responseDialog.body}</Typography>
            </Box>
          )}
          <TextField
            label="Your response"
            multiline
            rows={4}
            fullWidth
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Thank the customer and address their feedback professionally…"
            helperText={`${responseText.length} / 2000 characters (min 10)`}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1.5 }}>
          <Button
            onClick={() => setResponseDialog(null)}
            variant="outlined"
            sx={{ borderColor: "rgba(255,255,255,0.15)", borderRadius: "12px" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRespond}
            variant="contained"
            disabled={responding || responseText.trim().length < 10}
            sx={{ background: "linear-gradient(135deg, #4318FF, #0075FF)", borderRadius: "12px", fontWeight: 700 }}
          >
            {responding ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Publish Response"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}