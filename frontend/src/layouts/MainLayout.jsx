// src/layouts/MainLayout.jsx
import { Outlet } from "react-router-dom";
import { Box }    from "@mui/material";
import Navbar     from "@/components/navbar/Navbar";
import CartDrawer from "@/components/navbar/CartDrawer";

export default function MainLayout() {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <CartDrawer />
      <Box component="main" sx={{ flex: 1, pt: "70px" }}>
        <Outlet />
      </Box>
    </Box>
  );
}