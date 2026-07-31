/** Admin CMS pageSlug values for car-owner FAQs. */
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

/** Map a car-owner Expo pathname to the FAQ pageSlug for that screen. */
export function ownerFaqPageSlugFromPath(pathname: string): OwnerFaqPageSlug {
  const path = pathname.replace(/\/+$/, "") || "/";
  const lower = path.toLowerCase();

  if (lower.includes("/my-vehicles") || lower.includes("/vehicles")) {
    return OWNER_FAQ_PAGE_SLUGS.myVehicles;
  }
  if (lower.includes("/profile")) {
    return OWNER_FAQ_PAGE_SLUGS.profile;
  }
  if (lower.includes("/documents")) {
    return OWNER_FAQ_PAGE_SLUGS.documents;
  }
  if (lower.includes("/schedule-service") || lower.includes("/auto-shop")) {
    return OWNER_FAQ_PAGE_SLUGS.autoShops;
  }
  if (lower.includes("/deals")) {
    return OWNER_FAQ_PAGE_SLUGS.deals;
  }
  if (
    lower.includes("/service-history") ||
    lower.includes("/expenses") ||
    lower.includes("/invoices") ||
    lower.includes("/job-cards")
  ) {
    return OWNER_FAQ_PAGE_SLUGS.expenses;
  }
  if (lower.includes("/digital-diary") || lower.includes("/diary")) {
    return OWNER_FAQ_PAGE_SLUGS.digitalDiary;
  }
  if (lower.includes("/reports")) {
    return OWNER_FAQ_PAGE_SLUGS.reports;
  }
  if (lower.includes("/notification")) {
    return OWNER_FAQ_PAGE_SLUGS.notifications;
  }
  if (lower.includes("/faqs") || lower.includes("/help")) {
    return OWNER_FAQ_PAGE_SLUGS.help;
  }
  if (lower.includes("/home") || lower.includes("/(tabs)")) {
    return OWNER_FAQ_PAGE_SLUGS.home;
  }

  return OWNER_FAQ_PAGE_SLUGS.help;
}
