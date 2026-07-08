import { useEffect, useMemo } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { FiBell, FiUser } from "react-icons/fi";
import useAuth from "../../auth/useAuth";
import { type NavItem } from "../../config/adminNav";
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

  const onHelpNav = helpPath != null && isPathActive(location.pathname, helpPath, homePath);

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
          <div className="flex items-center">
            <Link to={homePath} className="shrink-0">
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

      <main className="min-h-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
