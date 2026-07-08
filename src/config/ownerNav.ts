import type { NavItem } from "./adminNav";

export const ownerPrimaryNav: NavItem[] = [
  {
    name: "Home",
    path: "/owner",
    matchPaths: ["/owner"],
  },
  {
    name: "Profile",
    path: "/owner/profile",
    matchPaths: ["/owner/profile", "/owner/profile/vehicles"],
  },
  {
    name: "Auto Shops",
    path: "/owner/auto-shops",
    matchPaths: ["/owner/auto-shops"],
  },
  {
    name: "Deals",
    path: "/owner/deals",
    matchPaths: ["/owner/deals"],
  },
  {
    name: "Expenses",
    path: "/owner/expenses",
    matchPaths: ["/owner/expenses", "/owner/invoices", "/owner/expenses/job-cards"],
  },
  {
    name: "Digital Diary",
    path: "/owner/digital-diary",
    matchPaths: ["/owner/digital-diary", "/owner/digital-diary/documents"],
  },
  {
    name: "Reports",
    path: "/owner/reports",
    matchPaths: ["/owner/reports"],
  },
];
