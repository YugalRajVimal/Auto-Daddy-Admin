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

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(() => readSession());
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(() => {
    setSession(readSession());
  }, []);

  const login = useCallback((next: Session) => {
    writeSession(next);
    setSession(next);
  }, []);

  const logout = useCallback(
    (redirect = true) => {
      const signInPath = session
        ? getSignInPathForRole(session.role)
        : "/";
      clearSession();
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
      return next;
    });
  }, []);

  const can = useCallback(
    (module: string, action: Action = "view"): boolean => {
      if (!session) return false;
      if (session.role === "admin") return true;
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
      if (!current?.token) {
        if (!cancelled) {
          setSession(null);
          setIsLoading(false);
        }
        return;
      }

      const portal = getPortalForRole(current.role);

      if (portal === "admin") {
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

          if (!cancelled) {
            if (res.ok) {
              const data = await res.json();
              const next: Session = {
                ...current,
                profile:
                  current.isLogInViaSuperAdmin && data?.name
                    ? { name: data.name, email: data.email }
                    : current.profile,
              };
              writeSession(next);
              setSession(next);
            } else {
              clearSession();
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
    }),
    [session, isLoading, login, logout, can, canView, refreshSession, setProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function getPostLoginRedirect(role: UserRole): string {
  return getHomePathForRole(role);
}

export { useAuth } from "./useAuth";
