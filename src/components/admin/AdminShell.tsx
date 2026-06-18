import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
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

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      <div className="mx-auto flex w-full min-h-0 flex-1 flex-col px-2 sm:px-3 lg:w-[92.5%] lg:max-w-[1350px] lg:px-0">
      {/* Top bar */}
      <div className="relative flex items-center justify-between py-3">
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
              className="block h-auto w-auto max-h-10 max-w-[140px] object-contain md:max-h-12 md:max-w-[168px]"
            />
          </Link>
        </div>

        <span className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 font-canada text-2xl text-ad-green md:block md:text-3xl">
          Canada
        </span>

        <div className="grid w-[210px] grid-cols-3 gap-1 sm:w-[270px] md:gap-2 lg:w-[330px]">
          <span className="flex items-center justify-center bg-ad-grey-light px-2 py-2 text-center text-xs font-medium text-black md:px-4 md:py-2.5 md:text-sm">
            Admin
          </span>
          <a
            href="https://autodaddy.ca"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center bg-ad-grey px-2 py-2 text-center text-xs font-medium text-black hover:bg-gray-400 md:px-4 md:py-2.5 md:text-sm"
          >
            Help
          </a>
          <Link
            to="/admin/logout"
            className="flex items-center justify-center bg-ad-grey-dark px-2 py-2 text-center text-xs font-medium text-white hover:opacity-90 md:px-4 md:py-2.5 md:text-sm"
          >
            Log out
          </Link>
        </div>
      </div>

      {/* Primary nav */}
      <nav
        className={`bg-ad-purple ${mobileOpen ? "block" : "hidden lg:block"}`}
      >
        <ul className="flex flex-col lg:flex-row lg:w-full">
          {visibleNav.map((item) => {
            const isActive = activePrimary?.name === item.name;
            const firstPath = item.path ?? item.subItems?.[0]?.path ?? "#";
            const itemClass = `w-full border-0 border-b border-white/20 px-4 py-2.5 text-center text-sm font-medium transition-colors lg:border-b-0 lg:px-6 lg:py-3 ${isActive
              ? "relative z-10 bg-white text-ad-purple"
              : "text-white hover:bg-white/10"
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

      {/* Sub nav */}
      {subItems.length > 0 && (
        <div className="relative z-10 -mt-px border-b-2 border-ad-purple bg-white">
          <ul className="flex flex-wrap items-stretch gap-2 py-2.5 md:gap-4">
            {subItems.map((sub) => {
              const active = isPathActive(location.pathname, sub.path);
              return (
                <li key={sub.path} className="relative flex items-center">
                  {active && (
                    <span
                      className="pointer-events-none absolute bottom-0 left-1/2 z-10 hidden h-0 w-0 -translate-x-1/2 translate-y-full border-x-[7px] border-b-[7px] border-x-transparent border-b-ad-purple md:block"
                      aria-hidden
                    />
                  )}
                  <Link
                    to={sub.path}
                    className={`block px-3 py-1.5 text-sm text-blue-700 underline-offset-2 hover:underline ${active ? "bg-gray-200 font-medium" : ""
                      }`}
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
