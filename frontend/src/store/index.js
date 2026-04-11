// src/store/index.js
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./api/baseApi.js";
import authReducer from "./slices/authSlice.js";
import cartReducer from "./slices/cartSlice.js";
import uiReducer   from "./slices/uiSlice.js";

const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
    cart: cartReducer,
    ui:   uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
  devTools: true,
});

export default store;