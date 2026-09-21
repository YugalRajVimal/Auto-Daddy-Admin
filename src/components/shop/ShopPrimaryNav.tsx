import { Link, useLocation, useNavigate } from "react-router";
import { getActivePrimaryItem, type NavItem } from "../../config/adminNav";

type ShopPrimaryNavProps = {
  homePath: string;
  primaryNav: NavItem[];
  className?: string;
  navLabel?: string;
};

/** Purple tab bar — the active section renders as a raised white tab. */
export default function ShopPrimaryNav({
  homePath,
  primaryNav,
  className = "",
  navLabel = "Shop sections",
}: ShopPrimaryNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const activePrimary = getActivePrimaryItem(location.pathname, primaryNav, homePath);

  const handlePrimaryNavLinkClick = (path: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname === path) {
      e.preventDefault();
      navigate(path, { replace: true, state: { navReset: Date.now() } });
    }
  };

  return (
    <nav className={`min-w-0 w-full ${className}`.trim()} aria-label={navLabel}>
      <ul className="no-scrollbar flex w-full gap-1 overflow-x-auto rounded-xl bg-gradient-to-r from-ad-purple via-[#a3399a] to-ad-purple-dark p-1 shadow-[0_6px_18px_rgba(155,48,141,0.28)]">
        {primaryNav.map((item) => {
          const isActive = activePrimary?.name === item.name;
          const firstPath = item.path ?? item.subItems?.[0]?.path ?? "#";
          return (
            <li key={item.name} className="flex-1 shrink-0">
              <Link
                to={firstPath}
                onClick={(e) => handlePrimaryNavLinkClick(firstPath, e)}
                aria-current={isActive ? "page" : undefined}
                className={`block whitespace-nowrap rounded-lg px-3 py-2 text-center text-[15px] font-semibold leading-tight transition-all duration-150 lg:text-base ${
                  isActive
                    ? "bg-white text-ad-purple shadow-sm"
                    : "text-white/90 hover:bg-white/15 hover:text-white"
                }`}
              >
                {item.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
