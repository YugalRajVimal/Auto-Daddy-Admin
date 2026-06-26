/** Shared horizontal inset so header (profile link → logout) aligns with the page body grid. */
export const shopPortalHorizPaddingClass = "px-3 sm:px-4 md:px-4 lg:px-4 xl:px-4";

/** Horizontal + vertical padding inside the hero content card. */
export const shopHeroCardPaddingClass = "px-2 py-2.5 sm:px-3 sm:py-3";

/** Fixed main content card — viewport height, no grow; clip and scroll inside. */
export const shopMainContentShellClass =
  "flex h-[calc(100vh-11rem)] max-h-[calc(100vh-11rem)] min-h-[420px] w-full flex-col overflow-hidden rounded-lg lg:h-[calc(100vh-220px)] lg:max-h-[calc(100vh-220px)]";

/** Scrollable region below the hero card toolbar (scroll works, scrollbar hidden). */
export const shopHeroCardScrollClass =
  "no-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto";

/** Inner body inside the hero card (fills scroll area). */
export const shopHeroCardBodyClass = "flex min-h-0 flex-col";

/** Child panels that should fill the remaining space inside the hero card body. */
export const shopMainContentFillClass = "flex min-h-0 flex-1 flex-col";

/** Muted copy placed directly on the hero image (not inside a card). */
export const shopHeroOnImageMutedTextClass = "text-white/85";

/** List footer labels sitting on the hero image. */
export const shopHeroFooterTextClass = "text-sm font-semibold text-white";

/** Marks an opaque nested card/panel — keeps default dark text inside the hero card. */
export const shopHeroOpaqueSurfaceClass = "shop-hero-surface";
export const shopHeroCardSearchClass =
  "w-full max-w-xs rounded-full border border-gray-300 bg-white/90 px-4 py-2 text-sm text-gray-800 shadow-sm placeholder:text-gray-500 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 sm:max-w-sm";
