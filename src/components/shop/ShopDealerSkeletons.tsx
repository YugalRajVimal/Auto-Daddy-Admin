/**
 * Outline placeholder for the dashboard's parts-dealer ad. Shown while dealers load and
 * while no dealer is listed yet, so the ad panel keeps its layout instead of sample data.
 */

/** Dealer ad card outline — photo block, name banner, city bar, contact icons, tagline. */
export function ShopDealerAdCardSkeleton({
  pulse = true,
  className = "",
}: {
  pulse?: boolean;
  className?: string;
}) {
  const animate = pulse ? "animate-pulse" : "";

  return (
    <div
      className={`flex w-full flex-col overflow-hidden rounded-lg border border-gray-200/80 bg-white shadow-lg ${animate} ${className}`.trim()}
      aria-hidden
    >
      <div className="min-h-[140px] w-full flex-1 bg-gray-200/80" />
      <div className="h-9 shrink-0 bg-[#008000]/70" />
      <div className="shrink-0 space-y-2 px-3 py-3">
        <div className="h-7 rounded-none bg-[#d4ffd4]" />
        <div className="flex justify-center gap-6">
          <div className="h-5 w-5 rounded-full bg-gray-200" />
          <div className="h-5 w-5 rounded-full bg-[#008000]/25" />
          <div className="h-5 w-5 rounded-full bg-gray-200" />
        </div>
        <div className="h-8 border border-gray-300 bg-white" />
      </div>
    </div>
  );
}
