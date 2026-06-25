import { useMemo, useState } from "react";
import PortalSidebarButton from "../../components/admin/PortalSidebarButton";
import OwnerDealFilters from "../../components/owner/OwnerDealFilters";
import OwnerDealRow from "../../components/owner/OwnerDealRow";
import OwnerPageShell, {
  OwnerPageSidebar,
  ownerPageLayoutClass,
  ownerPageMainClass,
} from "../../components/owner/OwnerPageShell";
import { useAuth } from "../../auth";
import { useCarOwnerDashboard } from "../../hooks/useOwnerPortal";
import { useCarOwnerDeals } from "../../hooks/useCarOwnerDeals";
import { useCarOwnerVehicles } from "../../hooks/useCarOwnerVehicles";
import {
  EMPTY_DEAL_LIST_FILTERS,
  matchesDealCategory,
  matchesDealListFilters,
  type DealCategory,
  type DealListFilters,
} from "../../lib/carOwnerDeals";
import type { CarOwnerDeal } from "../../types/carOwnerDeals";
import type { CarOwnerVehicle } from "../../lib/carOwnerVehicles";

const CATEGORIES: { id: DealCategory; label: string }[] = [
  { id: "service", label: "Service Deals" },
  { id: "tire", label: "Tires and Alloy wheels" },
  { id: "parts", label: "Spare Part Deal" },
  { id: "salvage", label: "Salvages" },
];


function dealRowVehicleLabel(deal: CarOwnerDeal, index: number, vehicles: CarOwnerVehicle[]): string {
  if ("selectedVehicle" in deal && deal.selectedVehicle) {
    const sv = deal.selectedVehicle;
    const vehicleIdx = vehicles.findIndex((v) => v.id === sv.id);
    if (vehicleIdx >= 0) return `Vehicle -${vehicleIdx + 1}`;

    const parts = [sv.name?.trim(), sv.model?.trim()].filter(Boolean);
    if (parts.length) return parts.join(" ");
    return `Vehicle -${index + 1}`;
  }

  if (vehicles.length > 0) {
    return `Vehicle -${(index % vehicles.length) + 1}`;
  }

  return `Vehicle -${index + 1}`;
}

export default function OwnerDealsPage() {
  const { session } = useAuth();
  const countryCode = session?.meta?.countryCode;
  const { deals, loading, error, refresh } = useCarOwnerDeals();
  const { vehicles } = useCarOwnerVehicles();
  const { faqsHeading, faqsDescription } = useCarOwnerDashboard();

  const [category, setCategory] = useState<DealCategory>("service");
  const [listFilters, setListFilters] = useState<DealListFilters>(EMPTY_DEAL_LIST_FILTERS);
  const [faqsOpen, setFaqsOpen] = useState(false);

  const categoryDeals = useMemo(
    () => deals.filter((d) => matchesDealCategory(d, category)),
    [deals, category]
  );

  const filteredDeals = useMemo(
    () => categoryDeals.filter((d) => matchesDealListFilters(d, listFilters)),
    [categoryDeals, listFilters]
  );

  return (
    <OwnerPageShell
      title="Current Deals"
      headerClassName="flex-nowrap gap-2 overflow-x-auto sm:gap-3"
      metaTitle="Deals | AutoDaddy"
      metaDescription="Car owner deals"
      headerAction={
        !loading && !error ? (
          <OwnerDealFilters deals={categoryDeals} filters={listFilters} onChange={setListFilters} />
        ) : null
      }
      faqsOpen={faqsOpen}
      onFaqsClose={() => setFaqsOpen(false)}
      faqsHeading={faqsHeading}
      faqsDescription={faqsDescription}
    >
      <div className={ownerPageLayoutClass}>
        <OwnerPageSidebar onFaqsClick={() => setFaqsOpen(true)}>
          {CATEGORIES.map((item) => (
            <PortalSidebarButton
              key={item.id}
              label={item.label}
              active={category === item.id}
              onClick={() => {
                setCategory(item.id);
                setListFilters(EMPTY_DEAL_LIST_FILTERS);
              }}
            />
          ))}
        </OwnerPageSidebar>

        <div className={`flex min-h-[420px] flex-col overflow-y-auto px-1 pb-2 ${ownerPageMainClass}`}>
          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
            </div>
          ) : error ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
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
            <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-gray-600">
              {categoryDeals.length === 0
                ? "No deals in this category right now."
                : "No deals match the selected filters."}
            </div>
          ) : (
            filteredDeals.map((deal, index) => (
              <OwnerDealRow
                key={deal._id}
                deal={deal}
                vehicleLabel={dealRowVehicleLabel(deal, index, vehicles)}
                countryCode={countryCode}
              />
            ))
          )}
        </div>
      </div>
    </OwnerPageShell>
  );
}
