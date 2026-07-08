import * as SecureStore from "expo-secure-store";

export const AUTH_META_KEY = "authMeta";
export const AUTH_LAST_ROLE_KEY = "authLastRole";

export type AuthSessionMeta = {
  role: string | null;
  name: string | null;
  isProfileComplete: boolean | null;
  isAutoShopBusinessProfileComplete: boolean | null;
  profilePhoto: string | null;
  /** Login phone used for POST /api/auth/ session checks. */
  phone?: string | null;
  countryCode?: string | null;
};

export async function getAuthMeta(): Promise<AuthSessionMeta | null> {
  const raw = await SecureStore.getItemAsync(AUTH_META_KEY);
  const lastRole = await SecureStore.getItemAsync(AUTH_LAST_ROLE_KEY);

  if (!raw) {
    return lastRole
      ? {
          role: lastRole,
          name: null,
          isProfileComplete: null,
          isAutoShopBusinessProfileComplete: null,
          profilePhoto: null,
        }
      : null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthSessionMeta;
    // Migration: if older installs only have authMeta, persist role separately
    // so cold-start routing can proceed even if authMeta later fails to parse.
    if (parsed?.role && parsed.role !== lastRole) {
      await SecureStore.setItemAsync(AUTH_LAST_ROLE_KEY, parsed.role);
    }
    if (!parsed?.role && lastRole) {
      return { ...parsed, role: lastRole };
    }
    return parsed;
  } catch {
    return lastRole
      ? {
          role: lastRole,
          name: null,
          isProfileComplete: null,
          isAutoShopBusinessProfileComplete: null,
          profilePhoto: null,
        }
      : null;
  }
}
