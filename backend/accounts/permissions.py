"""
accounts/permissions.py
Custom DRF permission classes for Role-Based Access Control (RBAC).
Import these in any view to restrict access by role.
"""
from rest_framework.permissions import BasePermission, IsAuthenticated


class IsBuyer(BasePermission):
    """Allow access only to authenticated users with role=buyer."""
    message = "Only buyers can perform this action."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "buyer"
        )


class IsVendor(BasePermission):
    """Allow access only to authenticated users with role=vendor."""
    message = "Only vendors can perform this action."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "vendor"
        )


class IsVendorActive(BasePermission):
    """
    Allow access only to vendors whose store is ACTIVE (approved by admin).
    Use this on vendor dashboard endpoints.
    """
    message = "Your vendor account must be active to perform this action."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role != "vendor":
            return False
        try:
            return request.user.vendor_profile.status == "active"
        except Exception:
            return False


class IsAdminUser(BasePermission):
    """Allow access only to authenticated users with role=admin."""
    message = "Only admins can perform this action."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "admin"
        )


class IsOwnerOrAdmin(BasePermission):
    """
    Object-level permission.
    Allow access if the requesting user owns the object OR is an admin.
    The object must have a `user` attribute.
    """
    message = "You do not have permission to access this resource."

    def has_object_permission(self, request, view, obj):
        if request.user and request.user.role == "admin":
            return True
        return getattr(obj, "user", None) == request.user


class IsVendorOwnerOrAdmin(BasePermission):
    """
    Object-level permission for vendor-owned objects.
    The object must have a `vendor` attribute whose `user` is request.user.
    """
    message = "You do not have permission to manage this resource."

    def has_object_permission(self, request, view, obj):
        if request.user and request.user.role == "admin":
            return True
        vendor = getattr(obj, "vendor", None)
        if vendor:
            return vendor.user == request.user
        return False


class IsVerified(BasePermission):
    """Allow access only to users who have verified their email."""
    message = "Please verify your email address first."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.is_verified
        )