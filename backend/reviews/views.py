"""
reviews/views.py
All review endpoints:
  - Buyers create, edit, delete their own reviews
  - Buyers upload review images
  - Buyers vote reviews helpful/not helpful
  - Buyers flag reviews
  - Vendors respond to their product reviews
  - Admin moderates reviews
  - Public reads approved reviews
"""
from rest_framework import status, generics, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Avg, Count, Q

from .models import (
    ProductReview, ReviewImage,
    ReviewHelpfulness, ReviewFlag, VendorReview,
)
from .serializers import (
    ProductReviewSerializer,
    ProductReviewCreateSerializer,
    ProductReviewUpdateSerializer,
    VendorResponseSerializer,
    ReviewHelpfulnessSerializer,
    ReviewFlagSerializer,
    AdminReviewModerationSerializer,
    AdminModerationActionSerializer,
    RatingSummarySerializer,
    VendorReviewSerializer,
    VendorReviewCreateSerializer,
    ReviewImageSerializer,
)
from .filters import ProductReviewFilter, VendorReviewFilter
from accounts.permissions import (
    IsAdminUser, IsVendorActive, IsBuyer,
)


# ═══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def get_rating_breakdown(product):
    """
    Returns star distribution for a product's approved reviews.
    Example: { "5": 40, "4": 30, "3": 20, "2": 5, "1": 5 }
    (percentages, integers)
    """
    reviews = ProductReview.objects.filter(
        product            = product,
        moderation_status  = ProductReview.ModerationStatus.APPROVED,
    )
    total = reviews.count()
    breakdown = {}
    for star in range(1, 6):
        count = reviews.filter(rating=star).count()
        breakdown[str(star)] = round((count / total * 100)) if total > 0 else 0
    return breakdown


# ═══════════════════════════════════════════════════════════════════════════════
# PUBLIC — READ REVIEWS
# ═══════════════════════════════════════════════════════════════════════════════

class ProductReviewListView(generics.ListAPIView):
    """
    GET /api/v1/reviews/products/<product_slug>/
    Public — list all approved reviews for a product.

    Query params:
        ordering=-created_at   newest first (default)
        ordering=-rating       highest rated first
        ordering=-helpful_count most helpful first
        rating=5               filter by star rating
        verified_only=true     verified purchases only
        has_images=true        reviews with photos only
    """
    serializer_class   = ProductReviewSerializer
    permission_classes = [AllowAny]
    filter_backends    = [
        DjangoFilterBackend,
        filters.OrderingFilter,
    ]
    filterset_class    = ProductReviewFilter
    ordering_fields    = ["created_at", "rating", "helpful_count"]
    ordering           = ["-created_at"]

    def get_queryset(self):
        from products.models import Product
        product = get_object_or_404(
            Product,
            slug   = self.kwargs["product_slug"],
            status = "active",
        )
        return ProductReview.objects.filter(
            product           = product,
            moderation_status = ProductReview.ModerationStatus.APPROVED,
        ).select_related(
            "buyer"
        ).prefetch_related(
            "images", "helpfulness_votes"
        )


class ProductRatingSummaryView(APIView):
    """
    GET /api/v1/reviews/products/<product_slug>/summary/
    Public — rating breakdown for a product.
    Returns average, total count, star distribution.
    """
    permission_classes = [AllowAny]

    def get(self, request, product_slug):
        from products.models import Product
        product = get_object_or_404(Product, slug=product_slug, status="active")

        approved_reviews = ProductReview.objects.filter(
            product           = product,
            moderation_status = ProductReview.ModerationStatus.APPROVED,
        )

        stats = approved_reviews.aggregate(
            avg   = Avg("rating"),
            total = Count("id"),
        )

        breakdown = get_rating_breakdown(product)

        verified_count    = approved_reviews.filter(is_verified_purchase=True).count()
        with_images_count = approved_reviews.filter(images__isnull=False).distinct().count()

        return Response({
            "average_rating":    round(stats["avg"] or 0, 2),
            "total_reviews":     stats["total"],
            "rating_breakdown":  breakdown,
            "verified_count":    verified_count,
            "with_images_count": with_images_count,
        })


