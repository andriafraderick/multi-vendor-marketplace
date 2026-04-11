// src/components/charts/RevenueChart.jsx
import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Box, Typography, Skeleton } from "@mui/material";
import GlassCard from "@/components/ui/GlassCard";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

function generateDemoData(days = 30) {
  const labels  = [];
  const revenue = [];
  const orders  = [];
  const now     = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    labels.push(
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    );
    revenue.push(parseFloat((Math.random() * 800 + 100).toFixed(2)));
    orders.push(Math.floor(Math.random() * 12 + 1));
  }
  return { labels, revenue, orders };
}

export default function RevenueChart({ snapshots = [], isLoading = false }) {
  const chartData = useMemo(() => {
    if (snapshots.length > 0) {
      return {
        labels:  snapshots.map((s) =>
          new Date(s.date).toLocaleDateString("en-US", {
            month: "short",
            day:   "numeric",
          })
        ),
        revenue: snapshots.map((s) => parseFloat(s.net_revenue   || 0)),
        orders:  snapshots.map((s) => parseInt(s.orders_count    || 0)),
      };
    }
    return generateDemoData(30);
  }, [snapshots]);

  const options = {
    responsive:          true,
    maintainAspectRatio: false,
    interaction:         { mode: "index", intersect: false },
    plugins: {
      legend: {
        labels: {
          color:        "rgba(255,255,255,0.6)",
          font:         { family: "Inter", size: 12, weight: "600" },
          boxWidth:     12,
          boxHeight:    12,
          borderRadius: 4,
        },
      },
      tooltip: {
        backgroundColor: "rgba(15,12,41,0.95)",
        borderColor:     "rgba(255,255,255,0.12)",
        borderWidth:     1,
        titleColor:      "#fff",
        bodyColor:       "rgba(255,255,255,0.7)",
        padding:         12,
        cornerRadius:    10,
        callbacks: {
          label: (ctx) =>
            ctx.dataset.label === "Revenue"
              ? ` $${ctx.parsed.y.toFixed(2)}`
              : ` ${ctx.parsed.y} orders`,
        },
      },
    },
    scales: {
      x: {
        grid:  { color: "rgba(255,255,255,0.04)", drawBorder: false },
        ticks: {
          color:         "rgba(255,255,255,0.4)",
          font:          { size: 11 },
          maxTicksLimit: 8,
        },
      },
      y: {
        grid:     { color: "rgba(255,255,255,0.04)", drawBorder: false },
        ticks:    {
          color:    "rgba(255,255,255,0.4)",
          font:     { size: 11 },
          callback: (v) => `$${v}`,
        },
        position: "left",
      },
      y1: {
        grid:     { display: false },
        ticks:    { color: "rgba(255,255,255,0.3)", font: { size: 11 } },
        position: "right",
      },
    },
  };

  const data = {
    labels: chartData.labels,
    datasets: [
      {
        label:                    "Revenue",
        data:                     chartData.revenue,
        borderColor:              "#4318FF",
        backgroundColor:          "rgba(67,24,255,0.12)",
        borderWidth:              2.5,
        pointRadius:              0,
        pointHoverRadius:         5,
        pointHoverBackgroundColor: "#4318FF",
        fill:                     true,
        tension:                  0.4,
        yAxisID:                  "y",
      },
      {
        label:                    "Orders",
        data:                     chartData.orders,
        borderColor:              "#0075FF",
        backgroundColor:          "transparent",
        borderWidth:              2,
        pointRadius:              0,
        pointHoverRadius:         5,
        pointHoverBackgroundColor: "#0075FF",
        fill:                     false,
        tension:                  0.4,
        borderDash:               [5, 3],
        yAxisID:                  "y1",
      },
    ],
  };

  return (
    <GlassCard hover={false} sx={{ p: 3, height: "100%" }}>
      <Box
        sx={{
          display:        "flex",
          justifyContent: "space-between",
          alignItems:     "flex-start",
          mb:             3,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Revenue Overview
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Last 30 days · Revenue vs Orders
          </Typography>
        </Box>
      </Box>

      {isLoading ? (
        <Skeleton
          variant="rectangular"
          height={260}
          sx={{ borderRadius: "12px", bgcolor: "rgba(255,255,255,0.06)" }}
        />
      ) : (
        <Box sx={{ height: 260 }}>
          <Line options={options} data={data} />
        </Box>
      )}
    </GlassCard>
  );
}