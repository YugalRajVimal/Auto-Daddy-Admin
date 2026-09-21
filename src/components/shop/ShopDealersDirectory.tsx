import { useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { usePartsDealers } from "../../hooks/usePartsDealers";
import { openPartsDealerLink } from "../../lib/shopPartsDealers";
import ShopDealerCard from "./ShopDealerCard";

/** People → Dealers: searchable grid of parts-dealer cards. */
export default function ShopDealersDirectory() {
  const { dealers, loading } = usePartsDealers();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return dealers;
    return dealers.filter((dealer) =>
      [dealer.name, dealer.city, dealer.specialty, dealer.phone].some((field) =>
        field?.toLowerCase().includes(q),
      ),
    );
  }, [dealers, query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {loading ? "Loading dealers…" : `${filtered.length} dealer${filtered.length === 1 ? "" : "s"}`}
        </p>
        <label className="relative block w-full max-w-xs">
          <span className="sr-only">Search dealers</span>
          <FiSearch
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dealers"
            className="w-full rounded-lg border border-gray-200 bg-gray-100 py-2 pl-9 pr-3 text-sm focus:border-ad-purple focus:bg-white focus:outline-none focus:ring-2 focus:ring-ad-purple/20"
          />
        </label>
      </div>

      {loading && dealers.length === 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-[340px] animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 py-12 text-center text-sm text-gray-500">
          {dealers.length === 0 ? "No dealers yet." : "No dealers match your search."}
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4">
          {filtered.map((dealer, index) => (
            <ShopDealerCard
              key={`${dealer.name}-${index}`}
              name={dealer.name}
              phone={dealer.phone}
              imageUrl={dealer.imageUrl}
              city={dealer.city}
              website={dealer.website}
              specialty={dealer.specialty}
              onClick={() => openPartsDealerLink(dealer)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
