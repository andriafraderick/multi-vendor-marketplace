// src/store/api/reviewApi.js
import { baseApi } from "./baseApi";

export const reviewApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getProductReviews: builder.query({
      query: ({ slug, ...params }) => ({
        url: `/reviews/products/${slug}/`,
        params,
      }),
      providesTags: ["Review"],
    }),

    getProductRatingSummary: builder.query({
      query: (slug) => `/reviews/products/${slug}/summary/`,
      providesTags: ["Review"],
    }),

    createProductReview: builder.mutation({
      query: (data) => ({
        url:    "/reviews/products/create/",
        method: "POST",
        body:   data,
      }),
      invalidatesTags: ["Review"],
    }),

    getPendingReviews: builder.query({
      query: () => "/reviews/pending-items/",
      providesTags: ["Review"],
    }),

    getMyReviews: builder.query({
      query: () => "/reviews/my-reviews/",
      providesTags: ["Review"],
    }),

    voteReviewHelpful: builder.mutation({
      query: ({ reviewId, isHelpful }) => ({
        url:    `/reviews/${reviewId}/helpful/`,
        method: "POST",
        body:   { is_helpful: isHelpful },
      }),
      invalidatesTags: ["Review"],
    }),

    flagReview: builder.mutation({
      query: ({ reviewId, ...data }) => ({
        url:    `/reviews/${reviewId}/flag/`,
        method: "POST",
        body:   data,
      }),
    }),

    // Vendor
    getVendorReviews: builder.query({
      query: (params = {}) => ({
        url: "/reviews/vendor/my-reviews/",
        params,
      }),
      providesTags: ["Review"],
    }),

    respondToReview: builder.mutation({
      query: ({ reviewId, response }) => ({
        url:    `/reviews/vendor/${reviewId}/respond/`,
        method: "POST",
        body:   { vendor_response: response },
      }),
      invalidatesTags: ["Review"],
    }),

    // Vendor store reviews (public)
    getVendorStoreReviews: builder.query({
      query: ({ vendor_slug, ...params }) => ({
        url: `/reviews/vendors/${vendor_slug}/`,
        params,
      }),
      providesTags: ["Review"],
    }),

    getVendorStoreRatingSummary: builder.query({
      query: (vendor_slug) => `/reviews/vendors/${vendor_slug}/summary/`,
      providesTags: ["Review"],
    }),

    createVendorReview: builder.mutation({
      query: (data) => ({
        url:    "/reviews/vendors/create/",
        method: "POST",
        body:   data,
      }),
      invalidatesTags: ["Review"],
    }),

    // Admin
    getAllReviewsAdmin: builder.query({
      query: (params = {}) => ({
        url: "/reviews/admin/all/",
        params,
      }),
      providesTags: ["Review"],
    }),

    moderateReview: builder.mutation({
      query: ({ reviewId, ...data }) => ({
        url:    `/reviews/admin/${reviewId}/moderate/`,
        method: "POST",
        body:   data,
      }),
      invalidatesTags: ["Review"],
    }),

    getFlaggedReviews: builder.query({
      query: () => "/reviews/admin/flagged/",
      providesTags: ["Review"],
    }),
  }),
});

export const {
  useGetProductReviewsQuery,
  useGetProductRatingSummaryQuery,
  useCreateProductReviewMutation,
  useGetPendingReviewsQuery,
  useGetMyReviewsQuery,
  useVoteReviewHelpfulMutation,
  useFlagReviewMutation,
  useGetVendorReviewsQuery,
  useRespondToReviewMutation,
  useGetVendorStoreReviewsQuery,
  useGetVendorStoreRatingSummaryQuery,
  useCreateVendorReviewMutation,
  useGetAllReviewsAdminQuery,
  useModerateReviewMutation,
  useGetFlaggedReviewsQuery,
} = reviewApi;