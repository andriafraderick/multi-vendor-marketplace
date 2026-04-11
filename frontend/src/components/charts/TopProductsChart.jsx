// src/components/charts/TopProductsChart.jsx
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Box, Typography, Skeleton } from "@mui/material";
import GlassCard from "@/components/ui/GlassCard";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

export default function TopProductsChart({ products = [], isLoading = false }) {
  const items =
    products.length > 0
      ? products.slice(0, 6)
      : [
          { name: "Blue Sneakers",  total_sales: 42 },
          { name: "Leather Wallet", total_sales: 38 },
          { name: "Cotton T-Shirt", total_sales: 31 },
          { name: "Running Shoes",  total_sales: 27 },
          { name: "Denim Jacket",   total_sales: 22 },
          { name: "Canvas Bag",     total_sales: 18 },
        ];

  const labels = items.map((p) =>
    p.name.length > 14 ? p.name.slice(0, 14) + "…" : p.name
  );
  const values = items.map((p) => p.total_sales || 0);

  const options = {
    indexAxis:           "y",
    responsive:          true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15,12,41,0.95)",
        borderColor:     "rgba(255,255,255,0.12)",
        borderWidth:     1,
        titleColor:      "#fff",
        bodyColor:       "rgba(255,255,255,0.7)",
        padding:         10,
        cornerRadius:    8,
        callbacks: {
          label: (ctx) => ` ${ctx.parsed.x} units sold`,
        },
      },
    },
    scales: {
      x: {
        grid:  { color: "rgba(255,255,255,0.05)", drawBorder: false },
        ticks: { color: "rgba(255,255,255,0.4)", font: { size: 11 } },
      },
      y: {
        grid:  { display: false },
        ticks: {
          color: "rgba(255,255,255,0.65)",
          font:  { size: 11, weight: "600" },
        },
      },
    },
  };

  const data = {
    labels,
    datasets: [
      {
        data:            values,
        backgroundColor: values.map(
          (_, i) =>
            `rgba(${67 - i * 5}, ${24 + i * 10}, 255, ${0.75 - i * 0.06})`
        ),
        borderRadius:  6,
        borderSkipped: false,
      },
    ],
  };

  return (
    <GlassCard hover={false} sx={{ p: 3, height: "100%" }}>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Top Products
      </Typography>
      <Typography variant="caption" color="text.secondary">
        By units sold
      </Typography>

      {isLoading ? (
        <Skeleton
          variant="rectangular"
          height={220}
          sx={{
            borderRadius: "12px",
            mt:           2,
            bgcolor:      "rgba(255,255,255,0.06)",
          }}
        />
      ) : (
        <Box sx={{ height: 220, mt: 2 }}>
          <Bar options={options} data={data} />
        </Box>
      )}
    </GlassCard>
  );
}