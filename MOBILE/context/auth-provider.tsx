import { getJson, postJson, type ApiResponse } from "@/lib/api";
import { getDeviceIdForApi } from "@/lib/device-id";
import { getFcmTokenForApi } from "@/lib/fcm-token";
import { isAssociateRole } from "@/lib/associate-roles";
import {
  clearAuthSession,
  getAuthSession,
  saveAuthSession,
  saveAutoShopOwnerProfile,
  saveCarOwnerDashboardDetails,
  saveDashboardDetails,
  AUTH_LAST_ROLE_KEY,
  type AuthSessionMeta,
} from "@/lib/auth";
import {
  createDevAssociateMeta,
  DEV_ASSOCIATE_TOKEN,
  isDevAssociateToken,
} from "@/lib/dev-associate-session";
import type { CarOwnerDashboardApiResponse } from "@/types/car-owner-dashboard";
import { fetchAndMergeShopOwnerPortal } from "@/lib/shop-owner-portal-bootstrap";
import {
  isAuthSessionUnauthorized,
  isAuthSessionVerified,
  normalizeAuthSessionPhone,
  verifyAuthSessionWithServer,
} from "@/lib/verify-auth-session";
import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

type OtpRequestResponse = {
  message?: string;
};

type VerifyOtpResponse = {
  message?: string;
  token?: string;
  isProfileComplete?: boolean;
  isAutoShopBusinessProfileComplete?: boolean;
  role?: string;
  name?: string;
  profilePhoto?: string | null;
};

type UserProfileResponse = {
  success?: boolean;
  data?: {
    role?: string;
    name?: string;
    isProfileComplete?: boolean;
    profilePhoto?: string | null;
    isAutoShopBusinessProfileComplete?: boolean;
    phone?: string;
    countryCode?: string;
  };
};

function mergeSessionPhoneFields(
  base: AuthSessionMeta,
  phone?: string | null,
  countryCode?: string | null
): AuthSessionMeta {
  const nextPhone = phone?.trim() ? normalizeAuthSessionPhone(phone) : null;
  const nextCountryCode = countryCode?.trim() || null;
  return {
    ...base,
    phone: nextPhone ?? base.phone ?? null,
    countryCode: nextCountryCode ?? base.countryCode ?? null,
  };
}

