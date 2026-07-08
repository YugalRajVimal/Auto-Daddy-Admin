import type { Permissions, Session, UserRole } from "./types";

export const SESSION_KEY = "autodaddy-session";

/** Legacy keys — kept in sync on write for backward compatibility. */
export const LEGACY_KEYS = {
  adminToken: "admin-token",
  adminRole: "admin-role",
  subadminPermissions: "subadmin-permissions",
  isLogInViaSuperAdmin: "isLogInViaSuperAdmin",
} as const;

function parsePermissions(raw: string | null): Permissions | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Permissions;
  } catch {
    return null;
  }
}

function normalizeRole(raw: string | null): UserRole {
  if (raw === "subadmin") return "subadmin";
  if (raw === "car_owner") return "car_owner";
  if (raw === "auto_shop_owner") return "auto_shop_owner";
  if (raw === "supervisor") return "supervisor";
  return "admin";
}

/** Read session from unified key, falling back to legacy localStorage keys. */
export function readSession(): Session | null {
  const stored = localStorage.getItem(SESSION_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as Session;
      if (parsed?.token && parsed?.role) return parsed;
    } catch {
      // fall through to legacy keys
    }
  }

  const token = localStorage.getItem(LEGACY_KEYS.adminToken);
  if (!token) return null;

  const role = normalizeRole(localStorage.getItem(LEGACY_KEYS.adminRole));
  const permissions = parsePermissions(
    localStorage.getItem(LEGACY_KEYS.subadminPermissions)
  );
  const isLogInViaSuperAdmin =
    localStorage.getItem(LEGACY_KEYS.isLogInViaSuperAdmin) === "true";

  return {
    token,
    role,
    permissions,
    isLogInViaSuperAdmin,
  };
}

/** Persist session to unified key and legacy keys used by existing code. */
export function writeSession(session: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  localStorage.setItem(LEGACY_KEYS.adminToken, session.token);
  localStorage.setItem(LEGACY_KEYS.adminRole, session.role);

  if (session.permissions) {
    localStorage.setItem(
      LEGACY_KEYS.subadminPermissions,
      JSON.stringify(session.permissions)
    );
  } else {
    localStorage.removeItem(LEGACY_KEYS.subadminPermissions);
  }

  if (session.isLogInViaSuperAdmin) {
    localStorage.setItem(LEGACY_KEYS.isLogInViaSuperAdmin, "true");
  } else {
    localStorage.removeItem(LEGACY_KEYS.isLogInViaSuperAdmin);
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(LEGACY_KEYS.adminToken);
  localStorage.removeItem(LEGACY_KEYS.adminRole);
  localStorage.removeItem(LEGACY_KEYS.subadminPermissions);
  localStorage.removeItem(LEGACY_KEYS.isLogInViaSuperAdmin);

  // Other legacy tokens from older flows
  localStorage.removeItem("sub-admin-token");
  localStorage.removeItem("supervisor-token");
  localStorage.removeItem("therapist-token");
}

export function getAuthHeader(): Record<string, string> {
  const session = readSession();
  return session?.token ? { Authorization: session.token } : {};
}
