import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Action, Permissions, Session, UserProfile, UserRole } from "./types";
import { getPortalForRole, getSignInPathForRole, getHomePathForRole } from "./roleRegistry";
import { clearSession, readSession, writeSession } from "./tokenStorage";
import {
  isSessionUnauthorized,
  isSessionVerified,
  verifyMobileSession,
} from "../api/mobileAuth";

export interface AuthContextValue {
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
  token: string | null;
  permissions: Permissions | null;
  isAdmin: boolean;
  isLogInViaSuperAdmin: boolean;
  profile: UserProfile | undefined;
  login: (session: Session) => void;
  logout: (redirect?: boolean) => void;
  can: (module: string, action?: Action) => boolean;
  canView: (module: string) => boolean;
  refreshSession: () => void;
  setProfile: (profile: UserProfile) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const API_BASE = import.meta.env.VITE_API_URL as string;


// Updated per request: always use localStorage.setItem('permission', JSON.stringify(data.permissions)) to save
function savePermissionsToLocalStorage(permission: Permissions | null) {
  if (permission) {
    localStorage.setItem('permission', JSON.stringify(permission));
  } else {
    window.localStorage.removeItem('permission');
  }
}

function loadPermissionsFromLocalStorage(): Permissions | null {
  try {
    const item = window.localStorage.getItem('permission');
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(() => {
    const s = readSession();
    // Merge local permissions on init if present
    if (s && (!s.permissions || Object.keys(s.permissions).length === 0)) {
      const lsPerms = loadPermissionsFromLocalStorage();
      if (lsPerms) {
        s.permissions = lsPerms;
      }
    }
    return s;
  });
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(() => {
    const s = readSession();
    // Merge local permissions if missing from session
    if (s && (!s.permissions || Object.keys(s.permissions).length === 0)) {
      const lsPerms = loadPermissionsFromLocalStorage();
      if (lsPerms) {
        s.permissions = lsPerms;
      }
    }
    setSession(s);
  }, []);

  const login = useCallback((next: Session) => {
    writeSession(next);
    // Save permissions using localStorage.setItem('permission', JSON.stringify(...))
    localStorage.setItem('permission', JSON.stringify(next.permissions ?? null));
    setSession(next);
  }, []);

  const logout = useCallback(
    (redirect = true) => {
      const signInPath = session
        ? getSignInPathForRole(session.role)
        : "/";
      clearSession();
      // Remove permissions with the correct key
      localStorage.removeItem('permission');
      setSession(null);
      if (redirect) {
        window.location.href = signInPath;
      }
    },
    [session]
  );

  const setProfile = useCallback((profile: UserProfile) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev, profile };
      writeSession(next);
      // Permissions in profile should not usually change here, so do not touch LS
      return next;
    });
  }, []);

  // const setPermissions = useCallback((permissions: Permissions | null) => {
  //   setSession((prev) => {
  //     if (!prev) return prev;
  //     const next = { ...prev, permissions: permissions || {} };
  //     writeSession(next);
  //     savePermissionsToLocalStorage(permissions);
  //     return next;
  //   });
  // }, []);

  const can = useCallback(
    (module: string, action: Action = "view"): boolean => {
      if (!session) return false;
      if (
        session.role === "admin" ||
        session.role === "role_admin" ||
        session.role === "sub_admin" ||
        session.role === "associates"
      ) {
        return true;
      }
      return !!session.permissions?.[module]?.[action];
    },
    [session]
  );

  const canView = useCallback(
    (module: string) => can(module, "view"),
    [can]
  );

  // Validate session on mount
  useEffect(() => {
    let cancelled = false;

    async function validate() {
      const current = readSession();
      // Merge any "offline" permissions
      const savedPermissions = loadPermissionsFromLocalStorage();
      if (current && savedPermissions && (!current.permissions || Object.keys(current.permissions).length === 0)) {
        current.permissions = savedPermissions;
      }

      if (!current?.token) {
        if (!cancelled) {
          setSession(null);
          setIsLoading(false);
        }
        savePermissionsToLocalStorage(null);
        return;
      }

      const portal = getPortalForRole(current.role);

      if (
        portal === "admin" ||
        portal === "role_admin" ||
        portal === "sub_admin" ||
        portal === "associates"
      ) {
 
        try {
          const res = await fetch(`${API_BASE}/api/auth/admin/check-auth/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: current.token,
            },
            body: JSON.stringify({
              role: current.role === "subadmin" ? "subadmin" : "admin",
            }),
          });

          console.log(res);

          if (!cancelled) {
            if (res.ok) {
              const data = await res.json();
              const updatedPermissions = data?.permissions ? data.permissions : current.permissions;
              const next: Session = {
                ...current,
                // Backend now sends the authoritative role on every check-auth
                // response — always trust it over the possibly-stale value
                // already sitting in the local session.
                role: data?.role ?? current.role,
                profile:
                  current.isLogInViaSuperAdmin && data?.name
                    ? { name: data.name, email: data.email }
                    : current.profile,
                permissions: updatedPermissions
              };
              writeSession(next);
              localStorage.setItem('permission', JSON.stringify(updatedPermissions ?? null));
              setSession(next);
            } else {
              clearSession();
              localStorage.removeItem('permission');
              setSession(null);
            }
            setIsLoading(false);
          }
        } catch {
          if (!cancelled) {
            setSession(current);
            setIsLoading(false);
          }
        }
        return;
      }

      // Car owner / shop owner — MOBILE session check
      const phone = current.meta?.phone;
      const countryCode = current.meta?.countryCode;
      if (!phone || !countryCode) {
        if (!cancelled) {
          setSession(current);
          setIsLoading(false);
        }
        return;
      }

      try {
        const res = await verifyMobileSession(current.token, countryCode, phone);
        if (!cancelled) {
          if (isSessionVerified(res.data) || !isSessionUnauthorized(res.status, res.data)) {
            setSession(current);
          } else {
            clearSession();
            localStorage.removeItem('permission');
            setSession(null);
          }
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setSession(current);
          setIsLoading(false);
        }
      }
    }

    validate();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: !!session?.token,
      isLoading,
      role: session?.role ?? null,
      token: session?.token ?? null,
      permissions: session?.permissions ?? null,
      isAdmin: session?.role === "admin",
      isLogInViaSuperAdmin: !!session?.isLogInViaSuperAdmin,
      profile: session?.profile,
      login,
      logout,
      can,
      canView,
      refreshSession,
      setProfile,
      // Not in interface, but add for local permission saving externally if needed:
      // setPermissions,
    }),
    [session, isLoading, login, logout, can, canView, refreshSession, setProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function getPostLoginRedirect(role: UserRole): string {
  return getHomePathForRole(role);
}

export { useAuth } from "./useAuth";
