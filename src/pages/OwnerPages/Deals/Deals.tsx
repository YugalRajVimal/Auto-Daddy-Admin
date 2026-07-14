import { useCallback, useMemo, useState, type ReactNode } from "react";
import { FiMapPin, FiTag } from "react-icons/fi";
import { useLocation } from "react-router";
import { Skeleton } from "../../../components/common/Skeleton";
import OwnerDealFilters from "../../../components/owner/OwnerDealFilters";
import OwnerDealRow from "../../../components/owner/OwnerDealRow";
import OwnerPageShell, { ownerPageIntroClass } from "../../../components/owner/OwnerPageShell";
import { useAuth } from "../../../auth";
import { useOwnerNavReset } from "../../../hooks/useOwnerNavReset";
import { useCarOwnerDeals } from "../../../hooks/useCarOwnerDeals";
import { useCarOwnerVehicles } from "../../../hooks/useCarOwnerVehicles";
import {
  EMPTY_DEAL_LIST_FILTERS,
  dealsForCategory,
  matchesDealListFilters,
  type DealCategory,
  type DealListFilters,
} from "../../../lib/carOwnerDeals";
import type { CarOwnerDeal } from "../../../types/carOwnerDeals";
import type { CarOwnerVehicle } from "../../../lib/carOwnerVehicles";

const CATEGORY_BY_PATH: Record<string, DealCategory> = {
  "/owner/deals": "parts",
  "/owner/deals/spare-parts": "parts",
  "/owner/deals/service": "service",
  "/owner/deals/salvage": "salvage",
  "/owner/deals/completed": "completed",
};

const CATEGORY_HEADINGS: Record<DealCategory, string> = {
  service: "Service Deals",
  tire: "Tires and Alloy wheels",
  parts: "Spare Parts Deals",
  salvage: "Salvage Deals",
  completed: "Completed Deals",
};

const CATEGORY_SUBTITLES: Record<DealCategory, string> = {
  service: "Active service offers from nearby shops",
  tire: "Tire and alloy wheel offers for your vehicle",
  parts: "Spare parts and accessory deals matched to you",
  salvage: "Salvage and recovery offers",
  completed: "Offers that have already ended",
};

function dealCategoryFromPath(pathname: string): DealCategory {
  return CATEGORY_BY_PATH[pathname] ?? "parts";
}

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

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ad-purple/20 bg-white/60 px-6 py-14 text-center shadow-sm backdrop-blur-sm">
      <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-ad-bg-purple text-ad-purple">
        <FiTag size={22} aria-hidden />
      </span>
      <div className="max-w-sm text-sm text-slate-600">{children}</div>
    </div>
  );
}

function DealSection({
  title,
  icon: Icon,
  deals,
  vehicles,
  countryCode,
  startIndex,
}: {
  title: string;
  icon: typeof FiMapPin;
  deals: CarOwnerDeal[];
  vehicles: CarOwnerVehicle[];
  countryCode?: string;
  startIndex: number;
}) {
  if (deals.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2 px-0.5">
        <span className="flex size-7 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
          <Icon size={14} aria-hidden />
        </span>
        <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">{title}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
          {deals.length}
        </span>
      </div>
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
  const location = useLocation();
  const category = dealCategoryFromPath(location.pathname);
  const [listFilters, setListFilters] = useState<DealListFilters>(EMPTY_DEAL_LIST_FILTERS);

  const { grouped, apiFilters, loading, error, refresh } = useCarOwnerDeals({
    make: listFilters.make,
    model: listFilters.model,
  });
  const { vehicles } = useCarOwnerVehicles();

  const resetSidebar = useCallback(() => {
    setListFilters(EMPTY_DEAL_LIST_FILTERS);
  }, []);

  useOwnerNavReset(resetSidebar);

  const categoryBucket = useMemo(() => dealsForCategory(grouped, category), [grouped, category]);

  const categoryDeals = useMemo(
    () => [...categoryBucket.city, ...categoryBucket.others],
    [categoryBucket]
  );

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
      pageHeading=""
      metaTitle="Deals | AutoDaddy"
      metaDescription="Car owner deals"
      noPanel
    >
      <div className="flex flex-col gap-4">
        <header className={`${ownerPageIntroClass} flex flex-wrap items-end justify-between gap-3`}>
          <div className="space-y-1">
            <p className="text-sm text-slate-500">{CATEGORY_SUBTITLES[category]}</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              {CATEGORY_HEADINGS[category]}
            </h1>
          </div>
          {!loading && !error && filteredTotal > 0 ? (
            <p className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-black/5">
              {filteredTotal} deal{filteredTotal === 1 ? "" : "s"}
            </p>
          ) : null}
        </header>

        {!loading && !error ? (
          <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)] ring-1 ring-black/5 sm:p-4">
            <OwnerDealFilters
              deals={categoryDeals}
              filters={listFilters}
              onChange={setListFilters}
              apiFilters={apiFilters}
            />
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-52 w-full rounded-2xl" />
            <Skeleton className="h-52 w-full rounded-2xl" />
          </div>
        ) : error ? (
          <EmptyState>
            <span className="mb-3 block font-semibold text-slate-800">{error}</span>
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-xl bg-ad-purple px-4 py-2 text-sm font-semibold text-white shadow-sm"
            >
              Try again
            </button>
          </EmptyState>
        ) : filteredTotal === 0 ? (
          <EmptyState>
            {categoryDeals.length === 0
              ? "No deals in this category right now."
              : "No deals match the selected filters."}
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-5">
            <DealSection
              title="In your city"
              icon={FiMapPin}
              deals={filteredCity}
              vehicles={vehicles}
              countryCode={countryCode}
              startIndex={0}
            />
            <DealSection
              title="Other cities"
              icon={FiTag}
              deals={filteredOthers}
              vehicles={vehicles}
              countryCode={countryCode}
              startIndex={filteredCity.length}
            />
          </div>
        )}
      </div>
    </OwnerPageShell>
  );
}
