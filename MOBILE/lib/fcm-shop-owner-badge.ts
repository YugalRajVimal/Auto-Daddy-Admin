import {
  getInitialNotification,
  onNotificationOpenedApp,
  setBackgroundMessageHandler,
} from "@react-native-firebase/messaging";

import { tryFirebaseMessaging } from "@/lib/firebase-messaging";
import { markNotificationReceivedForCurrentRole } from "@/lib/notification-badge";

/** Registers FCM handlers that flag unread badge for the signed-in role. */
export function registerFcmShopOwnerBadgeHandlers(): void {
  const messaging = tryFirebaseMessaging();
  if (!messaging) {
    return;
  }

  setBackgroundMessageHandler(messaging, async () => {
    await markNotificationReceivedForCurrentRole();
  });

  onNotificationOpenedApp(messaging, async () => {
    await markNotificationReceivedForCurrentRole();
  });

  void getInitialNotification(messaging)
    .then((message) => {
      if (message) {
        return markNotificationReceivedForCurrentRole();
      }
      return undefined;
    })
    .catch(() => undefined);
}
