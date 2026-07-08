import {
  AuthorizationStatus,
  hasPermission,
  requestPermission,
} from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { tryFirebaseMessaging } from "@/lib/firebase-messaging";

function isFirebaseMessagingAuthorized(status: number): boolean {
  return (
    status === AuthorizationStatus.AUTHORIZED ||
    status === AuthorizationStatus.PROVISIONAL
  );
}

async function ensureAndroidDefaultChannel(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync("default", {
    name: "Default",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function areNotificationPermissionsGranted(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  const expo = await Notifications.getPermissionsAsync();
  if (expo.status !== "granted") {
    return false;
  }

  const messaging = tryFirebaseMessaging();
  if (!messaging) {
    return false;
  }
  const fcm = await hasPermission(messaging);
  return isFirebaseMessagingAuthorized(fcm);
}

/** Prompts for notification permission when not already granted (best-effort). */
export async function ensureNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  await ensureAndroidDefaultChannel();

  let expoStatus = (await Notifications.getPermissionsAsync()).status;
  if (expoStatus !== "granted") {
    expoStatus = (await Notifications.requestPermissionsAsync()).status;
  }

  if (expoStatus !== "granted") {
    return false;
  }

  const messaging = tryFirebaseMessaging();
  if (!messaging) {
    return false;
  }
  const existingFcm = await hasPermission(messaging);
  if (!isFirebaseMessagingAuthorized(existingFcm)) {
    const requested = await requestPermission(messaging);
    if (!isFirebaseMessagingAuthorized(requested)) {
      return false;
    }
  }

  return true;
}
