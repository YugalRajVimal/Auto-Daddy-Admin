import type { Portal, UserRole } from "./types";

export interface RoleConfig {
  role: UserRole;
  portal: Portal;
  homePath: string;
  signInPath: string;
  label: string;
}

export const ROLE_REGISTRY: Record<UserRole, RoleConfig> = {
  admin: {
    role: "admin",
    portal: "admin",
    homePath: "/admin",
    signInPath: "/",
    label: "Admin",
  },
  subadmin: {
    role: "subadmin",
    portal: "admin",
    homePath: "/admin",
    signInPath: "/subadmin/signin",
    label: "Sub Admin",
  },
  car_owner: {
    role: "car_owner",
    portal: "owner",
    homePath: "/owner",
    signInPath: "/owner/signin",
    label: "Car Owner",
  },
  auto_shop_owner: {
    role: "auto_shop_owner",
    portal: "shop",
    homePath: "/shop",
    signInPath: "/shop/signin",
    label: "Auto Shop Owner",
  },
  supervisor: {
    role: "supervisor",
    portal: "admin",
    homePath: "/supervisor",
    signInPath: "/supervisor/signin",
    label: "Supervisor",
  },
};

export function getRoleConfig(role: UserRole): RoleConfig {
  return ROLE_REGISTRY[role];
}

export function getPortalForRole(role: UserRole): Portal {
  return ROLE_REGISTRY[role].portal;
}

export function getSignInPathForRole(role: UserRole): string {
  return ROLE_REGISTRY[role].signInPath;
}

export function getHomePathForRole(role: UserRole): string {
  return ROLE_REGISTRY[role].homePath;
}
