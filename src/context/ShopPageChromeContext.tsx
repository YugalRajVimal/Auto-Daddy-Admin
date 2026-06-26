import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
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
  activeSidebarId?: string | null;
  onSidebarSelect?: (id: string) => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  sidebarHeading?: string;
  sidebarHeadingClassName?: string;
  sidebarExtra?: ReactNode;
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
  /** When false, main content starts flush with the sidebar top (e.g. home hero). */
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

/** Register page chrome (title, sidebar, FAQs) with the persistent shop layout. */
export function useShopPageChrome(config: ShopPageChromeConfig) {
  const { setChrome } = useShopPageChromeContext();

  useLayoutEffect(() => {
    setChrome({ ...DEFAULT_SHOP_PAGE_CHROME, ...config });
  }, [
    setChrome,
    config.title,
    config.metaTitle,
    config.metaDescription,
    config.sidebarItems,
    config.activeSidebarId,
    config.onSidebarSelect,
    config.searchPlaceholder,
    config.searchValue,
    config.onSearchChange,
    config.sidebarHeading,
    config.sidebarHeadingClassName,
    config.sidebarExtra,
    config.sidebarFooter,
    config.searchInputId,
    config.faqsOpen,
    config.onFaqsOpen,
    config.onFaqsClose,
    config.faqsHeading,
    config.faqsDescription,
    config.headerAction,
    config.pageHeading,
    config.sidebarVariant,
    config.contentTopOffset,
  ]);
}
