export type NavSubItem = {
  name: string;
  path: string;
  permissionModule?: string;
};

export type NavItem = {
  name: string;
  path?: string;
  permissionModule?: string;
  adminOnly?: boolean;
  subItems?: NavSubItem[];
  /** Paths that activate this primary tab (defaults to path + subItem paths) */
  matchPaths?: string[];
};

export const primaryNav: NavItem[] = [
  {
    name: "Home",
    path: "/admin",
    permissionModule: "dashboard",
    subItems: [
      { name: "Dashboard", path: "/admin", permissionModule: "dashboard" },
      { name: "Thought of Day", path: "/admin/thought-of-day", permissionModule: "dashboardData" },
      { name: "Features", path: "/admin/features", permissionModule: "dashboardData" },
      { name: "FAQs", path: "/admin/faqs", permissionModule: "dashboardData" },
      { name: "Privacy", path: "/admin/privacy", permissionModule: "dashboardData" },
      { name: "Web - Temp", path: "/admin/website-templates", permissionModule: "websiteTemplates" },
      { name: "Inv - Temp", path: "/admin/invoice-templates", permissionModule: "websiteTemplates" },
    ],
    matchPaths: [
      "/admin",
      "/admin/thought-of-day",
      "/admin/features",
      "/admin/faqs",
      "/admin/privacy",
      "/admin/website-templates",
      "/admin/invoice-templates",
    ],
  },
  {
    name: "Locations",
    subItems: [
      { name: "Provinces", path: "/admin/provinces", permissionModule: "provinces" },
      { name: "Cities", path: "/admin/cities", permissionModule: "cities" },
    ],
    matchPaths: ["/admin/provinces", "/admin/cities"],
  },
  {
    name: "Services",
    subItems: [
      { name: "Services", path: "/admin/categories", permissionModule: "services" },
      { name: "Sub Services", path: "/admin/services", permissionModule: "categories" },
    ],
    matchPaths: ["/admin/categories", "/admin/services"],
  },
  {
    name: "Users",
    permissionModule: "users",
    subItems: [
      { name: "Car Owners", path: "/admin/car-owners", permissionModule: "users" },
      { name: "Auto Shop Owners", path: "/admin/auto-shop-owners", permissionModule: "users" },
      { name: "Associates", path: "/admin/associates", permissionModule: "users" },
      { name: "Dealers", path: "/admin/dealers", permissionModule: "users" },
    ],
    matchPaths: ["/admin/car-owners", "/admin/auto-shop-owners", "/admin/associates", "/admin/dealers"],
  },
  {
    name: "Leads",
    path: "/admin/leads",
    permissionModule: "dashboard",
  },
  {
    name: "Accounts",
    path: "/admin/accounts",
    permissionModule: "dashboard",
  },
  {
    name: "Messages",
    path: "/admin/messages",
    permissionModule: "inviteHelp",
  },
  {
    name: "Reports",
    path: "/admin/reports",
    permissionModule: "dashboard",
  },
  {
    name: "Ads",
    path: "/admin/ads",
    permissionModule: "ads",
  },
];

/* ── Legacy nav items (commented out — routes still reachable by URL) ──
export const legacyPrimaryNav: NavItem[] = [
  {
    name: "Dashboard",
    path: "/admin",
    permissionModule: "dashboard",
    subItems: [
      { name: "Dashboard", path: "/admin", permissionModule: "dashboard" },
      { name: "Dashboard Data", path: "/admin/dashboard-data", permissionModule: "dashboardData" },
      { name: "FAQs", path: "/admin/faqs", permissionModule: "dashboardData" },
      { name: "Privacy", path: "/admin/privacy", permissionModule: "dashboardData" },
      { name: "Web - Temp", path: "/admin/website-templates", permissionModule: "websiteTemplates" },
      { name: "Inv - Temp", path: "/admin/invoice-templates", permissionModule: "websiteTemplates" },
    ],
    matchPaths: [
      "/admin",
      "/admin/dashboard-data",
      "/admin/faqs",
      "/admin/privacy",
      "/admin/website-templates",
      "/admin/invoice-templates",
    ],
  },
  {
    name: "All Users",
    permissionModule: "users",
    subItems: [
      { name: "Car Owners", path: "/admin/car-owners", permissionModule: "users" },
      { name: "Auto Shop Owners", path: "/admin/auto-shop-owners", permissionModule: "users" },
      { name: "Associates", path: "/admin/associates", permissionModule: "users" },
      { name: "Dealers", path: "/admin/dealers", permissionModule: "users" },
    ],
    matchPaths: ["/admin/car-owners", "/admin/auto-shop-owners", "/admin/associates", "/admin/dealers"],
  },
  {
    name: "Categories / Services",
    subItems: [
      { name: "Categories", path: "/admin/categories", permissionModule: "services" },
      { name: "Services", path: "/admin/services", permissionModule: "categories" },
    ],
    matchPaths: ["/admin/categories", "/admin/services"],
  },
  {
    name: "Car Companies",
    path: "/admin/car-companies",
    permissionModule: "carCompanies",
  },
  {
    name: "Location",
    subItems: [
      { name: "Provinces", path: "/admin/provinces", permissionModule: "provinces" },
      { name: "Cities", path: "/admin/cities", permissionModule: "cities" },
    ],
    matchPaths: ["/admin/provinces", "/admin/cities"],
  },
  {
    name: "Running Deals",
    path: "/admin/running-deals",
    permissionModule: "runningDeals",
  },
  {
    name: "Wallet",
    path: "/admin/wallet",
    permissionModule: "wallet",
  },
  {
    name: "Invite Help",
    path: "/admin/invite-help",
    permissionModule: "inviteHelp",
  },
  {
    name: "Manage Task",
    path: "/admin/manage-task",
    permissionModule: "tasks",
  },
];
*/

export const adminOnlyNav: NavItem[] = [
  /* ── Legacy admin-only nav (commented out — route still reachable by URL) ──
  {
    name: "Administration",
    adminOnly: true,
    subItems: [{ name: "Sub Admin Management", path: "/admin/subadmins" }],
    matchPaths: ["/admin/subadmins"],
  },
  */
];

export function getActivePrimaryItem(pathname: string, items: NavItem[]): NavItem | null {
  for (const item of items) {
    const paths = item.matchPaths ?? [
      ...(item.path ? [item.path] : []),
      ...(item.subItems?.map((s) => s.path) ?? []),
    ];
    const matched = paths.some((p) => {
      if (p === "/admin") return pathname === "/admin";
      return pathname === p || pathname.startsWith(`${p}/`);
    });
    if (matched) return item;
  }
  return null;
}
