/** Shared horizontal inset so header (profile link → logout) aligns with the page body grid. */
export const shopPortalHorizPaddingClass = "px-3 sm:px-4 md:px-4 lg:px-4 xl:px-4";

/** Uniform inset inside the hero content card (all shop pages except Home). */
export const shopHeroCardPaddingClass = "p-4 sm:p-8 md:p-14 lg:p-16 xl:p-20";

/** Fixed main content card — viewport height, no grow; clip and scroll inside. */
export const shopMainContentHeightClass =
  "h-[calc(100vh-11rem)] max-h-[calc(100vh-11rem)] min-h-[420px] lg:h-[calc(100vh-220px)] lg:max-h-[calc(100vh-220px)]";

export const shopMainContentShellClass =
  `flex w-full flex-col overflow-hidden rounded-lg ${shopMainContentHeightClass}`;

/** Max height for sidebar ad block aligned with the home hero card. */
export const shopMainContentMaxHeightClass =
  "max-h-[calc(100vh-11rem)] lg:max-h-[calc(100vh-220px)]";

/** Scrollable region below the hero card toolbar (scroll works, scrollbar hidden). */
export const shopHeroCardScrollClass =
  "no-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto";

/** Inner body inside the hero card (fills scroll area). */
export const shopHeroCardBodyClass = "flex min-h-0 flex-col";

/** Scroll-area body: at least full height so short page content can sit vertically centered. */
export const shopHeroCardScrollBodyClass = `${shopHeroCardBodyClass} min-h-full`;

/** Wraps route content; `my-auto` centers short pages vertically inside the scroll body. */
export const shopHeroCardScrollContentClass = "my-auto w-full min-w-0";

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

/** Shorter inputs for shop add/edit form cards. */
export const shopCompactInputClass =
  "shop-compact-input w-full h-[22px] box-border border border-gray-400 bg-white px-2 py-0 text-sm leading-tight focus:border-blue-500 focus:outline-none";

/** Multiline fields in shop form cards. */
export const shopCompactTextareaClass =
  "shop-compact-input w-full min-h-[22px] border border-gray-400 bg-white px-2 py-0.5 text-sm leading-tight focus:border-blue-500 focus:outline-none resize-y";

/** Read-only value cells matching compact input height. */
export const shopCompactReadOnlyClass =
  "min-h-[22px] rounded border border-gray-400 bg-gray-100 px-2 py-0.5 text-sm leading-tight";

/** Compact file picker for shop forms. */
export const shopCompactFileInputClass =
  "block w-full text-xs leading-tight text-gray-700 file:mr-2 file:h-[22px] file:rounded file:border-0 file:bg-gray-100 file:px-2 file:py-0 file:text-xs file:font-semibold file:text-gray-700";
