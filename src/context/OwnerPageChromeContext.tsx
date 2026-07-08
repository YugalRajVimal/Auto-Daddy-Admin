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

export type OwnerPageChromeConfig = {
  title?: string;
  titleClassName?: string;
  headerClassName?: string;
  metaTitle?: string;
  metaDescription?: string;
  /** Full-width header row above the sidebar / hero grid (e.g. split title + section). */
  pageHeader?: ReactNode;
  sidebarItems?: ShopSidebarItem[];
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
  sidebarFooter?: ReactNode;
  /** Top-left slot above sidebar content (e.g. home grid menu). */
  sidebarHeader?: ReactNode;
  /** Replaces the default nav sidebar (vehicle thumbnails, service menu, etc.). */
  customSidebar?: ReactNode;
  searchInputId?: string;
  faqsOpen?: boolean;
  onFaqsOpen?: () => void;
  onFaqsClose?: () => void;
  faqsHeading?: string;
  faqsDescription?: string;
  headerAction?: ReactNode;
  pageHeading?: string;
  sidebarVariant?: "business-card" | "nav";
  heroCard?: boolean;
  heroBackgroundImage?: boolean;
  sidebarStretch?: boolean;
  contentTopOffset?: boolean;
  contentFillHeight?: boolean;
  heroCardFlush?: boolean;
  heroCardTransparent?: boolean;
  heroCardToolbarAlways?: boolean;
};

export const DEFAULT_OWNER_PAGE_CHROME: OwnerPageChromeConfig = {
  metaTitle: "AutoDaddy",
  metaDescription: "Car owner portal",
};

type OwnerPageChromeContextValue = {
  chrome: OwnerPageChromeConfig;
  setChrome: Dispatch<SetStateAction<OwnerPageChromeConfig>>;
};

const OwnerPageChromeContext = createContext<OwnerPageChromeContextValue | null>(null);

export function OwnerPageChromeProvider({ children }: { children: ReactNode }) {
  const [chrome, setChrome] = useState<OwnerPageChromeConfig>(DEFAULT_OWNER_PAGE_CHROME);
  const location = useLocation();

  useLayoutEffect(() => {
    setChrome(DEFAULT_OWNER_PAGE_CHROME);
  }, [location.pathname]);

  const value = useMemo(
    () => ({
      chrome,
      setChrome,
    }),
    [chrome],
  );

  return <OwnerPageChromeContext.Provider value={value}>{children}</OwnerPageChromeContext.Provider>;
}

export function useOwnerPageChromeContext() {
  const ctx = useContext(OwnerPageChromeContext);
  if (!ctx) {
    throw new Error("useOwnerPageChromeContext must be used within OwnerPageChromeProvider");
  }
  return ctx;
}

function isSameChromeConfig(prev: OwnerPageChromeConfig, next: OwnerPageChromeConfig): boolean {
  return (
    prev.title === next.title &&
    prev.titleClassName === next.titleClassName &&
    prev.headerClassName === next.headerClassName &&
    prev.metaTitle === next.metaTitle &&
    prev.metaDescription === next.metaDescription &&
    prev.pageHeader === next.pageHeader &&
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
    prev.sidebarFooter === next.sidebarFooter &&
    prev.sidebarHeader === next.sidebarHeader &&
    prev.customSidebar === next.customSidebar &&
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
    prev.heroBackgroundImage === next.heroBackgroundImage &&
    prev.sidebarStretch === next.sidebarStretch &&
    prev.contentTopOffset === next.contentTopOffset &&
    prev.contentFillHeight === next.contentFillHeight &&
    prev.heroCardFlush === next.heroCardFlush &&
    prev.heroCardTransparent === next.heroCardTransparent &&
    prev.heroCardToolbarAlways === next.heroCardToolbarAlways
  );
}

/** Register page chrome with the persistent owner layout. */
export function useOwnerPageChrome(config: OwnerPageChromeConfig) {
  const { setChrome } = useOwnerPageChromeContext();
  const configRef = useRef(config);
  configRef.current = config;

  useLayoutEffect(() => {
    setChrome((prev) => {
      const next = { ...DEFAULT_OWNER_PAGE_CHROME, ...configRef.current };
      return isSameChromeConfig(prev, next) ? prev : next;
    });
  });
}
