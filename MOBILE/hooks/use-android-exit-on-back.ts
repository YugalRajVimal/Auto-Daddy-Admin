import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { BackHandler, Platform } from "react-native";

/**
 * On Android, treat the focused screen as the app root: hardware back exits
 * instead of popping leftover drawer/tab history (which can loop Home ↔ prior screen).
 */
export function useAndroidExitOnBack() {
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") {
        return undefined;
      }
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        BackHandler.exitApp();
        return true;
      });
      return () => sub.remove();
    }, [])
  );
}
