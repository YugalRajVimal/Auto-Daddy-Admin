import type { DomainDetailsInput } from "@/lib/shop-owner-domain-api";
import type { SubscriptionPlan } from "@/lib/shop-owner-subscription-api";
import type { SubscriptionPlanId } from "@/types/website-subscription-autoshop";

export type ShopWebsiteSection = "overview" | "domain" | "templates" | "subscription";

export type DomainForm = DomainDetailsInput;

export const WEBSITE_SECTIONS: { id: ShopWebsiteSection; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "domain", label: "Domain" },
  { id: "templates", label: "My Website" },
  { id: "subscription", label: "Subscription" },
];

export const SECTION_TITLES: Record<ShopWebsiteSection, string> = {
  overview: "Overview",
  domain: "Domain Details",
  templates: "My Website",
  subscription: "Subscription",
};

export const DOMAIN_STATUS_OPTIONS = ["Existing", "New"] as const;

export const EMPTY_DOMAIN_FORM: DomainForm = {
  domainName: "",
  expiryDate: "",
  provider: "",
  status: "Existing",
};

export const YEARLY_FEATURES: { label: string; note: string }[] = [
  { label: "Website", note: "for 365 days" },
  { label: "Free Software", note: "for 365 days" },
  { label: "Job Cards", note: "Unlimited" },
  { label: "Deals Marketplace", note: "Service deals" },
  { label: "Mobile App", note: "For You and Customers" },
];

export const FALLBACK_PLANS: Record<SubscriptionPlanId, SubscriptionPlan> = {
  yearly: {
    id: "yearly",
    title: "$ 365 Yearly plan",
    amount: 365,
    days: 365,
    hst: 49,
    features: YEARLY_FEATURES,
    invoiceRows: [
      { service: "Website", description: "Website subscription for 365 days", amount: 365 },
    ],
  },
  biweekly: {
    id: "biweekly",
    title: "$ 15 Bi-weekly plan",
    amount: 390,
    days: 14,
    hst: 51,
    description: "26 -Void cheques of CAD 15",
    invoiceRows: [
      {
        service: "Bi-weekly plan",
        description: "26 void cheques of CAD 15 for 26 bi-weekly periods",
        amount: 390,
      },
    ],
  },
};

export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Earliest selectable expiry: tomorrow (must be in the future). */
export function minExpiryDateInput(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return toDateInputValue(d);
}

export function ymdToDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

export function formatDisplayDate(iso: string): string {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return iso || "—";
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

export function isValidDomainUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    const host = parsed.hostname;
    if (!host || !host.includes(".")) return false;
    return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(
      host
    );
  } catch {
    return false;
  }
}

export function isValidFutureExpiryDate(expiryDate: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) return false;
  const end = new Date(`${expiryDate}T00:00:00`);
  if (Number.isNaN(end.getTime())) return false;
  if (toDateInputValue(end) !== expiryDate) return false;
  const min = new Date(`${minExpiryDateInput()}T00:00:00`);
  return end.getTime() >= min.getTime();
}

export function daysUntilExpiry(expiryDate: string): number | null {
  if (!expiryDate) return null;
  const end = new Date(`${expiryDate}T00:00:00`);
  if (Number.isNaN(end.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = end.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export const MOBILE_SUBSCRIPTION_RETURN_URLS = {
  successUrl: "https://app.autodaddy.ca/shop/my-website?payment=success",
  cancelUrl: "https://app.autodaddy.ca/shop/my-website?payment=cancel",
} as const;
