/** Portal page edge inset — horizontal matches bottom (0.25rem). */
export const shopPortalBottomPaddingClass = "pb-1 md:pb-1";

/**
 * Shared horizontal inset so header (profile link → logout) aligns with the page body grid.
 * All breakpoints are set explicitly so {@link PortalPageContent} defaults do not leak through twMerge.
 */
export const shopPortalHorizPaddingClass =
  "px-1 sm:px-1 md:px-1 lg:px-1 xl:px-1";

/** Resets {@link PortalPageContent} vertical padding on shop pages. */
export const shopPortalTopPaddingClass = "pt-0 md:pt-0";

/** Vertical rhythm: page title → nav and nav → hero card (0.5rem). */
export const shopNavVerticalGapClass = "gap-2";

/** Space between the page title header and the primary nav row. */
export const shopHeaderToNavGapClass = "mt-2";

/** Shared nav-row cell — logo slot and menu bar use the same footprint. */
export const shopNavRowCellClass = "flex h-10 w-full items-center";

/** Left nav-row slot (Home menu button); invisible spacer keeps row height on other pages. */
export const shopNavRowSlotClass = `${shopNavRowCellClass} justify-center`;

/** Primary nav row — same height as {@link shopNavRowSlotClass}. */
export const shopNavRowNavClass = shopNavRowCellClass;

/** Shop page body: nav row over sidebar + main content. */
export const shopPageBodyGridClass =
  "grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)] lg:items-stretch lg:gap-x-5 lg:gap-y-2 xl:grid-cols-[260px_minmax(0,1fr)]";

/** Home menu button footprint — matches nav row height. */
export const shopHomeMenuButtonClass =
  "flex size-10 shrink-0 items-center justify-center rounded-lg transition-opacity hover:opacity-80";

export const shopHomeMenuButtonImageClass = "size-9 object-contain";

/** Uniform inset inside the hero content card (all shop pages except Home). */
export const shopHeroCardPaddingClass = "p-2 sm:p-3 md:p-5 lg:p-6 xl:p-8";

/** Modest inset for flush hero cards (e.g. Shop is Open — no background image). */
export const shopHeroCardFlushPaddingClass = "p-1 sm:p-1.5";

/** Background image inside the shop profile hero card (all shop pages except Home). */
export const shopHeroCardImageClass = "absolute inset-0 h-full w-full object-cover opacity-75";

/** Fixed main content card — viewport height, no grow; clip and scroll inside. */
export const shopMainContentHeightClass =
  "h-[calc(100vh-9.5rem)] max-h-[calc(100vh-9.5rem)] min-h-[420px] lg:h-[calc(100vh-175px)] lg:max-h-[calc(100vh-175px)]";

export const shopMainContentShellClass =
  `flex w-full flex-col overflow-hidden rounded-lg ${shopMainContentHeightClass}`;

/** Max height for sidebar ad block aligned with the home hero card. */
export const shopMainContentMaxHeightClass =
  "max-h-[calc(100vh-9.5rem)] lg:max-h-[calc(100vh-175px)]";

/** Scrollable region below the hero card toolbar (scroll works, scrollbar hidden). */
export const shopHeroCardScrollClass =
  "no-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto";

/** Inner body inside the hero card (fills scroll area). */
export const shopHeroCardBodyClass = "flex min-h-0 flex-col";

/** Scroll-area body: at least full height so short page content can sit vertically centered. */
export const shopHeroCardScrollBodyClass = `${shopHeroCardBodyClass} min-h-full`;

/** Wraps route content; `my-auto` centers short pages vertically inside the scroll body. */
export const shopHeroCardScrollContentClass = "my-auto w-full min-w-0";

/** Top-aligned route content inside the hero card scroll body. */
export const shopHeroCardScrollContentTopClass = "w-full min-w-0";

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
  "shop-compact-input w-full h-[26px] box-border border border-gray-400 bg-white px-2 py-0 text-sm leading-tight focus:border-blue-500 focus:outline-none";

/** Multiline fields in shop form cards. */
export const shopCompactTextareaClass =
  "shop-compact-input w-full min-h-[26px] border border-gray-400 bg-white px-2 py-0.5 text-sm leading-tight focus:border-blue-500 focus:outline-none resize-y";

/** Read-only value cells matching compact input height. */
export const shopCompactReadOnlyClass =
  "min-h-[26px] rounded border border-gray-400 bg-gray-100 px-2 py-0.5 text-sm leading-tight";

/** Compact file picker for shop forms. */
export const shopCompactFileInputClass =
  "block w-full text-xs leading-tight text-gray-700 file:mr-2 file:h-[26px] file:rounded file:border-0 file:bg-gray-100 file:px-2 file:py-0 file:text-xs file:font-semibold file:text-gray-700";

/** Profile add/edit form card body — default form panel styling. */
export const shopProfileFormPanelClass = "!mb-0 shadow-none";

/** Profile add/edit form footer strip — matches unselected sidebar nav pill tone. */
export const shopProfileFormPanelFooterClass =
  "shop-profile-form-panel-footer border-t border-ad-purple bg-[#FDE4D0]";

/** Highlight for the table row currently being edited in profile sections. */
export const shopProfileEditingRowClass = "shop-profile-editing-row bg-[#FDE4D0]";
