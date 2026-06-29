/** Vertical stack spacing for left sidebar nav pills. */
export const shopSidebarButtonStackClass = "flex flex-col gap-4";

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
