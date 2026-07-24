import { router } from "expo-router";

export const SHOP_OWNER_HOME = "/(shop-owner)/(tabs)/home";
export const SHOP_OWNER_PROFILE = "/(shop-owner)/profile";

export function routeSearchParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  return trimmed || undefined;
}

/** Resolve `backTo` from route params; defaults to shop dashboard. */
export function resolveShopOwnerBackTo(
  backToParam: string | string[] | undefined,
  fromParam?: string | string[] | undefined,
  fallback: string = SHOP_OWNER_HOME
): string {
  return (
    routeSearchParam(backToParam) ??
    (routeSearchParam(fromParam) === "profile" ? SHOP_OWNER_PROFILE : fallback)
  );
}

/**
 * Return to the role home without leaving sibling "tab" screens under it.
 * `dismissTo` pops history until home; `replace` is the fallback when dismiss isn't available.
 */
export function navigateToAppHome(homeRoute: string = SHOP_OWNER_HOME) {
  dismissOrReplace(homeRoute);
}

function dismissOrReplace(route: string) {
  const href = route as never;
  if (typeof router.dismissTo === "function") {
    router.dismissTo(href);
    return;
  }
  router.replace(href);
}

/**
 * Pop one screen when the stack allows it (e.g. Edit Vehicle → Customers).
 * Only replace to an explicit return route or home when there is nothing to pop —
 * avoids duplicating routes (Customers → Add → navigate Customers → Customers).
 */
export function navigateBackTarget(explicitTarget?: string, fallbackHome: string = SHOP_OWNER_HOME) {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  const target = explicitTarget?.trim();
  dismissOrReplace(target || fallbackHome);
}
