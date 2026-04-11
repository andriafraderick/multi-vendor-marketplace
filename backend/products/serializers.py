"""
products/serializers.py
Serializers for Category, Product, ProductImage, ProductVariant,
ProductAttribute, and Wishlist.
"""
from rest_framework import serializers
from .models import (
    Category, Product, ProductImage,
    ProductVariant, ProductAttribute, Wishlist,
)


# ── Category ───────────────────────────────────────────────────────────────────

class CategorySerializer(serializers.ModelSerializer):
    subcategories = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()

    class Meta:
        model  = Category
        fields = (
            "id", "name", "slug", "description",
            "icon", "image", "parent", "is_active",
            "sort_order", "subcategories", "product_count",
        )
        read_only_fields = ("id", "slug")

    def get_subcategories(self, obj):
        children = obj.subcategories.filter(is_active=True)
        return CategorySerializer(children, many=True, context=self.context).data

    def get_product_count(self, obj):
        return obj.products.filter(status="active").count()


class CategoryWriteSerializer(serializers.ModelSerializer):
    """Used by admin to create/update categories."""

    class Meta:
        model  = Category
        fields = (
            "name", "slug", "description",
            "icon", "image", "parent",
            "is_active", "sort_order",
        )
        extra_kwargs = {"slug": {"required": False}}

    def validate_parent(self, value):
        # Prevent circular nesting
        if value and self.instance and value.id == self.instance.id:
            raise serializers.ValidationError("A category cannot be its own parent.")
        return value


# ── Product Images & Variants ──────────────────────────────────────────────────

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProductImage
        fields = ("id", "image", "alt_text", "sort_order", "is_primary")
        read_only_fields = ("id",)


class ProductVariantSerializer(serializers.ModelSerializer):
    final_price = serializers.ReadOnlyField()

    class Meta:
        model  = ProductVariant
        fields = (
            "id", "name", "value", "sku",
            "price_modifier", "final_price",
            "stock_quantity", "is_active",
        )
        read_only_fields = ("id", "sku", "final_price")


class ProductAttributeSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProductAttribute
        fields = ("id", "key", "value")
        read_only_fields = ("id",)


# ── Product (List view — minimal fields, fast) ─────────────────────────────────

class ProductListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for product listings.
    Used on browse/search pages — only essential fields.
    """
    primary_image    = serializers.SerializerMethodField()
    discount_percentage = serializers.ReadOnlyField()
    is_in_stock      = serializers.ReadOnlyField()
    vendor_name      = serializers.CharField(source="vendor.store_name", read_only=True)
    vendor_slug      = serializers.CharField(source="vendor.slug",       read_only=True)
    category_name    = serializers.CharField(source="category.name",     read_only=True)

    class Meta:
        model  = Product
        fields = (
            "id", "name", "slug", "short_description",
            "price", "compare_at_price", "discount_percentage",
            "average_rating", "total_reviews", "total_sales",
            "is_featured", "is_digital", "is_in_stock",
            "free_shipping", "condition",
            "vendor_name", "vendor_slug",
            "category_name", "primary_image",
            "created_at",
        )

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if img:
            request = self.context.get("request")
            url = img.image.url
            return request.build_absolute_uri(url) if request else url
        return None


# ── Product (Detail view — full fields) ───────────────────────────────────────

class ProductDetailSerializer(serializers.ModelSerializer):
    """
    Full serializer for a single product's detail page.
    """
    images      = ProductImageSerializer(many=True, read_only=True)
    variants    = ProductVariantSerializer(many=True, read_only=True)
    attributes  = ProductAttributeSerializer(many=True, read_only=True)
    discount_percentage = serializers.ReadOnlyField()
    is_in_stock         = serializers.ReadOnlyField()
    is_low_stock        = serializers.ReadOnlyField()

    # Vendor info
    vendor_id    = serializers.UUIDField(source="vendor.id",         read_only=True)
    vendor_name  = serializers.CharField(source="vendor.store_name", read_only=True)
    vendor_slug  = serializers.CharField(source="vendor.slug",       read_only=True)
    vendor_logo  = serializers.SerializerMethodField()
    vendor_rating = serializers.DecimalField(
        source="vendor.average_rating", max_digits=3, decimal_places=2, read_only=True
    )

    # Category info
    category_id   = serializers.UUIDField(source="category.id",   read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)

    class Meta:
        model  = Product
        fields = (
            "id", "name", "slug", "sku", "description",
            "short_description", "condition", "tags",
            "price", "compare_at_price", "discount_percentage",
            "stock_quantity", "is_in_stock", "is_low_stock", "track_inventory",
            "weight", "requires_shipping", "free_shipping",
            "is_featured", "is_digital",
            "average_rating", "total_reviews", "total_sales", "view_count",
            "meta_title", "meta_description",
            "vendor_id", "vendor_name", "vendor_slug", "vendor_logo", "vendor_rating",
            "category_id", "category_name", "category_slug",
            "images", "variants", "attributes",
            "created_at", "updated_at", "published_at",
        )

    def get_vendor_logo(self, obj):
        if obj.vendor.logo:
            request = self.context.get("request")
            url = obj.vendor.logo.url
            return request.build_absolute_uri(url) if request else url
        return None


# ── Product Write (Vendor creates/updates) ─────────────────────────────────────

class ProductWriteSerializer(serializers.ModelSerializer):
    """
    Used by vendors to create or update their products.
    Does NOT allow changing vendor (auto-set from request.user).
    """
    images     = ProductImageSerializer(many=True, read_only=True)
    variants   = ProductVariantSerializer(many=True, read_only=True)
    attributes = ProductAttributeSerializer(many=True, read_only=True)

    class Meta:
        model  = Product
        fields = (
            "id", "category",
            "name", "description", "short_description",
            "condition", "tags",
            "price", "compare_at_price", "cost_price",
            "stock_quantity", "low_stock_threshold", "track_inventory",
            "weight", "requires_shipping", "free_shipping",
            "is_digital", "meta_title", "meta_description",
            "images", "variants", "attributes",
        )
        read_only_fields = ("id",)

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than 0.")
        return value

    def validate(self, attrs):
        compare = attrs.get("compare_at_price")
        price   = attrs.get("price", getattr(self.instance, "price", None))
        if compare and price and compare <= price:
            raise serializers.ValidationError(
                {"compare_at_price": "Compare-at price must be higher than the selling price."}
            )
        return attrs

    def create(self, validated_data):
        # vendor is injected by the view
        return Product.objects.create(**validated_data)


# ── Admin Product Status Serializer ────────────────────────────────────────────

class ProductStatusSerializer(serializers.ModelSerializer):
    """Admin-only: approve, reject, or archive a product."""

    class Meta:
        model  = Product
        fields = ("status", "rejection_reason")

    def validate_status(self, value):
        allowed = ["active", "rejected", "archived", "draft"]
        if value not in allowed:
            raise serializers.ValidationError(f"Status must be one of: {allowed}")
        return value


# ── Product Image Upload ────────────────────────────────────────────────────────

class ProductImageUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProductImage
        fields = ("id", "image", "alt_text", "sort_order", "is_primary")
        read_only_fields = ("id",)


# ── Product Variant Write ──────────────────────────────────────────────────────

class ProductVariantWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProductVariant
        fields = (
            "id", "name", "value",
            "price_modifier", "stock_quantity", "is_active",
        )
        read_only_fields = ("id",)


# ── Wishlist ───────────────────────────────────────────────────────────────────

class WishlistSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.UUIDField(write_only=True)

    class Meta:
        model  = Wishlist
        fields = ("id", "product", "product_id", "added_at")
        read_only_fields = ("id", "added_at")

    def validate_product_id(self, value):
        try:
            product = Product.objects.get(id=value, status="active")
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found or not available.")
        self.product_obj = product
        return value

    def create(self, validated_data):
        validated_data.pop("product_id")
        user = self.context["request"].user
        product = self.product_obj

        wishlist_item, created = Wishlist.objects.get_or_create(
            user=user, product=product
        )
        if not created:
            raise serializers.ValidationError({"detail": "Product already in wishlist."})
        return wishlist_item