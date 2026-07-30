import { shopPrimaryNav } from "../config/shopNav";
import type { NavItem } from "../config/adminNav";

/** Paths shop owners may fully use without an active subscription. */
const ALLOWED_PREFIXES = [
  "/shop/profile",
  "/shop/my-website",
  "/shop/help",
] as const;

export function isShopPathAllowedWithoutSubscription(pathname: string): boolean {
  return ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Full shop nav is always shown; subscription only soft-locks interactions. */
export function getShopPrimaryNavForSubscription(_hasActiveSubscription?: boolean): NavItem[] {
  return shopPrimaryNav;
}

/**
 * Dev-only override from `VITE_DEV_SIMULATE_SUBSCRIPTION_ACTIVE`.
 * - `"true"` / `"1"` → force active
 * - `"false"` / `"0"` → force inactive
 * - unset / other → use real API days-left
 * Ignored outside Vite DEV (`import.meta.env.DEV`).
 */
export function getDevSimulatedSubscriptionActive(): boolean | null {
  if (!import.meta.env.DEV) return null;
  const raw = (import.meta.env.VITE_DEV_SIMULATE_SUBSCRIPTION_ACTIVE ?? "")
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
  daysLeft: number | null | undefined,
): number | undefined {
  const simulated = getDevSimulatedSubscriptionActive();
  if (simulated === true) {
    return typeof daysLeft === "number" && daysLeft > 0 ? daysLeft : 365;
  }
  if (simulated === false) return 0;
  return typeof daysLeft === "number" ? daysLeft : undefined;
}
