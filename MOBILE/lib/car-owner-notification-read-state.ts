import { getJson } from "@/lib/api";
import { getAuthMeta } from "@/lib/auth-meta";
import {
  parseCarOwnerNotificationsResponse,
  type CarOwnerNotification,
} from "@/types/car-owner-notifications";
import * as SecureStore from "expo-secure-store";

export const CAR_OWNER_NOTIF_UNREAD_KEY = "carOwnerNotificationsUnread";
export const CAR_OWNER_NOTIF_LAST_READ_AT_KEY = "carOwnerNotificationsLastReadAt";

const badgeListeners = new Set<() => void>();

function notifyBadgeListeners() {
  badgeListeners.forEach((listener) => listener());
}

export function subscribeCarOwnerNotificationBadge(listener: () => void): () => void {
  badgeListeners.add(listener);
  return () => badgeListeners.delete(listener);
}

export function isCarOwnerRole(role: string | null | undefined): boolean {
  const r = (role ?? "").toLowerCase();
  return r === "carowner" || r === "car-owner" || r === "car_owner";
}

export async function loadCarOwnerHasUnread(): Promise<boolean> {
  const meta = await getAuthMeta();
  if (!isCarOwnerRole(meta?.role ?? null)) return false;
  const flag = await SecureStore.getItemAsync(CAR_OWNER_NOTIF_UNREAD_KEY);
  return flag === "1";
}

export async function markCarOwnerNotificationReceived(): Promise<void> {
  const meta = await getAuthMeta();
  if (!isCarOwnerRole(meta?.role ?? null)) return;
  await SecureStore.setItemAsync(CAR_OWNER_NOTIF_UNREAD_KEY, "1");
  notifyBadgeListeners();
}

export async function markCarOwnerNotificationsRead(latestNotificationTime: string): Promise<void> {
  const meta = await getAuthMeta();
  if (!isCarOwnerRole(meta?.role ?? null)) return;
  const trimmed = latestNotificationTime.trim();
  if (trimmed) {
    await SecureStore.setItemAsync(CAR_OWNER_NOTIF_LAST_READ_AT_KEY, trimmed);
  }
  await SecureStore.deleteItemAsync(CAR_OWNER_NOTIF_UNREAD_KEY);
  notifyBadgeListeners();
}

export async function clearCarOwnerNotificationReadState(): Promise<void> {
  await SecureStore.deleteItemAsync(CAR_OWNER_NOTIF_UNREAD_KEY);
  await SecureStore.deleteItemAsync(CAR_OWNER_NOTIF_LAST_READ_AT_KEY);
  notifyBadgeListeners();
}

export function latestCarOwnerNotificationTime(items: CarOwnerNotification[]): string | null {
  let latest: string | null = null;
  for (const item of items) {
    const time = item.time.trim();
    if (!time) continue;
    if (!latest || time > latest) latest = time;
  }
  return latest;
}

/** Marks unread when API has notifications newer than last read (e.g. missed push). */
export async function syncCarOwnerUnreadFromApi(authToken: string): Promise<void> {
  const meta = await getAuthMeta();
  if (!isCarOwnerRole(meta?.role ?? null)) return;

  const res = await getJson<unknown>("/api/user/get-notifications?page=1&limit=1", {
    authToken,
  });
  if (!res.ok) return;
  const parsed = parseCarOwnerNotificationsResponse(res.data, 1);
  const latest = latestCarOwnerNotificationTime(parsed.items);
  if (!latest) return;

  const lastReadAt = (await SecureStore.getItemAsync(CAR_OWNER_NOTIF_LAST_READ_AT_KEY))?.trim() ?? "";
  if (!lastReadAt || latest > lastReadAt) {
    await SecureStore.setItemAsync(CAR_OWNER_NOTIF_UNREAD_KEY, "1");
    notifyBadgeListeners();
  }
}
