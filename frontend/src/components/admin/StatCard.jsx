// src/components/admin/StatCard.jsx
import { Box, Typography, Skeleton } from "@mui/material";
import GlassCard from "@/components/ui/GlassCard";

export default function StatCard({
  icon,
  label,
  value,
  sub,
  color     = "#4318FF",
  trend,
  isLoading = false,
}) {
  return (
    <GlassCard
      hover={false}
      sx={{
        p: 3,
        transition: "transform 250ms, box-shadow 250ms, border-color 250ms",
        "&:hover": {
          transform:   "translateY(-4px)",
          boxShadow:   `0 16px 40px ${color}28`,
          borderColor: `${color}38`,
        },
      }}
    >
      <Box
        sx={{
          display:        "flex",
          justifyContent: "space-between",
          alignItems:     "flex-start",
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{
              color:         "rgba(255,255,255,0.45)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontWeight:    700,
              display:       "block",
              mb:            0.5,
            }}
          >
            {label}
          </Typography>

          {isLoading ? (
            <Skeleton
              variant="text"
              width={120}
              height={48}
              sx={{ bgcolor: "rgba(255,255,255,0.06)" }}
            />
          ) : (
            <Typography
              variant="h4"
              fontWeight={900}
              sx={{ lineHeight: 1.15 }}
            >
              {value}
            </Typography>
          )}

          {sub && !isLoading && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: "block" }}
            >
              {sub}
            </Typography>
          )}

          {trend !== undefined && !isLoading && (
            <Typography
              variant="caption"
              sx={{
                color:      trend >= 0 ? "#10B981" : "#F44336",
                fontWeight: 700,
                display:    "block",
                mt:         0.5,
              }}
            >
              {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}% vs last month
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            width:          52,
            height:         52,
            borderRadius:   "16px",
            background:     `linear-gradient(135deg, ${color}28, ${color}15)`,
            border:         `1px solid ${color}32`,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            color,
            flexShrink:     0,
            ml:             2,
            "& svg":        { fontSize: 24 },
          }}
        >
          {icon}
        </Box>
      </Box>
    </GlassCard>
  );
}