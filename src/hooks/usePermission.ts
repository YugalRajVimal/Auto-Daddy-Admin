// hooks/usePermissions.ts
// Reads subadmin permissions from the JWT / localStorage and returns helper functions.

import { useMemo } from "react";

export type Action = "view" | "add" | "edit" | "delete";
export type ModuleKey =
  | "dashboard" | "users" | "services" | "categories" | "websiteTemplates"
  | "dashboardData" | "carCompanies" | "provinces" | "cities" | "ads"
  | "runningDeals" | "wallet" | "inviteHelp" | "tasks";

export interface Permissions {
  [module: string]: { view?: boolean; add?: boolean; edit?: boolean; delete?: boolean };
}

function parsePermissions(): Permissions | null {
  try {
    const stored = localStorage.getItem("subadmin-permissions");
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function getRole(): string {
  return localStorage.getItem("admin-role") || "admin";
}

/**
 * usePermissions()
 * Returns:
 *   - isAdmin: true if the logged-in user is the main admin (unrestricted)
 *   - can(module, action): true if the user has the given permission
 *   - canView(module): shortcut for can(module, "view")
 */
export function usePermissions() {
  const role = getRole();
  const permissions = useMemo(() => parsePermissions(), []);

  const isAdmin = role === "admin";

  const can = (module: string, action: Action): boolean => {
    if (isAdmin) return true;
    return !!(permissions?.[module]?.[action]);
  };

  const canView = (module: string): boolean => can(module, "view");

  return { isAdmin, can, canView, permissions, role };
}

export default usePermissions;