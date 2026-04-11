// src/layouts/DashboardLayout.jsx
import { Outlet }   from "react-router-dom";
import { Box }      from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import Sidebar      from "@/components/sidebar/Sidebar";
import Navbar       from "@/components/navbar/Navbar";
import {
  selectSidebarOpen,
  selectMobileSidebarOpen,
  closeMobileSidebar,
} from "@/store/slices/uiSlice";

const SIDEBAR_W      = 260;
const SIDEBAR_W_COLLAPSED = 72;

export default function DashboardLayout({ role }) {
  const dispatch          = useDispatch();
  const sidebarOpen       = useSelector(selectSidebarOpen);
  const mobileSidebarOpen = useSelector(selectMobileSidebarOpen);
  const sidebarWidth      = sidebarOpen ? SIDEBAR_W : SIDEBAR_W_COLLAPSED;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>

      {/* Desktop sidebar */}
      <Box
        sx={{
          display:    { xs: "none", md: "block" },
          width:      sidebarWidth,
          flexShrink: 0,
          transition: "width 300ms cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <Sidebar role={role} />
      </Box>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <Box
          onClick={() => dispatch(closeMobileSidebar())}
          sx={{
            display:  { xs: "block", md: "none" },
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 1200,
          }}
        />
      )}
      <Box
        sx={{
          display:    { xs: "block", md: "none" },
          position:   "fixed",
          left:       mobileSidebarOpen ? 0 : -SIDEBAR_W,
          top:        0, bottom: 0,
          width:      SIDEBAR_W,
          zIndex:     1201,
          transition: "left 300ms cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <Sidebar role={role} />
      </Box>

      {/* Main content area */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Navbar isDashboard />
        <Box
          component="main"
          sx={{
            flex: 1,
            p:   { xs: 2, md: 3 },
            pt:  "80px",
            minHeight: "100vh",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}