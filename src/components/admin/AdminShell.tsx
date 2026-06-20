import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { FiBell, FiUser } from "react-icons/fi";
import usePermissions from "../../hooks/usePermission";
import {
  primaryNav,
  adminOnlyNav,
  adminUtilityNav,
  getActivePrimaryItem,
  type NavItem,
  type NavSubItem,
} from "../../config/adminNav";

const LOGO = "/logo.png";

function filterNavItem(item: NavItem, canView: (m: string) => boolean, isAdmin: boolean): NavItem | null {
  if (item.adminOnly && !isAdmin) return null;
  if (item.subItems) {
    const visibleSubs = item.subItems.filter(
      (s) => !s.permissionModule || canView(s.permissionModule)
    );
    if (visibleSubs.length === 0) return null;
    return { ...item, subItems: visibleSubs };
  }
  if (item.permissionModule && !canView(item.permissionModule)) return null;
  return item;
}

function isPathActive(pathname: string, path: string) {
  if (path === "/admin") return pathname === "/admin";
  return pathname === path || pathname.startsWith(path + "/");
}

function getActiveSubItemPath(pathname: string, subItems: NavSubItem[]): string | null {
  const exact = subItems.find((s) => {
    if (s.path === "/admin") return pathname === "/admin";
    return pathname === s.path;
  });
  if (exact) return exact.path;

  const prefixMatch = subItems
    .filter((s) => s.path !== "/admin" && pathname.startsWith(`${s.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0];
  return prefixMatch?.path ?? null;
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, canView } = usePermissions();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNav = [
    ...primaryNav.map((n) => filterNavItem(n, canView, isAdmin)).filter(Boolean) as NavItem[],
    ...adminOnlyNav.map((n) => filterNavItem(n, canView, isAdmin)).filter(Boolean) as NavItem[],
  ];

  const activePrimary = getActivePrimaryItem(location.pathname, visibleNav);
  const visibleUtilityNav = isAdmin
    ? adminUtilityNav.filter((s) => !s.permissionModule || canView(s.permissionModule))
    : [];
  const onAdminUtility = visibleUtilityNav.some((s) => isPathActive(location.pathname, s.path));
  const utilitySubItems = onAdminUtility ? visibleUtilityNav : [];
  const primarySubItems: NavSubItem[] = activePrimary?.subItems ?? [];
  const displaySubItems = utilitySubItems.length > 0 ? utilitySubItems : primarySubItems;
  const activeSubItemPath = getActiveSubItemPath(location.pathname, displaySubItems);
  const adminUtilityPath = visibleUtilityNav[0]?.path ?? "/admin/roles";

  const handlePrimaryClick = (item: NavItem) => {
    const target = item.path ?? item.subItems?.[0]?.path;
    if (target) navigate(target);
    setMobileOpen(false);
  };

  const handleSubNavClick = (path: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    setMobileOpen(false);
    if (location.pathname === path) {
      e.preventDefault();
      navigate(path, { replace: true, state: { navReset: Date.now() } });
    }
  };

  const handlePrimaryNavLinkClick = (path: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    setMobileOpen(false);
    if (location.pathname === path) {
      e.preventDefault();
      navigate(path, { replace: true, state: { navReset: Date.now() } });
    }
  };

  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to log out?")) return;

    localStorage.removeItem("admin-token");
    localStorage.removeItem("admin-role");
    localStorage.removeItem("subadmin-permissions");
    navigate("/", { replace: true });
  };

  const utilityLinkClass =
    "inline-block rounded-b-lg border border-gray-400 bg-gray-200 px-2.5 py-0.5 text-[11px] text-gray-700 hover:bg-gray-300 sm:px-3 sm:text-xs";
  const utilityLinkActiveClass =
    "inline-block rounded-b-lg border border-ad-purple bg-white px-2.5 py-0.5 text-[11px] font-semibold text-ad-purple shadow-sm sm:px-3 sm:text-xs";

  const subNavLinkClass =
    "relative block px-2 py-1.5 text-center text-xs leading-snug text-blue-700 underline-offset-2 hover:underline lg:px-1.5 lg:py-1.5 lg:text-xs lg:leading-snug lg:whitespace-normal";

  const loginRole = isAdmin ? "Admin" : "Sub Admin";

  useEffect(() => {
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-ad-app-bg font-sans">
      <div className="flex w-full flex-col">
        {/* Header: logo, login status, utilities */}
        <header className="px-3 pt-4 pb-2 sm:px-4 md:pt-5">
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
              <Link to="/admin">
                <img
                  src={LOGO}
                  alt="AutoDaddy"
                  className="block h-auto w-auto max-h-16 max-w-[200px] object-contain sm:max-h-[72px] sm:max-w-[220px] md:max-h-20 md:max-w-[260px]"
                />
              </Link>
            </div>

            <div className="col-span-2 flex items-center justify-center md:col-span-1 md:self-center">
              <p className="font-serif text-base text-gray-700 md:text-lg lg:text-xl">
                Login as :{" "}
                <span className="text-lg font-bold text-ad-green md:text-xl lg:text-2xl">{loginRole}</span>
              </p>
            </div>

            <div className="col-span-2 flex flex-col items-end gap-2 md:col-span-1 md:col-start-3 md:row-start-1">
              <nav className="flex items-center gap-0 [&>a+a]:-ml-px" aria-label="Account actions">
                {isAdmin && visibleUtilityNav.length > 0 && (
                  <Link
                    to={adminUtilityPath}
                    className={onAdminUtility ? utilityLinkActiveClass : utilityLinkClass}
                  >
                    Admin
                  </Link>
                )}
                <Link to="#" className={utilityLinkClass}>
                  Help
                </Link>
                <button type="button" onClick={handleLogout} className={utilityLinkClass}>
                  Log out
                </button>
              </nav>
              <div className="flex items-center gap-4">
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
                <Link
                  to="/admin/profile"
                  className="flex h-11 w-11 items-center justify-center border border-gray-300 bg-white text-gray-400 shadow-sm sm:h-12 sm:w-12"
                  aria-label="Profile"
                >
                  <FiUser size={28} strokeWidth={1.75} />
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Primary nav — separated tabs: flat top, rounded bottom */}
        <nav
          className={`relative z-20 overflow-visible px-3 pb-0 sm:px-4 ${mobileOpen ? "block" : "hidden lg:block"}`}
        >
          <ul className="flex flex-col gap-px lg:flex-row lg:w-full lg:gap-px">
            {visibleNav.map((item) => {
              const isActive = activePrimary?.name === item.name;
              const firstPath = item.path ?? item.subItems?.[0]?.path ?? "#";
              const itemClass = `w-full px-3 py-1.5 text-center text-sm font-semibold transition-colors lg:rounded-b-lg lg:px-4 lg:py-2 lg:text-sm ${isActive
                ? "relative z-20 border border-ad-purple bg-white text-ad-purple shadow-md"
                : "border border-ad-purple/80 bg-ad-purple text-white shadow-sm hover:bg-ad-purple-dark"
                }`;
              return (
                <li key={item.name} className="min-w-0 flex-1">
                  {item.subItems ? (
                    <button
                      type="button"
                      onClick={() => handlePrimaryClick(item)}
                      className={itemClass}
                    >
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

        {/* Sub nav — columns align with primary nav tabs on desktop */}
        {displaySubItems.length > 0 && (activePrimary || onAdminUtility) && (
          <div className="relative z-10 mt-[3px] bg-white lg:mt-[5px]">
            <div className="px-3 sm:px-4">
              <ul className="hidden w-full items-stretch overflow-visible lg:flex lg:gap-px lg:pb-[7px]">
                {visibleNav.map((item, colIndex) => {
                  const sub = colIndex < displaySubItems.length ? displaySubItems[colIndex] : null;
                  const active = sub ? sub.path === activeSubItemPath : false;
                  return (
                    <li key={item.name} className="relative min-w-0 flex-1 overflow-visible">
                      {sub && (
                        <Link
                          to={sub.path}
                          onClick={(e) => handleSubNavClick(sub.path, e)}
                          className={`${subNavLinkClass} ${active ? "bg-gray-200 font-medium" : ""}`}
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

        <main>{children}</main>
      </div>
    </div>
  );
}
