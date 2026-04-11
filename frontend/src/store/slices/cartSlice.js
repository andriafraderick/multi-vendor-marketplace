// src/store/slices/cartSlice.js
import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    isOpen:     false,
    itemCount:  0,
    subtotal:   "0.00",
  },
  reducers: {
    openCart:  (state) => { state.isOpen = true; },
    closeCart: (state) => { state.isOpen = false; },
    toggleCart:(state) => { state.isOpen = !state.isOpen; },
    setCartSummary(state, { payload }) {
      state.itemCount = payload.total_items || 0;
      state.subtotal  = payload.subtotal    || "0.00";
    },
    clearCartState(state) {
      state.isOpen    = false;
      state.itemCount = 0;
      state.subtotal  = "0.00";
    },
  },
});

export const {
  openCart, closeCart, toggleCart,
  setCartSummary, clearCartState,
} = cartSlice.actions;

export const selectCartOpen      = (state) => state.cart.isOpen;
export const selectCartItemCount = (state) => state.cart.itemCount;
export const selectCartSubtotal  = (state) => state.cart.subtotal;

export default cartSlice.reducer;