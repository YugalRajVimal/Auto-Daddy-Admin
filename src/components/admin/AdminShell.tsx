import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { FiBell, FiUser } from "react-icons/fi";
import usePermissions from "../../hooks/usePermission";
import {
  primaryNav,
  adminOnlyNav,
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
  const subItems: NavSubItem[] = activePrimary?.subItems ?? [];

  const handlePrimaryClick = (item: NavItem) => {
    const target = item.path ?? item.subItems?.[0]?.path;
    if (target) navigate(target);
    setMobileOpen(false);
  };

  const utilityLinkClass =
    "inline-block border border-gray-300 bg-gray-50 px-2.5 py-1 text-[11px] text-gray-600 hover:bg-gray-100 sm:px-3 sm:text-xs";

  const subNavLinkClass =
    "block px-1.5 py-2 text-center text-xs leading-snug text-blue-700 underline-offset-2 hover:underline lg:px-1 lg:py-2 lg:text-xs lg:leading-tight lg:whitespace-normal";

  const loginRole = isAdmin ? "Admin" : "Sub Admin";

  return (
    <div className="flex min-h-screen flex-col bg-ad-app-bg font-sans">
      <div className="mx-auto flex w-full min-h-0 flex-1 flex-col lg:max-w-[1350px]">
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
              <p className="font-serif text-sm text-gray-700 md:text-base">
                Login as : <span className="font-bold text-ad-green">{loginRole}</span>
              </p>
            </div>

            <div className="col-span-2 flex flex-col items-end gap-2 md:col-span-1 md:col-start-3 md:row-start-1">
              <nav className="flex items-center gap-1 sm:gap-1.5" aria-label="Account actions">
                <Link to="/admin/profile" className={utilityLinkClass}>
                  Admin
                </Link>
                <Link to="#" className={utilityLinkClass}>
                  Help
                </Link>
                <Link to="/admin/logout" className={utilityLinkClass}>
                  Log out
                </Link>
              </nav>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  className="relative text-blue-600 hover:text-blue-700"
                  aria-label="Notifications"
                >
                  <FiBell size={22} strokeWidth={1.75} />
                  <span className="absolute -right-1.5 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold leading-none text-white">
                    1
                  </span>
                </button>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center border border-gray-300 bg-white text-gray-400 shadow-sm"
                  aria-label="Profile"
                >
                  <FiUser size={22} strokeWidth={1.75} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Primary nav — separated tabs: flat top, rounded bottom */}
        <nav
          className={`px-3 sm:px-4 ${mobileOpen ? "block" : "hidden lg:block"}`}
        >
          <ul className="flex flex-col lg:flex-row lg:w-full lg:gap-px">
            {visibleNav.map((item) => {
              const isActive = activePrimary?.name === item.name;
              const firstPath = item.path ?? item.subItems?.[0]?.path ?? "#";
              const itemClass = `w-full border-0 border-b border-white/20 px-4 py-2.5 text-center text-sm font-medium transition-colors lg:rounded-t-none lg:rounded-b-lg lg:border-b lg:px-6 lg:py-3 ${isActive
                ? "relative z-10 bg-white text-ad-purple lg:border-ad-purple lg:border-b-white"
                : "bg-ad-purple text-white hover:bg-ad-purple-dark lg:border-ad-purple"
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
                      onClick={() => setMobileOpen(false)}
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
        {subItems.length > 0 && activePrimary && (
          <div className="relative z-10 -mt-px bg-white">
            <div className="px-3 sm:px-4">
              <ul className="hidden w-full items-stretch overflow-visible pb-[7px] lg:flex lg:gap-px">
                {visibleNav.map((item, colIndex) => {
                  const sub = colIndex < subItems.length ? subItems[colIndex] : null;
                  const active = sub ? isPathActive(location.pathname, sub.path) : false;
                  return (
                    <li key={item.name} className="relative min-w-0 flex-1 overflow-visible">
                      {sub && (
                        <>
                          {active && (
                            <span
                              className="pointer-events-none absolute bottom-0 left-1/2 z-10 h-0 w-0 -translate-x-1/2 translate-y-full border-x-[7px] border-b-[7px] border-x-transparent border-b-ad-purple"
                              aria-hidden
                            />
                          )}
                          <Link
                            to={sub.path}
                            className={`${subNavLinkClass} ${active ? "bg-gray-200 font-medium" : ""}`}
                          >
                            {sub.name}
                          </Link>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="hidden border-b-2 border-ad-purple lg:block" aria-hidden />
            <ul className="flex flex-col border-b-2 border-ad-purple lg:hidden">
              {subItems.map((sub) => {
                const active = isPathActive(location.pathname, sub.path);
                return (
                  <li key={sub.path}>
                    <Link
                      to={sub.path}
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

        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
