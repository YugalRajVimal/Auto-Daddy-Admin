import { useEffect, useMemo } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { FiBell } from "react-icons/fi";
import useAuth from "../../auth/useAuth";
import { getActivePrimaryItem, type NavItem } from "../../config/adminNav";
import { Skeleton } from "../common/Skeleton";
import { useShopPageChromeContext } from "../../context/ShopPageChromeContext";
import { useShopNotifications } from "../../hooks/useShopNotifications";
import type { PortalBrandLogo } from "../admin/PortalShell";
import ShopBrandLogo from "./ShopBrandLogo";
import { shopNavVerticalGapClass, shopPortalHorizPaddingClass } from "./shopLayoutStyles";

const SHOP_MESSAGES_PATH = "/shop/messages";
const SHOP_LAST_SEEN_KEY = "ad:lastSeen:shop-notifications";

function isPathActive(pathname: string, path: string, homePath: string) {
  if (path === homePath) return pathname === homePath;
  return pathname === path || pathname.startsWith(`${path}/`);
}

export type ShopPortalShellProps = {
  homePath: string;
  profilePath: string;
  primaryNav: NavItem[];
  brandLogo?: PortalBrandLogo;
  businessName: string;
  businessNameLoading?: boolean;
  city?: string;
  subscriptionDaysLeft?: number | null;
  helpPath?: string;
};

export default function ShopPortalShell({
  homePath,
  profilePath,
  primaryNav,
  brandLogo,
  businessName,
  businessNameLoading = false,
  city,
  subscriptionDaysLeft,
  helpPath,
}: ShopPortalShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { chrome } = useShopPageChromeContext();
  const { items } = useShopNotifications();

  const activePrimary = getActivePrimaryItem(location.pathname, primaryNav, homePath);
  const onHelpNav = helpPath != null && isPathActive(location.pathname, helpPath, homePath);

  const pageHeading =
    chrome.pageHeading?.trim() ||
    chrome.title?.trim() ||
    activePrimary?.name ||
    "Dashboard";

  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to log out?")) return;
    logout();
  };

  const newCount = useMemo(() => {
    const lastSeen = Number(localStorage.getItem(SHOP_LAST_SEEN_KEY) ?? 0);
    if (!Number.isFinite(lastSeen) || lastSeen <= 0) return 0;
    return items.reduce((count, n) => {
      const t = n.time ? new Date(n.time).getTime() : NaN;
      if (!Number.isNaN(t) && t > lastSeen) return count + 1;
      return count;
    }, 0);
  }, [items]);

  const handleNotificationsClick = () => {
    localStorage.setItem(SHOP_LAST_SEEN_KEY, String(Date.now()));
    navigate(SHOP_MESSAGES_PATH, { state: { initialTab: "notifications" } });
  };

  const utilityLinkClass =
    "inline-block rounded-b-lg border border-gray-400 bg-gray-200 px-2.5 py-0.5 text-[11px] text-gray-700 hover:bg-gray-300 sm:px-3 sm:text-xs";
  const helpLinkActiveClass =
    "inline-block rounded-b-lg border border-ad-green bg-ad-green-light px-2.5 py-0.5 text-[11px] font-semibold text-ad-green-dark shadow-sm sm:px-3 sm:text-xs";

  const brandLogoLabel = brandLogo?.placeholderLabel?.trim() || "Business logo";
  const headerLogo = brandLogo ? (
    <ShopBrandLogo src={brandLogo.src} alt={brandLogoLabel} className="!size-[42px]" />
  ) : null;

  /** Matches vertical rhythm between header rows and header → primary nav. */
  const headerStackGapClass = shopNavVerticalGapClass;

  useEffect(() => {
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-ad-app-bg font-sans">
      <header className={`${shopPortalHorizPaddingClass} pt-0 pb-0`}>
        <div className={`grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-x-3 ${headerStackGapClass}`}>
          <div className="col-start-1 row-start-1 row-span-2 flex w-fit max-w-full min-w-0 flex-col items-center justify-self-start self-center pt-1">
            {businessNameLoading ? (
              <span aria-busy="true" aria-label="Loading business name">
                <Skeleton className="h-7 w-36 rounded sm:h-8 sm:w-44 md:h-9 md:w-52" />
              </span>
            ) : (
              <Link
                to={homePath}
                className="block min-w-0 max-w-full truncate font-serif text-lg italic text-gray-500 hover:text-gray-600 sm:text-xl md:text-2xl"
              >
                {businessName || "Your Business"}
              </Link>
            )}
            {city ? (
              <Link
                to={profilePath}
                className="text-sm font-bold text-blue-600 underline hover:text-blue-700 md:text-base"
              >
                {city}
              </Link>
            ) : null}
          </div>

          <div
            className={`col-start-3 row-start-1 row-span-2 flex flex-col items-end justify-self-end self-start ${headerStackGapClass}`}
          >
            <nav
              className="flex shrink-0 items-start gap-0 [&>*+*]:-ml-px"
              aria-label="Account actions"
            >
              {subscriptionDaysLeft != null ? (
                <span className={utilityLinkClass}>{subscriptionDaysLeft} Days Left</span>
              ) : null}
              <Link
                to={helpPath ?? "#"}
                className={helpPath && onHelpNav ? helpLinkActiveClass : utilityLinkClass}
              >
                Help
              </Link>
              <button type="button" onClick={handleLogout} className={utilityLinkClass}>
                Log out
              </button>
            </nav>

            <div className="relative z-10 flex items-center justify-end gap-2.5">
              <button
                type="button"
                className="relative text-blue-600 hover:text-blue-700"
                aria-label="Notifications"
                onClick={handleNotificationsClick}
              >
                <FiBell size={22} strokeWidth={1.75} />
                {newCount > 0 ? (
                  <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold leading-none text-white">
                    {newCount > 99 ? "99+" : newCount}
                  </span>
                ) : null}
              </button>
              {headerLogo ? (
                <Link to={profilePath} className="shrink-0" aria-label="Open profile">
                  {headerLogo}
                </Link>
              ) : null}
            </div>
          </div>

          <h1 className="pointer-events-none col-span-3 col-start-1 row-start-2 z-0 flex h-[42px] w-full items-center justify-center self-end text-center font-serif text-lg font-bold leading-tight text-gray-600 md:text-xl lg:text-2xl">
            {pageHeading}
          </h1>
        </div>
      </header>

      <main className="min-h-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
