/** Admin CMS pageSlug values for car-owner FAQs (see AdminPages/Content/FAQs.tsx). */
export const OWNER_FAQ_PAGE_SLUGS = {
  home: "Home - CarOwner",
  profile: "Profile - CarOwner",
  myVehicles: "MyVehicles - CarOwner",
  documents: "Documents - CarOwner",
  autoShops: "AutoShops - CarOwner",
  deals: "Deals - CarOwner",
  expenses: "Expenses - CarOwner",
  digitalDiary: "Digital Diary - CarOwner",
  reports: "Reports - CarOwner",
  notifications: "Notifications - CarOwner",
  help: "Help - CarOwner",
} as const;

export type OwnerFaqPageSlug =
  (typeof OWNER_FAQ_PAGE_SLUGS)[keyof typeof OWNER_FAQ_PAGE_SLUGS];

/** Map a car-owner portal pathname to the FAQ pageSlug for that screen. */
export function ownerFaqPageSlugFromPath(pathname: string): OwnerFaqPageSlug {
  const path = pathname.replace(/\/+$/, "") || "/owner";

  if (path === "/owner" || path === "/owner/privacy" || path === "/owner/features") {
    return OWNER_FAQ_PAGE_SLUGS.home;
  }
  if (path.startsWith("/owner/profile/vehicles") || path === "/owner/vehicles") {
    return OWNER_FAQ_PAGE_SLUGS.myVehicles;
  }
  if (path.startsWith("/owner/profile")) {
    return OWNER_FAQ_PAGE_SLUGS.profile;
  }
  if (path.startsWith("/owner/documents") || path.startsWith("/owner/digi-purse")) {
    return OWNER_FAQ_PAGE_SLUGS.documents;
  }
  if (path.startsWith("/owner/auto-shops")) {
    return OWNER_FAQ_PAGE_SLUGS.autoShops;
  }
  if (path.startsWith("/owner/deals")) {
    return OWNER_FAQ_PAGE_SLUGS.deals;
  }
  if (
    path.startsWith("/owner/expenses") ||
    path.startsWith("/owner/invoices") ||
    path.startsWith("/owner/job-cards")
  ) {
    return OWNER_FAQ_PAGE_SLUGS.expenses;
  }
  if (path.startsWith("/owner/digital-diary")) {
    return OWNER_FAQ_PAGE_SLUGS.digitalDiary;
  }
  if (path.startsWith("/owner/reports")) {
    return OWNER_FAQ_PAGE_SLUGS.reports;
  }
  if (path.startsWith("/owner/messages")) {
    return OWNER_FAQ_PAGE_SLUGS.notifications;
  }
  if (path.startsWith("/owner/help")) {
    return OWNER_FAQ_PAGE_SLUGS.help;
  }

  return OWNER_FAQ_PAGE_SLUGS.home;
}
