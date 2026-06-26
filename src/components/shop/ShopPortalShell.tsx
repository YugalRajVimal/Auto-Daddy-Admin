import { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { FiBell } from "react-icons/fi";
import useAuth from "../../auth/useAuth";
import { getActivePrimaryItem, type NavItem } from "../../config/adminNav";
import { Skeleton } from "../common/Skeleton";
import { useShopPageChromeContext } from "../../context/ShopPageChromeContext";
import type { PortalBrandLogo } from "../admin/PortalShell";
import ShopBrandLogo from "./ShopBrandLogo";
import { shopPortalHorizPaddingClass } from "./shopLayoutStyles";

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
  const { logout } = useAuth();
  const { chrome } = useShopPageChromeContext();

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

  const utilityLinkClass =
    "inline-block rounded-b-lg border border-gray-400 bg-gray-200 px-2.5 py-0.5 text-[11px] text-gray-700 hover:bg-gray-300 sm:px-3 sm:text-xs";
  const helpLinkActiveClass =
    "inline-block rounded-b-lg border border-ad-green bg-ad-green-light px-2.5 py-0.5 text-[11px] font-semibold text-ad-green-dark shadow-sm sm:px-3 sm:text-xs";

  const brandLogoLabel = brandLogo?.placeholderLabel?.trim() || "Business logo";
  const headerLogo = brandLogo ? (
    <ShopBrandLogo src={brandLogo.src} alt={brandLogoLabel} />
  ) : null;

  useEffect(() => {
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-ad-app-bg font-sans">
      <header className={`${shopPortalHorizPaddingClass} pt-4 pb-1 md:pt-5`}>
        <div className="grid grid-cols-[auto_1fr_auto] items-start gap-x-3 gap-y-3">
          <Link to={homePath} className="row-span-2 shrink-0 self-start">
            {headerLogo}
          </Link>

          <div className="min-w-0 flex items-center">
            {businessNameLoading ? (
              <span aria-busy="true" aria-label="Loading business name">
                <Skeleton className="h-7 w-36 rounded sm:h-8 sm:w-44 md:h-9 md:w-52" />
              </span>
            ) : (
              <Link
                to={homePath}
                className="min-w-0 truncate font-serif text-lg italic text-gray-500 hover:text-gray-600 sm:text-xl md:text-2xl"
              >
                {businessName || "Your Business"}
              </Link>
            )}
          </div>

          <nav
            className="flex shrink-0 items-center gap-0 self-start [&>*+*]:-ml-px"
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

          <div className="col-start-2 row-start-2 min-w-0 justify-self-start self-center">
            {city ? (
              <Link
                to={profilePath}
                className="text-sm font-bold text-blue-600 underline hover:text-blue-700 md:text-base"
              >
                {city}
              </Link>
            ) : null}
          </div>

          <h1 className="pointer-events-none col-start-2 col-end-4 row-start-2 self-center text-center font-serif text-lg font-bold text-gray-600 md:text-xl lg:text-2xl">
            {pageHeading}
          </h1>

          <div className="relative z-10 col-start-3 row-start-2 flex justify-end justify-self-end self-center">
            <button
              type="button"
              className="relative text-blue-600 hover:text-blue-700"
              aria-label="Notifications"
            >
              <FiBell size={26} strokeWidth={1.75} />
              <span className="absolute -right-1.5 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold leading-none text-white">
                1
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
