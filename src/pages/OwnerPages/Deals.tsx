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
  dealsForCategory,
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

function DealSection({
  title,
  deals,
  vehicles,
  countryCode,
  startIndex,
}: {
  title: string;
  deals: CarOwnerDeal[];
  vehicles: CarOwnerVehicle[];
  countryCode?: string;
  startIndex: number;
}) {
  if (deals.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="px-1 text-xs font-bold uppercase tracking-wide text-gray-500">{title}</h2>
      {deals.map((deal, index) => (
        <OwnerDealRow
          key={deal._id}
          deal={deal}
          vehicleLabel={dealRowVehicleLabel(deal, startIndex + index, vehicles)}
          countryCode={countryCode}
        />
      ))}
    </section>
  );
}

export default function OwnerDealsPage() {
  const { session } = useAuth();
  const countryCode = session?.meta?.countryCode;
  const [category, setCategory] = useState<DealCategory>(CATEGORIES[0].id);
  const [listFilters, setListFilters] = useState<DealListFilters>(EMPTY_DEAL_LIST_FILTERS);

  const { grouped, apiFilters, loading, error, refresh } = useCarOwnerDeals({
    make: listFilters.make,
    model: listFilters.model,
  });
  const { vehicles } = useCarOwnerVehicles();

  const resetSidebar = useCallback(() => {
    setCategory(CATEGORIES[0].id);
    setListFilters(EMPTY_DEAL_LIST_FILTERS);
  }, []);

  useOwnerNavReset(resetSidebar);

  const categoryBucket = useMemo(() => dealsForCategory(grouped, category), [grouped, category]);

  const categoryDeals = useMemo(
    () => [...categoryBucket.city, ...categoryBucket.others],
    [categoryBucket]
  );

  // make/model are applied via API query params; only city is filtered client-side
  const cityOnlyFilters = useMemo(
    () => ({ make: "", model: "", city: listFilters.city }),
    [listFilters.city]
  );

  const filteredCity = useMemo(
    () => categoryBucket.city.filter((d) => matchesDealListFilters(d, cityOnlyFilters)),
    [categoryBucket.city, cityOnlyFilters]
  );

  const filteredOthers = useMemo(
    () => categoryBucket.others.filter((d) => matchesDealListFilters(d, cityOnlyFilters)),
    [categoryBucket.others, cityOnlyFilters]
  );

  const filteredTotal = filteredCity.length + filteredOthers.length;

  return (
    <OwnerPageShell
      pageHeading={CATEGORY_HEADINGS[category]}
      metaTitle="Deals | AutoDaddy"
      metaDescription="Car owner deals"
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
      <div className="flex flex-col gap-4 overflow-y-auto px-1 pb-2">
        {!loading && !error ? (
          <OwnerDealFilters
            deals={categoryDeals}
            filters={listFilters}
            onChange={setListFilters}
            apiFilters={apiFilters}
          />
        ) : null}
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
        ) : filteredTotal === 0 ? (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-gray-600">
            {categoryDeals.length === 0
              ? "No deals in this category right now."
              : "No deals match the selected filters."}
          </div>
        ) : (
          <>
            <DealSection
              title="In your city"
              deals={filteredCity}
              vehicles={vehicles}
              countryCode={countryCode}
              startIndex={0}
            />
            <DealSection
              title="Other cities"
              deals={filteredOthers}
              vehicles={vehicles}
              countryCode={countryCode}
              startIndex={filteredCity.length}
            />
          </>
        )}
      </div>
    </OwnerPageShell>
  );
}
