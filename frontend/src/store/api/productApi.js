// src/store/api/productApi.js
import { baseApi } from "./baseApi";

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    getProducts: builder.query({
      query: (params = {}) => ({ url: "/products/", params }),
      providesTags: ["Product"],
    }),

    getFeaturedProducts: builder.query({
      query: () => "/products/featured/",
      providesTags: ["Product"],
      // Normalize: backend returns array or paginated object
      transformResponse: (response) => {
        if (Array.isArray(response)) return response;
        return response?.results || [];
      },
    }),

    getProductBySlug: builder.query({
      query: (slug) => `/products/${slug}/`,
      providesTags: (r, e, slug) => [{ type: "Product", id: slug }],
    }),

    getRelatedProducts: builder.query({
      query: (slug) => `/products/${slug}/related/`,
      transformResponse: (response) => {
        if (Array.isArray(response)) return response;
        return response?.results || [];
      },
    }),

    getCategories: builder.query({
      query: () => "/products/categories/",
      providesTags: ["Product"],
      transformResponse: (response) => {
        if (Array.isArray(response)) return response;
        return response?.results || [];
      },
    }),

    getCategoryBySlug: builder.query({
      query: (slug) => `/products/categories/${slug}/`,
    }),

    // Vendor product management
    getMyProducts: builder.query({
      query: (params = {}) => ({ url: "/products/vendor/my-products/", params }),
      providesTags: ["Product"],
    }),

    createProduct: builder.mutation({
      query: (data) => ({
        url:    "/products/vendor/my-products/",
        method: "POST",
        body:   data,
      }),
      invalidatesTags: ["Product"],
    }),

    updateProduct: builder.mutation({
      query: ({ id, ...data }) => ({
        url:    `/products/vendor/my-products/${id}/`,
        method: "PATCH",
        body:   data,
      }),
      invalidatesTags: ["Product"],
    }),

    deleteProduct: builder.mutation({
      query: (id) => ({
        url:    `/products/vendor/my-products/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Product"],
    }),

    // Wishlist
    getWishlist: builder.query({
      query: () => "/products/wishlist/",
      providesTags: ["Product"],
    }),

    addToWishlist: builder.mutation({
      query: (productId) => ({
        url:    "/products/wishlist/",
        method: "POST",
        body:   { product_id: productId },
      }),
      invalidatesTags: ["Product"],
    }),

    removeFromWishlist: builder.mutation({
      query: (productId) => ({
        url:    `/products/wishlist/${productId}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Product"],
    }),

    checkWishlist: builder.query({
      query: (productId) => `/products/wishlist/check/${productId}/`,
    }),

    // Admin
    getAllProductsAdmin: builder.query({
      query: (params = {}) => ({ url: "/products/admin/all/", params }),
      providesTags: ["Product"],
    }),

    updateProductStatus: builder.mutation({
      query: ({ id, ...data }) => ({
        url:    `/products/admin/${id}/status/`,
        method: "PATCH",
        body:   data,
      }),
      invalidatesTags: ["Product"],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetFeaturedProductsQuery,
  useGetProductBySlugQuery,
  useGetRelatedProductsQuery,
  useGetCategoriesQuery,
  useGetCategoryBySlugQuery,
  useGetMyProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetWishlistQuery,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
  useCheckWishlistQuery,
  useGetAllProductsAdminQuery,
  useUpdateProductStatusMutation,
} = productApi;