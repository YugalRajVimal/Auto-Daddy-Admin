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
    permissionModule: "home",
    subItems: [
      { name: "Dashboard", path: "/admin", permissionModule: "home.subNav.dashboard" },
      { name: "Thought of Day", path: "/admin/thought-of-day", permissionModule: "home.subNav.thoughtOfDay" },
      { name: "Features", path: "/admin/features", permissionModule: "home.subNav.features" },
      { name: "FAQs", path: "/admin/faqs", permissionModule: "home.subNav.faqs" },
      { name: "Privacy", path: "/admin/privacy", permissionModule: "home.subNav.privacy" },
      { name: "Web - Temp", path: "/admin/website-templates", permissionModule: "home.subNav.websiteTemplate" },
      { name: "Inv - Temp", path: "/admin/invoice-templates", permissionModule: "home.subNav.invoiceTemplate" },
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
    permissionModule: "location",
    subItems: [
      { name: "Provinces", path: "/admin/provinces", permissionModule: "location.subNav.provinces" },
      { name: "Cities", path: "/admin/cities", permissionModule: "location.subNav.cities" },
    ],
    matchPaths: ["/admin/provinces", "/admin/cities"],
  },
  {
    name: "Services",
    permissionModule: "services",
    subItems: [
      { name: "Services", path: "/admin/categories", permissionModule: "services.subNav.services" },
      { name: "Sub Services", path: "/admin/services", permissionModule: "services.subNav.subServices" },
      { name: "Car Brands", path: "/admin/car-brands", permissionModule: "carCompanies.subNav.carCompanies" },
    ],
    matchPaths: ["/admin/categories", "/admin/services", "/admin/car-brands"],
  },
  {
    name: "Users",
    permissionModule: "users",
    subItems: [
      { name: "Car Owners", path: "/admin/car-owners", permissionModule: "users.subNav.carOwners" },
      { name: "Auto Shop Owners", path: "/admin/auto-shop-owners", permissionModule: "users.subNav.autoShopOwners" },
      { name: "Dealers", path: "/admin/dealers", permissionModule: "users.subNav.dealers" },
    ],
    matchPaths: ["/admin/car-owners", "/admin/auto-shop-owners", "/admin/dealers"],
  },
  {
    name: "Leads",
    permissionModule: "leads",
    subItems: [
      { name: "All Leads", path: "/admin/leads", permissionModule: "leads.subNav.allLeads" },
      { name: "Visited", path: "/admin/leads/visited", permissionModule: "leads.subNav.visitedLeads" },
      { name: "Completed", path: "/admin/leads/completed", permissionModule: "leads.subNav.completedLeads" },
    ],
    matchPaths: ["/admin/leads", "/admin/leads/visited", "/admin/leads/completed"],
  },
  {
    name: "Accounts",
    permissionModule: "accounts",
    subItems: [
      { name: "Expenses", path: "/admin/accounts/expenses", permissionModule: "accounts.subNav.expenses" },
      { name: "Bank", path: "/admin/accounts/bank", permissionModule: "accounts.subNav.bank" },
    ],
    matchPaths: ["/admin/accounts/expenses", "/admin/accounts/bank"],
  },
  {
    name: "Invoices",
    permissionModule: "invoices",
    subItems: [
      { name: "Invoices", path: "/admin/invoices", permissionModule: "invoices.subNav.invoices" },
      { name: "Items", path: "/admin/invoices/items", permissionModule: "invoices.subNav.items" },
    ],
    matchPaths: ["/admin/invoices", "/admin/invoices/items"],
  },
  {
    name: "Reports",
    path: "/admin/reports",
    // Leaf item with no subItems — check its own subNav leaf directly since
    // the top-level "reports.view" in your sample is always false.
    permissionModule: "reports.subNav.reports",
    matchPaths: ["/admin/reports"],
  },
  {
    name: "Domain",
    permissionModule: "domain",
    subItems: [
      { name: "Domain Manager", path: "/admin/domain/manager", permissionModule: "domain.subNav.domainManager" },
    ],
    matchPaths: ["/admin/domain/manager"],
  },
];

/** Routes accessed via the top Admin utility button (not primary nav). */
export const adminUtilityNav: NavSubItem[] = [
  { name: "Role Manager", path: "/admin/roles", permissionModule: "roleManagement.subNav.staffUsers" },
  { name: "Manage Admin", path: "/admin/subadmins", permissionModule: "roleManagement.subNav.staffUsers" },
];

/** Sub-header tabs for the notification bell (/admin/messages/*). */
export const adminMessagesNav: NavSubItem[] = [
  { name: "Notifications Sent", path: "/admin/messages/sent", permissionModule: "messages.subNav.sent" },
  { name: "Messages Received", path: "/admin/messages/received", permissionModule: "messages.subNav.received" },
];

export const adminOnlyNav: NavItem[] = [];

export function getActivePrimaryItem(
  pathname: string,
  items: NavItem[],
  homePath = "/admin"
): NavItem | null {
  for (const item of items) {
    const paths = item.matchPaths ?? [
      ...(item.path ? [item.path] : []),
      ...(item.subItems?.map((s) => s.path) ?? []),
    ];
    const matched = paths.some((p) => {
      if (p === homePath) return pathname === homePath;
      return pathname === p || pathname.startsWith(`${p}/`);
    });
    if (matched) return item;
  }
  return null;
}