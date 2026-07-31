/**
 * Shop owners may fully use these Expo route segments without an active subscription.
 * Matches web allowed prefixes: profile, my-website, help (+ business setup).
 */
const ALLOWED_SEGMENT_MARKERS = [
  "profile",
  "website",
  "faqs",
  "invite-help",
  "businessprofile",
  "about",
  "privacypolicy",
  "disclaimer",
  "documents",
] as const;

export function isShopPathAllowedWithoutSubscription(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  const lower = path.toLowerCase();
  return ALLOWED_SEGMENT_MARKERS.some(
    (marker) =>
      lower === `/${marker}` ||
      lower.endsWith(`/${marker}`) ||
      lower.includes(`/${marker}/`) ||
      lower.includes(`(${marker})`)
  );
}

/**
 * Dev-only override from `EXPO_PUBLIC_DEV_SIMULATE_SUBSCRIPTION_ACTIVE`.
 * - `"true"` / `"1"` → force active
 * - `"false"` / `"0"` → force inactive
 * - unset / other → use real API days-left
 * Ignored outside `__DEV__`.
 */
export function getDevSimulatedSubscriptionActive(): boolean | null {
  if (typeof __DEV__ === "undefined" || !__DEV__) return null;
  const raw = (process.env.EXPO_PUBLIC_DEV_SIMULATE_SUBSCRIPTION_ACTIVE ?? "")
    .toString()
    .trim()
    .toLowerCase();
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return null;
}

/** Apply daysLeft > 0 rule, with optional DEV env simulation. */
export function resolveHasActiveSubscription(daysLeft: number | null | undefined): boolean {
  const simulated = getDevSimulatedSubscriptionActive();
  if (simulated != null) return simulated;
  return typeof daysLeft === "number" && daysLeft > 0;
}

/** Days left for UI when DEV simulation is on. */
export function resolveSubscriptionDaysLeft(
  daysLeft: number | null | undefined
): number | undefined {
  const simulated = getDevSimulatedSubscriptionActive();
  if (simulated === true) {
    return typeof daysLeft === "number" && daysLeft > 0 ? daysLeft : 365;
  }
  if (simulated === false) return 0;
  return typeof daysLeft === "number" ? daysLeft : undefined;
}
