export type Action = "view" | "add" | "edit" | "delete";

export type UserRole =
  | "admin"
  | "subadmin"
  | "car_owner"
  | "auto_shop_owner"
  | "supervisor";

export type Portal = "admin" | "owner" | "shop";

export interface Permissions {
  [module: string]: Partial<Record<Action, boolean>>;
}

export interface UserProfile {
  id?: string;
  name?: string;
  email?: string;
}

export interface Session {
  token: string;
  role: UserRole;
  permissions?: Permissions | null;
  isLogInViaSuperAdmin?: boolean;
  profile?: UserProfile;
}

export type AuthGuardReason =
  | "unauthenticated"
  | "portal_mismatch"
  | "missing_permission"
  | "token_expired";
