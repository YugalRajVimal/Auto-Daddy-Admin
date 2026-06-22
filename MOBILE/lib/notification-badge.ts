import { getAuthMeta } from "@/lib/auth";
import { markCarOwnerNotificationReceived } from "@/lib/car-owner-notification-read-state";
import {
  isAutoShopOwnerRole,
  markShopOwnerNotificationReceived,
} from "@/lib/shop-owner-notification-read-state";

/** Sets unread badge for the signed-in role when a push arrives. */
export async function markNotificationReceivedForCurrentRole(): Promise<void> {
  const meta = await getAuthMeta();
  const role = meta?.role ?? null;
  if (isAutoShopOwnerRole(role)) {
    await markShopOwnerNotificationReceived();
    return;
  }
  await markCarOwnerNotificationReceived();
}
