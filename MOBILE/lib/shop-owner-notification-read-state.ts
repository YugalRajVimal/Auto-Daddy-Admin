import { getJson } from "@/lib/api";
import { getAuthMeta } from "@/lib/auth-meta";
import {
  parseShopOwnerNotificationsResponse,
  type ShopOwnerNotification,
} from "@/types/shop-owner-notifications";
import * as SecureStore from "expo-secure-store";

export const SHOP_OWNER_NOTIF_UNREAD_KEY = "shopOwnerNotificationsUnread";
export const SHOP_OWNER_NOTIF_LAST_READ_AT_KEY = "shopOwnerNotificationsLastReadAt";

const badgeListeners = new Set<() => void>();

function notifyBadgeListeners() {
  badgeListeners.forEach((listener) => listener());
}

export function subscribeShopOwnerNotificationBadge(listener: () => void): () => void {
  badgeListeners.add(listener);
  return () => badgeListeners.delete(listener);
}

export function isAutoShopOwnerRole(role: string | null | undefined): boolean {
  return (role ?? "").toLowerCase() === "autoshopowner";
}

export async function loadShopOwnerHasUnread(): Promise<boolean> {
  const meta = await getAuthMeta();
  if (!isAutoShopOwnerRole(meta?.role ?? null)) return false;
  const flag = await SecureStore.getItemAsync(SHOP_OWNER_NOTIF_UNREAD_KEY);
  return flag === "1";
}

export async function markShopOwnerNotificationReceived(): Promise<void> {
  const meta = await getAuthMeta();
  if (!isAutoShopOwnerRole(meta?.role ?? null)) return;
  await SecureStore.setItemAsync(SHOP_OWNER_NOTIF_UNREAD_KEY, "1");
  notifyBadgeListeners();
}

export async function markShopOwnerNotificationsRead(latestNotificationTime: string): Promise<void> {
  const meta = await getAuthMeta();
  if (!isAutoShopOwnerRole(meta?.role ?? null)) return;
  const trimmed = latestNotificationTime.trim();
  if (trimmed) {
    await SecureStore.setItemAsync(SHOP_OWNER_NOTIF_LAST_READ_AT_KEY, trimmed);
  }
  await SecureStore.deleteItemAsync(SHOP_OWNER_NOTIF_UNREAD_KEY);
  notifyBadgeListeners();
}

export async function clearShopOwnerNotificationReadState(): Promise<void> {
  await SecureStore.deleteItemAsync(SHOP_OWNER_NOTIF_UNREAD_KEY);
  await SecureStore.deleteItemAsync(SHOP_OWNER_NOTIF_LAST_READ_AT_KEY);
  notifyBadgeListeners();
}

export function latestShopOwnerNotificationTime(items: ShopOwnerNotification[]): string | null {
  let latest: string | null = null;
  for (const item of items) {
    const time = item.time.trim();
    if (!time) continue;
    if (!latest || time > latest) latest = time;
  }
  return latest;
}

/** Marks unread when API has notifications newer than last read (e.g. missed push). */
export async function syncShopOwnerUnreadFromApi(authToken: string): Promise<void> {
  const meta = await getAuthMeta();
  if (!isAutoShopOwnerRole(meta?.role ?? null)) return;

  const res = await getJson<unknown>(
    "/api/auto-shop-owner/get-notifications?page=1&limit=1",
    { authToken }
  );
  if (!res.ok) return;
  const parsed = parseShopOwnerNotificationsResponse(res.data, 1);
  const latest = latestShopOwnerNotificationTime(parsed.items);
  if (!latest) return;

  const lastReadAt = (await SecureStore.getItemAsync(SHOP_OWNER_NOTIF_LAST_READ_AT_KEY))?.trim() ?? "";
  if (!lastReadAt || latest > lastReadAt) {
    await SecureStore.setItemAsync(SHOP_OWNER_NOTIF_UNREAD_KEY, "1");
    notifyBadgeListeners();
  }
}
