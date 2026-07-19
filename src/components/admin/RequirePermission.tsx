// components/admin/RequirePermission.tsx
import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

interface RequirePermissionProps {
  /** "navKey" or "navKey.subKey" from config/permissionModules.ts. Omit to only require login. */
  modulePath?: string;
  /** Restrict to SuperAdmin regardless of the permission matrix. */
  superAdminOnly?: boolean;
  children: ReactNode;
}

export default function RequirePermission({
  modulePath,
  superAdminOnly,
  children,
}: RequirePermissionProps) {
  const { isAuthenticated, isSuperAdmin, canAccess, loading } = useAdminAuth();
  const location = useLocation();

  // Avoid a flash-redirect to /login while the session is still being
  // restored from localStorage on first paint.
  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (superAdminOnly && !isSuperAdmin) {
    return <Navigate to="/admin/403" replace />;
  }

  if (modulePath && !canAccess(modulePath)) {
    return <Navigate to="/admin/403" replace />;
  }

  return <>{children}</>;
}