import { shopPrimaryNav } from "../config/shopNav";

export type ShopDataSection =
  | "portal"
  | "partsDealers"
  | "customers"
  | "services"
  | "jobCards"
  | "wallet"
  | "deals"
  | "payments"
  | "websiteTemplates";

const PATH_SECTIONS: Record<string, ShopDataSection[]> = {
  "/shop": ["portal", "partsDealers"],
  "/shop/profile": ["portal", "services"],
  "/shop/people": ["customers"],
  "/shop/services": ["services"],
  "/shop/job-cards": ["jobCards"],
  "/shop/wallet": ["wallet"],
  "/shop/my-website": ["websiteTemplates"],
  "/shop/reports": ["payments"],
  "/shop/deals": ["deals"],
};

/** Longest match wins so `/shop` does not swallow `/shop/services`, etc. */
export function normalizeShopPrimaryPath(pathname: string): string | null {
  let best: string | null = null;
  for (const item of shopPrimaryNav) {
    const path = item.path;
    if (!path) continue;
    if (pathname === path || pathname.startsWith(`${path}/`)) {
      if (!best || path.length > best.length) {
        best = path;
      }
    }
  }
  return best;
}

export function getSectionsForShopPath(pathname: string): ShopDataSection[] {
  const primary = normalizeShopPrimaryPath(pathname);
  if (!primary) return [];
  return PATH_SECTIONS[primary] ?? [];
}
