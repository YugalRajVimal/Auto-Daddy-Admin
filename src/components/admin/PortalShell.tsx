import React,{ useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { FiImage, FiUser } from "react-icons/fi";
import { FaBell } from "react-icons/fa";
import useAuth from "../../auth/useAuth";
import { adminSettingsNav, getActivePrimaryItem, type NavItem, type NavSubItem } from "../../config/adminNav";
import { hasView, type StoredPermissions } from "../../utils/navPermissions";

const LOGO = "/logo.png";
const ADMIN_MESSAGES_PATH = "/admin/messages/received";



// Adopt OwnerPanelLayout (22-35): Track impersonation state using localStorage, sync across tabs
const useBackToSuperAdminToken = () => {
  const [backToSuperAdminToken, setBackToSuperAdminToken] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("back-to-admin-token");
    setBackToSuperAdminToken(token);
    // Listen for changes to storage (other tabs etc)
    const storageListener = () => {
      const t = localStorage.getItem("back-to-admin-token");
      setBackToSuperAdminToken(t);
    };
    window.addEventListener('storage', storageListener);
    return () => window.removeEventListener('storage', storageListener);
  }, []);

  return backToSuperAdminToken;
};

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

export type PortalBrandLogo = {
  src: string | null;
  placeholderLabel?: string;
};

export type PortalShellProps = {
  children: React.ReactNode;
  homePath: string;
  profilePath: string;
  primaryNav: NavItem[];
  utilityNav?: NavSubItem[];
  utilityNavLabel?: string;
  /** Sub-header tabs shown when on matching paths (e.g. notification messages). */
  contextualNav?: NavSubItem[];
  /** When set, replaces the default AutoDaddy logo in the header. */
  brandLogo?: PortalBrandLogo;
  /** Center header content (e.g. owner name and city). */
  headerCenter?: React.ReactNode;
  /** Optional profile photo shown beside the notification bell. */
  headerAvatarSrc?: string | null;
  /** Help page path; when set, the Help utility link navigates here. */
  helpPath?: string;
};


