// src/store/api/authApi.js
import { baseApi } from "./baseApi";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    loginUser: builder.mutation({
      query: (credentials) => ({
        url:    "/auth/login/",
        method: "POST",
        body:   credentials,
      }),
      invalidatesTags: ["Auth", "Cart"],
    }),

    registerBuyer: builder.mutation({
      query: (data) => ({
        url:    "/auth/register/buyer/",
        method: "POST",
        body:   data,
      }),
    }),

    registerVendor: builder.mutation({
      query: (data) => ({
        url:    "/auth/register/vendor/",
        method: "POST",
        body:   data,
      }),
    }),

    logoutUser: builder.mutation({
      query: (refreshToken) => ({
        url:    "/auth/logout/",
        method: "POST",
        body:   { refresh: refreshToken },
      }),
      invalidatesTags: ["Auth", "Cart"],
    }),

    getMe: builder.query({
      query: () => "/auth/me/",
      providesTags: ["Auth"],
    }),

    updateProfile: builder.mutation({
      query: (data) => ({
        url:    "/auth/me/",
        method: "PUT",
        body:   data,
      }),
      invalidatesTags: ["Auth"],
    }),

    changePassword: builder.mutation({
      query: (data) => ({
        url:    "/auth/change-password/",
        method: "POST",
        body:   data,
      }),
    }),

    verifyEmail: builder.mutation({
      query: (data) => ({
        url:    "/auth/verify-email/",
        method: "POST",
        body:   data,
      }),
    }),

    forgotPassword: builder.mutation({
      query: (data) => ({
        url:    "/auth/forgot-password/",
        method: "POST",
        body:   data,
      }),
    }),

    resetPassword: builder.mutation({
      query: (data) => ({
        url:    "/auth/reset-password/",
        method: "POST",
        body:   data,
      }),
    }),

    getAddresses: builder.query({
      query: () => "/auth/addresses/",
      providesTags: ["Auth"],
    }),

    addAddress: builder.mutation({
      query: (data) => ({
        url:    "/auth/addresses/",
        method: "POST",
        body:   data,
      }),
      invalidatesTags: ["Auth"],
    }),

    deleteAddress: builder.mutation({
      query: (id) => ({
        url:    `/auth/addresses/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Auth"],
    }),
  }),
});

export const {
  useLoginUserMutation,
  useRegisterBuyerMutation,
  useRegisterVendorMutation,
  useLogoutUserMutation,
  useGetMeQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useVerifyEmailMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetAddressesQuery,
  useAddAddressMutation,
  useDeleteAddressMutation,
} = authApi;