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
  "/shop": ["portal"],
  "/shop/profile": ["portal", "services"],
  "/shop/people": ["customers"],
  "/shop/services": ["services"],
  "/shop/job-cards": ["jobCards"],
  "/shop/wallet": ["wallet"],
  "/shop/my-website": ["websiteTemplates"],
  "/shop/reports": ["payments"],
  "/shop/deals": ["deals"],
};

/** Next primary-nav section to prefetch while the user is on `path`. */
const PREFETCH_AFTER: Record<string, ShopDataSection> = {
  "/shop": "services",
  "/shop/profile": "customers",
  "/shop/people": "services",
  "/shop/services": "jobCards",
  "/shop/job-cards": "wallet",
  "/shop/wallet": "websiteTemplates",
  "/shop/my-website": "payments",
  "/shop/reports": "deals",
};

export function normalizeShopPrimaryPath(pathname: string): string | null {
  const match = shopPrimaryNav.find(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
  );
  return match?.path ?? null;
}

export function getSectionsForShopPath(pathname: string): ShopDataSection[] {
  const primary = normalizeShopPrimaryPath(pathname);
  if (!primary) return [];
  return PATH_SECTIONS[primary] ?? [];
}

export function getPrefetchSectionForShopPath(pathname: string): ShopDataSection | null {
  const primary = normalizeShopPrimaryPath(pathname);
  if (!primary) return null;
  return PREFETCH_AFTER[primary] ?? null;
}
