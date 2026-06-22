import * as Application from "expo-application";
import * as Device from "expo-device";
import { Platform } from "react-native";

let cachedDeviceId: string | null = null;

/**
 * Stable-ish device identifier for auth payloads.
 * Prefers platform IDs from `expo-application`, with `expo-device` metadata as fallback.
 */
export async function getDeviceIdForApi(): Promise<string> {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }
  try {
    if (Platform.OS === "android") {
      const id = Application.getAndroidId();
      if (typeof id === "string" && id.length > 0) {
        cachedDeviceId = id;
        return id;
      }
    }
    if (Platform.OS === "ios") {
      const id = await Application.getIosIdForVendorAsync();
      if (typeof id === "string" && id.length > 0) {
        cachedDeviceId = id;
        return id;
      }
    }
  } catch {
    // fall through
  }
  const parts = [Device.osBuildId, Device.modelId, Application.applicationId ?? ""]
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean);
  const fallback = parts.length > 0 ? parts.join("|") : `autodaddy-${Platform.OS}`;
  cachedDeviceId = fallback;
  return fallback;
}
