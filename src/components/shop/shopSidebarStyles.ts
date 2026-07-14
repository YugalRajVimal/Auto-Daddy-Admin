/** Vertical stack spacing for left sidebar nav pills. */
export const shopSidebarButtonStackClass = "flex flex-col gap-4";

/** Tighter stack for soft glass owner-portal sidebars. */
export const ownerSidebarButtonStackClass = "flex flex-col gap-2";

/** Shared sidebar column footprint (shop + owner portals). */
export const shopSidebarShellClass =
  "flex w-full shrink-0 flex-col lg:w-[220px] xl:w-[260px] lg:h-[calc(100vh-220px)] lg:max-h-[calc(100vh-220px)]";

export function shopSidebarButtonClass(active?: boolean, className = "") {
  const base =
    "flex w-full items-center gap-2 rounded-l-full rounded-r-none px-3 py-1.5 text-left text-sm font-bold transition-colors duration-150";
  const tone = active
    ? "border border-ad-purple bg-ad-purple text-white shadow-sm hover:border-ad-pink-dark hover:bg-ad-pink-dark"
    : "border border-ad-purple bg-[#FDE4D0] text-ad-purple hover:border-ad-pink-dark hover:bg-[#f5cce8]";
  return `${base} ${tone} ${className}`.trim();
}

/** Soft glass pills for the modern owner portal. */
export function ownerSidebarButtonClass(active?: boolean, className = "") {
  const base =
    "flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold tracking-wide transition-all duration-200";
  const tone = active
    ? "bg-gradient-to-br from-ad-purple to-ad-purple-dark text-white shadow-[0_8px_18px_rgba(155,48,141,0.32)] ring-1 ring-ad-purple/30"
    : "border border-white/80 bg-white/65 text-ad-purple/80 shadow-[0_4px_14px_rgba(15,23,42,0.04)] backdrop-blur-md hover:-translate-y-0.5 hover:bg-white/90 hover:text-ad-purple hover:shadow-[0_8px_18px_rgba(155,48,141,0.12)]";
  return `${base} ${tone} ${className}`.trim();
}

export function shopSidebarOutdoorButtonClass(active?: boolean, className = "") {
  const base =
    "flex w-full items-center gap-2 rounded-l-full rounded-r-none px-3 py-1.5 text-left text-sm font-bold transition-colors duration-150";
  const tone = active
    ? "border border-gray-700 bg-gray-700 text-white shadow-sm hover:bg-gray-800"
    : "border border-gray-500 bg-gray-200 text-gray-800 hover:border-gray-600 hover:bg-gray-300";
  return `${base} ${tone} ${className}`.trim();
}

