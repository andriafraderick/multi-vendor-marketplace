// src/routes/RoleRoute.jsx
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUserRole, selectIsAuthenticated } from "@/store/slices/authSlice";

export default function RoleRoute({ children, allowedRoles = [] }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const role            = useSelector(selectUserRole);

  if (!isAuthenticated)           return <Navigate to="/login"     replace />;
  if (!allowedRoles.includes(role)) return <Navigate to="/unauthorized" replace />;

  return children;
}