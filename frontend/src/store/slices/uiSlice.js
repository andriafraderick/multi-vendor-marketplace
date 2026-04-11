// src/store/slices/uiSlice.js
import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    sidebarOpen:     true,
    mobileSidebarOpen: false,
    pageTitle:       "Marketplace",
  },
  reducers: {
    toggleSidebar:      (state) => { state.sidebarOpen       = !state.sidebarOpen; },
    setSidebarOpen:     (state, { payload }) => { state.sidebarOpen = payload; },
    toggleMobileSidebar:(state) => { state.mobileSidebarOpen = !state.mobileSidebarOpen; },
    closeMobileSidebar: (state) => { state.mobileSidebarOpen = false; },
    setPageTitle:       (state, { payload }) => { state.pageTitle = payload; },
  },
});

export const {
  toggleSidebar, setSidebarOpen,
  toggleMobileSidebar, closeMobileSidebar,
  setPageTitle,
} = uiSlice.actions;

export const selectSidebarOpen       = (state) => state.ui.sidebarOpen;
export const selectMobileSidebarOpen = (state) => state.ui.mobileSidebarOpen;
export const selectPageTitle         = (state) => state.ui.pageTitle;

export default uiSlice.reducer;