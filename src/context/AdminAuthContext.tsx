// context/AdminAuthContext.tsx
//
// Single source of truth for "who is logged in and what can they do" on the
// admin side. Wraps POST /api/auth/staff/login, persists { token, user } to
// localStorage under the same "admin-token" key your pages already read,
// and exposes canAccess() built on config/permissionModules.ts.

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    type ReactNode,
  } from "react";
  import axios from "axios";
  import { canAccess as perCanAccess, type Permissions, type StaffRole } from "../config/permissionModules";
  
  const API = import.meta.env.VITE_API_URL;
  const TOKEN_KEY = "admin-token";
  const USER_KEY = "admin-user";

  
  
  export interface AdminAuthUser {
    id: string;
    name: string;
    email: string;
    role: StaffRole;
    // Backend returns null for role "admin" (SuperAdmin bypasses all checks).
    permissions: Permissions | null;
  }
  
  interface AdminAuthContextValue {
    user: AdminAuthUser | null;
    token: string | null;
    /** True only while restoring a session from localStorage on first mount. */
    loading: boolean;
    isAuthenticated: boolean;
    isSuperAdmin: boolean;
    login: (email: string, password: string) => Promise<AdminAuthUser>;
    logout: () => void;
    /** "navKey" or "navKey.subKey" — always true for SuperAdmin. */
    canAccess: (modulePath: string) => boolean;
  }
  
  const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);
  
  function readStoredUser(): AdminAuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AdminAuthUser) : null;
    } catch {
      return null;
    }
  }
  
  export function AdminAuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AdminAuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
  
    // Restore session on mount + keep axios default header in sync so pages
    // that don't manually pass headers still get authenticated requests.
    useEffect(() => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = readStoredUser();
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        axios.defaults.headers.common.Authorization = storedToken;
      }
      setLoading(false);
    }, []);
  
    // Global 401/403 handling: if a request comes back unauthorized, the
    // stored token is stale (expired/revoked/deactivated) — clear the
    // session so the next render redirects to login instead of looping on
    // failed requests.
    useEffect(() => {
      const interceptor = axios.interceptors.response.use(
        (res) => res,
        (err) => {
          if (err?.response?.status === 401) {
            logout();
          }
          return Promise.reject(err);
        }
      );
      return () => axios.interceptors.response.eject(interceptor);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
  
    const login = useCallback(async (email: string, password: string) => {
      const res = await axios.post(`${API}/api/auth/staff/login`, { email, password });
      const { token: newToken, user: newUser } = res.data as { token: string; user: AdminAuthUser };
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
      axios.defaults.headers.common.Authorization = newToken;
      setToken(newToken);
      setUser(newUser);
      return newUser;
    }, []);
  
    const logout = useCallback(() => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      delete axios.defaults.headers.common.Authorization;
      setToken(null);
      setUser(null);
    }, []);
  
    const isSuperAdmin = user?.role === "admin";
  
    const canAccess = useCallback(
      (modulePath: string) => {
        if (!user) return false;
        if (isSuperAdmin) return true;
        return perCanAccess(user.permissions ?? undefined, modulePath);
      },
      [user, isSuperAdmin]
    );
  
    const value: AdminAuthContextValue = {
      user,
      token,
      loading,
      isAuthenticated: !!user && !!token,
      isSuperAdmin,
      login,
      logout,
      canAccess,
    };
  
    return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
  }
  
  export function useAdminAuth(): AdminAuthContextValue {
    const ctx = useContext(AdminAuthContext);
    if (!ctx) throw new Error("useAdminAuth must be used within an <AdminAuthProvider>");
    return ctx;
  }