import { useEffect, useMemo, useState } from "react";
import JobCardForm from "../../components/JobCard/JobCardForm";
import { ShopViewTransition } from "../../components/shop/ShopAnimated";
import { shopHeroCardBodyClass } from "../../components/shop/shopLayoutStyles";
import ShopPageShell from "../../components/shop/ShopPageShell";
import { ShopSidebarButton } from "../../components/shop/ShopSidebar";
import { shopSidebarButtonStackClass } from "../../components/shop/shopSidebarStyles";
import {
  ShopEmptyPanel,
  ShopErrorPanel,
  ShopListPanel,
  ShopListFooter,
  ShopLoadingPanel,
} from "../../components/shop/ShopPanels";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { useShopJobCards } from "../../hooks/useShopJobCards";
import { formatCurrencyAmount } from "../../lib/currency";
import useAuth from "../../auth/useAuth";
import type { JobCardListRow } from "../../lib/shopOwnerJobCards";

const PAGE_SIZE = 10;

function displayJobId(jobNo: string | undefined): string {
  const raw = (jobNo ?? "").trim().replace(/^#/, "");
  if (!raw) return "—";
  const stripped = raw.replace(/^job\s*#?\s*/i, "").trim();
  if (!stripped) return "—";
  if (/^j/i.test(stripped)) {
    return stripped.replace(/^j/i, "J ");
  }
  return `J ${stripped}`;
}

function displayPhone(phone: string | undefined): string {
  const p = (phone ?? "").trim();
  if (!p) return "—";
  const digits = p.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return p;
}

function formatJobPrice(total: number | string | undefined, countryCode: string | null | undefined): string {
  const formatted = formatCurrencyAmount(total, countryCode, { fallback: "—" });
  if (formatted === "—") return formatted;
  const match = /^([^\d]+)(.+)$/.exec(formatted);
  if (match) {
    return `${match[1].trim()} ${match[2].trim()}`;
  }
  return formatted;
}

function JobCardRow({
  jc,
  countryCode,
  onSelect,
}: {
  jc: JobCardListRow;
  countryCode: string | null | undefined;
  onSelect: () => void;
}) {
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className="flex cursor-pointer items-stretch rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008000]"
    >
      <div className="flex w-[76px] shrink-0 flex-col items-center justify-center border border-gray-400 bg-white px-2 py-3 text-center sm:w-[88px]">
        <p className="text-[11px] font-semibold leading-tight text-gray-800">Job no.</p>
        <p className="mt-0.5 text-sm font-bold leading-tight text-blue-700">{displayJobId(jc.jobNo)}</p>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2 bg-[#d4ffd4] px-3 py-3 sm:gap-4 sm:px-5">
        <div className="min-w-0 shrink-0 sm:max-w-[34%]">
          <p className="truncate text-sm font-bold text-[#008000]">{jc.customerName ?? "—"}</p>
          {jc.phone ? (
            <a
              href={`tel:${jc.phone.replace(/\s/g, "")}`}
              className="text-sm font-semibold text-blue-700 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {displayPhone(jc.phone)}
            </a>
          ) : (
            <p className="text-sm font-semibold text-blue-700">—</p>
          )}
        </div>
        <p className="min-w-0 flex-1 truncate text-center text-lg font-bold tracking-wide text-gray-900 sm:text-xl">
          {jc.vehiclePlate?.trim() || "—"}
        </p>
        <div className="shrink-0 text-right sm:max-w-[28%]">
          <p className="text-sm font-bold text-[#008000]">{formatJobPrice(jc.total, countryCode)}</p>
          <p className="text-sm font-semibold text-blue-700">{jc.date ?? "—"}</p>
        </div>
      </div>
    </article>
  );
}

export default function ShopJobCardsPage() {
  const { session } = useAuth();
  const { faqsHeading, faqsDescription } = useShopOwnerPortal();
  const [search, setSearch] = useState("");
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"list" | "form">("list");
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editJobCardId, setEditJobCardId] = useState<string | null>(null);
  const { cards, loading, error, refresh } = useShopJobCards(search);

  const totalPages = Math.max(1, Math.ceil(cards.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paginatedList = useMemo(
    () => cards.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [cards, safePage],
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const openJobCard = (jc: JobCardListRow) => {
    setFormMode("edit");
    setEditJobCardId(jc.id);
    setView("form");
  };

  const openNewJobCard = () => {
    setFormMode("add");
    setEditJobCardId(null);
    setView("form");
  };

  const showList = () => {
    setView("list");
    setEditJobCardId(null);
  };

  return (
    <ShopPageShell
      title="Job Cards"
      metaTitle="Job Cards | AutoDaddy"
      metaDescription="Auto shop job cards"
      searchPlaceholder="Search Customer"
      searchValue={search}
      onSearchChange={setSearch}
      sidebarExtra={
        <div className={shopSidebarButtonStackClass}>
          <ShopSidebarButton label="Job Card List" active={view === "list"} onClick={showList} />
          <ShopSidebarButton
            label="Create New Job Card"
            active={view === "form" && formMode === "add"}
            onClick={openNewJobCard}
          />
        </div>
      }
      onFaqsOpen={() => setFaqsOpen(true)}
      onFaqsClose={() => setFaqsOpen(false)}
      faqsOpen={faqsOpen}
      faqsHeading={faqsHeading}
      faqsDescription={faqsDescription}
    >
      <ShopViewTransition
        viewKey={view === "form" ? `form-${formMode}-${editJobCardId ?? "new"}` : "list"}
        className={shopHeroCardBodyClass}
        focusOnReveal={view === "form"}
      >
        {view === "form" ? (
          <JobCardForm
            active
            mode={formMode}
            jobCardId={editJobCardId}
            onCancel={showList}
            onSaved={() => void refresh()}
          />
        ) : (
          <>
            {loading ? (
              <ShopLoadingPanel variant="split-row" count={5} />
            ) : error ? (
              <ShopErrorPanel message={error} onRetry={() => void refresh()} />
            ) : cards.length === 0 ? (
              <ShopEmptyPanel message="No job cards yet." />
            ) : (
              <>
                <ShopListPanel>
                  {paginatedList.map((jc) => (
                    <JobCardRow
                      key={jc.id}
                      jc={jc}
                      countryCode={session?.meta?.countryCode}
                      onSelect={() => openJobCard(jc)}
                    />
                  ))}
                </ShopListPanel>

                <ShopListFooter>
                  <p>{cards.length} Entries</p>
                  {totalPages > 1 ? (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => {
                        const isActive = pageNumber === safePage;
                        return (
                          <button
                            key={pageNumber}
                            type="button"
                            onClick={() => setPage(pageNumber)}
                            className={`flex h-8 min-w-8 items-center justify-center rounded-sm px-2 text-sm font-bold ${isActive
                                ? "bg-[#008000] text-white"
                                : "border border-[#008000] bg-white text-[#008000] hover:bg-[#d4ffd4]"
                              }`}
                            aria-current={isActive ? "page" : undefined}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </ShopListFooter>
              </>
            )}
          </>
        )}
      </ShopViewTransition>
    </ShopPageShell>
  );
}
