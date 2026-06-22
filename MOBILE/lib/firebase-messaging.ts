import { getMessaging, type Messaging } from "@react-native-firebase/messaging";

/** Shared FCM instance via modular API (avoids deprecated `messaging()`). */
export function firebaseMessaging(): Messaging {
  return getMessaging();
}

/** Best-effort FCM instance; null when the native module is unavailable. */
export function tryFirebaseMessaging(): Messaging | null {
  try {
    return getMessaging();
  } catch {
    return null;
  }
}
