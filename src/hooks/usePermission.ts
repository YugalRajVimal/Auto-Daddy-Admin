// hooks/usePermission.ts
// Delegates to AuthProvider when available; falls back to localStorage for edge cases.

import { useContext, useMemo } from "react";
import { AuthContext } from "../auth/AuthProvider";
import { readSession } from "../auth/tokenStorage";

export type Action = "view" | "add" | "edit" | "delete";
export type ModuleKey =
  | "dashboard" | "users" | "services" | "categories" | "websiteTemplates"
  | "dashboardData" | "carCompanies" | "provinces" | "cities" | "domain"
  | "runningDeals" | "wallet" | "inviteHelp" | "tasks";

export interface Permissions {
  [module: string]: { view?: boolean; add?: boolean; edit?: boolean; delete?: boolean };
}

/**
 * usePermissions()
 * Returns:
 *   - isAdmin: true if the logged-in user is the main admin (unrestricted)
 *   - can(module, action): true if the user has the given permission
 *   - canView(module): shortcut for can(module, "view")
 */
export function usePermissions() {
  const auth = useContext(AuthContext);

  const fallback = useMemo(() => {
    const session = readSession();
    const role = session?.role ?? "admin";
    const permissions = session?.permissions ?? null;
    const isAdmin = role === "admin";

    const can = (module: string, action: Action): boolean => {
      if (isAdmin) return true;
      return !!(permissions?.[module]?.[action]);
    };

    return {
      isAdmin,
      can,
      canView: (module: string) => can(module, "view"),
      permissions,
      role,
    };
  }, []);

  if (auth) {
    return {
      isAdmin: auth.isAdmin,
      can: auth.can,
      canView: auth.canView,
      permissions: auth.permissions,
      role: auth.role ?? "admin",
    };
  }

  return fallback;
}

export default usePermissions;
