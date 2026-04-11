"""
products/views.py
All product and category API views.
"""
from rest_framework import status, generics, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q
from django.shortcuts import get_object_or_404

from .models import (
    Category, Product, ProductImage,
    ProductVariant, ProductAttribute, Wishlist,
)
from .serializers import (
    CategorySerializer,
    CategoryWriteSerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    ProductWriteSerializer,
    ProductStatusSerializer,
    ProductImageUploadSerializer,
    ProductVariantWriteSerializer,
    WishlistSerializer,
)
from .filters import ProductFilter
from accounts.permissions import IsAdminUser as IsAdminRole, IsVendor, IsVendorActive


# ═══════════════════════════════════════════════════════════════════════════════
# CATEGORY VIEWS
# ═══════════════════════════════════════════════════════════════════════════════

class CategoryListView(generics.ListAPIView):
    """
    GET /api/v1/products/categories/
    Public — list all active top-level categories with their subcategories.
    """
    serializer_class   = CategorySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        # Only return top-level categories; subcategories come nested inside
        return Category.objects.filter(
            is_active=True, parent__isnull=True
        ).prefetch_related("subcategories")


class CategoryDetailView(generics.RetrieveAPIView):
    """
    GET /api/v1/products/categories/<slug>/
    Public — get a single category by slug.
    """
    serializer_class   = CategorySerializer
    permission_classes = [AllowAny]
    lookup_field       = "slug"
    queryset           = Category.objects.filter(is_active=True)


class CategoryCreateView(generics.CreateAPIView):
    """
    POST /api/v1/products/categories/create/
    Admin only — create a new category.
    """
    serializer_class   = CategoryWriteSerializer
    permission_classes = [IsAdminRole]


class CategoryUpdateView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PUT/PATCH/DELETE /api/v1/products/categories/<slug>/manage/
    Admin only — update or delete a category.
    """
    serializer_class   = CategoryWriteSerializer
    permission_classes = [IsAdminRole]
    lookup_field       = "slug"
    queryset           = Category.objects.all()


# ═══════════════════════════════════════════════════════════════════════════════
# PUBLIC PRODUCT VIEWS
# ═══════════════════════════════════════════════════════════════════════════════

class ProductListView(generics.ListAPIView):
    """
    GET /api/v1/products/
    Public — browse all active products.
    Supports: search, filter, ordering, pagination.

    Query params:
        search=<str>         searches name, description, tags
        ordering=price       sort ascending by price
        ordering=-price      sort descending
        ordering=-created_at newest first (default)
        min_price=10
        max_price=100
        category=<slug>
        vendor=<slug>
        is_featured=true
        in_stock=true
        condition=new
    """
    serializer_class   = ProductListSerializer
    permission_classes = [AllowAny]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class    = ProductFilter
    search_fields      = ["name", "description", "short_description", "tags", "vendor__store_name"]
    ordering_fields    = ["price", "created_at", "average_rating", "total_sales", "view_count"]
    ordering           = ["-created_at"]

    def get_queryset(self):
        return Product.objects.filter(
            status="active"
        ).select_related(
            "vendor", "category"
        ).prefetch_related("images")


class FeaturedProductListView(generics.ListAPIView):
    """
    GET /api/v1/products/featured/
    Public — only featured active products.
    """
    serializer_class   = ProductListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Product.objects.filter(
            status="active", is_featured=True
        ).select_related("vendor", "category").prefetch_related("images")[:20]


class ProductDetailView(generics.RetrieveAPIView):
    """
    GET /api/v1/products/<slug>/
    Public — full product detail. Also increments view_count.
    """
    serializer_class   = ProductDetailSerializer
    permission_classes = [AllowAny]
    lookup_field       = "slug"

    def get_queryset(self):
        return Product.objects.filter(
            status="active"
        ).select_related(
            "vendor", "category"
        ).prefetch_related("images", "variants", "attributes")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()

        # Increment view count (simple version — Redis-based in production)
        Product.objects.filter(pk=instance.pk).update(view_count=instance.view_count + 1)

        # Log the view for analytics
        try:
            from analytics.models import ProductViewLog
            ProductViewLog.objects.create(
                product    = instance,
                user       = request.user if request.user.is_authenticated else None,
                ip_address = request.META.get("REMOTE_ADDR"),
                referrer   = request.META.get("HTTP_REFERER", ""),
            )
        except Exception:
            pass  # Never fail a product page load because of analytics

        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class RelatedProductsView(generics.ListAPIView):
    """
    GET /api/v1/products/<slug>/related/
    Public — products in the same category from the same or other vendors.
    """
    serializer_class   = ProductListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        slug    = self.kwargs.get("slug")
        product = get_object_or_404(Product, slug=slug, status="active")
        return Product.objects.filter(
            status="active",
            category=product.category,
        ).exclude(id=product.id).select_related(
            "vendor", "category"
        ).prefetch_related("images")[:8]


# ═══════════════════════════════════════════════════════════════════════════════
# VENDOR PRODUCT MANAGEMENT VIEWS
# ═══════════════════════════════════════════════════════════════════════════════

class VendorProductListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/products/vendor/my-products/
         Vendor sees all their own products (all statuses).

    POST /api/v1/products/vendor/my-products/
         Vendor creates a new product (starts as draft, goes to pending).
    """
    permission_classes = [IsAuthenticated, IsVendorActive]
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields      = ["name", "sku"]
    ordering_fields    = ["price", "created_at", "stock_quantity", "total_sales"]
    ordering           = ["-created_at"]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ProductWriteSerializer
        return ProductListSerializer

    def get_queryset(self):
        return Product.objects.filter(
            vendor=self.request.user.vendor_profile
        ).select_related("category").prefetch_related("images")

    def perform_create(self, serializer):
        # Automatically assign the vendor and set status to pending (needs admin approval)
        product = serializer.save(
            vendor=self.request.user.vendor_profile,
            status="pending",
        )
        return product

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        product = self.perform_create(serializer)
        return Response(
            {
                "message": "Product submitted for admin approval.",
                "product": ProductDetailSerializer(product, context={"request": request}).data,
            },
            status=status.HTTP_201_CREATED,
        )


class VendorProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/v1/products/vendor/my-products/<id>/
    PUT    /api/v1/products/vendor/my-products/<id>/
    DELETE /api/v1/products/vendor/my-products/<id>/

    Vendor can only access their own products.
    """
    permission_classes = [IsAuthenticated, IsVendorActive]
    lookup_field       = "id"

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return ProductWriteSerializer
        return ProductDetailSerializer

    def get_queryset(self):
        return Product.objects.filter(
            vendor=self.request.user.vendor_profile
        ).prefetch_related("images", "variants", "attributes")

    def update(self, request, *args, **kwargs):
        partial  = kwargs.pop("partial", False)
        instance = self.get_object()

        # If product was active/rejected and vendor edits it, reset to pending
        if instance.status in ["active", "rejected"]:
            instance.status = "pending"
            instance.save(update_fields=["status"])

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(
            {
                "message": "Product updated and resubmitted for approval.",
                "product": serializer.data,
            }
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Don't hard-delete — archive instead so order history isn't broken
        instance.status = "archived"
        instance.save(update_fields=["status"])
        return Response(
            {"message": "Product archived successfully."},
            status=status.HTTP_200_OK,
        )


# ═══════════════════════════════════════════════════════════════════════════════
# PRODUCT IMAGE MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

class ProductImageUploadView(APIView):
    """
    POST /api/v1/products/vendor/my-products/<id>/images/
    Vendor uploads one or more images for their product.
    Accepts multipart/form-data.
    """
    permission_classes = [IsAuthenticated, IsVendorActive]
    parser_classes     = [MultiPartParser, FormParser]

    def get_product(self, request, id):
        return get_object_or_404(
            Product,
            id=id,
            vendor=request.user.vendor_profile,
        )

    def post(self, request, id):
        product = self.get_product(request, id)
        files   = request.FILES.getlist("images")

        if not files:
            return Response(
                {"error": "No images provided. Send files under the key 'images'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(files) > 10:
            return Response(
                {"error": "Maximum 10 images per upload."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created_images = []
        for i, file in enumerate(files):
            is_primary = (i == 0 and not product.images.filter(is_primary=True).exists())
            img = ProductImage.objects.create(
                product    = product,
                image      = file,
                sort_order = product.images.count() + i,
                is_primary = is_primary,
            )
            created_images.append(img)

        serializer = ProductImageUploadSerializer(
            created_images, many=True, context={"request": request}
        )
        return Response(
            {
                "message": f"{len(created_images)} image(s) uploaded.",
                "images": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    def delete(self, request, id):
        """DELETE /api/v1/products/vendor/my-products/<id>/images/?image_id=<id>"""
        product  = self.get_product(request, id)
        image_id = request.query_params.get("image_id")
        if not image_id:
            return Response(
                {"error": "Provide image_id as a query parameter."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        image = get_object_or_404(ProductImage, id=image_id, product=product)
        image.delete()
        return Response({"message": "Image deleted."}, status=status.HTTP_200_OK)


# ═══════════════════════════════════════════════════════════════════════════════
# PRODUCT VARIANT MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

class ProductVariantListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/products/vendor/my-products/<id>/variants/
    POST /api/v1/products/vendor/my-products/<id>/variants/
    """
    serializer_class   = ProductVariantWriteSerializer
    permission_classes = [IsAuthenticated, IsVendorActive]

    def get_product(self):
        return get_object_or_404(
            Product,
            id=self.kwargs["id"],
            vendor=self.request.user.vendor_profile,
        )

    def get_queryset(self):
        return ProductVariant.objects.filter(product=self.get_product())

    def perform_create(self, serializer):
        serializer.save(product=self.get_product())


class ProductVariantDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PUT/DELETE /api/v1/products/vendor/my-products/<id>/variants/<variant_id>/
    """
    serializer_class   = ProductVariantWriteSerializer
    permission_classes = [IsAuthenticated, IsVendorActive]
    lookup_field       = "id"
    lookup_url_kwarg   = "variant_id"

    def get_queryset(self):
        product = get_object_or_404(
            Product,
            id=self.kwargs["id"],
            vendor=self.request.user.vendor_profile,
        )
        return ProductVariant.objects.filter(product=product)


# ═══════════════════════════════════════════════════════════════════════════════
# ADMIN PRODUCT MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

class AdminProductListView(generics.ListAPIView):
    """
    GET /api/v1/products/admin/all/
    Admin — view all products across all vendors and statuses.
    """
    serializer_class   = ProductListSerializer
    permission_classes = [IsAdminRole]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class    = ProductFilter
    search_fields      = ["name", "sku", "vendor__store_name"]
    ordering           = ["-created_at"]

    def get_queryset(self):
        status_filter = self.request.query_params.get("status")
        qs = Product.objects.select_related("vendor", "category").prefetch_related("images")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class AdminProductStatusView(APIView):
    """
    PATCH /api/v1/products/admin/<id>/status/
    Admin approves, rejects, or archives a product.
    Body: { "status": "active", "rejection_reason": "..." }
    """
    permission_classes = [IsAdminRole]

    def patch(self, request, id):
        product    = get_object_or_404(Product, id=id)
        serializer = ProductStatusSerializer(product, data=request.data, partial=True)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        new_status = serializer.validated_data.get("status")

        if new_status == "active":
            serializer.save(published_at=timezone.now())
        else:
            serializer.save()

        return Response(
            {
                "message": f"Product status updated to '{new_status}'.",
                "product": ProductDetailSerializer(product, context={"request": request}).data,
            }
        )


class AdminFeatureProductView(APIView):
    """
    PATCH /api/v1/products/admin/<id>/feature/
    Admin toggles featured status.
    """
    permission_classes = [IsAdminRole]

    def patch(self, request, id):
        product            = get_object_or_404(Product, id=id)
        product.is_featured = not product.is_featured
        product.save(update_fields=["is_featured"])
        state = "featured" if product.is_featured else "unfeatured"
        return Response({"message": f"Product {state}.", "is_featured": product.is_featured})


# ═══════════════════════════════════════════════════════════════════════════════
# WISHLIST
# ═══════════════════════════════════════════════════════════════════════════════

class WishlistView(generics.ListCreateAPIView):
    """
    GET  /api/v1/products/wishlist/    — My wishlist
    POST /api/v1/products/wishlist/    — Add product to wishlist
    Body: { "product_id": "<uuid>" }
    """
    serializer_class   = WishlistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Wishlist.objects.filter(
            user=self.request.user
        ).select_related("product__vendor", "product__category").prefetch_related("product__images")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        item = serializer.save(user=request.user)
        return Response(
            {"message": "Product added to wishlist.", "item": WishlistSerializer(item, context={"request": request}).data},
            status=status.HTTP_201_CREATED,
        )


class WishlistRemoveView(APIView):
    """
    DELETE /api/v1/products/wishlist/<product_id>/
    Remove a product from the authenticated user's wishlist.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, product_id):
        item = get_object_or_404(
            Wishlist,
            user=request.user,
            product__id=product_id,
        )
        item.delete()
        return Response({"message": "Removed from wishlist."}, status=status.HTTP_200_OK)


class WishlistCheckView(APIView):
    """
    GET /api/v1/products/wishlist/check/<product_id>/
    Check if a product is in the user's wishlist.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, product_id):
        in_wishlist = Wishlist.objects.filter(
            user=request.user,
            product__id=product_id,
        ).exists()
        return Response({"in_wishlist": in_wishlist})