# ═══════════════════════════════════════════════════════════════════════════════
# BUYER — SUBMIT REVIEW
# ═══════════════════════════════════════════════════════════════════════════════

class ProductReviewCreateView(APIView):
    """
    POST /api/v1/reviews/products/create/
    Buyer submits a review for a delivered order item.

    Body:
    {
        "order_item_id": "<uuid>",
        "rating": 5,
        "title": "Great product!",
        "body": "Really happy with this purchase.",
        "pros": "Fast delivery, great quality",
        "cons": "Packaging could be better"
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ProductReviewCreateSerializer(
            data    = request.data,
            context = {"request": request},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        review = serializer.save()
        return Response(
            {
                "message": (
                    "Review submitted successfully. "
                    "It will appear after moderation."
                ),
                "review": ProductReviewSerializer(
                    review, context={"request": request}
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )


class ProductReviewDetailView(APIView):
    """
    GET    /api/v1/reviews/<review_id>/   — Get a single approved review
    PUT    /api/v1/reviews/<review_id>/   — Buyer edits their own review
    DELETE /api/v1/reviews/<review_id>/   — Buyer deletes their own review
    """
    permission_classes = [IsAuthenticated]

    def _get_review(self, review_id):
        return get_object_or_404(ProductReview, id=review_id)

    def get(self, request, review_id):
        review = self._get_review(review_id)
        # Public users can only see approved reviews
        if (
            review.moderation_status != ProductReview.ModerationStatus.APPROVED
            and review.buyer != request.user
            and request.user.role != "admin"
        ):
            return Response(
                {"error": "Review not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(
            ProductReviewSerializer(review, context={"request": request}).data
        )

    def put(self, request, review_id):
        review = self._get_review(review_id)

        # Only the author can edit
        if review.buyer != request.user:
            return Response(
                {"error": "You can only edit your own reviews."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ProductReviewUpdateSerializer(
            review,
            data    = request.data,
            partial = True,
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(
            {
                "message": "Review updated. It will go through moderation again.",
                "review": ProductReviewSerializer(
                    review, context={"request": request}
                ).data,
            }
        )

    def delete(self, request, review_id):
        review = self._get_review(review_id)

        if review.buyer != request.user and request.user.role != "admin":
            return Response(
                {"error": "You can only delete your own reviews."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Unmark the order item so buyer can re-review if needed
        if review.order_item:
            review.order_item.review_left = False
            review.order_item.save(update_fields=["review_left"])

        review.delete()
        return Response({"message": "Review deleted."}, status=status.HTTP_200_OK)


# ═══════════════════════════════════════════════════════════════════════════════
# BUYER — REVIEW IMAGES
# ═══════════════════════════════════════════════════════════════════════════════

class ReviewImageUploadView(APIView):
    """
    POST   /api/v1/reviews/<review_id>/images/
    DELETE /api/v1/reviews/<review_id>/images/?image_id=<id>

    Buyer uploads photos to their review.
    Max 5 images per review.
    """
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser]

    def _get_own_review(self, request, review_id):
        return get_object_or_404(
            ProductReview,
            id    = review_id,
            buyer = request.user,
        )

    def post(self, request, review_id):
        review = self._get_own_review(request, review_id)

        files = request.FILES.getlist("images")
        if not files:
            return Response(
                {"error": "No images provided. Send files under the key 'images'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        current_count = review.images.count()
        if current_count + len(files) > 5:
            return Response(
                {
                    "error": (
                        f"Maximum 5 images per review. "
                        f"You already have {current_count}, "
                        f"trying to add {len(files)}."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = []
        for file in files:
            img = ReviewImage.objects.create(
                review  = review,
                image   = file,
                caption = request.data.get("caption", ""),
            )
            created.append(img)

        serializer = ReviewImageSerializer(
            created, many=True, context={"request": request}
        )
        return Response(
            {
                "message": f"{len(created)} image(s) uploaded.",
                "images":  serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    def delete(self, request, review_id):
        review   = self._get_own_review(request, review_id)
        image_id = request.query_params.get("image_id")
        if not image_id:
            return Response(
                {"error": "Provide image_id as a query parameter."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        image = get_object_or_404(ReviewImage, id=image_id, review=review)
        image.delete()
        return Response({"message": "Image deleted."})


# ═══════════════════════════════════════════════════════════════════════════════
# BUYER — HELPFULNESS VOTE
# ═══════════════════════════════════════════════════════════════════════════════

class ReviewHelpfulnessView(APIView):
    """
    POST   /api/v1/reviews/<review_id>/helpful/
    Body:  { "is_helpful": true }

    DELETE /api/v1/reviews/<review_id>/helpful/
    Removes the user's vote.

    A user can change their vote by posting again — it toggles.
    """
    permission_classes = [IsAuthenticated]

    def _get_review(self, review_id):
        return get_object_or_404(
            ProductReview,
            id                = review_id,
            moderation_status = ProductReview.ModerationStatus.APPROVED,
        )

    def post(self, request, review_id):
        review     = self._get_review(review_id)
        serializer = ReviewHelpfulnessSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Cannot vote on your own review
        if review.buyer == request.user:
            return Response(
                {"error": "You cannot vote on your own review."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        is_helpful = serializer.validated_data["is_helpful"]

        # Get or create vote
        vote, created = ReviewHelpfulness.objects.get_or_create(
            review = review,
            user   = request.user,
            defaults={"is_helpful": is_helpful},
        )

        if not created:
            # Update existing vote
            old_vote       = vote.is_helpful
            vote.is_helpful = is_helpful
            vote.save(update_fields=["is_helpful"])

            # Adjust counts
            if old_vote and not is_helpful:
                # Was helpful, now not helpful
                review.helpful_count     = max(0, review.helpful_count - 1)
                review.not_helpful_count += 1
            elif not old_vote and is_helpful:
                # Was not helpful, now helpful
                review.not_helpful_count = max(0, review.not_helpful_count - 1)
                review.helpful_count    += 1
        else:
            # New vote
            if is_helpful:
                review.helpful_count += 1
            else:
                review.not_helpful_count += 1

        review.save(update_fields=["helpful_count", "not_helpful_count"])

        return Response({
            "message":        "Vote recorded.",
            "is_helpful":     is_helpful,
            "helpful_count":  review.helpful_count,
            "not_helpful_count": review.not_helpful_count,
        })

    def delete(self, request, review_id):
        review = self._get_review(review_id)
        vote   = ReviewHelpfulness.objects.filter(
            review=review, user=request.user
        ).first()

        if not vote:
            return Response(
                {"error": "You have not voted on this review."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Adjust counts
        if vote.is_helpful:
            review.helpful_count = max(0, review.helpful_count - 1)
        else:
            review.not_helpful_count = max(0, review.not_helpful_count - 1)
        review.save(update_fields=["helpful_count", "not_helpful_count"])

        vote.delete()
        return Response({"message": "Vote removed."})


# ═══════════════════════════════════════════════════════════════════════════════
# BUYER — FLAG REVIEW
# ═══════════════════════════════════════════════════════════════════════════════

class ReviewFlagView(APIView):
    """
    POST /api/v1/reviews/<review_id>/flag/
    Buyer flags a review as inappropriate.

    Body:
    {
        "reason": "spam",
        "detail": "This review is clearly fake."
    }

    Valid reasons: spam, inappropriate, fake, irrelevant, other
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, review_id):
        review = get_object_or_404(
            ProductReview,
            id                = review_id,
            moderation_status = ProductReview.ModerationStatus.APPROVED,
        )

        # Cannot flag your own review
        if review.buyer == request.user:
            return Response(
                {"error": "You cannot flag your own review."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ReviewFlagSerializer(
            data    = request.data,
            context = {"request": request, "review": review},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(
            {"message": "Review flagged. Our team will review it shortly."},
            status=status.HTTP_201_CREATED,
        )


# ═══════════════════════════════════════════════════════════════════════════════
# BUYER — MY REVIEWS
# ═══════════════════════════════════════════════════════════════════════════════

class MyReviewsView(generics.ListAPIView):
    """
    GET /api/v1/reviews/my-reviews/
    Authenticated buyer sees all their own reviews (all statuses).
    """
    serializer_class   = ProductReviewSerializer
    permission_classes = [IsAuthenticated]
    ordering           = ["-created_at"]

    def get_queryset(self):
        return ProductReview.objects.filter(
            buyer=self.request.user
        ).select_related(
            "product", "buyer"
        ).prefetch_related("images")


class PendingReviewsView(APIView):
    """
    GET /api/v1/reviews/pending-items/
    Returns all delivered OrderItems that the buyer has NOT yet reviewed.
    Used to prompt buyers to leave a review after delivery.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from orders.models import OrderItem
        unreviewed_items = OrderItem.objects.filter(
            vendor_order__order__buyer = request.user,
            vendor_order__status       = "delivered",
            review_left                = False,
            product__isnull            = False,
        ).select_related(
            "product__vendor",
            "vendor_order__order",
        ).prefetch_related("product__images")

        data = []
        for item in unreviewed_items:
            primary_image = (
                item.product.images.filter(is_primary=True).first()
                or item.product.images.first()
            )
            image_url = None
            if primary_image:
                image_url = (
                    request.build_absolute_uri(primary_image.image.url)
                    if request else primary_image.image.url
                )
            data.append({
                "order_item_id":  str(item.id),
                "order_number":   item.vendor_order.order.order_number,
                "product_id":     str(item.product.id) if item.product else None,
                "product_name":   item.product_name,
                "product_slug":   item.product.slug if item.product else None,
                "vendor_name":    item.vendor_order.vendor.store_name,
                "product_image":  image_url,
                "delivered_at":   item.vendor_order.delivered_at,
            })

        return Response({"pending_reviews": data, "count": len(data)})


# ═══════════════════════════════════════════════════════════════════════════════
# VENDOR — RESPOND TO REVIEWS
# ═══════════════════════════════════════════════════════════════════════════════

class VendorReviewListView(generics.ListAPIView):
    """
    GET /api/v1/reviews/vendor/my-reviews/
    Vendor sees all approved reviews for their products.
    Can filter by responded/unresponded.
    """
    serializer_class   = ProductReviewSerializer
    permission_classes = [IsAuthenticated, IsVendorActive]
    filter_backends    = [ProductReviewFilter, filters.OrderingFilter]
    ordering           = ["-created_at"]

    def get_queryset(self):
        qs = ProductReview.objects.filter(
            product__vendor   = self.request.user.vendor_profile,
            moderation_status = ProductReview.ModerationStatus.APPROVED,
        ).select_related(
            "product", "buyer"
        ).prefetch_related("images")

        # ?responded=true|false
        responded = self.request.query_params.get("responded")
        if responded == "true":
            qs = qs.exclude(vendor_response="")
        elif responded == "false":
            qs = qs.filter(vendor_response="")

        return qs


class VendorRespondToReviewView(APIView):
    """
    POST  /api/v1/reviews/vendor/<review_id>/respond/
    Vendor adds or updates their response to a product review.

    Body: { "vendor_response": "Thank you for your feedback!" }

    DELETE /api/v1/reviews/vendor/<review_id>/respond/
    Vendor removes their response.
    """
    permission_classes = [IsAuthenticated, IsVendorActive]

    def _get_review(self, request, review_id):
        """Get a review that belongs to the vendor's product."""
        return get_object_or_404(
            ProductReview,
            id                        = review_id,
            product__vendor           = request.user.vendor_profile,
            moderation_status         = ProductReview.ModerationStatus.APPROVED,
        )

    def post(self, request, review_id):
        review     = self._get_review(request, review_id)
        serializer = VendorResponseSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        review.vendor_response     = serializer.validated_data["vendor_response"]
        review.vendor_responded_at = timezone.now()
        review.save(update_fields=["vendor_response", "vendor_responded_at"])

        action = "updated" if review.vendor_response else "added"
        return Response({
            "message":          f"Response {action} successfully.",
            "vendor_response":  review.vendor_response,
            "responded_at":     review.vendor_responded_at,
        })

    def delete(self, request, review_id):
        review = self._get_review(request, review_id)
        review.vendor_response     = ""
        review.vendor_responded_at = None
        review.save(update_fields=["vendor_response", "vendor_responded_at"])
        return Response({"message": "Vendor response removed."})


# ═══════════════════════════════════════════════════════════════════════════════
# ADMIN — REVIEW MODERATION
# ═══════════════════════════════════════════════════════════════════════════════

class AdminReviewListView(generics.ListAPIView):
    """
    GET /api/v1/reviews/admin/all/
    Admin sees all reviews across all products.
    Filter by moderation status, rating, product, vendor.

    ?status=pending|approved|rejected|flagged
    ?product=<product_id>
    ?vendor=<vendor_id>
    """
    serializer_class   = AdminReviewModerationSerializer
    permission_classes = [IsAdminUser]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class    = ProductReviewFilter
    search_fields      = ["buyer__email", "product__name", "title", "body"]
    ordering           = ["-created_at"]

    def get_queryset(self):
        qs = ProductReview.objects.select_related(
            "product__vendor", "buyer"
        ).prefetch_related("images", "flags")

        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(moderation_status=status_filter)

        product_id = self.request.query_params.get("product")
        if product_id:
            qs = qs.filter(product__id=product_id)

        vendor_id = self.request.query_params.get("vendor")
        if vendor_id:
            qs = qs.filter(product__vendor__id=vendor_id)

        return qs


class AdminReviewDetailView(generics.RetrieveAPIView):
    """
    GET /api/v1/reviews/admin/<review_id>/
    Admin views full detail of one review.
    """
    serializer_class   = AdminReviewModerationSerializer
    permission_classes = [IsAdminUser]
    lookup_field       = "id"
    queryset           = ProductReview.objects.select_related(
        "product__vendor", "buyer"
    ).prefetch_related("images", "flags")


class AdminModerateReviewView(APIView):
    """
    POST /api/v1/reviews/admin/<review_id>/moderate/
    Admin approves, rejects, flags, or unflags a review.

    Body:
    {
        "action": "approve",
        "note": "Review meets community guidelines."
    }

    Actions:
        approve  → moderation_status = approved
        reject   → moderation_status = rejected
        flag     → moderation_status = flagged
        unflag   → moderation_status = approved (clears flags)
    """
    permission_classes = [IsAdminUser]

    def post(self, request, review_id):
        review     = get_object_or_404(ProductReview, id=review_id)
        serializer = AdminModerationActionSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        action = serializer.validated_data["action"]
        note   = serializer.validated_data.get("note", "")

        action_map = {
            "approve": ProductReview.ModerationStatus.APPROVED,
            "reject":  ProductReview.ModerationStatus.REJECTED,
            "flag":    ProductReview.ModerationStatus.FLAGGED,
            "unflag":  ProductReview.ModerationStatus.APPROVED,
        }

        new_status = action_map[action]

        review.moderation_status = new_status
        review.moderation_note   = note
        review.moderated_by      = request.user
        review.moderated_at      = timezone.now()
        review.save(update_fields=[
            "moderation_status", "moderation_note",
            "moderated_by", "moderated_at",
        ])

        # If unflagging — clear all flags
        if action == "unflag":
            review.flags.all().delete()

        # Recalculate product rating after moderation
        review._update_product_rating()

        return Response({
            "message": f"Review {action}d successfully.",
            "review":  AdminReviewModerationSerializer(
                review, context={"request": request}
            ).data,
        })


class AdminBulkModerateView(APIView):
    """
    POST /api/v1/reviews/admin/bulk-moderate/
    Admin performs bulk moderation action on multiple reviews.

    Body:
    {
        "review_ids": ["<uuid>", "<uuid>"],
        "action": "approve",
        "note": "Bulk approval"
    }
    """
    permission_classes = [IsAdminUser]

    def post(self, request):
        review_ids = request.data.get("review_ids", [])
        action     = request.data.get("action")
        note       = request.data.get("note", "Bulk action.")

        if not review_ids:
            return Response(
                {"error": "Provide review_ids as a list."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        valid_actions = ["approve", "reject", "flag"]
        if action not in valid_actions:
            return Response(
                {"error": f"Action must be one of: {valid_actions}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        action_map = {
            "approve": ProductReview.ModerationStatus.APPROVED,
            "reject":  ProductReview.ModerationStatus.REJECTED,
            "flag":    ProductReview.ModerationStatus.FLAGGED,
        }

        updated = ProductReview.objects.filter(
            id__in=review_ids
        ).update(
            moderation_status = action_map[action],
            moderation_note   = note,
            moderated_by      = request.user,
            moderated_at      = timezone.now(),
        )

        return Response({
            "message": f"{updated} review(s) {action}d.",
            "updated_count": updated,
        })


class AdminFlaggedReviewsView(generics.ListAPIView):
    """
    GET /api/v1/reviews/admin/flagged/
    Admin sees all flagged reviews sorted by flag count.
    Most flagged first — highest priority for moderation.
    """
    serializer_class   = AdminReviewModerationSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return ProductReview.objects.filter(
            moderation_status=ProductReview.ModerationStatus.FLAGGED
        ).annotate(
            flag_count=Count("flags")
        ).select_related(
            "product__vendor", "buyer"
        ).prefetch_related(
            "images", "flags"
        ).order_by("-flag_count", "-created_at")


# ═══════════════════════════════════════════════════════════════════════════════
# VENDOR REVIEWS (store-level)
# ═══════════════════════════════════════════════════════════════════════════════

class VendorStoreReviewListView(generics.ListAPIView):
    """
    GET /api/v1/reviews/vendors/<vendor_slug>/
    Public — all approved vendor-level reviews for a store.
    """
    serializer_class   = VendorReviewSerializer
    permission_classes = [AllowAny]
    filter_backends    = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class    = VendorReviewFilter
    ordering_fields    = ["created_at", "rating"]
    ordering           = ["-created_at"]

    def get_queryset(self):
        from vendors.models import VendorProfile
        vendor = get_object_or_404(
            VendorProfile,
            slug   = self.kwargs["vendor_slug"],
            status = "active",
        )
        return VendorReview.objects.filter(
            vendor      = vendor,
            is_approved = True,
        ).select_related("buyer")


class VendorStoreRatingSummaryView(APIView):
    """
    GET /api/v1/reviews/vendors/<vendor_slug>/summary/
    Public — vendor store rating summary.
    """
    permission_classes = [AllowAny]

    def get(self, request, vendor_slug):
        from vendors.models import VendorProfile
        vendor = get_object_or_404(VendorProfile, slug=vendor_slug, status="active")

        reviews = VendorReview.objects.filter(vendor=vendor, is_approved=True)
        stats   = reviews.aggregate(
            avg_overall       = Avg("rating"),
            avg_communication = Avg("communication_rating"),
            avg_shipping      = Avg("shipping_rating"),
            total             = Count("id"),
        )

        breakdown = {}
        total     = stats["total"]
        for star in range(1, 6):
            count             = reviews.filter(rating=star).count()
            breakdown[str(star)] = round((count / total * 100)) if total > 0 else 0

        return Response({
            "vendor_name":         vendor.store_name,
            "average_rating":      round(stats["avg_overall"] or 0, 2),
            "communication_rating": round(stats["avg_communication"] or 0, 2),
            "shipping_rating":     round(stats["avg_shipping"] or 0, 2),
            "total_reviews":       total,
            "rating_breakdown":    breakdown,
        })


class VendorReviewCreateView(APIView):
    """
    POST /api/v1/reviews/vendors/create/
    Buyer leaves a store-level review after a delivered VendorOrder.

    Body:
    {
        "vendor_order_id": "<uuid>",
        "rating": 5,
        "communication_rating": 5,
        "shipping_rating": 4,
        "body": "Great seller, fast delivery!"
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = VendorReviewCreateSerializer(
            data    = request.data,
            context = {"request": request},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        review = serializer.save()
        return Response(
            {
                "message": "Vendor review submitted successfully.",
                "review":  VendorReviewSerializer(
                    review, context={"request": request}
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )