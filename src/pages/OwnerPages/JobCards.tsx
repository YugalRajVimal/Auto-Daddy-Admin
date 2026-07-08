import { useEffect, useMemo, useState } from "react";
import OwnerPageShell, {
  OwnerPageSearchInput,
} from "../../components/owner/OwnerPageShell";
import { OwnerJobCardsTable } from "../../components/owner/OwnerPanelTables";
import { useAuth } from "../../auth";
import { useCarOwnerJobCards } from "../../hooks/useCarOwnerJobCards";
import {
  businessName,
  jobCardLicensePlate,
  jobChipLabel,
  serviceTypeLabel,
} from "../../lib/carOwnerJobCards";

const PAGE_SIZE = 10;

export default function OwnerJobCardsPage() {
  const { session } = useAuth();
  const countryCode = session?.meta?.countryCode;
  const { items, loading, error, refresh } = useCarOwnerJobCards(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((jc) => {
      const hay = [
        jobChipLabel(jc),
        businessName(jc.business),
        jobCardLicensePlate(jc),
        serviceTypeLabel(jc),
        jc.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <OwnerPageShell
      pageHeading="Job Cards"
      metaTitle="Job Cards | AutoDaddy"
      metaDescription="Car owner job cards"
      heroCardFlush
      contentTopOffset
    >
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <p className="text-sm font-semibold text-gray-800">{error}</p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-md bg-ad-purple px-4 py-2 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-600">
          {search.trim() ? "No job cards match your search." : "No job cards yet."}
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <OwnerPageSearchInput value={search} onChange={setSearch} placeholder="Search job cards…" />
          </div>
          <OwnerJobCardsTable rows={pageRows} countryCode={countryCode} />
          {totalPages > 1 ? (
            <div className="flex items-center justify-between gap-2 border-t border-gray-200 pt-3 text-xs text-gray-600">
              <span>
                Page {page} of {totalPages} ({filtered.length} total)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded border border-gray-300 bg-white px-2 py-1 font-semibold text-ad-purple disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded border border-gray-300 bg-white px-2 py-1 font-semibold text-ad-purple disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </OwnerPageShell>
  );
}
