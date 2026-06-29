import { useCallback, useMemo, useState } from "react";
import OwnerDealFilters from "../../components/owner/OwnerDealFilters";
import OwnerDealRow from "../../components/owner/OwnerDealRow";
import OwnerPageShell from "../../components/owner/OwnerPageShell";
import { useAuth } from "../../auth";
import { useOwnerNavReset } from "../../hooks/useOwnerNavReset";
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

const CATEGORY_HEADINGS: Record<DealCategory, string> = {
  service: "Service Deals",
  tire: "Tires and Alloy wheels",
  parts: "Spare Part Deal",
  salvage: "Salvages",
};

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

  const [category, setCategory] = useState<DealCategory>(CATEGORIES[0].id);
  const [listFilters, setListFilters] = useState<DealListFilters>(EMPTY_DEAL_LIST_FILTERS);

  const resetSidebar = useCallback(() => {
    setCategory(CATEGORIES[0].id);
    setListFilters(EMPTY_DEAL_LIST_FILTERS);
  }, []);

  useOwnerNavReset(resetSidebar);

  const categoryDeals = useMemo(
    () => deals.filter((d) => matchesDealCategory(d, category)),
    [deals, category],
  );

  const filteredDeals = useMemo(
    () => categoryDeals.filter((d) => matchesDealListFilters(d, listFilters)),
    [categoryDeals, listFilters],
  );

  return (
    <OwnerPageShell
      pageHeading={CATEGORY_HEADINGS[category]}
      metaTitle="Deals | AutoDaddy"
      metaDescription="Car owner deals"
      headerAction={
        !loading && !error ? (
          <OwnerDealFilters deals={categoryDeals} filters={listFilters} onChange={setListFilters} />
        ) : null
      }
      sidebarItems={CATEGORIES.map((item) => ({
        id: item.id,
        label: item.label,
        variant: "primary" as const,
      }))}
      activeSidebarId={category}
      onSidebarSelect={(id) => {
        setCategory(id as DealCategory);
        setListFilters(EMPTY_DEAL_LIST_FILTERS);
      }}
      heroCardFlush
      contentTopOffset
    >
      <div className="flex flex-col gap-3 overflow-y-auto px-1 pb-2">
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
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
    </OwnerPageShell>
  );
}
