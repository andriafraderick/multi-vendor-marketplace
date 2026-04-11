"""
vendors/views.py
Vendor storefront, dashboard, and admin management endpoints.
"""
from rest_framework import status, generics, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import VendorProfile, VendorPayoutRequest
from .serializers import (
    VendorProfilePublicSerializer,
    VendorProfileDashboardSerializer,
    VendorProfileUpdateSerializer,
    VendorPayoutRequestSerializer,
    AdminVendorListSerializer,
    AdminVendorDetailSerializer,
    AdminVendorStatusSerializer,
)
from accounts.permissions import IsAdminUser, IsVendorActive, IsAuthenticated


# ═══════════════════════════════════════════════════════════════════════════════
# PUBLIC VENDOR STOREFRONT
# ═══════════════════════════════════════════════════════════════════════════════

class VendorStoreListView(generics.ListAPIView):
    """
    GET /api/v1/vendors/
    Public — list all active vendor stores.
    """
    serializer_class   = VendorProfilePublicSerializer
    permission_classes = [AllowAny]
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter]
    search_fields      = ["store_name", "description", "city", "country"]
    ordering_fields    = ["average_rating", "total_orders", "created_at"]
    ordering           = ["-total_orders"]

    def get_queryset(self):
        return VendorProfile.objects.filter(
            status="active"
        ).select_related("user")


class VendorStoreDetailView(generics.RetrieveAPIView):
    """
    GET /api/v1/vendors/<slug>/
    Public — view a single vendor storefront.
    """
    serializer_class   = VendorProfilePublicSerializer
    permission_classes = [AllowAny]
    lookup_field       = "slug"

    def get_queryset(self):
        return VendorProfile.objects.filter(status="active").select_related("user")


class VendorStoreProductsView(generics.ListAPIView):
    """
    GET /api/v1/vendors/<slug>/products/
    Public — all active products from a specific vendor.
    """
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        from products.serializers import ProductListSerializer
        return ProductListSerializer

    def get_queryset(self):
        from products.models import Product
        vendor = get_object_or_404(VendorProfile, slug=self.kwargs["slug"], status="active")
        return Product.objects.filter(
            vendor=vendor, status="active"
        ).select_related("category").prefetch_related("images")


# ═══════════════════════════════════════════════════════════════════════════════
# VENDOR DASHBOARD (own profile management)
# ═══════════════════════════════════════════════════════════════════════════════

class VendorDashboardView(APIView):
    """
    GET  /api/v1/vendors/dashboard/
    Full vendor dashboard data — profile + summary stats.
    """
    permission_classes = [IsAuthenticated, IsVendorActive]

    def get(self, request):
        vendor     = request.user.vendor_profile
        serializer = VendorProfileDashboardSerializer(vendor, context={"request": request})

        # Quick stats summary
        from orders.models import VendorOrder
        from django.db.models import Sum, Count

        pending_orders = VendorOrder.objects.filter(
            vendor=vendor, status="pending"
        ).count()

        processing_orders = VendorOrder.objects.filter(
            vendor=vendor, status__in=["confirmed", "processing"]
        ).count()

        return Response({
            "profile": serializer.data,
            "quick_stats": {
                "pending_orders":    pending_orders,
                "processing_orders": processing_orders,
                "total_orders":      vendor.total_orders,
                "total_sales":       str(vendor.total_sales),
                "average_rating":    str(vendor.average_rating),
                "total_reviews":     vendor.total_reviews,
            },
        })


