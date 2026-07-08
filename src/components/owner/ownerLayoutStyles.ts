/** Owner sub-page body: sidebar + hero card (primary nav stays in PortalShell). */
export const ownerPageBodyGridClass =
  "grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-stretch lg:gap-x-5 xl:grid-cols-[260px_minmax(0,1fr)]";

export const ownerPageTitleClass = "text-xl font-bold text-blue-700 md:text-2xl";

/** Page title in the nav row (left of primary menu), aligned with the sidebar column. */
export const ownerNavPageHeadingClass =
  "font-serif text-lg font-bold leading-tight text-ad-grey md:text-xl lg:text-2xl";

export const ownerPageHeaderClass = "mb-3 flex items-center justify-between gap-3";

export const ownerPageAddFormSubtitleClass =
  "text-center font-serif text-xl font-bold text-ad-grey-dark md:text-2xl";

export const ownerPageSectionTitleClass = ownerPageAddFormSubtitleClass;

/** @deprecated Use ownerPageBodyGridClass via OwnerPageLayout instead. */
export const ownerPageLayoutClass =
  "flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-5";

import { shopSidebarShellClass } from "../shop/shopSidebarStyles";

export const ownerPageSidebarClass = `${shopSidebarShellClass} relative overflow-visible`;

/** @deprecated Main content is rendered inside the hero card by OwnerPageLayout. */
export const ownerPageMainClass = "min-w-0 flex-1";
