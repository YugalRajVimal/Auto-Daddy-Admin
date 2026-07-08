import { Navigate, useLocation } from "react-router";
import type { Portal } from "../types";
import { getPortalForRole } from "../roleRegistry";
import { useAuth } from "../useAuth";

interface RequireAuthProps {
  children: React.ReactNode;
  /** When set, only users belonging to this portal may access. */
  portal?: Portal;
  /** Redirect target when unauthenticated. Defaults to `/`. */
  signInPath?: string;
  /** Redirect when authenticated but wrong portal. */
  unauthorizedPath?: string;
}

export function RequireAuth({
  children,
  portal,
  signInPath = "/",
  unauthorizedPath = "/admin/unauthorized",
}: RequireAuthProps) {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ad-app-bg">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
      </div>
    );
  }

  if (!isAuthenticated || !role) {
    if (import.meta.env.DEV) {
      console.debug("[auth] RequireAuth: unauthenticated", { path: location.pathname });
    }
    return <Navigate to={signInPath} replace state={{ from: location.pathname }} />;
  }

  if (portal && getPortalForRole(role) !== portal) {
    if (import.meta.env.DEV) {
      console.debug("[auth] RequireAuth: portal_mismatch", { role, expected: portal });
    }
    return <Navigate to={unauthorizedPath} replace />;
  }

  return <>{children}</>;
}

export default RequireAuth;