class VendorProfileUpdateView(APIView):
    """
    PUT/PATCH /api/v1/vendors/dashboard/profile/
    Vendor updates their own store information.
    """
    permission_classes = [IsAuthenticated, IsVendorActive]

    def get(self, request):
        serializer = VendorProfileDashboardSerializer(
            request.user.vendor_profile, context={"request": request}
        )
        return Response(serializer.data)

    def put(self, request):
        return self._update(request, partial=False)

    def patch(self, request):
        return self._update(request, partial=True)

    def _update(self, request, partial):
        serializer = VendorProfileUpdateSerializer(
            request.user.vendor_profile,
            data    = request.data,
            partial = partial,
            context = {"request": request},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response({
            "message": "Store profile updated.",
            "profile": VendorProfileDashboardSerializer(
                request.user.vendor_profile, context={"request": request}
            ).data,
        })


class VendorPayoutRequestView(generics.ListCreateAPIView):
    """
    GET  /api/v1/vendors/dashboard/payouts/   — My payout requests
    POST /api/v1/vendors/dashboard/payouts/   — Request a payout
    Body: { "amount": "500.00", "notes": "Monthly payout" }
    """
    serializer_class   = VendorPayoutRequestSerializer
    permission_classes = [IsAuthenticated, IsVendorActive]

    def get_queryset(self):
        return VendorPayoutRequest.objects.filter(
            vendor=self.request.user.vendor_profile
        ).order_by("-requested_at")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        vendor = request.user.vendor_profile

        # Check available balance
        from vendors.models import CommissionRecord
        from django.db.models import Sum
        available = CommissionRecord.objects.filter(
            vendor=vendor,
            status="confirmed",
        ).aggregate(total=Sum("vendor_payout"))["total"] or 0

        requested_amount = serializer.validated_data["amount"]
        if requested_amount > available:
            return Response(
                {"error": f"Insufficient balance. Available: ${available}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payout = serializer.save(vendor=vendor)
        return Response(
            {
                "message": "Payout request submitted.",
                "payout":  VendorPayoutRequestSerializer(payout).data,
            },
            status=status.HTTP_201_CREATED,
        )


# ═══════════════════════════════════════════════════════════════════════════════
# ADMIN VENDOR MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

class AdminVendorListView(generics.ListAPIView):
    """
    GET /api/v1/vendors/admin/all/
    Admin sees all vendors — any status.
    ?status=pending|active|suspended|rejected
    """
    serializer_class   = AdminVendorListSerializer
    permission_classes = [IsAdminUser]
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter]
    search_fields      = ["store_name", "user__email", "city"]
    ordering           = ["-created_at"]

    def get_queryset(self):
        qs            = VendorProfile.objects.select_related("user")
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class AdminVendorDetailView(generics.RetrieveAPIView):
    """
    GET /api/v1/vendors/admin/all/<id>/
    Admin full detail of a vendor.
    """
    serializer_class   = AdminVendorDetailSerializer
    permission_classes = [IsAdminUser]
    lookup_field       = "id"
    queryset           = VendorProfile.objects.select_related("user")


class AdminVendorStatusView(APIView):
    """
    PATCH /api/v1/vendors/admin/all/<id>/status/
    Admin approves, suspends, or rejects a vendor.
    Body: { "status": "active", "rejection_reason": "", "commission_rate": "12.0" }
    """
    permission_classes = [IsAdminUser]

    def patch(self, request, id):
        vendor     = get_object_or_404(VendorProfile, id=id)
        serializer = AdminVendorStatusSerializer(vendor, data=request.data, partial=True)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        new_status = serializer.validated_data.get("status", vendor.status)

        if new_status == "active" and vendor.status != "active":
            serializer.save(approved_at=timezone.now(), approved_by=request.user)
            # Email the vendor
            from accounts.emails import send_vendor_status_email
            vendor.refresh_from_db()
            send_vendor_status_email(vendor)
        else:
            serializer.save()
            if new_status in ["rejected", "suspended"]:
                from accounts.emails import send_vendor_status_email
                vendor.refresh_from_db()
                send_vendor_status_email(vendor)

        return Response({
            "message": f"Vendor status updated to '{new_status}'.",
            "vendor":  AdminVendorDetailSerializer(vendor, context={"request": request}).data,
        })


class AdminPayoutListView(generics.ListAPIView):
    """
    GET /api/v1/vendors/admin/payouts/
    Admin sees all payout requests from all vendors.
    """
    serializer_class   = VendorPayoutRequestSerializer
    permission_classes = [IsAdminUser]
    filter_backends    = [filters.OrderingFilter]
    ordering           = ["-requested_at"]

    def get_queryset(self):
        qs            = VendorPayoutRequest.objects.select_related("vendor__user")
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class AdminPayoutProcessView(APIView):
    """
    PATCH /api/v1/vendors/admin/payouts/<id>/process/
    Admin marks a payout as completed or failed.
    Body: { "status": "completed", "stripe_transfer_id": "tr_xxx" }
    """
    permission_classes = [IsAdminUser]

    def patch(self, request, id):
        payout     = get_object_or_404(VendorPayoutRequest, id=id)
        new_status = request.data.get("status")
        transfer_id = request.data.get("stripe_transfer_id", "")

        if new_status not in ["completed", "failed", "processing"]:
            return Response(
                {"error": "Status must be completed, failed, or processing."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payout.status = new_status
        if new_status == "completed":
            payout.processed_at       = timezone.now()
            payout.stripe_transfer_id = transfer_id

            # Mark associated commission records as paid out
            from vendors.models import CommissionRecord
            CommissionRecord.objects.filter(
                vendor=payout.vendor,
                status="confirmed",
            ).update(status="paid_out", paid_out_at=timezone.now())

        payout.save()
        return Response({
            "message": f"Payout marked as {new_status}.",
            "payout":  VendorPayoutRequestSerializer(payout).data,
        })