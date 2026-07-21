import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router";
import { getJson } from "../api/mobileAuth";
import { useAuth } from "../auth";
import type { ShopDashboardData } from "../hooks/useShopPortal";
import {
  buildMyCustomersQuery,
  fetchMyCustomers,
  fetchMyServices,
  fetchPayments,
  type MyCustomersPeriod,
} from "../lib/shopOwnerApi";
import { fetchAutoshopJobCards } from "../lib/autoshopownerJobCardsApi";
import { fetchAutoshopDealers, fetchAutoshopMyDeals } from "../lib/autoshopownerDealsApi";
import {
  getSectionsForShopPath,
  type ShopDataSection,
} from "../lib/shopDataSections";
import {
  isJobCardPaid,
  parseJobCardsFromPagePayload,
  type JobCardListRow,
} from "../lib/shopOwnerJobCards";
import {
  customerKey,
  dealId,
  parseMyCustomers,
  parseMyDeals,
  parseMyServices,
  parsePayments,
} from "../lib/shopOwnerParsers";
import {
  resolvePartsDealersFromPayload,
  type PartsDealerCard,
} from "../lib/shopPartsDealers";
import {
  fetchWebsiteTemplates,
  parseWebsiteTemplatesResponse,
  type WebsiteTemplate,
} from "../lib/shopOwnerWebsiteApi";
import type { MyCustomer, ShopDeal, ShopProfileResponse, ShopServiceCategory } from "../types/shopOwner";

const DEFAULT_PERIOD: MyCustomersPeriod = { timeFilter: "All", anchorDate: new Date() };

export type ShopPortalCache = {
  dashboard: ShopDashboardData | null;
  profile: ShopProfileResponse | null;
};

export type ShopWalletCache = {
  paid: JobCardListRow[];
  unpaid: JobCardListRow[];
  paidCash: JobCardListRow[];
  paidOnline: JobCardListRow[];
  unpaidCash: JobCardListRow[];
  unpaidOnline: JobCardListRow[];
};

export type ShopWebsiteTemplatesCache = {
  hasPurchasedTemplate: boolean | null;
  templates: WebsiteTemplate[];
};

type SectionDataMap = {
  portal: ShopPortalCache;
  partsDealers: PartsDealerCard[];
  customers: MyCustomer[];
  services: ShopServiceCategory[];
  jobCards: unknown;
  wallet: ShopWalletCache;
  deals: ShopDeal[];
  payments: Array<Record<string, unknown>>;
  websiteTemplates: ShopWebsiteTemplatesCache;
};

type SectionState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  loaded: boolean;
};

type ShopOwnerDataContextValue = {
  sections: { [K in ShopDataSection]: SectionState<SectionDataMap[K]> };
  loadSection: (section: ShopDataSection, options?: { force?: boolean }) => Promise<void>;
  prefetchSection: (section: ShopDataSection) => Promise<void>;
  refreshSection: (section: ShopDataSection) => Promise<void>;
};

const INITIAL_SECTION_STATE = <T,>(): SectionState<T> => ({
  data: null,
  loading: false,
  error: null,
  loaded: false,
});

const ShopOwnerDataContext = createContext<ShopOwnerDataContextValue | null>(null);

