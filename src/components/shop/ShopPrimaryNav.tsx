import { Link, useLocation, useNavigate } from "react-router";
import { getActivePrimaryItem, type NavItem } from "../../config/adminNav";

type ShopPrimaryNavProps = {
  homePath: string;
  primaryNav: NavItem[];
  className?: string;
};

export default function ShopPrimaryNav({
  homePath,
  primaryNav,
  className = "",
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
    <nav className={`w-full ${className}`.trim()} aria-label="Shop sections">
      <ul className="flex w-full flex-col gap-2 py-2 lg:flex-row lg:items-center lg:gap-1 lg:py-2.5">
        {primaryNav.map((item) => {
          const isActive = activePrimary?.name === item.name;
          const firstPath = item.path ?? item.subItems?.[0]?.path ?? "#";
          const linkClass = `block px-1 text-base font-semibold text-ad-purple transition-colors md:text-lg ${
            isActive ? "underline underline-offset-4 decoration-2" : "hover:underline"
          }`;
          return (
            <li key={item.name} className="min-w-0 flex-1 text-center">
              <Link
                to={firstPath}
                onClick={(e) => handlePrimaryNavLinkClick(firstPath, e)}
                className={linkClass}
                aria-current={isActive ? "page" : undefined}
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
