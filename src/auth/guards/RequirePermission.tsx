import { Navigate } from "react-router";
import useAuth from "../useAuth";
import type { Action } from "../types";

interface RequirePermissionProps {
  module: string;
  action?: Action;
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Admin-portal module permission guard.
 * Main admin role bypasses all checks; sub-admins need explicit permission.
 */
export function RequirePermission({
  module,
  action = "view",
  children,
  redirectTo = "/admin/unauthorized",
}: RequirePermissionProps) {
  const { can } = useAuth();

  if (!can(module, action)) {
    if (import.meta.env.DEV) {
      console.debug("[auth] RequirePermission: missing_permission", { module, action });
    }
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

export default RequirePermission;
