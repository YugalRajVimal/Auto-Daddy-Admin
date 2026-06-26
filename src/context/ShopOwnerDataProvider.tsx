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
  fetchJobCards,
  fetchMyCustomers,
  fetchMyDeals,
  fetchMyServices,
  fetchPaidJobCards,
  fetchPayments,
  fetchUnpaidJobCards,
  type MyCustomersPeriod,
} from "../lib/shopOwnerApi";
import {
  getPrefetchSectionForShopPath,
  getSectionsForShopPath,
  type ShopDataSection,
} from "../lib/shopDataSections";
import { parseJobCardsFromPagePayload, type JobCardListRow } from "../lib/shopOwnerJobCards";
import {
  customerKey,
  dealId,
  parseMyCustomers,
  parseMyDeals,
  parseMyServices,
  parsePayments,
} from "../lib/shopOwnerParsers";
import { FALLBACK_PARTS_DEALERS, fetchPartsDealers, type PartsDealerCard } from "../lib/shopPartsDealers";
import { parsePaidWalletPayload, parseUnpaidWalletPayload } from "../lib/shopOwnerWallet";
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
        const [dashRes, profileRes] = await Promise.all([
          getJson<ShopDashboardData>("/api/auto-shop-owner/dashboard-details-new", token),
          getJson<ShopProfileResponse>("/api/auto-shop-owner/profile", token),
        ]);
        return {
          data: {
            dashboard: dashRes.ok ? (dashRes.data ?? null) : null,
            profile: profileRes.ok ? (profileRes.data ?? null) : null,
          },
          error: null,
        };
      }
      case "partsDealers":
        return { data: await fetchPartsDealers(token), error: null };
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
        const res = await fetchJobCards(token, buildMyCustomersQuery(DEFAULT_PERIOD));
        if (!res.ok) return { data: null, error: "Could not load job cards." };
        return { data: res.data ?? null, error: null };
      }
      case "wallet": {
        const [paidRes, unpaidRes] = await Promise.all([
          fetchPaidJobCards(token),
          fetchUnpaidJobCards(token),
        ]);
        const paid = paidRes.ok
          ? (() => {
              const { cash, online } = parsePaidWalletPayload(paidRes.data);
              return [...cash, ...online];
            })()
          : [];
        const unpaid = unpaidRes.ok
          ? (() => {
              const { cash, online } = parseUnpaidWalletPayload(unpaidRes.data);
              return [...cash, ...online];
            })()
          : [];
        if (!paidRes.ok && !unpaidRes.ok) {
          return { data: { paid: [], unpaid: [] }, error: "Could not load wallet data." };
        }
        return { data: { paid, unpaid }, error: null };
      }
      case "deals": {
        const res = await fetchMyDeals(token);
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

  const runSectionFetch = useCallback(
    async (section: ShopDataSection, options?: { silent?: boolean; force?: boolean }) => {
      if (!token) {
        setSections(createInitialSections());
        return;
      }

      let shouldFetch = false;
      let showLoading = false;

      setSections((prev) => {
        const existing = prev[section];
        if (!options?.force && existing.loaded) {
          return prev;
        }
        shouldFetch = true;
        showLoading = !existing.loaded && !options?.silent;
        if (!showLoading) return prev;
        return {
          ...prev,
          [section]: { ...existing, loading: true, error: null },
        };
      });

      if (!shouldFetch) return;

      const existingPromise = inflightRef.current[section];
      if (existingPromise) {
        await existingPromise;
        return;
      }

      const promise = (async () => {
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

/** Loads the current page's data and prefetches the next primary-nav section. */
export function ShopOwnerPrefetcher() {
  const location = useLocation();
  const { loadSection, prefetchSection } = useShopOwnerData();

  useEffect(() => {
    const currentSections = getSectionsForShopPath(location.pathname);
    const nextSection = getPrefetchSectionForShopPath(location.pathname);

    for (const section of currentSections) {
      void loadSection(section);
    }
    if (nextSection) {
      void prefetchSection(nextSection);
    }
  }, [location.pathname, loadSection, prefetchSection]);

  return null;
}

export {
  customerKey,
  dealId,
  parseJobCardsFromPagePayload,
  FALLBACK_PARTS_DEALERS,
};
export type { PartsDealerCard } from "../lib/shopPartsDealers";
export type { JobCardListRow } from "../lib/shopOwnerJobCards";
