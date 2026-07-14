import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { FiBell, FiUser } from "react-icons/fi";
import useAuth from "../../auth/useAuth";
import { getActivePrimaryItem, type NavItem, type NavSubItem } from "../../config/adminNav";
import { useCarOwnerNotifications } from "../../hooks/useCarOwnerNotifications";
import ShopBrandLogo from "../shop/ShopBrandLogo";
import { shopPortalHorizPaddingClass } from "../shop/shopLayoutStyles";
import {
  ownerChromeHeaderPadClass,
  ownerChromeLogoClass,
  ownerChromeNameClass,
  ownerChromePrimaryTabClass,
  ownerChromeSubNavLinkClass,
} from "./ownerLayoutStyles";

const LOGO = "/logo.png";
const OWNER_MESSAGES_PATH = "/owner/messages";
const OWNER_LAST_SEEN_KEY = "ad:lastSeen:owner-notifications";

function isPathActive(pathname: string, path: string, homePath: string) {
  if (path === homePath) return pathname === homePath;
  return pathname === path || pathname.startsWith(`${path}/`);
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
}: OwnerPortalShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { items } = useCarOwnerNotifications();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navReset = (location.state as { navReset?: number } | null | undefined)?.navReset ?? 0;
  const contentKey = `${location.pathname}-${navReset}`;

  const activePrimary = getActivePrimaryItem(location.pathname, primaryNav, homePath);
  const onHelpNav = helpPath != null && isPathActive(location.pathname, helpPath, homePath);
  const displaySubItems: NavSubItem[] = activePrimary?.subItems ?? [];
  const hasSubNav = displaySubItems.length > 0 && activePrimary != null;
  const activeSubItemPath = getActiveSubItemPath(location.pathname, displaySubItems, homePath);

  const handleNavLinkClick = (path: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    setMobileOpen(false);
    if (location.pathname === path) {
      e.preventDefault();
      navigate(path, { replace: true, state: { navReset: Date.now() } });
    }
  };

  const handlePrimaryClick = (item: NavItem) => {
    const target = item.path ?? item.subItems?.[0]?.path;
    if (target) navigate(target);
    setMobileOpen(false);
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

  const utilityLinkClass =
    "rounded-full px-2.5 py-1 text-[11px] font-medium text-gray-500 transition-colors hover:bg-white/70 hover:text-ad-purple sm:px-3 sm:text-xs";
  const helpLinkActiveClass =
    "rounded-full bg-ad-green-light/80 px-2.5 py-1 text-[11px] font-semibold text-ad-green-dark ring-1 ring-ad-green/25 sm:px-3 sm:text-xs";

  const subNavActiveClass =
    "bg-white font-semibold text-ad-purple shadow-sm ring-1 ring-ad-purple/15";

  const headerStackGapClass = "gap-2";
  const loginAsDisplay = loginAs?.trim() || displayName;

  const headerAvatar = headerAvatarSrc?.trim() ? (
    <ShopBrandLogo
      src={headerAvatarSrc}
      alt="Profile photo"
      className="!size-9 !rounded-xl !border-white/80 !shadow-md ring-2 ring-ad-purple/10 sm:!size-10"
    />
  ) : (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/80 bg-white/70 text-ad-purple/50 shadow-md ring-2 ring-ad-purple/10 backdrop-blur-sm sm:size-10">
      <FiUser size={20} strokeWidth={1.75} aria-hidden />
    </span>
  );

  useEffect(() => {
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  }, [location.pathname]);

  return (
    <div className="owner-portal relative flex min-h-screen flex-col bg-ad-app-bg font-sans">
      <div
        className="owner-chrome-mist pointer-events-none absolute inset-x-0 top-0 z-0 h-40 bg-[radial-gradient(ellipse_80%_70%_at_50%_-10%,rgba(155,48,141,0.18),transparent_65%),radial-gradient(ellipse_50%_50%_at_8%_20%,rgba(44,140,44,0.12),transparent_55%)] 2xl:h-44"
        aria-hidden
      />

      <header className={`relative z-20 ${shopPortalHorizPaddingClass} ${ownerChromeHeaderPadClass}`}>
        <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 md:grid-cols-[auto_1fr_auto] md:gap-x-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-xl border border-white/70 bg-white/55 p-2 text-gray-600 shadow-sm backdrop-blur-md md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              <svg width="20" height="16" viewBox="0 0 16 12" fill="currentColor">
                <rect width="16" height="2" y="0" />
                <rect width="16" height="2" y="5" />
                <rect width="16" height="2" y="10" />
              </svg>
            </button>
            <Link to={homePath} className="shrink-0" onClick={(e) => handleNavLinkClick(homePath, e)}>
              <img src={LOGO} alt="AutoDaddy" className={ownerChromeLogoClass} />
            </Link>
          </div>

          <div className="col-span-2 flex items-center justify-center md:col-span-1">
            <p className={ownerChromeNameClass}>
              <Link
                to={homePath}
                className="bg-gradient-to-r from-ad-purple to-ad-pink-dark bg-clip-text font-semibold text-transparent transition-opacity hover:opacity-80"
              >
                {displayName}
              </Link>
              {city ? (
                <>
                  <span className="mx-1.5 font-normal text-ad-purple/25" aria-hidden>
                    ·
                  </span>
                  <Link
                    to={profilePath}
                    className="font-medium text-ad-blue-dark/80 underline decoration-ad-blue-dark/20 underline-offset-4 transition-colors hover:text-ad-blue-dark hover:decoration-ad-blue-dark/50"
                  >
                    {city}
                  </Link>
                </>
              ) : null}
            </p>
          </div>

          <div
            className={`col-span-2 flex flex-col items-end md:col-span-1 md:col-start-3 md:row-start-1 ${headerStackGapClass}`}
          >
            <nav
              className="flex shrink-0 items-center gap-1 rounded-full border border-white/60 bg-white/45 px-1.5 py-0.5 shadow-sm backdrop-blur-md"
              aria-label="Account actions"
            >
              <span className={`${utilityLinkClass} cursor-default text-gray-400 hover:bg-transparent hover:text-gray-400`}>
                Login as : <span className="text-gray-600">{loginAsDisplay}</span>
              </span>
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
                className="relative rounded-xl border border-white/70 bg-white/55 p-2 text-ad-blue-dark/80 shadow-sm backdrop-blur-md transition-colors hover:bg-white/85 hover:text-ad-blue-dark"
                aria-label="Notifications"
                onClick={handleNotificationsClick}
              >
                <FiBell size={18} strokeWidth={1.75} />
                {newCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-br from-ad-purple to-ad-pink-dark px-1 text-[10px] font-bold leading-none text-white shadow-sm">
                    {newCount > 99 ? "99+" : newCount}
                  </span>
                ) : null}
              </button>
              <Link to={profilePath} className="shrink-0 transition-transform hover:scale-[1.03]">
                {headerAvatar}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <nav
        className={`relative z-20 ${shopPortalHorizPaddingClass} pb-0 ${
          mobileOpen ? "block" : "hidden md:block"
        }`}
        aria-label="Owner sections"
      >
        <div
          className={`overflow-hidden border border-white/50 bg-gradient-to-b from-white/55 to-ad-bg-purple/40 p-1 shadow-[0_8px_28px_rgba(155,48,141,0.1)] backdrop-blur-xl ${
            hasSubNav ? "rounded-t-2xl border-b-0" : "rounded-2xl"
          }`}
        >
          <ul className="flex flex-col gap-1 md:flex-row md:gap-1">
            {primaryNav.map((item) => {
              const isActive = activePrimary?.name === item.name;
              const firstPath = item.path ?? item.subItems?.[0]?.path ?? "#";
              const itemClass = `${ownerChromePrimaryTabClass} ${
                isActive
                  ? "bg-gradient-to-br from-ad-purple to-ad-purple-dark text-white shadow-[0_6px_16px_rgba(155,48,141,0.35)]"
                  : "text-ad-purple/80 hover:bg-white/70 hover:text-ad-purple"
              }`;
              return (
                <li key={item.name} className="min-w-0 flex-1">
                  {item.subItems && item.subItems.length > 0 ? (
                    <button type="button" onClick={() => handlePrimaryClick(item)} className={itemClass}>
                      {item.name}
                    </button>
                  ) : (
                    <Link
                      to={firstPath}
                      onClick={(e) => handleNavLinkClick(firstPath, e)}
                      className={`block ${itemClass}`}
                    >
                      {item.name}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {hasSubNav ? (
        <div className={`relative z-10 ${shopPortalHorizPaddingClass}`}>
          <div className="rounded-b-2xl border border-t-0 border-white/50 bg-white/45 px-1.5 pb-1.5 pt-1 shadow-[0_10px_24px_rgba(100,130,170,0.06)] backdrop-blur-xl">
            <ul className="hidden w-full items-center md:flex">
              {primaryNav.map((item, colIndex) => {
                const sub = colIndex < displaySubItems.length ? displaySubItems[colIndex] : null;
                const active = sub ? sub.path === activeSubItemPath : false;
                return (
                  <li key={item.name} className="relative min-w-0 flex-1 px-0.5 py-1">
                    {sub ? (
                      <Link
                        to={sub.path}
                        onClick={(e) => handleNavLinkClick(sub.path, e)}
                        className={`${ownerChromeSubNavLinkClass} ${active ? subNavActiveClass : ""}`}
                      >
                        {sub.name}
                      </Link>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            <ul className="flex flex-col gap-1 p-1 md:hidden">
              {displaySubItems.map((sub) => {
                const active = sub.path === activeSubItemPath;
                return (
                  <li key={sub.path}>
                    <Link
                      to={sub.path}
                      onClick={(e) => handleNavLinkClick(sub.path, e)}
                      className={`${ownerChromeSubNavLinkClass} max-w-none text-left ${
                        active ? subNavActiveClass : ""
                      }`}
                    >
                      {sub.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}

      <main key={contentKey} className="relative z-10 min-h-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
