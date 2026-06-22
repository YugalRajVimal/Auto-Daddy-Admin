import { onMessage, type FirebaseMessagingTypes } from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";

import { tryFirebaseMessaging } from "@/lib/firebase-messaging";
import { markNotificationReceivedForCurrentRole } from "@/lib/notification-badge";

/** Show banners/sounds for locally scheduled notifications while the app is open. */
export function configureForegroundNotificationPresentation(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

function fcmDataForExpo(
  data: FirebaseMessagingTypes.RemoteMessage["data"],
): Record<string, unknown> | undefined {
  if (!data) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      typeof value === "string" ? value : JSON.stringify(value),
    ]),
  );
}

/**
 * When FCM delivers a message in the foreground, show it via Expo local notifications
 * so the payload (including `data`) is available to the app.
 */
export function subscribeFcmForegroundMessages(): () => void {
  const messaging = tryFirebaseMessaging();
  if (!messaging) {
    return () => undefined;
  }

  return onMessage(messaging, async (remoteMessage) => {
    console.log("FCM Message received in foreground!", remoteMessage);
    await markNotificationReceivedForCurrentRole();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: remoteMessage.notification?.title ?? "New Notification",
        body: remoteMessage.notification?.body ?? "You have a new message.",
        data: fcmDataForExpo(remoteMessage.data),
      },
      trigger: null,
    });
  });
}
