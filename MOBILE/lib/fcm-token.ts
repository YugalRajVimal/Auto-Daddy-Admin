import { getToken } from "@react-native-firebase/messaging";

import { firebaseMessaging } from "@/lib/firebase-messaging";
import { ensureNotificationPermissions } from "@/lib/notification-permissions";

/**
 * FCM registration token for push payloads (best-effort; null when unavailable).
 */
export async function getFcmTokenForApi(): Promise<string | null> {
  try {
    const enabled = await ensureNotificationPermissions();
    if (!enabled) {
      return null;
    }

    const fcmToken = await getToken(firebaseMessaging());
    return typeof fcmToken === "string" && fcmToken.length > 0 ? fcmToken : null;
  } catch {
    return null;
  }
}