type AuthContextType = {
  token: string | null;
  meta: AuthSessionMeta | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  /** Increments whenever background profile/dashboard refresh completes. */
  sessionRevision: number;
  /**
   * Persist + publish the latest profile fields when a car-owner dashboard payload
   * includes fresher `userProfile` than what's currently stored.
   */
  syncCarOwnerProfileFromDashboard: (profile: CarOwnerDashboardApiResponse["userProfile"] | null | undefined) => Promise<void>;
  sendOtp: (phone: string, countryCode: string) => Promise<ApiResponse<OtpRequestResponse>>;
  verifyOtp: (
    phone: string,
    countryCode: string,
    otp: string
  ) => Promise<ApiResponse<VerifyOtpResponse>>;
  logout: () => Promise<void>;
  refreshSession: (options?: {
    onProgress?: (label: string) => void;
    /** Called when backend rejects session (401/403) with a message. */
    onInvalidSession?: (message?: string) => void;
  }) => Promise<void>;
  /** Dev-only: local associate session without backend OTP. */
  enterDevAssociateSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

function isCarOwnerRole(role: string | null | undefined): boolean {
  const r = (role ?? "").toLowerCase().replace(/[-_\s]/g, "");
  return r === "carowner";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [meta, setMeta] = useState<AuthSessionMeta | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [sessionRevision, setSessionRevision] = useState(0);
  const metaRef = useRef<AuthSessionMeta | null>(null);
  const enrichInFlightRef = useRef(false);
  const lastEnrichedTokenRef = useRef<string | null>(null);
  const sessionVerifyInFlightRef = useRef(false);

  useEffect(() => {
    metaRef.current = meta;
  }, [meta]);

  function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error("timeout")), ms);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => {
      if (timeoutId) clearTimeout(timeoutId);
    }) as Promise<T>;
  }

  const invalidateStoredSession = useCallback(async () => {
    await clearAuthSession();
    lastEnrichedTokenRef.current = null;
    setToken(null);
    setMeta(null);
    setSessionRevision((v) => v + 1);
  }, []);

  /** POST /api/auth/ when login phone is stored; expired token or wrong phone → logout. */
  const checkStoredSessionWithAuthEndpoint = useCallback(
    async (
      authToken: string,
      sessionMeta: AuthSessionMeta | null,
      onInvalidSession?: (message?: string) => void
    ): Promise<"valid" | "invalid" | "skipped"> => {
      const phone = sessionMeta?.phone?.trim();
      const countryCode = sessionMeta?.countryCode?.trim();
      if (!phone || !countryCode) {
        return "skipped";
      }

      try {
        const response = await withTimeout(
          verifyAuthSessionWithServer(authToken, countryCode, phone),
          6000
        );
        if (isAuthSessionVerified(response)) {
          return "valid";
        }
        if (isAuthSessionUnauthorized(response)) {
          const msg =
            typeof response.data?.message === "string"
              ? response.data.message
              : typeof response.data?.error === "string"
                ? response.data.error
                : undefined;
          if (msg) {
            onInvalidSession?.(msg);
          }
          return "invalid";
        }
        return "skipped";
      } catch {
        return "skipped";
      }
    },
    []
  );

  const refreshMetaFromServer = useCallback(
    async (
      authToken: string,
      fallbackMeta: AuthSessionMeta | null,
      options?: { onProgress?: (label: string) => void; onInvalidSession?: (message?: string) => void }
    ) => {
      options?.onProgress?.("Fetching user profile");
      const userResponse = await getJson<UserProfileResponse>("/api/user/profile", {
        authToken,
      });

      const profileData = userResponse.data?.data;
      let nextMeta: AuthSessionMeta = mergeSessionPhoneFields(
        {
          role: profileData?.role ?? fallbackMeta?.role ?? null,
          name: profileData?.name ?? fallbackMeta?.name ?? null,
          isProfileComplete:
            profileData?.isProfileComplete ?? fallbackMeta?.isProfileComplete ?? null,
          isAutoShopBusinessProfileComplete:
            profileData?.isAutoShopBusinessProfileComplete ??
            fallbackMeta?.isAutoShopBusinessProfileComplete ??
            null,
          profilePhoto: profileData?.profilePhoto ?? fallbackMeta?.profilePhoto ?? null,
          phone: fallbackMeta?.phone ?? null,
          countryCode: fallbackMeta?.countryCode ?? null,
        },
        profileData?.phone,
        profileData?.countryCode
      );

      if (userResponse.status === 401 || userResponse.status === 403) {
        const msg =
          userResponse.data &&
          typeof userResponse.data === "object" &&
          "message" in userResponse.data &&
          typeof (userResponse.data as { message?: unknown }).message === "string"
            ? String((userResponse.data as { message?: string }).message ?? "")
            : undefined;
        if (msg) {
          options?.onInvalidSession?.(msg);
        }
        throw new Error("session_invalid");
      }

      if (isAssociateRole(nextMeta.role)) {
        return nextMeta;
      }

      if (nextMeta.role === "autoshopowner") {
        options?.onProgress?.("Fetching shop owner portal");
        const portal = await fetchAndMergeShopOwnerPortal(authToken);
        if (portal.profile) {
          await saveAutoShopOwnerProfile(portal.profile);
        }
        if (portal.dashboard?.success) {
          await saveDashboardDetails(portal.dashboard);
        }
        const up = portal.userProfileMeta;
        if (up) {
          nextMeta = mergeSessionPhoneFields(
            {
              ...nextMeta,
              role: up.role ?? nextMeta.role,
              name: up.name ?? nextMeta.name,
              isProfileComplete: up.isProfileComplete ?? nextMeta.isProfileComplete,
              isAutoShopBusinessProfileComplete:
                up.isAutoShopBusinessProfileComplete ??
                nextMeta.isAutoShopBusinessProfileComplete,
            },
            up.phone,
            up.countryCode
          );
        }
      }

      if (isCarOwnerRole(nextMeta.role)) {
        options?.onProgress?.("Fetching dashboard");
        const carOwnerDashboardResponse = await getJson<CarOwnerDashboardApiResponse>(
          "/api/user/dashboard",
          { authToken }
        );
        if (carOwnerDashboardResponse.ok && carOwnerDashboardResponse.data?.success) {
          await saveCarOwnerDashboardDetails(carOwnerDashboardResponse.data);
          const up = carOwnerDashboardResponse.data.userProfile;
          if (up) {
            nextMeta = mergeSessionPhoneFields({
              ...nextMeta,
              role: up.role ?? nextMeta.role,
              name: up.name ?? nextMeta.name,
              isProfileComplete: up.isProfileComplete ?? nextMeta.isProfileComplete,
              profilePhoto: up.profilePhoto ?? nextMeta.profilePhoto,
            }, up.phone, up.countryCode);
          }
        }
      }

      return nextMeta;
    },
    []
  );

  const syncCarOwnerProfileFromDashboard = useCallback(
    async (profile: CarOwnerDashboardApiResponse["userProfile"] | null | undefined) => {
      if (!token || !profile) return;

      const current: AuthSessionMeta = metaRef.current ?? {
        role: null,
        name: null,
        isProfileComplete: null,
        isAutoShopBusinessProfileComplete: null,
        profilePhoto: null,
      };

      const next: AuthSessionMeta = {
        ...current,
        role: profile.role ?? current.role,
        name: profile.name ?? current.name,
        isProfileComplete: profile.isProfileComplete ?? current.isProfileComplete,
        profilePhoto: profile.profilePhoto ?? current.profilePhoto,
      };
      const nextWithPhone = mergeSessionPhoneFields(next, profile.phone, profile.countryCode);

      // Avoid extra writes/rerenders when nothing changed.
      const changed =
        nextWithPhone.role !== current.role ||
        nextWithPhone.name !== current.name ||
        nextWithPhone.isProfileComplete !== current.isProfileComplete ||
        nextWithPhone.profilePhoto !== current.profilePhoto ||
        nextWithPhone.phone !== current.phone ||
        nextWithPhone.countryCode !== current.countryCode;
      if (!changed) return;

      await saveAuthSession(token, nextWithPhone);
      setMeta(nextWithPhone);
      setSessionRevision((v) => v + 1);
    },
    [token]
  );

  const refreshSession = useCallback(async (options?: { onProgress?: (label: string) => void; onInvalidSession?: (message?: string) => void }) => {
    const session = await getAuthSession();
    if (!session.token) {
      setToken(null);
      setMeta(null);
      return;
    }

    const verifyResult = await checkStoredSessionWithAuthEndpoint(
      session.token,
      session.meta,
      options?.onInvalidSession
    );
    if (verifyResult === "invalid") {
      await invalidateStoredSession();
      return;
    }

    setToken(session.token);
    try {
      const refreshedMeta = await withTimeout(
        refreshMetaFromServer(session.token, session.meta, {
          onProgress: options?.onProgress,
          onInvalidSession: options?.onInvalidSession,
        }),
        6000
      );
      await saveAuthSession(session.token, refreshedMeta);
      setMeta(refreshedMeta);
      setSessionRevision((v) => v + 1);
    } catch (e) {
      if (e instanceof Error && e.message === "session_invalid") {
        await invalidateStoredSession();
        return;
      }
      setMeta(session.meta);
    }
  }, [checkStoredSessionWithAuthEndpoint, invalidateStoredSession, refreshMetaFromServer]);

  useEffect(() => {
    let mounted = true;
    async function bootstrap() {
      try {
        if (__DEV__) {
          try {
            const [tokenRaw, metaRaw, lastRoleRaw, shopProfileRaw, dashboardRaw] = await Promise.all([
              SecureStore.getItemAsync("authToken"),
              SecureStore.getItemAsync("authMeta"),
              SecureStore.getItemAsync("authLastRole"),
              SecureStore.getItemAsync("autoShopOwnerProfile"),
              SecureStore.getItemAsync("autoShopDashboardDetails"),
            ]);

            const safe = {
              authToken: tokenRaw ? "[REDACTED]" : null,
              authMeta: metaRaw ?? null,
              authLastRole: lastRoleRaw ?? null,
              autoShopOwnerProfile: shopProfileRaw ? `[stored ${shopProfileRaw.length} chars]` : null,
              autoShopDashboardDetails: dashboardRaw ? `[stored ${dashboardRaw.length} chars]` : null,
            };
            // eslint-disable-next-line no-console
            console.log("[Auth bootstrap] SecureStore snapshot", safe);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.log("[Auth bootstrap] SecureStore snapshot failed", e);
          }
        }

        const session = await getAuthSession();
        if (!mounted) {
          return;
        }
        if (!session.token) {
          setToken(null);
          setMeta(null);
          return;
        }

        setToken(session.token);
        // Immediately hydrate meta from storage so role-based routing can proceed
        // even if the network refresh is slow or fails.
        if (session.meta?.role) {
          setMeta(session.meta);
        } else {
          // Older installs may not have meta/role yet; fall back to lastRole key.
          const lastRole = await SecureStore.getItemAsync(AUTH_LAST_ROLE_KEY);
          setMeta(
            lastRole
              ? {
                  role: lastRole,
                  name: null,
                  isProfileComplete: null,
                  isAutoShopBusinessProfileComplete: null,
                  profilePhoto: null,
                }
              : session.meta
          );
        }

        if (isDevAssociateToken(session.token)) {
          setMeta(session.meta ?? createDevAssociateMeta());
          return;
        }

        const verifyResult = await checkStoredSessionWithAuthEndpoint(
          session.token,
          session.meta
        );
        if (!mounted) {
          return;
        }
        if (verifyResult === "invalid") {
          await invalidateStoredSession();
          return;
        }

        try {
          const refreshedMeta = await withTimeout(
            refreshMetaFromServer(session.token, session.meta),
            6000
          );
          if (!mounted) {
            return;
          }
          await saveAuthSession(session.token, refreshedMeta);
          setMeta(refreshedMeta);
        } catch (e) {
          if (!mounted) {
            return;
          }
          if (e instanceof Error && e.message === "session_invalid") {
            await invalidateStoredSession();
            return;
          }
          // Keep cached meta; don't block boot forever if network hangs.
          setMeta((prev) => prev ?? session.meta);
        } finally {
          // If we have a token but still don't know the role, the session is not usable.
          // Force a fresh login instead of routing the user into the wrong role group.
          if (mounted) {
            const nextMeta = metaRef.current;
            if (!nextMeta?.role) {
              await clearAuthSession();
              setToken(null);
              setMeta(null);
              setSessionRevision((v) => v + 1);
            }
          }
        }
      } finally {
        if (mounted) {
          setIsBootstrapping(false);
        }
      }
    }
    void bootstrap();

    return () => {
      mounted = false;
    };
  }, [checkStoredSessionWithAuthEndpoint, invalidateStoredSession, refreshMetaFromServer]);

  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState !== "active") {
        return;
      }
      void (async () => {
        if (sessionVerifyInFlightRef.current || isBootstrapping) {
          return;
        }
        const session = await getAuthSession();
        if (!session.token || isDevAssociateToken(session.token)) {
          return;
        }
        sessionVerifyInFlightRef.current = true;
        try {
          const verifyResult = await checkStoredSessionWithAuthEndpoint(
            session.token,
            session.meta
          );
          if (verifyResult === "invalid") {
            await invalidateStoredSession();
          }
        } finally {
          sessionVerifyInFlightRef.current = false;
        }
      })();
    };

    const subscription = AppState.addEventListener("change", handleAppState);
    return () => subscription.remove();
  }, [checkStoredSessionWithAuthEndpoint, invalidateStoredSession, isBootstrapping]);

  const sendOtp = useCallback(async (phone: string, countryCode: string) => {
    const [deviceId, fcmToken] = await Promise.all([getDeviceIdForApi(), getFcmTokenForApi()]);
    return postJson<OtpRequestResponse>("/api/auth/sign-up-log-in", {
      countryCode,
      phone: phone.replace(/\D/g, ""),
      deviceId,
      fcmToken: fcmToken ?? "",
    });
  }, []);

  const verifyOtp = useCallback(async (phone: string, countryCode: string, otp: string) => {
    const [deviceId, fcmToken] = await Promise.all([getDeviceIdForApi(), getFcmTokenForApi()]);
    const response = await postJson<VerifyOtpResponse>("/api/auth/verify-otp", {
      countryCode,
      phone: phone.replace(/\D/g, ""),
      otp,
      deviceId,
      fcmToken: fcmToken ?? "",
    });

    if (response.ok && response.data?.token) {
      const nextMeta: AuthSessionMeta = {
        role: response.data.role ?? null,
        name: response.data.name ?? null,
        isProfileComplete: response.data.isProfileComplete ?? null,
        isAutoShopBusinessProfileComplete:
          response.data.isAutoShopBusinessProfileComplete ?? null,
        profilePhoto: response.data.profilePhoto ?? null,
        phone: normalizeAuthSessionPhone(phone),
        countryCode,
      };
      // Fast-login: save minimal meta and navigate immediately. Enrichment happens in background.
      await saveAuthSession(response.data.token, nextMeta);
      setToken(response.data.token);
      setMeta(nextMeta);
    }

    return response;
  }, []);

  // Background enrichment: after login (or token restore), refresh profile + dashboard async
  // and update SecureStore + meta (which should update UI across the app).
  useEffect(() => {
    let alive = true;
    async function enrich() {
      if (!token || isDevAssociateToken(token) || isAssociateRole(metaRef.current?.role)) {
        return;
      }
      if (enrichInFlightRef.current) {
        return;
      }
      if (lastEnrichedTokenRef.current === token) {
        return;
      }
      enrichInFlightRef.current = true;
      try {
        const refreshedMeta = await refreshMetaFromServer(token, metaRef.current);
        if (!alive) {
          return;
        }
        await saveAuthSession(token, refreshedMeta);
        if (!alive) {
          return;
        }
        setMeta(refreshedMeta);
        setSessionRevision((v) => v + 1);
        lastEnrichedTokenRef.current = token;
      } catch {
        // ignore - keep minimal meta
      } finally {
        enrichInFlightRef.current = false;
      }
    }
    void enrich();
    return () => {
      alive = false;
    };
  }, [refreshMetaFromServer, token]);

  const logout = useCallback(async () => {
    await invalidateStoredSession();
  }, [invalidateStoredSession]);

  const enterDevAssociateSession = useCallback(async () => {
    const nextMeta = createDevAssociateMeta();
    await saveAuthSession(DEV_ASSOCIATE_TOKEN, nextMeta);
    lastEnrichedTokenRef.current = DEV_ASSOCIATE_TOKEN;
    setToken(DEV_ASSOCIATE_TOKEN);
    setMeta(nextMeta);
    setSessionRevision((v) => v + 1);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      token,
      meta,
      isAuthenticated: Boolean(token),
      isBootstrapping,
      sessionRevision,
      syncCarOwnerProfileFromDashboard,
      sendOtp,
      verifyOtp,
      logout,
      refreshSession,
      enterDevAssociateSession,
    }),
    [
      enterDevAssociateSession,
      isBootstrapping,
      logout,
      meta,
      refreshSession,
      sendOtp,
      sessionRevision,
      syncCarOwnerProfileFromDashboard,
      token,
      verifyOtp,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