async function fetchSectionData(
  section: ShopDataSection,
  token: string,
): Promise<{ data: SectionDataMap[ShopDataSection] | null; error: string | null }> {
  try {
    switch (section) {
      case "portal": {
        const [homeRes, personalRes, businessRes, legacyProfileRes, legacyTeamRes] = await Promise.all([
          // NEW: Home (thought of the day + subscription days left)
          getJson<unknown>("/api/autoshopowner/home", token),
          // NEW: Profile slices
          getJson<unknown>("/api/autoshopowner/profile/personal", token),
          getJson<unknown>("/api/autoshopowner/profile/business", token),
          // LEGACY fallback: still needed for subscriptions and extra profile fields
          getJson<ShopProfileResponse>("/api/auto-shop-owner/profile", token),
          // LEGACY fallback: team members are not exposed in the new router yet
          getJson<unknown>("/api/auto-shop-owner/team-members", token),
        ]);

        const homeData =
          homeRes.ok && homeRes.data && typeof homeRes.data === "object"
            ? ((homeRes.data as Record<string, unknown>).data as Record<string, unknown> | null)
            : null;

        if (import.meta.env.DEV) {
          // Use console.log (not debug) so it shows up by default in DevTools.
          console.log("[shopOwner] /api/autoshopowner/home raw", homeRes);
          console.log("[shopOwner] /api/autoshopowner/home data", homeData);
        }

        const personalData =
          personalRes.ok && personalRes.data && typeof personalRes.data === "object"
            ? ((personalRes.data as Record<string, unknown>).data as Record<string, unknown> | null)
            : null;

        const businessData =
          businessRes.ok && businessRes.data && typeof businessRes.data === "object"
            ? ((businessRes.data as Record<string, unknown>).data as Record<string, unknown> | null)
            : null;

        // Normalize new /api/autoshopowner/profile/business response into legacy-friendly keys
        // consumed across the shop UI (e.g. ShopBusinessProfileEditor expects `address`, `email`,
        // `hstNumber`, `gstPercent`).
        const normalizedBusinessData =
          businessData && typeof businessData === "object"
            ? (() => {
                const d = businessData as Record<string, unknown>;
                const pickString = (...vals: unknown[]): string | undefined => {
                  for (const v of vals) {
                    if (typeof v === "string") {
                      const s = v.trim();
                      if (s) return s;
                    }
                  }
                  return undefined;
                };
                const pickGst = (...vals: unknown[]): number | string | undefined => {
                  for (const v of vals) {
                    if (typeof v === "number" && Number.isFinite(v)) return v;
                    if (typeof v === "string") {
                      const s = v.trim();
                      if (s) return s;
                    }
                  }
                  return undefined;
                };
                const pickShopTypes = (v: unknown): string[] | undefined => {
                  if (Array.isArray(v)) {
                    const types = v
                      .filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
                      .map((item) => item.trim());
                    return types.length > 0 ? types : undefined;
                  }
                  if (typeof v === "string" && v.trim()) {
                    const trimmed = v.trim();
                    if (trimmed.startsWith("[")) {
                      try {
                        const parsed = JSON.parse(trimmed) as unknown;
                        if (Array.isArray(parsed)) return pickShopTypes(parsed);
                      } catch {
                        // fall through to single string
                      }
                    }
                    return [trimmed];
                  }
                  return undefined;
                };
                const shopTypes = pickShopTypes(d.shopTypes ?? d.shopType);
                return {
                  ...d,
                  address: pickString(d.address, d.businessAddress),
                  email: pickString(d.email, d.businessEmail),
                  hstNumber: pickString(d.hstNumber, d.businessHSTNumber),
                  gstPercent: pickGst(d.gstPercent, d.gst),
                  shopTypes,
                  shopType: shopTypes?.[0],
                };
              })()
            : null;

        const legacyProfile = legacyProfileRes.ok ? (legacyProfileRes.data ?? null) : null;

        const teamMembers =
          legacyTeamRes.ok && legacyTeamRes.data && typeof legacyTeamRes.data === "object"
            ? (((legacyTeamRes.data as Record<string, unknown>).data as unknown) ??
                (legacyTeamRes.data as Record<string, unknown>).teamMembers)
            : null;

        const mergedProfile: ShopProfileResponse = {
          success: true,
          data: {
            ...(legacyProfile?.data ?? {}),
            userProfile: {
              ...(legacyProfile?.data?.userProfile ?? {}),
              ...(personalData ?? {}),
            },
            businessProfile: {
              ...(legacyProfile?.data?.businessProfile ?? {}),
              ...(normalizedBusinessData ?? {}),
            },
            ...(Array.isArray(teamMembers) ? { teamMembers } : {}),
          },
        };

        const mergedDashboard: ShopDashboardData | null =
          homeData != null
            ? {
                success: true,
                thoughtOfTheDay: homeData.thoughtOfTheDay as ShopDashboardData["thoughtOfTheDay"],
                businessName: typeof homeData.businessName === "string" ? homeData.businessName : undefined,
                subscriptionDaysLeftCount:
                  typeof homeData.daysLeftInSubscription === "number" ? homeData.daysLeftInSubscription : undefined,
              }
            : null;
        return {
          data: {
            dashboard: mergedDashboard,
            profile: mergedProfile,
          },
          error: null,
        };
      }
      case "partsDealers": {
        const res = await fetchAutoshopDealers(token);
        if (!res.ok) {
          return { data: [], error: "Could not load dealer ads." };
        }
        return { data: resolvePartsDealersFromPayload(res.data), error: null };
      }
      case "customers": {
        const res = await fetchMyCustomers(token, buildMyCustomersQuery(DEFAULT_PERIOD));
        if (!res.ok) return { data: [], error: "Could not load customers." };
        return { data: parseMyCustomers(res.data), error: null };
      }
      case "services": {
        const res = await fetchMyServices(token);
        if (!res.ok) return { data: [], error: "Could not load services." };
        return { data: parseMyServices(res.data), error: null };
      }
      case "jobCards": {
        const res = await fetchAutoshopJobCards(token);
        if (!res.ok) return { data: null, error: "Could not load job cards." };
        return { data: res.data ?? null, error: null };
      }
      case "wallet": {
        // Wallet invoices: only convertedToInvoice. Paid when invoicePaid === true.
        const convertedRes = await fetchAutoshopJobCards(token, { status: "convertedToInvoice" });
        if (!convertedRes.ok) {
          return {
            data: {
              paid: [],
              unpaid: [],
              paidCash: [],
              paidOnline: [],
              unpaidCash: [],
              unpaidOnline: [],
            },
            error: "Could not load wallet data.",
          };
        }
        const converted = parseJobCardsFromPagePayload(convertedRes.data);
        const unpaidOnline = converted.filter((row) => !isJobCardPaid(row));
        const paidOnline = converted.filter((row) => isJobCardPaid(row));
        const paidCash: JobCardListRow[] = [];
        const unpaidCash: JobCardListRow[] = [];
        return {
          data: {
            paid: paidOnline,
            unpaid: unpaidOnline,
            paidCash,
            paidOnline,
            unpaidCash,
            unpaidOnline,
          },
          error: null,
        };
      }
      case "deals": {
        const res = await fetchAutoshopMyDeals(token);
        if (!res.ok) return { data: [], error: "Could not load deals." };
        return { data: parseMyDeals(res.data), error: null };
      }
      case "payments": {
        const res = await fetchPayments(token);
        if (!res.ok) return { data: [], error: "Could not load reports." };
        return { data: parsePayments(res.data), error: null };
      }
      case "websiteTemplates": {
        const res = await fetchWebsiteTemplates(token);
        if (!res.ok) {
          return {
            data: { hasPurchasedTemplate: null, templates: [] },
            error: "Could not load website templates.",
          };
        }
        return { data: parseWebsiteTemplatesResponse(res.data), error: null };
      }
      default:
        return { data: null, error: null };
    }
  } catch {
    return { data: null, error: "Network error." };
  }
}

