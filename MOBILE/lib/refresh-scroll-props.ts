import { Platform } from "react-native";

/**
 * Shared ScrollView props for Android pull-to-refresh stability.
 * Keeps behavior consistent across screens.
 */
export function androidRefreshScrollProps(onRefresh?: (() => void) | null) {
  if (Platform.OS !== "android") {
    return { nestedScrollEnabled: true as const };
  }
  // Only disable overscroll/nested scrolling when pull-to-refresh is enabled.
  if (!onRefresh) {
    return { nestedScrollEnabled: true as const };
  }
  return { overScrollMode: "never" as const, nestedScrollEnabled: false as const };
}

