import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { FiBell, FiEdit2 } from "react-icons/fi";
import useAuth from "../../auth/useAuth";
import type { NavItem, NavSubItem } from "../../config/adminNav";
import { OwnerNavContext } from "../../context/OwnerNavContext";
import { useOwnerShopCityFilter } from "../../context/OwnerShopCityFilterContext";
import { useCarOwnerNotifications } from "../../hooks/useCarOwnerNotifications";
import ShopBrandLogo from "../shop/ShopBrandLogo";
import { ownerPortalGridClass, ownerPortalGutterClass } from "./ownerLayoutStyles";

const LOGO = "/logo.png";
const OWNER_MESSAGES_PATH = "/owner/messages";
const OWNER_LAST_SEEN_KEY = "ad:lastSeen:owner-notifications";

function isPathActive(pathname: string, path: string, homePath: string) {
  if (path === homePath) return pathname === homePath;
  return pathname === path || pathname.startsWith(`${path}/`);
}

/** Longest matching `matchPaths` entry wins, so nested routes pick the most specific tab. */
function findActivePrimary(pathname: string, items: NavItem[], homePath: string): NavItem | null {
  let best: NavItem | null = null;
  let bestLen = -1;
  for (const item of items) {
    const paths = item.matchPaths ?? [...(item.path ? [item.path] : []), ...(item.subItems?.map((s) => s.path) ?? [])];
    for (const p of paths) {
      const hit = p === homePath ? pathname === homePath : pathname === p || pathname.startsWith(`${p}/`);
      if (hit && p.length > bestLen) {
        best = item;
        bestLen = p.length;
      }
    }
  }
  return best;
}

