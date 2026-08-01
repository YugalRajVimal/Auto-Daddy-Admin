import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback } from "react";
import { Platform } from "react-native";

type NavWithParents = {
  getState?: () => { type?: string } | undefined;
  getParent?: () => NavWithParents | undefined;
  setOptions?: (options: { swipeEnabled?: boolean }) => void;
  openDrawer?: () => void;
};

function findDrawerNavigation(navigation: NavWithParents): NavWithParents | undefined {
  let current: NavWithParents | undefined = navigation;
  while (current) {
    const type = current.getState?.()?.type;
    if (type === "drawer" || typeof current.openDrawer === "function") {
      return current;
    }
    current = current.getParent?.();
  }
  return undefined;
}

/**
 * Drawer edge-swipe steals horizontal pans from nested tables/carousels on Android.
 * Disable drawer swipe while this screen is focused; restore the app default on blur.
 */
export function useDisableDrawerSwipeOnFocus() {
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      const drawerNav = findDrawerNavigation(navigation as NavWithParents);
      if (!drawerNav?.setOptions) {
        return undefined;
      }
      drawerNav.setOptions({ swipeEnabled: false });
      return () => {
        drawerNav.setOptions?.({ swipeEnabled: Platform.OS !== "ios" });
      };
    }, [navigation])
  );
}
