// src/components/ui/Pagination.jsx
import { Box, Pagination as MuiPagination, Typography } from "@mui/material";

export default function Pagination({ count, page, onChange, total, pageSize = 20 }) {
  if (!count || count <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end   = Math.min(page * pageSize, total);

  return (
    <Box
      sx={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        flexWrap:       "wrap",
        gap:            2,
        mt:             4,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        Showing {start}–{end} of {total} results
      </Typography>
      <MuiPagination
        count={count}
        page={page}
        onChange={(_, v) => onChange(v)}
        shape="rounded"
        sx={{
          "& .MuiPaginationItem-root": {
            color:        "rgba(255,255,255,0.6)",
            borderColor:  "rgba(255,255,255,0.12)",
            borderRadius: "10px",
            transition:   "all 200ms",
            "&:hover": {
              background:  "rgba(67,24,255,0.15)",
              borderColor: "rgba(67,24,255,0.4)",
              color:       "#fff",
            },
            "&.Mui-selected": {
              background:  "linear-gradient(135deg, #4318FF, #0075FF)",
              borderColor: "transparent",
              color:       "#fff",
              fontWeight:  700,
              boxShadow:   "0 4px 14px rgba(67,24,255,0.4)",
            },
          },
        }}
      />
    </Box>
  );
}