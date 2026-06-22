import * as SecureStore from "expo-secure-store";
import { File, Paths } from "expo-file-system";
import { Platform } from "react-native";

/** Same keys previously used in SecureStore (`lib/auth.ts`). */
const LEGACY_PROFILE_KEY = "autoShopOwnerProfile";
const LEGACY_DASHBOARD_KEY = "autoShopDashboardDetails";

const PROFILE_CACHE_FILE = "shop-owner-profile.json";
const DASHBOARD_CACHE_FILE = "shop-owner-dashboard.json";

function profileCacheFile(): File {
  return new File(Paths.document, PROFILE_CACHE_FILE);
}

function dashboardCacheFile(): File {
  return new File(Paths.document, DASHBOARD_CACHE_FILE);
}

async function readLegacySecureStore<T>(key: string): Promise<T | null> {
  const raw = await SecureStore.getItemAsync(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function removeLegacySecureStore(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // Key may not exist.
  }
}

async function writeJsonCache(file: File, json: string): Promise<void> {
  if (!file.exists) {
    file.create({ intermediates: true, idempotent: true });
  }
  file.write(json);
}

async function readJsonCache<T>(file: File): Promise<T | null> {
  if (!file.exists) {
    return null;
  }
  const raw = await file.text();
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Persists shop owner profile JSON in the app document directory (not SecureStore).
 * Large API payloads exceed SecureStore size limits on native.
 */
export async function saveAutoShopOwnerProfile(profileResponse: unknown): Promise<void> {
  const json = JSON.stringify(profileResponse);
  if (Platform.OS === "web") {
    await removeLegacySecureStore(LEGACY_PROFILE_KEY);
    return;
  }
  try {
    const file = profileCacheFile();
    await writeJsonCache(file, json);
    await removeLegacySecureStore(LEGACY_PROFILE_KEY);
  } catch {
    // Best-effort cache; network remains source of truth.
  }
}

export async function getAutoShopOwnerProfile<T = unknown>(): Promise<T | null> {
  if (Platform.OS !== "web") {
    try {
      const cached = await readJsonCache<T>(profileCacheFile());
      if (cached != null) {
        return cached;
      }
    } catch {
      // Fall through to legacy SecureStore.
    }
  }

  const legacy = await readLegacySecureStore<T>(LEGACY_PROFILE_KEY);
  if (legacy != null && Platform.OS !== "web") {
    try {
      await saveAutoShopOwnerProfile(legacy);
    } catch {
      // ignore
    }
    await removeLegacySecureStore(LEGACY_PROFILE_KEY);
  }
  return legacy;
}

/**
 * Persists shop owner dashboard JSON in the app document directory (not SecureStore).
 */
export async function saveDashboardDetails(detailsResponse: unknown): Promise<void> {
  const json = JSON.stringify(detailsResponse);
  if (Platform.OS === "web") {
    await removeLegacySecureStore(LEGACY_DASHBOARD_KEY);
    return;
  }
  try {
    const file = dashboardCacheFile();
    await writeJsonCache(file, json);
    await removeLegacySecureStore(LEGACY_DASHBOARD_KEY);
  } catch {
    // Best-effort cache; network remains source of truth.
  }
}

export async function getDashboardDetails<T = unknown>(): Promise<T | null> {
  if (Platform.OS !== "web") {
    try {
      const cached = await readJsonCache<T>(dashboardCacheFile());
      if (cached != null) {
        return cached;
      }
    } catch {
      // Fall through to legacy SecureStore.
    }
  }

  const legacy = await readLegacySecureStore<T>(LEGACY_DASHBOARD_KEY);
  if (legacy != null && Platform.OS !== "web") {
    try {
      await saveDashboardDetails(legacy);
    } catch {
      // ignore
    }
    await removeLegacySecureStore(LEGACY_DASHBOARD_KEY);
  }
  return legacy;
}

/** Clears on-disk caches and any legacy SecureStore entries (logout). */
export async function clearShopOwnerAuthCache(): Promise<void> {
  if (Platform.OS !== "web") {
    for (const file of [profileCacheFile(), dashboardCacheFile()]) {
      try {
        if (file.exists) {
          file.delete();
        }
      } catch {
        // ignore
      }
    }
  }
  await Promise.all([
    removeLegacySecureStore(LEGACY_PROFILE_KEY),
    removeLegacySecureStore(LEGACY_DASHBOARD_KEY),
  ]);
}
