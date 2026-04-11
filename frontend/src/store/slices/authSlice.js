// src/store/slices/authSlice.js
import { createSlice } from "@reduxjs/toolkit";

const stored = (() => {
  try {
    return {
      user:         JSON.parse(localStorage.getItem("user"))         || null,
      accessToken:  localStorage.getItem("accessToken")              || null,
      refreshToken: localStorage.getItem("refreshToken")             || null,
    };
  } catch {
    return { user: null, accessToken: null, refreshToken: null };
  }
})();

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user:         stored.user,
    accessToken:  stored.accessToken,
    refreshToken: stored.refreshToken,
    isLoading:    false,
    error:        null,
  },
  reducers: {
    setCredentials(state, { payload }) {
      const { user, tokens } = payload;
      state.user         = user;
      state.accessToken  = tokens.access;
      state.refreshToken = tokens.refresh;
      localStorage.setItem("user",         JSON.stringify(user));
      localStorage.setItem("accessToken",  tokens.access);
      localStorage.setItem("refreshToken", tokens.refresh);
    },

    setTokens(state, { payload }) {
      state.accessToken  = payload.accessToken;
      state.refreshToken = payload.refreshToken;
      localStorage.setItem("accessToken",  payload.accessToken);
      localStorage.setItem("refreshToken", payload.refreshToken);
    },

    updateUser(state, { payload }) {
      state.user = { ...state.user, ...payload };
      localStorage.setItem("user", JSON.stringify(state.user));
    },

    logout(state) {
      state.user         = null;
      state.accessToken  = null;
      state.refreshToken = null;
      state.error        = null;
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    },

    setError(state, { payload }) {
      state.error = payload;
    },

    clearError(state) {
      state.error = null;
    },
  },
});

export const {
  setCredentials, setTokens, updateUser,
  logout, setError, clearError,
} = authSlice.actions;

// Selectors
export const selectCurrentUser         = (state) => state.auth.user;
export const selectAccessToken         = (state) => state.auth.accessToken;
export const selectRefreshToken        = (state) => state.auth.refreshToken;
export const selectIsAuthenticated     = (state) => !!state.auth.accessToken;
export const selectUserRole            = (state) => state.auth.user?.role;
export const selectIsVendor            = (state) => state.auth.user?.role === "vendor";
export const selectIsAdmin             = (state) => state.auth.user?.role === "admin";
export const selectVendorStatus        = (state) => state.auth.user?.vendor?.status;
export const selectIsVendorActive      = (state) =>
  state.auth.user?.role === "vendor" &&
  state.auth.user?.vendor?.status === "active";

export default authSlice.reducer;