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
    matchPaths: ["/owner/profile"],
  },
  {
    name: "Vehicles",
    path: "/owner/vehicles",
    matchPaths: ["/owner/vehicles"],
  },
  {
    name: "Auto Shops",
    path: "/owner/auto-shops",
    matchPaths: ["/owner/auto-shops"],
  },
  {
    name: "Job Cards",
    path: "/owner/job-cards",
    matchPaths: ["/owner/job-cards"],
  },
  {
    name: "Invoices",
    path: "/owner/invoices",
    matchPaths: ["/owner/invoices"],
  },
  {
    name: "Messages",
    path: "/owner/messages",
    matchPaths: ["/owner/messages"],
  },
  {
    name: "Digi Purse",
    path: "/owner/digi-purse",
    matchPaths: ["/owner/digi-purse"],
  },
  {
    name: "Deals",
    path: "/owner/deals",
    matchPaths: ["/owner/deals"],
  },
];
