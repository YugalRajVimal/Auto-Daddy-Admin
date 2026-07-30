/** Admin CMS pageSlug values for shop-owner FAQs (see AdminPages/Content/FAQs.tsx). */
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

/** Map a shop-owner portal pathname to the FAQ pageSlug for that screen. */
export function shopFaqPageSlugFromPath(pathname: string): ShopFaqPageSlug {
  const path = pathname.replace(/\/+$/, "") || "/shop";

  if (path === "/shop") {
    return SHOP_FAQ_PAGE_SLUGS.home;
  }
  if (path.startsWith("/shop/people")) {
    return SHOP_FAQ_PAGE_SLUGS.people;
  }
  if (path.startsWith("/shop/services")) {
    return SHOP_FAQ_PAGE_SLUGS.services;
  }
  if (path.startsWith("/shop/job-cards")) {
    return SHOP_FAQ_PAGE_SLUGS.jobCards;
  }
  if (path.startsWith("/shop/wallet")) {
    return SHOP_FAQ_PAGE_SLUGS.wallet;
  }
  if (path.startsWith("/shop/my-website")) {
    return SHOP_FAQ_PAGE_SLUGS.myWebsite;
  }
  if (path.startsWith("/shop/reports")) {
    return SHOP_FAQ_PAGE_SLUGS.reports;
  }
  if (path.startsWith("/shop/deals")) {
    return SHOP_FAQ_PAGE_SLUGS.deals;
  }
  if (path.startsWith("/shop/messages")) {
    return SHOP_FAQ_PAGE_SLUGS.notifications;
  }
  if (path.startsWith("/shop/help")) {
    return SHOP_FAQ_PAGE_SLUGS.help;
  }
  if (path.startsWith("/shop/profile") || path.startsWith("/shop/team")) {
    return SHOP_FAQ_PAGE_SLUGS.profile;
  }

  return SHOP_FAQ_PAGE_SLUGS.home;
}