function getActiveSubItemPath(pathname: string, subItems: NavSubItem[], homePath: string): string | null {
  const exact = subItems.find((s) => {
    if (s.path === homePath) return pathname === homePath;
    return pathname === s.path;
  });
  if (exact) return exact.path;

  const prefixMatch = subItems
    .filter((s) => s.path !== homePath && pathname.startsWith(`${s.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0];
  return prefixMatch?.path ?? null;
}

export type OwnerPortalShellProps = {
  homePath: string;
  profilePath: string;
  primaryNav: NavItem[];
  displayName: string;
  city?: string;
  loginAs?: string;
  headerAvatarSrc?: string | null;
  helpPath?: string;
  /** Sub-header tabs when Help (utility link) is active. */
  helpNav?: NavSubItem[];
};

export default function OwnerPortalShell({
  homePath,
  profilePath,
  primaryNav,
  displayName,
  city,
  loginAs,
  headerAvatarSrc,
  helpPath,
  helpNav = [],
}: OwnerPortalShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { items } = useCarOwnerNotifications();
  const { filterCityName, openCityPicker } = useOwnerShopCityFilter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navReset = (location.state as { navReset?: number } | null | undefined)?.navReset ?? 0;
  const contentKey = `${location.pathname}-${navReset}`;
  const onCityFilterPages =
    location.pathname === "/owner/auto-shops" ||
    location.pathname.startsWith("/owner/auto-shops/") ||
    location.pathname === "/owner/deals" ||
    location.pathname.startsWith("/owner/deals/");
  const headerCity = onCityFilterPages
    ? filterCityName.trim() || "All cities"
    : city?.trim() || "";

  const activePrimary = findActivePrimary(location.pathname, primaryNav, homePath);
  const onHelpNav = helpPath != null && isPathActive(location.pathname, helpPath, homePath);
  const helpSubItems = onHelpNav ? helpNav : [];
  const primarySubItems: NavSubItem[] = activePrimary?.subItems ?? [];
  const displaySubItems: NavSubItem[] =
    helpSubItems.length > 0 ? helpSubItems : primarySubItems;
  // A tab with a single section (e.g. My vehicles on the Docs page) keeps that section highlighted.
  const activeSubItemPath =
    getActiveSubItemPath(location.pathname, displaySubItems, homePath) ??
    (activePrimary && displaySubItems.length === 1 ? displaySubItems[0].path : null);

  const handleNavLinkClick = (path: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    setMobileOpen(false);
    if (location.pathname === path) {
      e.preventDefault();
      navigate(path, { replace: true, state: { navReset: Date.now() } });
    }
  };

  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to log out?")) return;
    logout();
  };

  const newCount = useMemo(() => {
    const lastSeen = Number(localStorage.getItem(OWNER_LAST_SEEN_KEY) ?? 0);
    if (!Number.isFinite(lastSeen) || lastSeen <= 0) return 0;
    return items.reduce((count, n) => {
      const t = new Date(n.time).getTime();
      if (!Number.isNaN(t) && t > lastSeen) return count + 1;
      return count;
    }, 0);
  }, [items]);

  const handleNotificationsClick = () => {
    localStorage.setItem(OWNER_LAST_SEEN_KEY, String(Date.now()));
    navigate(OWNER_MESSAGES_PATH, { state: { initialTab: "notifications" } });
  };

  const loginAsDisplay = loginAs?.trim() || displayName;

  useEffect(() => {
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  }, [location.pathname]);

  const navContext = useMemo(
    () => ({
      subItems: onHelpNav ? helpSubItems : activePrimary ? displaySubItems : [],
      activeSubPath: activeSubItemPath,
      onSubNavClick: handleNavLinkClick,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onHelpNav, helpSubItems, activePrimary, displaySubItems, activeSubItemPath, location.pathname],
  );

  const cityLinkClass =
    "inline-flex items-center gap-1.5 font-serif text-xl font-bold text-blue-700 underline decoration-2 underline-offset-4 transition-colors hover:text-ad-purple 2xl:text-2xl";
  const cityLabel = headerCity || (onCityFilterPages ? "Select city" : "");

  const utilityClass =
    "px-3 py-1 text-xs font-semibold text-gray-700 transition-colors hover:bg-white hover:text-ad-purple sm:px-4 sm:text-[13px]";

  return (
    <OwnerNavContext.Provider value={navContext}>
      <div className="owner-portal relative flex min-h-screen flex-col bg-ad-app-bg font-sans">
        <header className={`relative z-20 ${ownerPortalGutterClass} pt-2 pb-3 2xl:pt-3`}>
          <div className={ownerPortalGridClass}>
            {/* Logo + city (mockup: logo with the city link under it) */}
            <div className="flex items-center gap-3 lg:flex-col lg:items-center lg:justify-center lg:gap-1">
              <button
                type="button"
                className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 shadow-sm lg:hidden"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
                aria-expanded={mobileOpen}
              >
                <svg width="20" height="16" viewBox="0 0 16 12" fill="currentColor" aria-hidden>
                  <rect width="16" height="2" y="0" />
                  <rect width="16" height="2" y="5" />
                  <rect width="16" height="2" y="10" />
                </svg>
              </button>
              <Link to={homePath} className="shrink-0" onClick={(e) => handleNavLinkClick(homePath, e)}>
                <img
                  src={LOGO}
                  alt="AutoDaddy"
                  className="block h-auto max-h-12 w-auto max-w-[200px] object-contain drop-shadow-sm md:max-h-14 2xl:max-h-16 2xl:max-w-[240px]"
                />
              </Link>
              {cityLabel ? (
                onCityFilterPages ? (
                  <button type="button" onClick={openCityPicker} className={cityLinkClass} aria-label="Change city filter">
                    {cityLabel}
                    <FiEdit2 className="size-3.5 shrink-0" aria-hidden />
                  </button>
                ) : (
                  <Link to={profilePath} className={cityLinkClass}>
                    {cityLabel}
                  </Link>
                )
              ) : null}
            </div>

            <div className="flex min-w-0 flex-col gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="order-last w-full min-w-0 truncate text-center font-serif sm:order-none sm:w-auto sm:flex-1 sm:pt-4 text-2xl font-bold tracking-wide text-gray-400 [text-shadow:0_1px_0_#fff] md:text-[1.75rem] 2xl:text-3xl">
                  <Link to={profilePath} className="transition-colors hover:text-ad-purple">
                    {displayName}
                  </Link>
                </p>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <nav
                    className="flex items-center divide-x divide-white overflow-hidden rounded-md bg-gray-200/90 shadow-sm ring-1 ring-gray-300/60"
                    aria-label="Account actions"
                  >
                    <span className="px-3 py-1 text-xs font-bold text-gray-700 sm:text-[13px]">
                      Login as : {loginAsDisplay}
                    </span>
                    <Link
                      to={helpPath ?? "#"}
                      className={`${utilityClass} ${onHelpNav ? "bg-white text-ad-purple" : ""}`}
                    >
                      Help
                    </Link>
                    <button type="button" onClick={handleLogout} className={utilityClass}>
                      Log out
                    </button>
                  </nav>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="relative flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-md transition-transform hover:scale-105"
                      aria-label={newCount > 0 ? `Notifications (${newCount} new)` : "Notifications"}
                      onClick={handleNotificationsClick}
                    >
                      <FiBell size={20} strokeWidth={2} />
                      {newCount > 0 ? (
                        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ad-purple px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                          {newCount > 99 ? "99+" : newCount}
                        </span>
                      ) : null}
                    </button>
                    <Link to={profilePath} className="shrink-0 transition-transform hover:scale-[1.03]" aria-label="Profile">
                      <ShopBrandLogo
                        src={headerAvatarSrc}
                        alt="Profile photo"
                        className="!size-14 !rounded-lg !border !border-gray-300 !bg-white text-ad-purple/40 shadow-sm"
                      />
                    </Link>
                  </div>
                </div>
              </div>

              <nav className={mobileOpen ? "block" : "hidden lg:block"} aria-label="Owner sections">
                <ul className="flex flex-col gap-1.5 lg:flex-row">
                  {primaryNav.map((item) => {
                    const isActive = activePrimary?.name === item.name && !onHelpNav;
                    const target = item.path ?? item.subItems?.[0]?.path ?? "#";
                    return (
                      <li key={item.name} className="min-w-0 flex-1">
                        <Link
                          to={target}
                          onClick={(e) => handleNavLinkClick(target, e)}
                          aria-current={isActive ? "page" : undefined}
                          className={`block truncate rounded-lg border-2 px-2 py-1.5 text-center text-[15px] font-bold tracking-wide transition-all 2xl:text-base ${
                            isActive
                              ? "border-ad-purple bg-white text-ad-purple shadow-[0_4px_14px_rgba(155,48,141,0.18)]"
                              : "border-transparent bg-gradient-to-b from-[#b045a4] to-ad-purple text-white shadow-sm hover:-translate-y-px hover:brightness-110"
                          }`}
                        >
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
          </div>
        </header>

        <main key={contentKey} className="relative z-10 min-h-0 flex-1">
          <Outlet />
        </main>
      </div>
    </OwnerNavContext.Provider>
  );
}
