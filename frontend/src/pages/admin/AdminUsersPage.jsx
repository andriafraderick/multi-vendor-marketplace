// src/pages/admin/AdminUsersPage.jsx
import { useState }  from "react";
import {
  Box, Typography, TextField, InputAdornment,
  IconButton, Chip, Grid,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon  from "@mui/icons-material/Clear";
import PeopleIcon from "@mui/icons-material/People";
import AdminDataTable from "@/components/admin/AdminDataTable";
import StatCard       from "@/components/admin/StatCard";
import OrderStatusBadge from "@/components/vendor/OrderStatusBadge";

// NOTE: A full users API endpoint can be added to the backend in a future
// iteration. This page demonstrates the UI shell with mock data until the
// /api/v1/admin/users/ endpoint is wired. The patterns here mirror the
// other admin pages exactly for consistency.

const MOCK_USERS = [
  { id: "1", email: "alice@example.com", first_name: "Alice", last_name: "Smith",  role: "buyer",  is_verified: true,  is_active: true,  date_joined: "2024-01-15" },
  { id: "2", email: "bob@example.com",   first_name: "Bob",   last_name: "Jones",  role: "vendor", is_verified: true,  is_active: true,  date_joined: "2024-02-03" },
  { id: "3", email: "carol@example.com", first_name: "Carol", last_name: "Davis",  role: "buyer",  is_verified: false, is_active: true,  date_joined: "2024-03-10" },
  { id: "4", email: "dan@example.com",   first_name: "Dan",   last_name: "Wilson", role: "vendor", is_verified: true,  is_active: false, date_joined: "2024-01-28" },
];

const ROLE_COLORS = {
  buyer:  { bg: "rgba(0,117,255,0.12)",  border: "rgba(0,117,255,0.3)",  color: "#0075FF" },
  vendor: { bg: "rgba(67,24,255,0.12)",  border: "rgba(67,24,255,0.3)",  color: "#4318FF" },
  admin:  { bg: "rgba(247,37,133,0.12)", border: "rgba(247,37,133,0.3)", color: "#F72585" },
};

export default function AdminUsersPage() {
  const [search,     setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filtered = MOCK_USERS.filter((u) => {
    const matchRole   = roleFilter === "all" || u.role === roleFilter;
    const matchSearch = !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const columns = [
    {
      field: "name", headerName: "User", minWidth: 180,
      renderCell: (r) => (
        <Box>
          <Typography variant="body2" fontWeight={700}>{r.first_name} {r.last_name}</Typography>
          <Typography variant="caption" color="text.secondary">{r.email}</Typography>
        </Box>
      ),
    },
    {
      field: "role", headerName: "Role",
      renderCell: (r) => {
        const s = ROLE_COLORS[r.role] || ROLE_COLORS.buyer;
        return (
          <Chip label={r.role} size="small"
            sx={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontWeight: 700, textTransform: "capitalize" }} />
        );
      },
    },
    {
      field: "is_verified", headerName: "Verified", align: "center",
      renderCell: (r) => (
        <Typography variant="body2" sx={{ color: r.is_verified ? "#10B981" : "#FF9800" }}>
          {r.is_verified ? "✅ Yes" : "⏳ No"}
        </Typography>
      ),
    },
    {
      field: "is_active", headerName: "Active", align: "center",
      renderCell: (r) => (
        <Typography variant="body2" sx={{ color: r.is_active ? "#10B981" : "#F44336" }}>
          {r.is_active ? "Active" : "Inactive"}
        </Typography>
      ),
    },
    {
      field: "date_joined", headerName: "Joined",
      renderCell: (r) => new Date(r.date_joined).toLocaleDateString(),
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={900}>User Management</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          View all platform users
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: "Total Users", value: MOCK_USERS.length,                                      color: "#4318FF" },
          { label: "Buyers",      value: MOCK_USERS.filter((u) => u.role === "buyer").length,    color: "#0075FF" },
          { label: "Vendors",     value: MOCK_USERS.filter((u) => u.role === "vendor").length,   color: "#7B2FF7" },
          { label: "Unverified",  value: MOCK_USERS.filter((u) => !u.is_verified).length,        color: "#FF9800" },
        ].map(({ label, value, color }) => (
          <Grid item key={label} xs={12} sm={6} lg={3}>
            <StatCard icon={<PeopleIcon />} label={label} value={value} color={color} />
          </Grid>
        ))}
      </Grid>

      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
        <Box sx={{ display: "flex", gap: 1 }}>
          {["all", "buyer", "vendor", "admin"].map((r) => (
            <Chip key={r} label={r.charAt(0).toUpperCase() + r.slice(1)}
              onClick={() => setRoleFilter(r)}
              sx={{
                cursor: "pointer", fontWeight: 600, textTransform: "capitalize",
                background: roleFilter === r ? "rgba(67,24,255,0.2)" : "rgba(255,255,255,0.06)",
                border:     roleFilter === r ? "1px solid rgba(67,24,255,0.5)" : "1px solid rgba(255,255,255,0.1)",
                color:      roleFilter === r ? "#fff" : "rgba(255,255,255,0.6)",
                transition: "all 200ms",
              }}
            />
          ))}
        </Box>
        <Box sx={{ ml: "auto", maxWidth: 280, flex: 1 }}>
          <TextField
            size="small" fullWidth placeholder="Search users…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: "rgba(255,255,255,0.35)" }} /></InputAdornment>,
              endAdornment: search && <InputAdornment position="end"><IconButton size="small" onClick={() => setSearch("")}><ClearIcon sx={{ fontSize: 14 }} /></IconButton></InputAdornment>,
            }}
          />
        </Box>
      </Box>

      <AdminDataTable columns={columns} rows={filtered} emptyText="No users found." />
    </Box>
  );
}