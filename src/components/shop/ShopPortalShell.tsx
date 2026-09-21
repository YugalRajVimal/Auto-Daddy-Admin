import { useEffect, useMemo } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { FiBell } from "react-icons/fi";
import useAuth from "../../auth/useAuth";
import type { NavItem } from "../../config/adminNav";
import { Skeleton } from "../common/Skeleton";
import { useShopPageChromeContext } from "../../context/ShopPageChromeContext";
import { useShopNotifications } from "../../hooks/useShopNotifications";
import type { PortalBrandLogo } from "../admin/PortalShell";
import ShopBrandLogo from "./ShopBrandLogo";
import ShopPrimaryNav from "./ShopPrimaryNav";
import ShopSubNav from "./ShopSubNav";
import { shopPortalHorizPaddingClass } from "./shopLayoutStyles";

const SHOP_MESSAGES_PATH = "/shop/messages";
const SHOP_LAST_SEEN_KEY = "ad:lastSeen:shop-notifications";
const AUTODADDY_LOGO = "/logo.png";

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
  subscriptionDaysLeft,
  helpPath,
}: ShopPortalShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { chrome } = useShopPageChromeContext();
  const { items } = useShopNotifications();

  const onHelpNav = helpPath != null && isPathActive(location.pathname, helpPath, homePath);

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

  const utilityItemClass =
    "px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-white hover:text-ad-purple sm:px-4 sm:text-sm";

  useEffect(() => {
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-ad-app-bg font-sans">
      <header className={`${shopPortalHorizPaddingClass} flex flex-col gap-2 pb-1`}>
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3">
          <Link to={homePath} className="shrink-0" aria-label="AutoDaddy home">
            <img
              src={AUTODADDY_LOGO}
              alt="AutoDaddy"
              className="h-11 w-auto max-w-[150px] object-contain sm:h-14 sm:max-w-[200px]"
            />
          </Link>

          <div className="flex min-w-0 items-baseline justify-center gap-2 pt-4">
            <span className="hidden shrink-0 text-sm font-medium text-gray-500 sm:inline">Login as :</span>
            {businessNameLoading ? (
              <span aria-busy="true" aria-label="Loading business name">
                <Skeleton className="h-7 w-40 rounded sm:h-8 sm:w-52" />
              </span>
            ) : (
              <Link
                to={profilePath}
                className="min-w-0 truncate text-xl font-extrabold tracking-tight text-ad-green-dark transition-colors hover:text-ad-green sm:text-2xl lg:text-3xl"
              >
                {businessName || "Your Business"}
              </Link>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <nav
              aria-label="Account actions"
              className="flex items-stretch divide-x divide-gray-300 overflow-hidden rounded-b-xl border border-t-0 border-gray-300 bg-gray-100 shadow-sm"
            >
              {subscriptionDaysLeft != null ? (
                <span className="px-3 py-1 text-xs font-bold text-gray-800 sm:px-4 sm:text-sm">
                  {subscriptionDaysLeft} days left
                </span>
              ) : null}
              <Link
                to={helpPath ?? "#"}
                className={`${utilityItemClass} ${onHelpNav ? "bg-white font-semibold text-ad-purple" : ""}`}
              >
                Help
              </Link>
              <button type="button" onClick={handleLogout} className={utilityItemClass}>
                Log out
              </button>
            </nav>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="relative flex size-9 items-center justify-center rounded-full text-blue-600 transition-colors hover:bg-white hover:text-blue-700"
                aria-label="Notifications"
                onClick={handleNotificationsClick}
              >
                <FiBell size={22} strokeWidth={1.75} />
                {newCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold leading-none text-white">
                    {newCount > 99 ? "99+" : newCount}
                  </span>
                ) : null}
              </button>
              <Link to={profilePath} className="shrink-0" aria-label="Open profile">
                <ShopBrandLogo
                  src={brandLogo?.src}
                  alt={brandLogo?.placeholderLabel?.trim() || "Profile photo"}
                  className="!size-11 rounded-lg border-gray-300 bg-white shadow-sm"
                />
              </Link>
            </div>
          </div>
        </div>

        <ShopPrimaryNav homePath={homePath} primaryNav={primaryNav} />

        <ShopSubNav
          items={chrome.sidebarItems ?? []}
          activeId={chrome.activeSidebarId}
          onSelect={chrome.onSidebarSelect}
          actions={chrome.subNavActions}
        />
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
}
