import * as SecureStore from "expo-secure-store";
import { File, Paths } from "expo-file-system";
import { Platform } from "react-native";

/** Same key previously used in SecureStore (`lib/auth.ts`). */
const LEGACY_SECURE_STORE_KEY = "carOwnerDashboardDetails";

const CACHE_FILE_NAME = "car-owner-dashboard.json";

function dashboardCacheFile(): File {
  return new File(Paths.document, CACHE_FILE_NAME);
}

async function readLegacySecureStore<T>(): Promise<T | null> {
  const raw = await SecureStore.getItemAsync(LEGACY_SECURE_STORE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function removeLegacySecureStore(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(LEGACY_SECURE_STORE_KEY);
  } catch {
    // Key may not exist.
  }
}

/**
 * Persists car owner dashboard JSON in the app document directory (not SecureStore).
 * Large CMS payloads exceed SecureStore size limits on native.
 */
export async function saveCarOwnerDashboardDetails(detailsResponse: unknown): Promise<void> {
  const json = JSON.stringify(detailsResponse);
  if (Platform.OS === "web") {
    await removeLegacySecureStore();
    return;
  }
  try {
    const file = dashboardCacheFile();
    if (!file.exists) {
      file.create({ intermediates: true, idempotent: true });
    }
    file.write(json);
    await removeLegacySecureStore();
  } catch {
    // Best-effort cache; network remains source of truth.
  }
}

export async function getCarOwnerDashboardDetails<T = unknown>(): Promise<T | null> {
  if (Platform.OS !== "web") {
    try {
      const file = dashboardCacheFile();
      if (file.exists) {
        const raw = await file.text();
        try {
          return JSON.parse(raw) as T;
        } catch {
          return null;
        }
      }
    } catch {
      // Fall through to legacy SecureStore.
    }
  }

  const legacy = await readLegacySecureStore<T>();
  if (legacy != null && Platform.OS !== "web") {
    try {
      await saveCarOwnerDashboardDetails(legacy);
    } catch {
      // ignore
    }
    await removeLegacySecureStore();
  }
  return legacy;
}

/** Clears on-disk cache and any legacy SecureStore entry (logout). */
export async function clearCarOwnerDashboardCache(): Promise<void> {
  if (Platform.OS !== "web") {
    try {
      const file = dashboardCacheFile();
      if (file.exists) {
        file.delete();
      }
    } catch {
      // ignore
    }
  }
  await removeLegacySecureStore();
}
