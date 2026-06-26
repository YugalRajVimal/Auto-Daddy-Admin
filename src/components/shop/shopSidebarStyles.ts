export function shopSidebarButtonClass(active?: boolean, className = "") {
  const base = "flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-left text-sm font-bold transition-colors";
  const tone = active
    ? "border border-ad-purple bg-ad-purple text-white shadow-sm"
    : "border border-transparent bg-[#FDE4D0] text-ad-purple hover:bg-[#fce0c8]";
  return `${base} ${tone} ${className}`.trim();
}
