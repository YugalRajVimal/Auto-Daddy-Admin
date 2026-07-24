import * as SecureStore from "expo-secure-store";

import { isAssociateRole } from "./associate-roles";
import {
  AUTH_LAST_ROLE_KEY,
  AUTH_META_KEY,
  type AuthSessionMeta,
  getAuthMeta,
} from "./auth-meta";
import { clearCarOwnerDashboardCache } from "./car-owner-dashboard-cache";
import { clearShopOwnerAuthCache } from "./shop-owner-auth-cache";
import { clearCarOwnerNotificationReadState } from "./car-owner-notification-read-state";
import { clearShopOwnerNotificationReadState } from "./shop-owner-notification-read-state";

export const AUTH_TOKEN_KEY = "authToken";
export { AUTH_META_KEY, AUTH_LAST_ROLE_KEY, type AuthSessionMeta, getAuthMeta } from "./auth-meta";
export const AUTH_AUTOSHOP_PROFILE_KEY = "autoShopOwnerProfile";
export const AUTH_DASHBOARD_DETAILS_KEY = "autoShopDashboardDetails";

export type PostAuthRoute =
  | "/(shop-owner)/(tabs)/home"
  | "/(shop-owner)/profile"
  | "/(car-owner)/(tabs)/home"
  | "/(car-owner)/profile"
  | "/(associate)/(tabs)/home";

export { isAssociateRole } from "./associate-roles";

export async function saveAuthSession(token: string, meta: AuthSessionMeta) {
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  await SecureStore.setItemAsync(AUTH_META_KEY, JSON.stringify(meta));
  if (meta.role) {
    await SecureStore.setItemAsync(AUTH_LAST_ROLE_KEY, meta.role);
  }
}

export async function clearAuthSession() {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(AUTH_META_KEY);
  await SecureStore.deleteItemAsync(AUTH_LAST_ROLE_KEY);
  await clearShopOwnerAuthCache();
  await clearCarOwnerDashboardCache();
  await clearShopOwnerNotificationReadState();
  await clearCarOwnerNotificationReadState();
}

export async function getAuthToken() {
  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

export async function getAuthSession() {
  const [token, meta] = await Promise.all([getAuthToken(), getAuthMeta()]);
  return { token, meta };
}

export {
  saveAutoShopOwnerProfile,
  getAutoShopOwnerProfile,
  saveDashboardDetails,
  getDashboardDetails,
} from "./shop-owner-auth-cache";

export {
  saveCarOwnerDashboardDetails,
  getCarOwnerDashboardDetails,
} from "./car-owner-dashboard-cache";

export function getPostAuthRoute(
  meta: Pick<AuthSessionMeta, "isProfileComplete" | "isAutoShopBusinessProfileComplete" | "role">
): PostAuthRoute {
  const role = (meta.role ?? "").toLowerCase();

  if (role === "autoshopowner") {
    // Match web shop portal: incomplete business profile does not block the app.
    // Owners edit it anytime under Profile. Still force personal profile when known incomplete.
    // On cold start meta flags can be null briefly; don't trap users in profile screens.
    if (meta.isProfileComplete === false) {
      return "/(shop-owner)/profile";
    }
    return "/(shop-owner)/(tabs)/home";
  }

  // car-owner shell (explicit)
  if (role === "carowner" || role === "car-owner" || role === "car_owner") {
    return "/(car-owner)/(tabs)/home";
  }

  if (isAssociateRole(meta.role)) {
    return "/(associate)/(tabs)/home";
  }

  // Unknown role: default to shop-owner home to avoid trapping users.
  return "/(shop-owner)/(tabs)/home";
}
