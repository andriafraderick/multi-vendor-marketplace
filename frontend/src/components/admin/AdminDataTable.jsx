// src/components/admin/AdminDataTable.jsx
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Skeleton,
} from "@mui/material";
import GlassCard from "@/components/ui/GlassCard";

export default function AdminDataTable({
  title,
  columns   = [],
  rows      = [],
  isLoading = false,
  emptyText = "No data found.",
  actions,
  stickyHeader = false,
  maxHeight,
}) {
  return (
    <GlassCard hover={false} sx={{ overflow: "hidden" }}>
      {(title || actions) && (
        <Box
          sx={{
            display:        "flex",
            justifyContent: "space-between",
            alignItems:     "center",
            p:              3,
            pb:             2,
            borderBottom:   "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {title && (
            <Typography variant="h6" fontWeight={700}>
              {title}
            </Typography>
          )}
          {actions && <Box>{actions}</Box>}
        </Box>
      )}

      <TableContainer sx={{ maxHeight: maxHeight || "auto" }}>
        <Table stickyHeader={stickyHeader} size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.field}
                  align={col.align || "left"}
                  sx={{
                    background:    "rgba(255,255,255,0.03)",
                    fontWeight:    700,
                    fontSize:      "0.72rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    color:         "rgba(255,255,255,0.45)",
                    whiteSpace:    "nowrap",
                    py:            1.75,
                    minWidth:      col.minWidth,
                    width:         col.width,
                  }}
                >
                  {col.headerName}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell key={col.field}>
                      <Skeleton
                        variant="text"
                        sx={{ bgcolor: "rgba(255,255,255,0.05)" }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  align="center"
                  sx={{ py: 6 }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {emptyText}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, idx) => (
                <TableRow
                  key={row.id || idx}
                  sx={{
                    transition: "background 150ms",
                    "&:hover":  { background: "rgba(255,255,255,0.03)" },
                    "&:last-child td": { border: 0 },
                  }}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.field}
                      align={col.align || "left"}
                      sx={{ py: 1.5, color: "rgba(255,255,255,0.85)" }}
                    >
                      {col.renderCell
                        ? col.renderCell(row)
                        : row[col.field] ?? "—"}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </GlassCard>
  );
}