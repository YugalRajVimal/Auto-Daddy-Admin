export type PortalSidebarPopupPlacement = "below" | "above";

const PORTAL_SIDEBAR_POPUP_BASE =
  "absolute left-0 z-50 w-full min-w-[220px] overflow-hidden rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl";

export function portalSidebarPopupClass(
  placement: PortalSidebarPopupPlacement = "below",
  className = ""
) {
  const position = placement === "below" ? "top-full mt-1.5" : "bottom-full mb-1.5";
  return `${PORTAL_SIDEBAR_POPUP_BASE} ${position} ${className}`.trim();
}

/** @deprecated Use portalSidebarPopupClass("below") or PortalSidebarPopup. */
export const PORTAL_SIDEBAR_POPUP_CLASS = portalSidebarPopupClass("below");

const PORTAL_SIDEBAR_PILL_BASE =
  "rounded-full border px-4 py-2.5 text-sm font-bold uppercase tracking-wide transition-colors";

export const PORTAL_SIDEBAR_FILLED_BLUE = "border-blue-700 bg-blue-600 text-white shadow-md";

export const PORTAL_SIDEBAR_OUTLINE_BLUE =
  "border-blue-600 bg-transparent text-blue-600 hover:border-blue-700 hover:bg-blue-600 hover:text-white hover:shadow-md";

export function portalSidebarPillClass(highlighted: boolean, className = "") {
  return `${PORTAL_SIDEBAR_PILL_BASE} ${highlighted ? PORTAL_SIDEBAR_FILLED_BLUE : PORTAL_SIDEBAR_OUTLINE_BLUE} ${className}`.trim();
}

export function isPortalSidebarHighlighted(active?: boolean, filled?: boolean) {
  return Boolean(active || filled);
}

export function portalSidebarButtonClass(active?: boolean, filled?: boolean, className = "") {
  return `flex w-full items-center gap-3 text-left ${portalSidebarPillClass(isPortalSidebarHighlighted(active, filled), className)}`;
}

export function portalSidebarSectionHeaderClass(active?: boolean, filled?: boolean, className = "") {
  return `flex w-full items-center justify-between text-left ${portalSidebarPillClass(isPortalSidebarHighlighted(active, filled), className)}`;
}
