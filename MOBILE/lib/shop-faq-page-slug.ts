/** Admin CMS pageSlug values for shop-owner FAQs. */
export const SHOP_FAQ_PAGE_SLUGS = {
  home: "Home - AutoShopOwner",
  profile: "Profile - AutoShopOwner",
  people: "People - AutoShopOwner",
  services: "Services - AutoShopOwner",
  jobCards: "JobCards - AutoShopOwner",
  wallet: "Wallet - AutoShopOwner",
  myWebsite: "MyWebsite - AutoShopOwner",
  reports: "Reports - AutoShopOwner",
  deals: "Deals - AutoShopOwner",
  help: "Help - AutoShopOwner",
  notifications: "Notifications - AutoShopOwner",
} as const;

export type ShopFaqPageSlug =
  (typeof SHOP_FAQ_PAGE_SLUGS)[keyof typeof SHOP_FAQ_PAGE_SLUGS];

/** Map a shop-owner Expo pathname to the FAQ pageSlug for that screen. */
export function shopFaqPageSlugFromPath(pathname: string): ShopFaqPageSlug {
  const path = pathname.replace(/\/+$/, "") || "/";
  const lower = path.toLowerCase();

  if (lower.includes("/customers") || lower.includes("/people")) {
    return SHOP_FAQ_PAGE_SLUGS.people;
  }
  if (lower.includes("/services")) {
    return SHOP_FAQ_PAGE_SLUGS.services;
  }
  if (lower.includes("/job-cards")) {
    return SHOP_FAQ_PAGE_SLUGS.jobCards;
  }
  if (lower.includes("/wallet")) {
    return SHOP_FAQ_PAGE_SLUGS.wallet;
  }
  if (lower.includes("/website")) {
    return SHOP_FAQ_PAGE_SLUGS.myWebsite;
  }
  if (lower.includes("/reports")) {
    return SHOP_FAQ_PAGE_SLUGS.reports;
  }
  if (lower.includes("/deals")) {
    return SHOP_FAQ_PAGE_SLUGS.deals;
  }
  if (lower.includes("/notification")) {
    return SHOP_FAQ_PAGE_SLUGS.notifications;
  }
  if (lower.includes("/faqs") || lower.includes("/invite-help") || lower.includes("/help")) {
    return SHOP_FAQ_PAGE_SLUGS.help;
  }
  if (lower.includes("/profile") || lower.includes("/team") || lower.includes("/businessprofile")) {
    return SHOP_FAQ_PAGE_SLUGS.profile;
  }
  if (lower.includes("/home") || lower.includes("/(tabs)")) {
    return SHOP_FAQ_PAGE_SLUGS.home;
  }

  return SHOP_FAQ_PAGE_SLUGS.help;
}
