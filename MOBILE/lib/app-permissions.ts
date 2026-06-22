import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Platform } from "react-native";

import { ensureNotificationPermissions } from "@/lib/notification-permissions";

export type AppPermissionKind = "notifications" | "mediaLibrary" | "camera" | "microphone" | "location";

export type AppPermissionsSnapshot = Record<AppPermissionKind, boolean>;

async function ensureMediaLibraryPermission(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  const existing = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (existing.granted) {
    return true;
  }

  const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return requested.granted;
}

async function ensureCameraPermission(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  const existing = await ImagePicker.getCameraPermissionsAsync();
  if (existing.granted) {
    return true;
  }

  const requested = await ImagePicker.requestCameraPermissionsAsync();
  return requested.granted;
}

async function ensureMicrophonePermission(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  const existing = await Audio.getPermissionsAsync();
  if (existing.granted) {
    return true;
  }

  const requested = await Audio.requestPermissionsAsync();
  return requested.granted;
}

/** Foreground location for shop map / GPS on business profile. */
export async function ensureForegroundLocationPermission(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  const existing = await Location.getForegroundPermissionsAsync();
  if (existing.granted) {
    return true;
  }

  const requested = await Location.requestForegroundPermissionsAsync();
  return requested.granted;
}

/**
 * Prompts for each app permission when missing. Runs sequentially so only one
 * system dialog is shown at a time.
 */
export async function ensureAppPermissions(): Promise<AppPermissionsSnapshot> {
  if (Platform.OS === "web") {
    return { notifications: false, mediaLibrary: false, camera: false, microphone: false, location: false };
  }

  const notifications = await ensureNotificationPermissions();
  const mediaLibrary = await ensureMediaLibraryPermission();
  const camera = await ensureCameraPermission();
  const microphone = await ensureMicrophonePermission();
  const location = await ensureForegroundLocationPermission();

  return { notifications, mediaLibrary, camera, microphone, location };
}
