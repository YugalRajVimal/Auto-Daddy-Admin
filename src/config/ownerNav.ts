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
    name: "Messages",
    path: "/owner/messages",
    matchPaths: ["/owner/messages"],
  },
  {
    name: "Deals",
    path: "/owner/deals",
    matchPaths: ["/owner/deals"],
  },
  {
    name: "Reports",
    path: "/owner/reports",
    matchPaths: ["/owner/reports", "/owner/invoices"],
  },
];
