import type { NavItem, NavSubItem } from "./adminNav";

/** Left-panel sections for Help (utility link, not primary nav). */
export const ownerHelpNav: NavSubItem[] = [
  { name: "Ticket Raised", path: "/owner/help" },
  { name: "Resolved", path: "/owner/help/resolved" },
];

/**
 * Primary tabs exactly as in the car owner mockups. Each tab's `subItems` render as the
 * vertical left panel. Pages not drawn in the mockups (dashboard, privacy, features,
 * digital diary, reports, job card history, deal sub-types, approvals) keep their routes
 * but have no navigation entry.
 */
export const ownerPrimaryNav: NavItem[] = [
  {
    name: "Home",
    path: "/owner",
    subItems: [],
    matchPaths: ["/owner", "/owner/dashboard", "/owner/privacy", "/owner/features"],
  },
  {
    name: "Profile",
    path: "/owner/profile",
    subItems: [
      { name: "Profile", path: "/owner/profile" },
      { name: "My Vehicles", path: "/owner/profile/vehicles" },
    ],
    matchPaths: ["/owner/profile"],
  },
  {
    name: "Auto shops",
    path: "/owner/auto-shops",
    subItems: [],
    matchPaths: ["/owner/auto-shops"],
  },
  {
    name: "My vehicles",
    path: "/owner/profile/vehicles",
    subItems: [{ name: "My Vehicles", path: "/owner/profile/vehicles" }],
    matchPaths: ["/owner/profile/vehicles", "/owner/documents", "/owner/digital-diary"],
  },
  {
    name: "Job Cards",
    path: "/owner/expenses/job-cards",
    subItems: [{ name: "Job Cards", path: "/owner/expenses/job-cards" }],
    matchPaths: ["/owner/expenses/job-cards", "/owner/expenses", "/owner/job-cards"],
  },
  {
    name: "Accounts",
    path: "/owner/expenses/invoices",
    subItems: [
      { name: "Job Card Payment", path: "/owner/accounts/job-card-payment" },
      { name: "Invoices", path: "/owner/expenses/invoices" },
      { name: "Expenses", path: "/owner/accounts/expenses" },
      { name: "Manage Banks", path: "/owner/accounts/manage-banks" },
    ],
    matchPaths: ["/owner/expenses/invoices", "/owner/invoices", "/owner/accounts"],
  },
  {
    name: "Deals",
    path: "/owner/deals/spare-parts",
    subItems: [],
    matchPaths: ["/owner/deals"],
  },
];
