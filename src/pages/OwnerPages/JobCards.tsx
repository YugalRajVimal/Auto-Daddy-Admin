import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { PortalPageContent } from "../../components/admin/PortalPageContent";
import OwnerFaqsDialog from "../../components/owner/OwnerFaqsDialog";
import OwnerJobCardRow from "../../components/owner/OwnerJobCardRow";
import OwnerVehicleSidebar from "../../components/owner/OwnerVehicleSidebar";
import { useAuth } from "../../auth";
import { useCarOwnerDashboard } from "../../hooks/useOwnerPortal";
import { useCarOwnerJobCards } from "../../hooks/useCarOwnerJobCards";
import { useCarOwnerVehicles } from "../../hooks/useCarOwnerVehicles";

export default function OwnerJobCardsPage() {
  const { session } = useAuth();
  const countryCode = session?.meta?.countryCode;
  const { faqsHeading, faqsDescription } = useCarOwnerDashboard();
  const { vehicles, loading: vehiclesLoading, refresh: refreshVehicles } = useCarOwnerVehicles();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const { items, loading, error, refresh } = useCarOwnerJobCards(selectedVehicleId);
  const [faqsOpen, setFaqsOpen] = useState(false);

  useEffect(() => {
    if (vehicles.length === 0) {
      setSelectedVehicleId(null);
      return;
    }
    if (selectedVehicleId && !vehicles.some((v) => v.id === selectedVehicleId)) {
      setSelectedVehicleId(vehicles[0]?.id ?? null);
    }
  }, [vehicles, selectedVehicleId]);

  const handleRefresh = () => {
    void refreshVehicles();
    void refresh();
  };

  return (
    <PortalPageContent className="flex flex-col px-3 py-3 sm:px-4 md:py-4 lg:px-6">
      <PageMeta title="Job Cards | AutoDaddy" description="Car owner job cards" />

      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="text-base font-bold text-blue-700">Job Cards</h1>
        <button
          type="button"
          onClick={handleRefresh}
          className="rounded border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-ad-purple hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-stretch">
        <OwnerVehicleSidebar
          vehicles={vehicles}
          selectedVehicleId={selectedVehicleId}
          loading={vehiclesLoading}
          onSelect={setSelectedVehicleId}
          onFaqsClick={() => setFaqsOpen(true)}
        />

        <div className="flex min-h-[420px] flex-1 flex-col">
          {loading || vehiclesLoading ? (
            <div className="flex flex-1 items-center justify-center rounded-md border border-gray-200 bg-white">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
            </div>
          ) : error ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-md border border-gray-200 bg-white p-6 text-center">
              <p className="text-sm font-semibold text-gray-800">{error}</p>
              <button
                type="button"
                onClick={handleRefresh}
                className="rounded-md bg-ad-purple px-4 py-2 text-sm font-semibold text-white"
              >
                Try again
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-md border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
              {selectedVehicleId ? "No job cards for this vehicle yet." : "No job cards yet."}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((jc) => (
                <OwnerJobCardRow key={jc._id} jc={jc} countryCode={countryCode} />
              ))}
            </div>
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
