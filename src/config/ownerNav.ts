import type { NavItem, NavSubItem } from "./adminNav";

export const ownerPrimaryNav: NavItem[] = [
  {
    name: "Home",
    path: "/owner",
    subItems: [
      { name: "Dashboard", path: "/owner" },
      { name: "FAQs", path: "/owner/faqs" },
      { name: "Privacy", path: "/owner/privacy" },
      { name: "Features", path: "/owner/features" },
    ],
    matchPaths: ["/owner", "/owner/faqs", "/owner/privacy", "/owner/features"],
  },
  {
    name: "Profile",
    path: "/owner/profile",
    subItems: [
      { name: "Profile", path: "/owner/profile" },
      { name: "My Vehicles", path: "/owner/profile/vehicles" },
    ],
    matchPaths: ["/owner/profile", "/owner/profile/vehicles"],
  },
  {
    name: "Documents",
    path: "/owner/documents",
    subItems: [],
    matchPaths: ["/owner/documents"],
  },
  {
    name: "Auto Shops",
    path: "/owner/auto-shops",
    subItems: [
      { name: "Approvals", path: "/owner/auto-shops/approvals" },
      { name: "Shops", path: "/owner/auto-shops" },
    ],
    matchPaths: ["/owner/auto-shops", "/owner/auto-shops/approvals"],
  },
  {
    name: "Deals",
    path: "/owner/deals",
    subItems: [
      { name: "Spare Parts Deals", path: "/owner/deals/spare-parts" },
      { name: "Service Deals", path: "/owner/deals/service" },
      { name: "Salvage Deals", path: "/owner/deals/salvage" },
      { name: "Completed Deals", path: "/owner/deals/completed" },
    ],
    matchPaths: [
      "/owner/deals",
      "/owner/deals/spare-parts",
      "/owner/deals/service",
      "/owner/deals/salvage",
      "/owner/deals/completed",
    ],
  },
  {
    name: "Expenses",
    path: "/owner/expenses/job-cards",
    subItems: [
      { name: "Job Cards", path: "/owner/expenses/job-cards" },
      { name: "Invoices", path: "/owner/expenses/invoices" },
    ],
    matchPaths: [
      "/owner/expenses",
      "/owner/expenses/job-cards",
      "/owner/expenses/invoices",
      "/owner/invoices",
    ],
  },
  {
    name: "Digital Diary",
    path: "/owner/digital-diary",
    matchPaths: ["/owner/digital-diary"],
  },
  {
    name: "Reports",
    path: "/owner/reports",
    subItems: [
      { name: "Job Cards", path: "/owner/reports/job-cards" },
      { name: "Invoices", path: "/owner/reports/invoices" },
      { name: "Auto Shops", path: "/owner/reports/auto-shops" },
      { name: "Tickets Raised", path: "/owner/reports/tickets-raised" },
    ],
    matchPaths: [
      "/owner/reports",
      "/owner/reports/job-cards",
      "/owner/reports/invoices",
      "/owner/reports/auto-shops",
      "/owner/reports/tickets-raised",
    ],
  },
];

/** Build Documents sub-nav from the owner's vehicles (prefer number plate labels). */
export function ownerDocumentsSubItems(
  vehicles: { id: string; label?: string }[]
): NavSubItem[] {
  if (vehicles.length === 0) {
    return [{ name: "Documents", path: "/owner/documents" }];
  }
  return vehicles.map((v, index) => ({
    name: v.label?.trim() || `Vehicle ${index + 1}`,
    path: `/owner/documents/${v.id}`,
  }));
}

/** Merge static owner nav with dynamic Documents vehicle sub-items. */
export function buildOwnerPrimaryNav(
  vehicles: { id: string; label?: string }[] = []
): NavItem[] {
  const documentSubs = ownerDocumentsSubItems(vehicles);
  return ownerPrimaryNav.map((item) => {
    if (item.name !== "Documents") return item;
    return {
      ...item,
      path: documentSubs[0]?.path ?? "/owner/documents",
      subItems: documentSubs,
      matchPaths: [
        "/owner/documents",
        ...documentSubs.map((s) => s.path),
      ],
    };
  });
}
