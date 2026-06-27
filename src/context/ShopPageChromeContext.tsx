import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useLocation } from "react-router";
import type { ShopSidebarItem } from "../components/shop/ShopSidebar";

export type ShopPageChromeConfig = {
  title?: string;
  metaTitle?: string;
  metaDescription?: string;
  sidebarItems?: ShopSidebarItem[];
  /** Placeholder sidebar pills while dynamic nav items load. */
  sidebarLoading?: boolean;
  sidebarSkeletonCount?: number;
  activeSidebarId?: string | null;
  onSidebarSelect?: (id: string) => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  sidebarHeading?: string;
  sidebarHeadingClassName?: string;
  sidebarExtra?: ReactNode;
  /** Top-left slot above sidebar content (home grid menu). */
  sidebarHeader?: ReactNode;
  sidebarFooter?: ReactNode;
  searchInputId?: string;
  faqsOpen?: boolean;
  onFaqsOpen?: () => void;
  onFaqsClose?: () => void;
  faqsHeading?: string;
  faqsDescription?: string;
  headerAction?: ReactNode;
  /** Center sub-header title (e.g. Dashboard, Personal Profile). */
  pageHeading?: string;
  /** `business-card` shows the profile card; `nav` shows section buttons. */
  sidebarVariant?: "business-card" | "nav";
  /** When false, uses the home hero layout instead of the profile background card. */
  heroCard?: boolean;
  /** When true, sidebar column stretches to match the main content height (home ads + menu). */
  sidebarStretch?: boolean;
  /** When false, keeps page content top-aligned inside the hero card instead of vertically centered. */
  contentTopOffset?: boolean;
};

export const DEFAULT_SHOP_PAGE_CHROME: ShopPageChromeConfig = {
  metaTitle: "AutoDaddy",
  metaDescription: "Auto shop portal",
};

type ShopPageChromeContextValue = {
  chrome: ShopPageChromeConfig;
  setChrome: Dispatch<SetStateAction<ShopPageChromeConfig>>;
};

const ShopPageChromeContext = createContext<ShopPageChromeContextValue | null>(null);

export function ShopPageChromeProvider({ children }: { children: ReactNode }) {
  const [chrome, setChrome] = useState<ShopPageChromeConfig>(DEFAULT_SHOP_PAGE_CHROME);
  const location = useLocation();

  useLayoutEffect(() => {
    setChrome(DEFAULT_SHOP_PAGE_CHROME);
  }, [location.pathname]);

  const value = useMemo(
    () => ({
      chrome,
      setChrome,
    }),
    [chrome],
  );

  return <ShopPageChromeContext.Provider value={value}>{children}</ShopPageChromeContext.Provider>;
}

export function useShopPageChromeContext() {
  const ctx = useContext(ShopPageChromeContext);
  if (!ctx) {
    throw new Error("useShopPageChromeContext must be used within ShopPageChromeProvider");
  }
  return ctx;
}

function isSameChromeConfig(prev: ShopPageChromeConfig, next: ShopPageChromeConfig): boolean {
  return (
    prev.title === next.title &&
    prev.metaTitle === next.metaTitle &&
    prev.metaDescription === next.metaDescription &&
    prev.sidebarItems === next.sidebarItems &&
    prev.sidebarLoading === next.sidebarLoading &&
    prev.sidebarSkeletonCount === next.sidebarSkeletonCount &&
    prev.activeSidebarId === next.activeSidebarId &&
    prev.onSidebarSelect === next.onSidebarSelect &&
    prev.searchPlaceholder === next.searchPlaceholder &&
    prev.searchValue === next.searchValue &&
    prev.onSearchChange === next.onSearchChange &&
    prev.sidebarHeading === next.sidebarHeading &&
    prev.sidebarHeadingClassName === next.sidebarHeadingClassName &&
    prev.sidebarExtra === next.sidebarExtra &&
    prev.sidebarHeader === next.sidebarHeader &&
    prev.sidebarFooter === next.sidebarFooter &&
    prev.searchInputId === next.searchInputId &&
    prev.faqsOpen === next.faqsOpen &&
    prev.onFaqsOpen === next.onFaqsOpen &&
    prev.onFaqsClose === next.onFaqsClose &&
    prev.faqsHeading === next.faqsHeading &&
    prev.faqsDescription === next.faqsDescription &&
    prev.headerAction === next.headerAction &&
    prev.pageHeading === next.pageHeading &&
    prev.sidebarVariant === next.sidebarVariant &&
    prev.heroCard === next.heroCard &&
    prev.sidebarStretch === next.sidebarStretch &&
    prev.contentTopOffset === next.contentTopOffset
  );
}

/** Register page chrome (title, sidebar, FAQs) with the persistent shop layout. */
export function useShopPageChrome(config: ShopPageChromeConfig) {
  const { setChrome } = useShopPageChromeContext();
  const configRef = useRef(config);
  configRef.current = config;

  useLayoutEffect(() => {
    setChrome((prev) => {
      const next = { ...DEFAULT_SHOP_PAGE_CHROME, ...configRef.current };
      return isSameChromeConfig(prev, next) ? prev : next;
    });
  });
}