export default function PortalShell({
  children,
  homePath,
  profilePath,
  primaryNav,
  utilityNav = [],
  utilityNavLabel = "Admin",
  contextualNav = [],
  brandLogo,
  headerCenter,
  headerAvatarSrc,
  helpPath,
}: PortalShellProps) {
  const location = useLocation();
  const navigate = useNavigate();


  const { role, logout, permissions } = useAuth();

const isSuperAdmin = role === "admin";

const storedPerms = (permissions as StoredPermissions | null) ?? null;

const canShowPrimary = (item: NavItem) =>
  isSuperAdmin ||
  hasView(storedPerms, item.permissionModule) ||
  (item.subItems ?? []).some((sub) => hasView(storedPerms, sub.permissionModule));

const canShowSub = (sub: NavSubItem) =>
  isSuperAdmin || hasView(storedPerms, sub.permissionModule);

// export default function PortalShell({
//   children,
//   homePath,
//   profilePath,
//   primaryNav,
//   utilityNav = [],
//   utilityNavLabel = "Admin",
//   contextualNav = [],
//   loginAs,
//   brandLogo,
//   headerCenter,
//   headerAvatarSrc,
//   subscriptionDaysLeft,
//   helpPath,
// }: PortalShellProps) {
  // const location = useLocation();
  // const navigate = useNavigate();
  // const { role, logout, session } = useAuth();


  console.log("role:", role, "isSuperAdmin:", isSuperAdmin);
console.log("storedPerms:", storedPerms);

  // NOTE: assumes role === "admin" means SuperAdmin, matching AdminAuthContext.
  // Adjust if your role string differs.
  // const isSuperAdmin = role === "admin";
  // const storedPerms = useMemo(() => readStoredPermissions(), []);

  // const canShowPrimary = (item: NavItem) =>
  //   isSuperAdmin || hasView(storedPerms, item.permissionModule);

  // const canShowSub = (sub: NavSubItem) =>
  //   isSuperAdmin || hasView(storedPerms, sub.permissionModule);

  const [mobileOpen, setMobileOpen] = useState(false);
  const navReset = (location.state as { navReset?: number } | null | undefined)?.navReset ?? 0;
  const contentKey = `${location.pathname}-${navReset}`;

  const activePrimary = getActivePrimaryItem(location.pathname, primaryNav, homePath);

  const visiblePrimaryNav = useMemo(
    () => primaryNav.filter(canShowPrimary),
    [primaryNav, storedPerms, isSuperAdmin]
  );
  const visibleUtilityNav = useMemo(
    () => utilityNav.filter(canShowSub),
    [utilityNav, storedPerms, isSuperAdmin]
  );
  const visibleContextualNav = useMemo(
    () => contextualNav.filter(canShowSub),
    [contextualNav, storedPerms, isSuperAdmin]
  );

  const showSettings = canShowSub(adminSettingsNav);
  const onSettingsNav = isPathActive(location.pathname, adminSettingsNav.path, homePath);

  const onUtilityNav = visibleUtilityNav.some((s) => isPathActive(location.pathname, s.path, homePath));
  const onContextualNav = visibleContextualNav.some((s) => isPathActive(location.pathname, s.path, homePath));
  const onHelpNav = helpPath != null && isPathActive(location.pathname, helpPath, homePath);
  const utilitySubItems = onUtilityNav ? visibleUtilityNav : [];
  const contextualSubItems = onContextualNav ? visibleContextualNav : [];
  const primarySubItems: NavSubItem[] = (activePrimary?.subItems ?? []).filter(canShowSub);

  const displaySubItems =
    utilitySubItems.length > 0
      ? utilitySubItems
      : contextualSubItems.length > 0
        ? contextualSubItems
        : primarySubItems;
  const activeSubItemPath = getActiveSubItemPath(location.pathname, displaySubItems, homePath);
  const utilityNavPath = visibleUtilityNav[0]?.path ?? "#";

  const { profile, isLogInViaSuperAdmin, login } = useAuth();
  const backToSuperAdminToken = useBackToSuperAdminToken();

  // Handler for reverting back to Super Admin session
  const handleBackToSuperAdmin = () => {
    const backToken = localStorage.getItem("back-to-admin-token");

    if (backToken) {
      localStorage.setItem("admin-token", backToken);
      localStorage.removeItem("back-to-admin-token");
      login({ token: backToken, role: "admin" });
      setTimeout(() => {
        // Use post-login redirect (use correct path for your app)
        window.location.href = "/admin";
      }, 800);
    }
  };


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

  const handleSubNavClick = (path: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    handleNavLinkClick(path, e);
  };

  const handlePrimaryNavLinkClick = (path: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    handleNavLinkClick(path, e);
  };

  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to log out?")) return;
    logout();
  };

  const utilityLinkClass =
    "inline-flex min-w-[76px] items-center justify-center rounded-b-md border border-[#c3c3c3] bg-[#d3d3d3] px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300 sm:min-w-[96px] sm:px-5 sm:text-[16px]";
  const utilityLinkActiveClass =
    "inline-flex min-w-[76px] items-center justify-center rounded-b-md border border-[#a5348f] bg-[#a5348f] px-3 py-1 text-sm font-semibold text-white shadow-sm sm:min-w-[96px] sm:px-5 sm:text-[16px]";
  const helpLinkActiveClass = utilityLinkActiveClass;

  const subNavLinkClass =
    "relative block px-2 py-1.5 text-center text-sm font-normal leading-snug text-[#0000e6] underline-offset-2 hover:underline lg:px-1.5 lg:py-1.5 lg:text-[13px] lg:leading-snug lg:whitespace-normal";

  const logoImageClass =
    "block h-auto w-auto max-h-[4.25rem] max-w-[220px] object-contain sm:max-h-[4.75rem] sm:max-w-[260px] md:max-h-20 md:max-w-[300px]";
  const brandLogoLabel = brandLogo?.placeholderLabel?.trim() || "Business logo";
  const headerLogo = brandLogo ? (
    brandLogo.src ? (
      <img src={brandLogo.src} alt={brandLogoLabel} className={logoImageClass} />
    ) : (
      <div
        className="flex min-h-16 min-w-[100px] max-h-20 max-w-[200px] flex-col items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50 px-3 py-2 sm:max-h-[72px] sm:max-w-[220px] md:max-h-20 md:max-w-[260px]"
        aria-label={brandLogoLabel}
      >
        <FiImage size={28} className="text-gray-400" strokeWidth={1.5} aria-hidden />
        <span className="mt-1 text-center text-[10px] font-medium leading-tight text-gray-500">
          {brandLogoLabel}
        </span>
      </div>
    )
  ) : (
    <img src={LOGO} alt="AutoDaddy" className={logoImageClass} />
  );

  useEffect(() => {
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  }, [location.pathname]);

  // Scopes the white admin theme (see `.admin-portal` in index.css) to this portal only,
  // including popups that render outside the shell's DOM tree.
  useEffect(() => {
    document.body.classList.add("admin-portal");
    return () => document.body.classList.remove("admin-portal");
  }, []);

  const utilityNavBar = (
    <nav
      className="flex shrink-0 items-center gap-0 [&>*+*]:-ml-px"
      aria-label="Account actions"
    >
      {visibleUtilityNav.length > 0 && (
        <Link
          to={utilityNavPath}
          className={onUtilityNav ? utilityLinkActiveClass : utilityLinkClass}
          onClick={(e) => handleNavLinkClick(utilityNavPath, e)}
        >
          {utilityNavLabel}
        </Link>
      )}
      {showSettings && (
        <Link
          to={adminSettingsNav.path}
          className={onSettingsNav ? utilityLinkActiveClass : utilityLinkClass}
          onClick={(e) => handleNavLinkClick(adminSettingsNav.path, e)}
        >
          {adminSettingsNav.name}
        </Link>
      )}
      {helpPath && (
        <Link
          to={helpPath}
          className={onHelpNav ? helpLinkActiveClass : utilityLinkClass}
          onClick={(e) => handleNavLinkClick(helpPath, e)}
        >
          Help
        </Link>
      )}
      <button type="button" onClick={handleLogout} className={utilityLinkClass}>
        Log out
      </button>
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-col bg-ad-app-bg font-sans">

{backToSuperAdminToken && (
        <div
          className="flex items-center justify-between px-4 py-2 text-sm z-50 border border-yellow-300 text-yellow-900 bg-yellow-100 whitespace-nowrap"
          style={{
            position: "sticky",
            top: 0,
            left: 0,
            right: 0,
            width: "fit-content",

            minWidth: "225px",
            margin: "12px auto 0 auto",
            borderBottomLeftRadius: "22px",
            borderBottomRightRadius: "22px",
            borderTopLeftRadius: "8px",
            borderTopRightRadius: "8px",
            boxShadow: "0 6px 16px #0001",
          }}
        >
          <span>
            <b>Impersonating from Super Admin</b>
            {profile?.name && (
              <span>
                {" "}
                (<span className="font-medium">{profile.name}</span>
                {profile.email && (
                  <span className="ml-1 text-gray-600">| {profile.email}</span>
                )}
                )
              </span>
            )}
          </span>
          <button
            className="ml-4 px-3 py-1 rounded bg-yellow-400 hover:bg-yellow-500 font-semibold text-yellow-900 border border-yellow-600 whitespace-nowrap"
            type="button"
            onClick={handleBackToSuperAdmin}
          >
            Back to Super Admin
          </button>
        </div>
      )}
      {!backToSuperAdminToken && isLogInViaSuperAdmin && (
        <div className="flex shrink-0 items-center gap-2 border-b border-yellow-200 bg-yellow-100 px-4 py-2 text-xs text-yellow-900">
          <span className="font-semibold">You are logged in as Admin</span>
          {profile?.name && (
            <span>
              (<span className="font-medium">{profile.name}</span>
              {profile.email && (
                <span className="ml-1 text-gray-600">| {profile.email}</span>
              )}
              )
            </span>
          )}
        </div>
      )}

      <div className="flex min-h-0 w-full flex-1 flex-col">
        <header className="px-3 pt-0 pb-2 sm:px-4">
          <div className="grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-3 md:grid-cols-[auto_1fr_auto] md:gap-x-4">
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
              <Link to={homePath} onClick={(e) => handleNavLinkClick(homePath, e)}>
                {headerLogo}
              </Link>
            </div>

            <div className="col-span-2 flex items-center justify-center md:col-span-1 md:self-center">
              {headerCenter ?? (
                <span className="select-none font-canada text-3xl leading-none text-[#86c232] sm:text-4xl">
                  Canada
                </span>
              )}
            </div>

            <div className="col-span-2 flex flex-col items-end gap-2 md:col-span-1 md:col-start-3 md:row-start-1">
              {utilityNavBar}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="relative text-[#1a6fe0] transition-colors hover:text-[#0d4fb0]"
                  aria-label="Notifications"
                  onClick={() => navigate(ADMIN_MESSAGES_PATH)}
                >
                  <FaBell size={26} />
                </button>
                <Link
                  to={profilePath}
                  className="flex h-11 w-11 items-center justify-center overflow-hidden border border-gray-400 bg-white text-gray-400 shadow-sm sm:h-[46px] sm:w-[46px]"
                  aria-label="Profile"
                  onClick={(e) => handleNavLinkClick(profilePath, e)}
                >
                  {headerAvatarSrc ? (
                    <img src={headerAvatarSrc} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <FiUser size={28} strokeWidth={1.75} />
                  )}
                </Link>
              </div>
            </div>
          </div>
        </header>

        <nav
          className={`relative z-20 overflow-visible px-3 pb-0 sm:px-4 ${mobileOpen ? "block" : "hidden lg:block"}`}
        >
          <ul className="flex flex-col gap-px lg:flex-row lg:w-full lg:gap-px">
            {visiblePrimaryNav.map((item) => {
              const isActive = activePrimary?.name === item.name;
              const firstPath = item.path ?? item.subItems?.[0]?.path ?? "#";
              const itemClass = `w-full px-3 py-1.5 text-center text-sm font-semibold transition-colors lg:rounded lg:px-4 lg:py-1.5 whitespace-nowrap lg:text-[14px] xl:text-[16px] 2xl:text-[17px] lg:leading-tight ${isActive
                  ? "relative z-20 border border-ad-purple bg-white text-ad-purple shadow-md"
                  : "border border-[#a5348f] bg-[#a5348f] text-white shadow-sm hover:bg-[#8c2179]"
                }`;
              return (
                <li key={item.name} className="min-w-0 flex-1">
                  {item.subItems ? (
                    <button type="button" onClick={() => handlePrimaryClick(item)} className={itemClass}>
                      {item.name}
                    </button>
                  ) : (
                    <Link
                      to={firstPath}
                      onClick={(e) => handlePrimaryNavLinkClick(firstPath, e)}
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

        {displaySubItems.length > 0 && (activePrimary || onUtilityNav || onContextualNav) && (
          <div className="relative z-10 mt-[3px] bg-white/35 backdrop-blur-xl lg:mt-[5px]">
            <div className="px-3 sm:px-4">
              <ul className="hidden w-full items-stretch overflow-visible lg:flex lg:gap-px lg:pb-[7px]">
                {primaryNav.map((item, colIndex) => {
                  const sub = colIndex < displaySubItems.length ? displaySubItems[colIndex] : null;
                  const active = sub ? sub.path === activeSubItemPath : false;
                  return (
                    <li key={item.name} className="relative min-w-0 flex-1 overflow-visible">
                      {sub && (
                        <Link
                          to={sub.path}
                          onClick={(e) => handleSubNavClick(sub.path, e)}
                          className={`${subNavLinkClass} ${active ? "bg-[#dcdcdc]" : ""}`}
                        >
                          {sub.name}
                          {active && (
                            <span
                              className="pointer-events-none absolute left-1/2 top-full z-10 h-0 w-0 -translate-x-1/2 border-x-[7px] border-b-[7px] border-x-transparent border-b-ad-purple"
                              aria-hidden
                            />
                          )}
                        </Link>
                      )}
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
                      onClick={(e) => handleSubNavClick(sub.path, e)}
                      className={`${subNavLinkClass} text-left ${active ? "bg-gray-200 font-medium" : ""}`}
                    >
                      {sub.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
  

        {displaySubItems.length === 0 || !(activePrimary || onUtilityNav || onContextualNav) ? (
          <div className="mt-1 hidden h-10 border-b-2 border-ad-purple lg:block" aria-hidden />
        ) : null}

        <main key={contentKey} className="flex min-h-0 flex-1 flex-col px-3 sm:px-4">
          {children}
        </main>
      </div>
    </div>
  );
}