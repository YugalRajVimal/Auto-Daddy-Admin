import { useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { usePartsDealers } from "../../hooks/usePartsDealers";
import { openPartsDealerLink } from "../../lib/shopPartsDealers";
import { shopPanelShellClass } from "./shopLayoutStyles";

const SKELETON_ROWS = 6;

/** Left column on inner shop pages: searchable parts-dealer list (purple / peach rows). */
export default function ShopDealersListPanel() {
  const { dealers, loading } = usePartsDealers();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return dealers;
    return dealers.filter((dealer) =>
      [dealer.name, dealer.city, dealer.specialty].some((field) => field?.toLowerCase().includes(q)),
    );
  }, [dealers, query]);

  // Show the skeleton whenever there is nothing to list — before the request starts,
  // while it is loading, and after it returns empty. Keying this off `loading` caused the
  // skeleton to flash and then be replaced by an empty message.
  const showSkeleton = dealers.length === 0;

  return (
    <aside
      aria-label="Parts dealers"
      aria-busy={showSkeleton && loading ? true : undefined}
      className={`${shopPanelShellClass} gap-3 border border-gray-200 bg-white/85 p-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur`}
    >
      <label className="relative block shrink-0">
        <span className="sr-only">Search dealers</span>
        <FiSearch
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          disabled={showSkeleton}
          className="w-full rounded-xl border border-gray-200 bg-gray-100 py-2.5 pl-10 pr-3 text-base text-gray-800 placeholder:font-semibold placeholder:text-gray-400 focus:border-ad-purple focus:bg-white focus:outline-none focus:ring-2 focus:ring-ad-purple/20 disabled:cursor-not-allowed"
        />
      </label>

      <p className="shrink-0 px-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        Parts dealers
      </p>

      <ul className="no-scrollbar flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
        {showSkeleton
          ? Array.from({ length: SKELETON_ROWS }, (_, i) => {
              const purple = i % 2 === 0;
              return (
                <li
                  key={i}
                  aria-hidden
                  className={`flex h-[52px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-lg ${
                    loading ? "animate-pulse" : ""
                  } ${purple ? "bg-ad-purple/25" : "bg-[#FDE4D0]"}`}
                >
                  <span className={`h-2.5 w-2/3 rounded-full ${purple ? "bg-white/50" : "bg-ad-purple/20"}`} />
                  <span className={`h-2 w-1/3 rounded-full ${purple ? "bg-white/35" : "bg-ad-purple/15"}`} />
                </li>
              );
            })
          : filtered.map((dealer, index) => {
              const purple = index % 2 === 0;
              return (
                <li key={`${dealer.name}-${index}`} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => openPartsDealerLink(dealer)}
                    title={dealer.specialty || dealer.name}
                    className={`w-full rounded-lg px-3 py-2 text-center transition-all duration-150 hover:-translate-y-px hover:shadow-md ${
                      purple
                        ? "bg-ad-purple text-white hover:bg-ad-purple-dark"
                        : "border border-transparent bg-[#FDE4D0] text-ad-purple hover:border-ad-purple/40"
                    }`}
                  >
                    <span className="block truncate text-[15px] font-semibold uppercase leading-tight tracking-wide">
                      {dealer.name}
                    </span>
                    <span className={`block truncate text-xs ${purple ? "text-white/85" : "text-ad-purple/80"}`}>
                      {dealer.city || "—"}
                    </span>
                  </button>
                </li>
              );
            })}
        {!showSkeleton && filtered.length === 0 ? (
          <li className="px-2 py-6 text-center text-sm text-gray-500">No dealers match your search.</li>
        ) : null}
      </ul>
    </aside>
  );
}