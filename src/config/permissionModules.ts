// config/permissionModules.ts
//
// FRONTEND MIRROR of backend constants/permissionModules.js.
// Keys, nesting, and labels MUST match exactly, or permission checks and
// nav filtering will silently stop matching. If the backend tree changes,
// mirror the change here.



export const BASE_ACTIONS = ["view", "create", "update", "delete"] as const;
export type BaseAction = (typeof BASE_ACTIONS)[number];


export interface SubNavDef {
  label: string;
}

export interface NavDef {
  label: string;
  subNav: Record<string, SubNavDef>;
}

/**
 * Resolves a "navKey" or "navKey.subKey" path string (as used in nav
 * config `permissionModule` fields) against a staff user's permissions.
 * Unknown paths return false (fail closed).
 */
export function canAccess(perms: Permissions | undefined, modulePath: string): boolean {
    if (!perms || !modulePath) return false;
    const [navKey, subKey] = modulePath.split(".");
  
    if (!Object.prototype.hasOwnProperty.call(perms, navKey)) return false;
    const nav = perms[navKey];
    if (!nav) return false;
    if (!subKey) return navHasAnyGrant(nav);
  
    const subNav = nav.subNav ?? {};
    if (!Object.prototype.hasOwnProperty.call(subNav, subKey)) return false;
    return !!subNav[subKey]?.view;
  }

export const PERMISSION_TREE: Record<string, NavDef> = {
  home: {
    label: "Home",
    subNav: {
      dashboard: { label: "Dashboard" },
      thoughtOfDay: { label: "Thought of the Day" },
      features: { label: "Features" },
      faqs: { label: "FAQs" },
      privacy: { label: "Privacy" },
      websiteTemplate: { label: "Website Template" },
      invoiceTemplate: { label: "Invoice Template" },
    },
  },
  location: {
    label: "Location",
    subNav: {
      provinces: { label: "Provinces" },
      cities: { label: "Cities" },
    },
  },
  services: {
    label: "Services",
    subNav: {
      services: { label: "Services" },
      subServices: { label: "Sub Services" },
      carBrands: { label: "Car Brands" },
    },
  },
  carCompanies: {
    label: "Car Companies",
    subNav: {
      carCompanies: { label: "Car Companies" },
    },
  },
  users: {
    label: "Users",
    subNav: {
      carOwners: { label: "Car Owners" },
      autoShopOwners: { label: "Auto Shop Owners" },
      dealers: { label: "Dealers" },
      associates: { label: "Associates" },
    },
  },
  leads: {
    label: "Leads",
    subNav: {
      allLeads: { label: "All Leads" },
      visitedLeads: { label: "Visited Leads" },
      completedLeads: { label: "Completed Leads" },
    },
  },
  accounts: {
    label: "Accounts",
    subNav: {
      expenses: { label: "Expenses" },
      bank: { label: "Bank" },
    },
  },
  invoices: {
    label: "Invoices",
    subNav: {
      invoices: { label: "Invoices" },
      items: { label: "Items" },
    },
  },
  messages: {
    label: "Messages",
    subNav: {
      sent: { label: "Sent" },
      received: { label: "Received" },
    },
  },
  reports: {
    label: "Reports",
    subNav: {
      reports: { label: "Reports" }, // implicit leaf — no real sub-nav in UI
    },
  },
  domain: {
    label: "Domain",
    subNav: {
      domainManager: { label: "Domain Manager" },
    },
  },
  runningDeals: {
    label: "Running Deals",
    subNav: {
      runningDeals: { label: "Running Deals" },
    },
  },
  wallet: {
    label: "Wallet",
    subNav: {
      wallet: { label: "Wallet" },
    },
  },
  tasks: {
    label: "Tasks",
    subNav: {
      tasks: { label: "Tasks" },
    },
  },
  roleManagement: {
    label: "Role Management",
    subNav: {
      staffUsers: { label: "Staff Users" },
    },
  },
};

