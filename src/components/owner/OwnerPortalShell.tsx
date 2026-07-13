import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { FiBell, FiUser } from "react-icons/fi";
import useAuth from "../../auth/useAuth";
import { getActivePrimaryItem, type NavItem, type NavSubItem } from "../../config/adminNav";
import { useCarOwnerNotifications } from "../../hooks/useCarOwnerNotifications";
import ShopBrandLogo from "../shop/ShopBrandLogo";
import { shopNavVerticalGapClass, shopPortalHorizPaddingClass } from "../shop/shopLayoutStyles";

const LOGO = "/logo.png";
const OWNER_MESSAGES_PATH = "/owner/messages";
const OWNER_LAST_SEEN_KEY = "ad:lastSeen:owner-notifications";

const logoImageClass =
  "block h-auto w-auto max-h-16 max-w-[200px] object-contain sm:max-h-[72px] sm:max-w-[220px] md:max-h-20 md:max-w-[260px]";

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
    "inline-block rounded-b-lg border border-gray-400 bg-gray-200 px-2.5 py-0.5 text-[11px] text-gray-700 hover:bg-gray-300 sm:px-3 sm:text-xs";
  const helpLinkActiveClass =
    "inline-block rounded-b-lg border border-ad-green bg-ad-green-light px-2.5 py-0.5 text-[11px] font-semibold text-ad-green-dark shadow-sm sm:px-3 sm:text-xs";

  const subNavLinkClass =
    "relative block px-2 py-1.5 text-center text-xs leading-snug text-blue-700 underline-offset-2 hover:underline lg:px-1.5 lg:py-1.5 lg:text-xs lg:leading-snug lg:whitespace-normal";

  const headerStackGapClass = shopNavVerticalGapClass;
  const loginAsDisplay = loginAs?.trim() || displayName;

  const headerAvatar = headerAvatarSrc?.trim() ? (
    <ShopBrandLogo src={headerAvatarSrc} alt="Profile photo" className="!size-[42px]" />
  ) : (
    <span className="flex size-[42px] shrink-0 items-center justify-center rounded border border-gray-300 bg-white text-gray-400">
      <FiUser size={22} strokeWidth={1.75} aria-hidden />
    </span>
  );

  useEffect(() => {
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-ad-app-bg font-sans">
      <header className={`${shopPortalHorizPaddingClass} pt-0 pb-0`}>
        <div className="grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-2 md:grid-cols-[auto_1fr_auto] md:gap-x-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded border border-gray-300 p-2 lg:hidden"
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
              <img src={LOGO} alt="AutoDaddy" className={logoImageClass} />
            </Link>
          </div>

          <div className="col-span-2 flex items-center justify-center md:col-span-1 md:self-center">
            <p className="text-center font-serif text-base text-gray-500 md:text-lg lg:text-xl">
              <Link to={homePath} className="italic hover:text-gray-600">
                {displayName}
              </Link>
              {city ? (
                <>
                  {" "}
                  -{" "}
                  <Link
                    to={profilePath}
                    className="font-bold text-blue-600 underline hover:text-blue-700"
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
              className="flex shrink-0 items-start gap-0 [&>*+*]:-ml-px"
              aria-label="Account actions"
            >
              <span className={utilityLinkClass}>Login as : {loginAsDisplay}</span>
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
              <Link to={profilePath} className="shrink-0">
                {headerAvatar}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <nav
        className={`relative z-20 overflow-visible ${shopPortalHorizPaddingClass} pb-0 ${
          mobileOpen ? "block" : "hidden lg:block"
        }`}
        aria-label="Owner sections"
      >
        <ul className="flex flex-col gap-px lg:flex-row lg:w-full lg:gap-px">
          {primaryNav.map((item) => {
            const isActive = activePrimary?.name === item.name;
            const firstPath = item.path ?? item.subItems?.[0]?.path ?? "#";
            const itemClass = `w-full px-3 py-1.5 text-center text-sm font-semibold transition-colors lg:rounded-b-lg lg:px-4 lg:py-2 lg:text-sm ${
              isActive
                ? "relative z-20 border border-ad-purple bg-ad-glass text-ad-purple shadow-md"
                : "border border-ad-purple/80 bg-ad-purple text-white shadow-sm hover:bg-ad-purple-dark"
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
      </nav>

      {displaySubItems.length > 0 && activePrimary ? (
        <div className="relative z-10 mt-[3px] bg-white/35 backdrop-blur-xl lg:mt-[5px]">
          <div className={shopPortalHorizPaddingClass}>
            <ul className="hidden w-full items-stretch overflow-visible lg:flex lg:gap-px lg:pb-[7px]">
              {primaryNav.map((item, colIndex) => {
                const sub = colIndex < displaySubItems.length ? displaySubItems[colIndex] : null;
                const active = sub ? sub.path === activeSubItemPath : false;
                return (
                  <li key={item.name} className="relative min-w-0 flex-1 overflow-visible">
                    {sub ? (
                      <Link
                        to={sub.path}
                        onClick={(e) => handleNavLinkClick(sub.path, e)}
                        className={`${subNavLinkClass} ${active ? "bg-gray-200 font-medium" : ""}`}
                      >
                        {sub.name}
                        {active ? (
                          <span
                            className="pointer-events-none absolute left-1/2 top-full z-10 h-0 w-0 -translate-x-1/2 border-x-[7px] border-b-[7px] border-x-transparent border-b-ad-purple"
                            aria-hidden
                          />
                        ) : null}
                      </Link>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="hidden border-b-2 border-ad-purple lg:block" aria-hidden />
          <ul className="flex flex-col border-b-2 border-ad-purple lg:hidden">
            {displaySubItems.map((sub) => {
              const active = sub.path === activeSubItemPath;
              return (
                <li key={sub.path}>
                  <Link
                    to={sub.path}
                    onClick={(e) => handleNavLinkClick(sub.path, e)}
                    className={`${subNavLinkClass} text-left ${active ? "bg-gray-200 font-medium" : ""}`}
                  >
                    {sub.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <main key={contentKey} className="min-h-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
