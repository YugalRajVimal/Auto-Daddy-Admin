import { useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { PortalPageContent } from "../../components/admin/PortalPageContent";
import OwnerFaqsDialog from "../../components/owner/OwnerFaqsDialog";
import { useAuth } from "../../auth";
import { useCarOwnerDashboard } from "../../hooks/useOwnerPortal";
import { useCarOwnerDeals } from "../../hooks/useCarOwnerDeals";
import {
  dealDiscountPercent,
  dealTitle,
  isDealActive,
  matchesDealCategory,
  type DealCategory,
} from "../../lib/carOwnerDeals";
import { formatCurrencyAmount } from "../../lib/currency";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";
import type { CarOwnerDeal } from "../../types/carOwnerDeals";

const CATEGORIES: { id: DealCategory; label: string }[] = [
  { id: "service", label: "Service Deals" },
  { id: "parts", label: "Parts Deal" },
  { id: "tire", label: "Tire Deals" },
  { id: "salvage", label: "Salvages" },
];

function formatValidDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function CategoryButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-md px-4 py-3 text-left text-sm font-bold transition-colors ${
        active
          ? "bg-[#006600] text-white shadow-sm"
          : "bg-[#008000] text-white hover:bg-[#006600]"
      }`}
    >
      {label}
    </button>
  );
}

function DealDetailPanel({
  deal,
  countryCode,
}: {
  deal: CarOwnerDeal | null;
  countryCode?: string;
}) {
  if (!deal) {
    return (
      <div className="flex min-h-[420px] flex-1 items-center justify-center rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-500">
        Select a category to view deals.
      </div>
    );
  }

  const imageUri = normalizeMediaUrl(deal.imagePath);
  const discount = dealDiscountPercent(deal);
  const active = isDealActive(deal);

  return (
    <div className="flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
      <div className="bg-[#FDE4D0] px-4 py-3">
        <p className="text-sm font-bold text-ad-purple">Offered By</p>
        <p className="text-base font-semibold text-gray-800">
          {deal.createdBy.businessName}
          {deal.createdBy.city ? ` · ${deal.createdBy.city}` : ""}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-4 bg-[#CCFFCC] p-4 md:p-6">
        {imageUri ? (
          <img
            src={imageUri}
            alt=""
            className="mx-auto max-h-56 w-full max-w-xl rounded-md object-cover shadow-sm"
          />
        ) : null}

        <div className="mx-auto w-full max-w-xl rounded-md bg-white/80 p-4 text-center shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">{dealTitle(deal)}</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">
            {deal.description?.trim() || "No description provided."}
          </p>
          {!active ? (
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-red-600">Offer ended</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 border-t border-gray-200 bg-white p-3 sm:grid-cols-3">
        <div className="rounded-md bg-ad-purple px-3 py-2 text-center text-sm font-bold text-white">
          Valid : {formatValidDate(deal.offerEndsOnDate)}
        </div>
        <div className="rounded-md bg-[#f472b6] px-3 py-2 text-center text-sm font-bold text-white">
          Estimated- {formatCurrencyAmount(deal.discountedPrice, countryCode)}
        </div>
        <div className="rounded-md bg-[#008000] px-3 py-2 text-center text-sm font-bold text-white">
          Discount{discount != null ? `-${discount}%` : " —"}
        </div>
      </div>
    </div>
  );
}

export default function OwnerDealsPage() {
  const { session } = useAuth();
  const countryCode = session?.meta?.countryCode;
  const { deals, loading, error, refresh } = useCarOwnerDeals();
  const { faqsHeading, faqsDescription } = useCarOwnerDashboard();

  const [category, setCategory] = useState<DealCategory>("service");
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [faqsOpen, setFaqsOpen] = useState(false);

  const filteredDeals = useMemo(
    () => deals.filter((d) => matchesDealCategory(d, category)),
    [deals, category]
  );

  useEffect(() => {
    if (filteredDeals.length === 0) {
      setSelectedDealId(null);
      return;
    }
    if (!selectedDealId || !filteredDeals.some((d) => d._id === selectedDealId)) {
      setSelectedDealId(filteredDeals[0]._id);
    }
  }, [filteredDeals, selectedDealId]);

  const selectedDeal = filteredDeals.find((d) => d._id === selectedDealId) ?? null;

  return (
    <PortalPageContent className="flex flex-col px-3 py-3 sm:px-4 md:py-4 lg:px-6">
      <PageMeta title="Deals | AutoDaddy" description="Car owner deals" />

      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="text-base font-bold text-blue-700">Deals</h1>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-ad-purple hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-stretch">
        <aside className="flex w-full shrink-0 flex-col gap-2 lg:w-[220px] xl:w-[240px]">
          {CATEGORIES.map((item) => (
            <CategoryButton
              key={item.id}
              label={item.label}
              active={category === item.id}
              onClick={() => {
                setCategory(item.id);
                setSelectedDealId(null);
              }}
            />
          ))}

          {filteredDeals.length > 1 ? (
            <div className="mt-2 flex flex-col gap-1.5">
              <p className="text-xs font-semibold text-gray-600">In this category</p>
              {filteredDeals.map((deal) => (
                <button
                  key={deal._id}
                  type="button"
                  onClick={() => setSelectedDealId(deal._id)}
                  className={`rounded-md px-3 py-2 text-left text-xs font-semibold transition-colors ${
                    selectedDealId === deal._id
                      ? "bg-white text-ad-purple ring-2 ring-ad-purple"
                      : "bg-white/80 text-gray-700 hover:bg-white"
                  }`}
                >
                  {dealTitle(deal)}
                </button>
              ))}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setFaqsOpen(true)}
            className="mt-auto rounded-md bg-ad-purple px-4 py-3 text-sm font-bold text-white hover:bg-ad-purple-dark"
          >
            FAQs
          </button>
        </aside>

        <div className="flex min-h-[420px] flex-1 flex-col">
          {loading ? (
            <div className="flex flex-1 items-center justify-center rounded-md border border-gray-200 bg-white">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
            </div>
          ) : error ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-md border border-gray-200 bg-white p-6 text-center">
              <p className="text-sm font-semibold text-gray-800">{error}</p>
              <button
                type="button"
                onClick={() => void refresh()}
                className="rounded-md bg-ad-purple px-4 py-2 text-sm font-semibold text-white"
              >
                Try again
              </button>
            </div>
          ) : filteredDeals.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-md border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
              No deals in this category right now.
            </div>
          ) : (
            <DealDetailPanel deal={selectedDeal} countryCode={countryCode} />
          )}
        </div>
      </div>

      <OwnerFaqsDialog
        open={faqsOpen}
        onClose={() => setFaqsOpen(false)}
        heading={faqsHeading}
        description={faqsDescription}
      />
    </PortalPageContent>
  );
}