export interface SubNavPermission {
  view: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

export interface NavPermission {
  view: boolean;
  subNav: Record<string, SubNavPermission>;
}

export type Permissions = Record<string, NavPermission>;

/** Fully-populated permissions object with every key present, all false. */
export function buildDefaultPermissions(): Permissions {
  const perms: Permissions = {};
  for (const [navKey, navDef] of Object.entries(PERMISSION_TREE)) {
    perms[navKey] = { view: false, subNav: {} };
    for (const subKey of Object.keys(navDef.subNav)) {
      perms[navKey].subNav[subKey] = {
        view: false,
        create: false,
        update: false,
        delete: false,
      };
    }
  }
  return perms;
}

export function moduleLabel(navKey: string, subKey?: string): string {
  const nav = PERMISSION_TREE[navKey];
  if (!nav) return subKey ? `${navKey}.${subKey}` : navKey;
  if (!subKey) return nav.label;
  return nav.subNav[subKey]?.label ?? subKey;
}

export function subNavAnyTrue(sub: SubNavPermission | undefined): boolean {
  return !!sub && (sub.view || sub.create || sub.update || sub.delete);
}

/** True if the staff user has ANY grant anywhere under navKey. */
export function navHasAnyGrant(perm: NavPermission | undefined): boolean {
  if (!perm) return false;
  if (perm.view) return true;
  return Object.values(perm.subNav || {}).some(subNavAnyTrue);
}

/** Human summary of granted modules — for table cells / print exports. */
export function permissionsSummary(perms: Permissions | undefined): string {
  if (!perms) return "\u2014";
  const granted: string[] = [];
  for (const [navKey, navDef] of Object.entries(PERMISSION_TREE)) {
    if (navHasAnyGrant(perms[navKey])) granted.push(navDef.label);
  }
  return granted.length ? granted.join(", ") : "\u2014";
}

// ─── Fixed roles (mirrors backend STAFF_ROLES) ─────────────────────────────
// Roles are hardcoded, not a manageable collection. "admin" (SuperAdmin) is
// never onboarded through the UI — it bypasses all permission checks.

export const FIXED_ROLES = [
  { value: "admin", label: "Super Admin", onboardable: false },
  { value: "role_admin", label: "Admin", onboardable: true },
  { value: "sub_admin", label: "Sub Admin", onboardable: true },
  { value: "associates", label: "Business Associate", onboardable: true },
] as const;

export type StaffRole = (typeof FIXED_ROLES)[number]["value"];

export const ONBOARDABLE_ROLES = FIXED_ROLES.filter((r) => r.onboardable);

export function roleLabel(role: string): string {
  return FIXED_ROLES.find((r) => r.value === role)?.label ?? role;
}

// ─── Illustrative default permission presets per fixed role ───────────────
// UI-only starting points for the read-only Role reference screen and for
// pre-filling the matrix when onboarding a new staff user of that role.
// The actual source of truth for what a staff user can do is always the
// `permissions` document saved on that StaffUser — these are just defaults.

function grantAll(): SubNavPermission {
  return { view: true, create: true, update: true, delete: true };
}
function viewOnly(): SubNavPermission {
  return { view: true, create: false, update: false, delete: false };
}

function presetFor(navKeys: string[], leaf: () => SubNavPermission): Permissions {
  const perms = buildDefaultPermissions();
  for (const navKey of navKeys) {
    if (!perms[navKey]) continue;
    perms[navKey].view = true;
    for (const subKey of Object.keys(perms[navKey].subNav)) {
      perms[navKey].subNav[subKey] = leaf();
    }
  }
  return perms;
}

export const DEFAULT_ROLE_PERMISSIONS: Record<StaffRole, Permissions> = {
  // SuperAdmin bypasses all permission checks server-side — shown here as
  // "full access" purely for reference, never actually read for "admin".
  admin: presetFor(Object.keys(PERMISSION_TREE), grantAll),
  role_admin: presetFor(Object.keys(PERMISSION_TREE), grantAll),
  sub_admin: presetFor(
    [
      "home",
      "location",
      "services",
      "carCompanies",
      "users",
      "leads",
      "invoices",
      "messages",
      "reports",
      "tasks",
    ],
    grantAll
  ),
  associates: presetFor(["leads", "messages", "tasks", "runningDeals"], viewOnly),
};