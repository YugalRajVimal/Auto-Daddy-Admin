import { useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { PortalPageContent } from "../../components/admin/PortalPageContent";
import PortalSidebarButton from "../../components/admin/PortalSidebarButton";
import OwnerDealRow from "../../components/owner/OwnerDealRow";
import OwnerFaqsDialog from "../../components/owner/OwnerFaqsDialog";
import { OwnerSidebarFaqsSlot } from "../../components/owner/OwnerFaqsButton";
import { useAuth } from "../../auth";
import { useCarOwnerDashboard } from "../../hooks/useOwnerPortal";
import { useCarOwnerDeals } from "../../hooks/useCarOwnerDeals";
import { useCarOwnerVehicles } from "../../hooks/useCarOwnerVehicles";
import { matchesDealCategory, type DealCategory } from "../../lib/carOwnerDeals";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";
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

function DealExpandedPanel({ deal }: { deal: CarOwnerDeal }) {
  const imageUri = normalizeMediaUrl(deal.imagePath);

  return (
    <div className="mb-3 overflow-hidden rounded-r-2xl rounded-l-md border border-ad-green-dark/20 bg-white shadow-sm">
      {imageUri ? (
        <img src={imageUri} alt="" className="mx-auto max-h-48 w-full object-cover" />
      ) : null}
      <div className="space-y-1 px-4 py-3">
        <p className="text-sm font-bold text-gray-900">
          {deal.createdBy.businessName}
          {deal.createdBy.city ? ` · ${deal.createdBy.city}` : ""}
        </p>
        <p className="text-sm text-gray-700">{deal.description?.trim() || "No description provided."}</p>
      </div>
    </div>
  );
}

export default function OwnerDealsPage() {
  const { session } = useAuth();
  const countryCode = session?.meta?.countryCode;
  const { deals, loading, error, refresh } = useCarOwnerDeals();
  const { vehicles } = useCarOwnerVehicles();
  const { faqsHeading, faqsDescription } = useCarOwnerDashboard();

  const [category, setCategory] = useState<DealCategory>("service");
  const [expandedDealId, setExpandedDealId] = useState<string | null>(null);
  const [faqsOpen, setFaqsOpen] = useState(false);

  const filteredDeals = useMemo(
    () => deals.filter((d) => matchesDealCategory(d, category)),
    [deals, category]
  );

  return (
    <PortalPageContent className="flex flex-col px-3 py-3 sm:px-4 md:py-4 lg:px-6">
      <PageMeta title="Deals | AutoDaddy" description="Car owner deals" />

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-stretch">
        <aside className="flex w-full shrink-0 flex-col gap-3 lg:w-[220px] xl:w-[260px] lg:min-h-[calc(100vh-220px)]">
          <h1 className="px-1 font-serif text-2xl font-semibold text-gray-400 sm:text-3xl">Current Deals</h1>

          {CATEGORIES.map((item) => (
            <PortalSidebarButton
              key={item.id}
              label={item.label}
              active={category === item.id}
              onClick={() => {
                setCategory(item.id);
                setExpandedDealId(null);
              }}
            />
          ))}

          <OwnerSidebarFaqsSlot onClick={() => setFaqsOpen(true)} />
        </aside>

        <div className="flex min-h-[420px] flex-1 flex-col overflow-y-auto px-1 pb-2">
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
              No deals in this category right now.
            </div>
          ) : (
            filteredDeals.map((deal, index) => (
              <div key={deal._id}>
                <OwnerDealRow
                  deal={deal}
                  vehicleLabel={dealRowVehicleLabel(deal, index, vehicles)}
                  countryCode={countryCode}
                  selected={expandedDealId === deal._id}
                  onClick={() => setExpandedDealId((cur) => (cur === deal._id ? null : deal._id))}
                />
                {expandedDealId === deal._id ? <DealExpandedPanel deal={deal} /> : null}
              </div>
            ))
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
