// src/store/api/vendorApi.js
import { baseApi } from "./baseApi";

export const vendorApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getVendors: builder.query({
      query: (params = {}) => ({ url: "/vendors/", params }),
      providesTags: ["Vendor"],
    }),

    getVendorBySlug: builder.query({
      query: (slug) => `/vendors/${slug}/`,
      providesTags: (r, e, slug) => [{ type: "Vendor", id: slug }],
    }),

    getVendorProducts: builder.query({
      query: ({ slug, ...params }) => ({ url: `/vendors/${slug}/products/`, params }),
    }),

    getVendorDashboard: builder.query({
      query: () => "/vendors/dashboard/",
      providesTags: ["Vendor"],
    }),

    updateVendorProfile: builder.mutation({
      query: (data) => ({
        url:    "/vendors/dashboard/profile/",
        method: "PATCH",
        body:   data,
      }),
      invalidatesTags: ["Vendor"],
    }),

    getPayoutRequests: builder.query({
      query: () => "/vendors/dashboard/payouts/",
      providesTags: ["Vendor"],
    }),

    createPayoutRequest: builder.mutation({
      query: (data) => ({
        url:    "/vendors/dashboard/payouts/",
        method: "POST",
        body:   data,
      }),
      invalidatesTags: ["Vendor"],
    }),

    // Admin
    getAllVendorsAdmin: builder.query({
      query: (params = {}) => ({ url: "/vendors/admin/all/", params }),
      providesTags: ["Vendor"],
    }),

    updateVendorStatus: builder.mutation({
      query: ({ id, ...data }) => ({
        url:    `/vendors/admin/all/${id}/status/`,
        method: "PATCH",
        body:   data,
      }),
      invalidatesTags: ["Vendor"],
    }),

    getAllPayoutsAdmin: builder.query({
      query: (params = {}) => ({ url: "/vendors/admin/payouts/", params }),
      providesTags: ["Vendor"],
    }),

    processPayoutAdmin: builder.mutation({
      query: ({ id, ...data }) => ({
        url:    `/vendors/admin/payouts/${id}/process/`,
        method: "PATCH",
        body:   data,
      }),
      invalidatesTags: ["Vendor"],
    }),
  }),
});

export const {
  useGetVendorsQuery,
  useGetVendorBySlugQuery,
  useGetVendorProductsQuery,
  useGetVendorDashboardQuery,
  useUpdateVendorProfileMutation,
  useGetPayoutRequestsQuery,
  useCreatePayoutRequestMutation,
  useGetAllVendorsAdminQuery,
  useUpdateVendorStatusMutation,
  useGetAllPayoutsAdminQuery,
  useProcessPayoutAdminMutation,
} = vendorApi;