function createInitialSections(): ShopOwnerDataContextValue["sections"] {
  return {
    portal: INITIAL_SECTION_STATE<ShopPortalCache>(),
    partsDealers: INITIAL_SECTION_STATE<PartsDealerCard[]>(),
    customers: INITIAL_SECTION_STATE<MyCustomer[]>(),
    services: INITIAL_SECTION_STATE<ShopServiceCategory[]>(),
    jobCards: INITIAL_SECTION_STATE<unknown>(),
    wallet: INITIAL_SECTION_STATE<ShopWalletCache>(),
    deals: INITIAL_SECTION_STATE<ShopDeal[]>(),
    payments: INITIAL_SECTION_STATE<Array<Record<string, unknown>>>(),
    websiteTemplates: INITIAL_SECTION_STATE<ShopWebsiteTemplatesCache>(),
  };
}

export function ShopOwnerDataProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [sections, setSections] = useState(createInitialSections);
  const inflightRef = useRef<Partial<Record<ShopDataSection, Promise<void>>>>({});
  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;

  const runSectionFetch = useCallback(
    async (section: ShopDataSection, options?: { silent?: boolean; force?: boolean }) => {
      if (!token) return;

      const existing = sectionsRef.current[section];
      if (!options?.force && existing.loaded) return;

      // Force navigations show loading even when cached data exists.
      const showLoading = Boolean(options?.force ? !options.silent : !existing.loaded && !options?.silent);
      if (showLoading) {
        setSections((prev) => ({
          ...prev,
          [section]: { ...prev[section], loading: true, error: null },
        }));
      }

      const existingPromise = inflightRef.current[section];
      if (existingPromise) {
        await existingPromise;
        return;
      }

      const promise = (async () => {
        try {
          const result = await fetchSectionData(section, token);
          setSections((prev) => ({
            ...prev,
            [section]: {
              data: result.data ?? prev[section].data,
              loading: false,
              error: result.error,
              loaded: true,
            },
          }));
        } catch {
          setSections((prev) => ({
            ...prev,
            [section]: {
              ...prev[section],
              loading: false,
              error: "Network error.",
              loaded: true,
            },
          }));
        }
      })();

      inflightRef.current[section] = promise;
      try {
        await promise;
      } finally {
        delete inflightRef.current[section];
      }
    },
    [token],
  );

  const loadSection = useCallback(
    async (section: ShopDataSection, options?: { force?: boolean }) => {
      await runSectionFetch(section, { force: options?.force, silent: false });
    },
    [runSectionFetch],
  );

  const prefetchSection = useCallback(
    async (section: ShopDataSection) => {
      await runSectionFetch(section, { silent: true });
    },
    [runSectionFetch],
  );

  const refreshSection = useCallback(
    async (section: ShopDataSection) => {
      await runSectionFetch(section, { force: true, silent: true });
    },
    [runSectionFetch],
  );

  useEffect(() => {
    if (!token) {
      setSections(createInitialSections());
      inflightRef.current = {};
    }
  }, [token]);

  const value = useMemo(
    () => ({
      sections,
      loadSection,
      prefetchSection,
      refreshSection,
    }),
    [sections, loadSection, prefetchSection, refreshSection],
  );

  return <ShopOwnerDataContext.Provider value={value}>{children}</ShopOwnerDataContext.Provider>;
}

export function useShopOwnerData() {
  const ctx = useContext(ShopOwnerDataContext);
  if (!ctx) {
    throw new Error("useShopOwnerData must be used within ShopOwnerDataProvider");
  }
  return ctx;
}

/** Force-refetches the current page's data on every navigation. */
export function ShopOwnerPrefetcher() {
  const location = useLocation();
  const { loadSection, refreshSection } = useShopOwnerData();

  useEffect(() => {
    // Portal powers the shell on every page — refresh in background (no header flicker).
    void refreshSection("portal");

    for (const section of getSectionsForShopPath(location.pathname)) {
      if (section === "portal") continue;
      void loadSection(section, { force: true });
    }
  }, [location.pathname, loadSection, refreshSection]);

  return null;
}

export {
  customerKey,
  dealId,
  parseJobCardsFromPagePayload,
};
export type { PartsDealerCard } from "../lib/shopPartsDealers";
export type { JobCardListRow } from "../lib/shopOwnerJobCards";
