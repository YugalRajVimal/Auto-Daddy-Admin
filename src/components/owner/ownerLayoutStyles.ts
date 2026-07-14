/** Owner sub-page body: sidebar + hero card (primary nav stays in PortalShell). */
export const ownerPageBodyGridClass =
  "grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[200px_minmax(0,1fr)] lg:items-stretch lg:gap-x-4 xl:grid-cols-[220px_minmax(0,1fr)] 2xl:gap-4 2xl:grid-cols-[260px_minmax(0,1fr)] 2xl:gap-x-5";

/** Shell grid used by OwnerPageShell (sidebar + content). Dense below 2xl. */
export const ownerPageShellGridClass =
  "grid min-h-0 gap-3 lg:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)] 2xl:gap-4 2xl:grid-cols-[260px_minmax(0,1fr)]";

/** Page outer padding under the owner chrome — compact on laptop / short height. */
export const ownerPageOuterClass = "owner-page-body bg-ad-app-bg py-2.5 md:py-3 2xl:py-5";

/** Horizontal content inset for owner routes. */
export const ownerPortalContentPadClass =
  "px-2 sm:px-3 md:px-4 lg:px-5 2xl:px-8";

export const ownerPageTitleClass =
  "text-lg font-bold text-blue-700 md:text-xl 2xl:text-2xl";

/** Page title in the nav row (left of primary menu), aligned with the sidebar column. */
export const ownerNavPageHeadingClass =
  "font-serif text-base font-bold leading-tight text-ad-grey md:text-lg lg:text-xl 2xl:text-2xl";

export const ownerPageHeaderClass = "mb-2 flex items-center justify-between gap-3 2xl:mb-3";

export const ownerPageAddFormSubtitleClass =
  "text-center font-serif text-lg font-bold text-ad-grey-dark md:text-xl 2xl:text-2xl";

export const ownerPageSectionTitleClass = ownerPageAddFormSubtitleClass;

/** Stack spacing for owner page sections (Home, Documents, etc.). */
export const ownerPageStackClass = "space-y-3 2xl:space-y-4";

/** Card padding that expands at 2xl. */
export const ownerCardPadClass = "p-3 2xl:p-4";

/** Dashboard section title. */
export const ownerDashboardTitleClass =
  "mt-0.5 text-xl font-bold tracking-tight text-slate-900 2xl:text-2xl";

/**
 * Chrome token classes — balanced on laptop; roomier at 2xl.
 * Mild short-height overrides live under `.owner-portal` in index.css.
 */
export const ownerChromeLogoClass =
  "owner-chrome-logo block h-auto w-auto max-h-12 max-w-[140px] object-contain drop-shadow-sm sm:max-h-14 sm:max-w-[170px] md:max-h-[3.75rem] md:max-w-[190px] 2xl:max-h-20 2xl:max-w-[220px]";

export const ownerChromeHeaderPadClass =
  "owner-chrome-header pt-2.5 pb-2 sm:pt-3 sm:pb-2.5 2xl:pt-3.5 2xl:pb-3";

export const ownerChromeNameClass =
  "text-center font-outfit text-base tracking-tight sm:text-lg md:text-xl 2xl:text-[1.375rem]";

export const ownerChromePrimaryTabClass =
  "owner-primary-tab w-full whitespace-nowrap rounded-xl px-2 py-2 text-center text-xs font-semibold tracking-wide transition-all sm:text-[13px] md:px-2.5 md:py-2.5 lg:text-sm 2xl:px-3 2xl:py-2.5 2xl:text-[15px]";

export const ownerChromeSubNavLinkClass =
  "owner-subnav-link relative mx-auto block max-w-[12rem] rounded-full px-3 py-1.5 text-center text-xs font-medium leading-snug text-gray-600 transition-all hover:bg-white/70 hover:text-ad-purple md:text-[13px] 2xl:px-3.5 2xl:py-2 2xl:text-sm md:whitespace-normal";

/** @deprecated Use ownerPageBodyGridClass via OwnerPageLayout instead. */
export const ownerPageLayoutClass =
  "flex min-h-0 flex-1 flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-4 2xl:gap-5";

export const ownerPageSidebarClass =
  "relative flex w-full min-w-0 shrink-0 flex-col overflow-hidden";

/** Glass panel that wraps owner sidebar button stacks (matches ShopSidebar ownerStyle). */
export const ownerPageSidebarPanelClass =
  "flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-2xl border border-white/70 bg-white/45 p-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] backdrop-blur-xl";

/** @deprecated Main content is rendered inside the hero card by OwnerPageLayout. */
export const ownerPageMainClass = "min-w-0 flex-1";
