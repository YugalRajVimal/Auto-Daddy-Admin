import * as Location from "expo-location";

import { ensureForegroundLocationPermission } from "@/lib/app-permissions";

export type DeviceCoordinates = {
  lat: number;
  lng: number;
};

export async function getQuickDeviceCoordinates(): Promise<DeviceCoordinates> {
  const granted = await ensureForegroundLocationPermission();
  if (!granted) {
    throw new Error("permission-denied");
  }

  // Fast path: if the OS has a recent fix, use it (avoids long cold-start GPS waits).
  const last = await Location.getLastKnownPositionAsync({
    maxAge: 60_000,
    requiredAccuracy: 200,
  });
  if (last?.coords) {
    return { lat: last.coords.latitude, lng: last.coords.longitude };
  }

  // Best-effort: helps some Android devices return faster.
  try {
    await Location.enableNetworkProviderAsync();
  } catch {
    // ignore
  }

  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Low,
    timeout: 8000,
    maximumAge: 10_000,
    mayShowUserSettingsDialog: true,
  });

  return { lat: pos.coords.latitude, lng: pos.coords.longitude };
}

