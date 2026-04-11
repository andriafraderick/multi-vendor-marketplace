// src/store/api/orderApi.js
import { baseApi } from "./baseApi";

export const orderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getCart: builder.query({
      query: () => "/orders/cart/",
      providesTags: ["Cart"],
    }),

    addToCart: builder.mutation({
      query: (data) => ({
        url:    "/orders/cart/",
        method: "POST",
        body:   data,
      }),
      invalidatesTags: ["Cart"],
    }),

    updateCartItem: builder.mutation({
      query: ({ id, quantity }) => ({
        url:    `/orders/cart/items/${id}/`,
        method: "PATCH",
        body:   { quantity },
      }),
      invalidatesTags: ["Cart"],
    }),

    removeCartItem: builder.mutation({
      query: (id) => ({
        url:    `/orders/cart/items/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Cart"],
    }),

    clearCart: builder.mutation({
      query: () => ({
        url:    "/orders/cart/",
        method: "DELETE",
      }),
      invalidatesTags: ["Cart"],
    }),

    validateCoupon: builder.mutation({
      query: (data) => ({
        url:    "/orders/coupons/validate/",
        method: "POST",
        body:   data,
      }),
    }),

    checkout: builder.mutation({
      query: (data) => ({
        url:    "/orders/checkout/",
        method: "POST",
        body:   data,
      }),
      invalidatesTags: ["Cart", "Order"],
    }),

    confirmPayment: builder.mutation({
      query: (data) => ({
        url:    "/orders/confirm-payment/",
        method: "POST",
        body:   data,
      }),
      invalidatesTags: ["Order"],
    }),

    getMyOrders: builder.query({
      query: (params = {}) => ({ url: "/orders/my-orders/", params }),
      providesTags: ["Order"],
    }),

    getOrderDetail: builder.query({
      query: (orderNumber) => `/orders/my-orders/${orderNumber}/`,
      providesTags: (r, e, n) => [{ type: "Order", id: n }],
    }),

    cancelOrder: builder.mutation({
      query: (orderNumber) => ({
        url:    `/orders/my-orders/${orderNumber}/cancel/`,
        method: "POST",
      }),
      invalidatesTags: ["Order"],
    }),

    // Vendor
    getVendorOrders: builder.query({
      query: (params = {}) => ({ url: "/orders/vendor/orders/", params }),
      providesTags: ["Order"],
    }),

    updateVendorOrder: builder.mutation({
      query: ({ id, ...data }) => ({
        url:    `/orders/vendor/orders/${id}/update/`,
        method: "PATCH",
        body:   data,
      }),
      invalidatesTags: ["Order"],
    }),

    getVendorCommissions: builder.query({
      query: (params = {}) => ({ url: "/orders/vendor/commissions/", params }),
      providesTags: ["Order"],
    }),

    // Admin
    getAllOrdersAdmin: builder.query({
      query: (params = {}) => ({ url: "/orders/admin/all/", params }),
      providesTags: ["Order"],
    }),

    updateOrderStatusAdmin: builder.mutation({
      query: ({ orderNumber, ...data }) => ({
        url:    `/orders/admin/all/${orderNumber}/status/`,
        method: "PATCH",
        body:   data,
      }),
      invalidatesTags: ["Order"],
    }),

    getCommissionOverview: builder.query({
      query: () => "/orders/admin/commissions/",
      providesTags: ["Order"],
    }),
  }),
});

export const {
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
  useValidateCouponMutation,
  useCheckoutMutation,
  useConfirmPaymentMutation,
  useGetMyOrdersQuery,
  useGetOrderDetailQuery,
  useCancelOrderMutation,
  useGetVendorOrdersQuery,
  useUpdateVendorOrderMutation,
  useGetVendorCommissionsQuery,
  useGetAllOrdersAdminQuery,
  useUpdateOrderStatusAdminMutation,
  useGetCommissionOverviewQuery,
} = orderApi;