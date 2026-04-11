// src/store/api/baseApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1",
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth?.accessToken;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    const refreshToken = api.getState().auth?.refreshToken;
    if (refreshToken) {
      const refreshResult = await baseQuery(
        {
          url: "/auth/token/refresh/",
          method: "POST",
          body: { refresh: refreshToken },
        },
        api,
        extraOptions
      );

      if (refreshResult?.data) {
        api.dispatch({
          type: "auth/setTokens",
          payload: {
            accessToken:  refreshResult.data.access,
            refreshToken: refreshResult.data.refresh,
          },
        });
        result = await baseQuery(args, api, extraOptions);
      } else {
        api.dispatch({ type: "auth/logout" });
      }
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery:   baseQueryWithReauth,
  tagTypes:    ["Auth", "Product", "Order", "Review", "Vendor", "Cart"],
  endpoints:   () => ({}),
});