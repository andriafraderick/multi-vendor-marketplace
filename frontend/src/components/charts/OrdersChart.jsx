// src/components/charts/OrderStatusChart.jsx
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { Box, Typography, Skeleton } from "@mui/material";
import GlassCard from "@/components/ui/GlassCard";

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = ["#4318FF", "#0075FF", "#10B981", "#F59E0B", "#F44336", "#7B2FF7"];

export default function OrderStatusChart({ vendorOrders = [], isLoading = false }) {
  const statusCounts = vendorOrders.reduce((acc, order) => {
    const s = order.status || "pending";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const counts = Object.keys(statusCounts).length > 0
    ? statusCounts
    : { pending: 8, processing: 5, shipped: 12, delivered: 30, cancelled: 3 };

  const labels = Object.keys(counts).map(
    (s) => s.charAt(0).toUpperCase() + s.slice(1)
  );
  const values = Object.values(counts);
  const total  = values.reduce((a, b) => a + b, 0);

  const options = {
    responsive:          true,
    maintainAspectRatio: false,
    cutout:              "72%",
    plugins: {
      legend: {
        position: "right",
        labels: {
          color:        "rgba(255,255,255,0.6)",
          font:         { family: "Inter", size: 11, weight: "600" },
          boxWidth:     10,
          boxHeight:    10,
          borderRadius: 3,
          padding:      12,
        },
      },
      tooltip: {
        backgroundColor: "rgba(15,12,41,0.95)",
        borderColor:     "rgba(255,255,255,0.12)",
        borderWidth:     1,
        titleColor:      "#fff",
        bodyColor:       "rgba(255,255,255,0.7)",
        padding:         10,
        cornerRadius:    8,
        callbacks: {
          label: (ctx) =>
            ` ${ctx.label}: ${ctx.parsed} (${Math.round((ctx.parsed / total) * 100)}%)`,
        },
      },
    },
  };

  const data = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: COLORS.slice(0, values.length).map((c) => `${c}CC`),
        borderColor:     COLORS.slice(0, values.length),
        borderWidth:     2,
        hoverBorderWidth: 3,
        hoverOffset:     6,
        data:            values,
      },
    ],
  };

  return (
    <GlassCard hover={false} sx={{ p: 3, height: "100%" }}>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Order Status
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Distribution across all orders
      </Typography>

      {isLoading ? (
        <Skeleton
          variant="circular"
          width={200}
          height={200}
          sx={{ mx: "auto", mt: 2, bgcolor: "rgba(255,255,255,0.06)" }}
        />
      ) : (
        <Box sx={{ height: 220, mt: 2, position: "relative" }}>
          <Doughnut options={options} data={data} />
          <Box
            sx={{
              position:       "absolute",
              top:            "50%",
              left:           "35%",
              transform:      "translate(-50%, -50%)",
              textAlign:      "center",
              pointerEvents:  "none",
            }}
          >
            <Typography variant="h5" fontWeight={900}>
              {total}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total
            </Typography>
          </Box>
        </Box>
      )}
    </GlassCard>
  );
}