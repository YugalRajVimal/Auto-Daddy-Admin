import useAuth from "../../auth/useAuth";
import {
  primaryNav,
  adminOnlyNav,
  adminUtilityNav,
  adminMessagesNav,
  type NavItem,
} from "../../config/adminNav";
import PortalShell from "./PortalShell";

function filterNavItem(
  item: NavItem,
  canView: (m: string) => boolean,
  isAdmin: boolean
): NavItem | null {
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

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { isAdmin, canView } = useAuth();

  const visibleNav = [
    ...(primaryNav.map((n) => filterNavItem(n, canView, isAdmin)).filter(Boolean) as NavItem[]),
    ...(adminOnlyNav.map((n) => filterNavItem(n, canView, isAdmin)).filter(Boolean) as NavItem[]),
  ];

  const visibleUtilityNav = isAdmin
    ? adminUtilityNav.filter((s) => !s.permissionModule || canView(s.permissionModule))
    : [];

  const visibleMessagesNav = adminMessagesNav.filter(
    (s) => !s.permissionModule || canView(s.permissionModule)
  );

  return (
    <PortalShell
      homePath="/admin"
      profilePath="/admin/profile"
      primaryNav={visibleNav}
      utilityNav={visibleUtilityNav}
      utilityNavLabel="Admin"
      contextualNav={visibleMessagesNav}
    >
      {children}
    </PortalShell>
  );
}
