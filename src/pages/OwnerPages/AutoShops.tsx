import { Link } from "react-router";
import { useCallback, useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiHeart, FiPlus } from "react-icons/fi";
import OwnerPageShell, { OwnerPageSidebar } from "../../components/owner/OwnerPageShell";
import OwnerVehiclePlateSidebar from "../../components/owner/OwnerVehiclePlateSidebar";
import OwnerShopExpandedPanel from "../../components/owner/OwnerShopExpandedPanel";
import { useCarOwnerAutoShops } from "../../hooks/useCarOwnerAutoShops";
import { useCarOwnerServiceSidebar } from "../../hooks/useOwnerPortal";
import { useCarOwnerVehicles } from "../../hooks/useCarOwnerVehicles";
import { useOwnerNavReset, useOwnerSidebarDefault } from "../../hooks/useOwnerNavReset";
import { isCarOwnerShopOpenToday } from "../../lib/carOwnerAutoShops";

const SELECT_VEHICLE_PROMPT = "Select a vehicle from the sidebar to find matching auto shops.";

export default function OwnerAutoShopsPage() {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedServiceIndex, setSelectedServiceIndex] = useState(0);
  const [expandedShopId, setExpandedShopId] = useState<string | null>(null);

  const { indoor, outdoor, loading: servicesLoading } = useCarOwnerServiceSidebar();
  const allServices = useMemo(() => [...indoor, ...outdoor], [indoor, outdoor]);
  const safeServiceIndex = allServices.length === 0 ? 0 : Math.min(selectedServiceIndex, allServices.length - 1);
  const selectedService = allServices[safeServiceIndex] ?? null;

  const shopFilters = useMemo(
    () => ({
      serviceIds: selectedService?.id ? [selectedService.id] : ([] as string[]),
      shopType: "autoShops" as const,
    }),
    [selectedService?.id]
  );

  const { shops, loading, error, refresh } = useCarOwnerAutoShops(shopFilters);
  const { vehicles, loading: vehiclesLoading, error: vehiclesError } = useCarOwnerVehicles();

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) ?? null;
  const expandedShop = shops.find((s) => s.id === expandedShopId) ?? null;

  const vehicleMakeLabel = useMemo(() => {
    const make = selectedVehicle?.make?.name?.trim();
    if (make) return make;
    const plate = selectedVehicle?.licensePlateNo?.trim().toUpperCase();
    if (plate) return plate;
    return "Your vehicle";
  }, [selectedVehicle]);

  const showShopList = Boolean(selectedVehicleId);

  const handleVehicleSelect = useCallback((vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setExpandedShopId(null);
  }, []);

  const resetSidebar = useCallback(() => {
    setSelectedVehicleId(vehicles[0]?.id ?? null);
    setExpandedShopId(null);
  }, [vehicles]);

  useOwnerSidebarDefault(!vehiclesLoading, resetSidebar);
  useOwnerNavReset(resetSidebar);

  const pageHeading = selectedVehicleId
    ? `Auto Repair Shop - ${vehicleMakeLabel}`
    : "Auto Repair Shops";

  return (
    <OwnerPageShell
      pageHeading={pageHeading}
      metaTitle="Auto Shops | AutoDaddy"
      metaDescription="Find auto shops near you"
      customSidebar={
        <OwnerPageSidebar>
          <OwnerVehiclePlateSidebar
            vehicles={vehicles}
            loading={vehiclesLoading}
            selectedVehicleId={selectedVehicleId}
            onSelect={handleVehicleSelect}
          />
        </OwnerPageSidebar>
      }
      heroCardFlush
      contentTopOffset
    >
      <div className="flex min-h-[320px] flex-col">
        <div className="mb-3 overflow-hidden rounded-md border border-ad-purple/30 bg-white">
          <div className="bg-ad-purple px-4 py-2 text-center font-bold text-white">
            Auto Mechanics Near by
          </div>
          <div className="flex items-center justify-center gap-3 bg-gray-100 px-4 py-2">
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded bg-gray-600 text-white disabled:opacity-40"
              onClick={() => setSelectedServiceIndex((i) => Math.max(0, i - 1))}
              disabled={servicesLoading || allServices.length === 0 || safeServiceIndex === 0}
              aria-label="Previous service"
            >
              <FiChevronLeft />
            </button>
            <div className="min-w-[220px] rounded bg-gray-200 px-4 py-1.5 text-center font-semibold text-gray-800">
              {selectedService?.name ?? "Select a service"}
            </div>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded bg-gray-600 text-white disabled:opacity-40"
              onClick={() => setSelectedServiceIndex((i) => Math.min(allServices.length - 1, i + 1))}
              disabled={
                servicesLoading ||
                allServices.length === 0 ||
                safeServiceIndex >= Math.max(0, allServices.length - 1)
              }
              aria-label="Next service"
            >
              <FiChevronRight />
            </button>
          </div>
        </div>

        {vehiclesLoading ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
          </div>
        ) : vehiclesError ? (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-red-600">
            {vehiclesError}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-sm text-gray-600">
            <p>Add a vehicle before finding auto shops.</p>
            <Link
              to="/owner/profile/vehicles"
              className="rounded-lg bg-ad-purple px-4 py-2 text-sm font-bold text-white hover:bg-ad-purple-dark"
            >
              Add vehicle
            </Link>
          </div>
        ) : !selectedVehicleId ? (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-gray-600">
            {SELECT_VEHICLE_PROMPT}
          </div>
        ) : !showShopList ? null : loading ? (
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
        ) : shops.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-gray-600">
            No auto repair shops found in your area yet.
          </div>
        ) : expandedShop ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-ad-purple/20 bg-white/60">
            <div className="p-3">
              <OwnerShopExpandedPanel
                shop={expandedShop}
                connectingServiceKey={null}
                sentServiceKeys={{}}
                statusMessage={null}
                onCollapse={() => setExpandedShopId(null)}
                onConnect={() => {
                  // Auto Shops page is browse-first; connect flow lives in dashboard.
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-y-auto gap-2">
            {shops.map((shop) => {
              const open = isCarOwnerShopOpenToday(shop);
              const phone = shop.phone.trim();
              return (
                <button
                  key={shop.id}
                  type="button"
                  onClick={() => setExpandedShopId(shop.id)}
                  className="flex w-full items-center gap-3 border border-[#7fbf7f] bg-[#ccffcc] px-3 py-2 text-left hover:bg-[#bdf7bd]"
                >
                  <div className="h-9 w-16 border border-[#7fbf7f] bg-white" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-gray-900">{shop.name}</div>
                    <div className="text-xs font-semibold text-blue-700">{phone || "—"}</div>
                  </div>
                  <div className="min-w-[120px]">
                    <span className="inline-flex w-full items-center justify-center rounded bg-[#008000] px-3 py-1 text-xs font-bold text-white">
                      {open ? "Shop is Open" : "Closed"}
                    </span>
                  </div>
                  <div className="flex w-10 justify-center">
                    {open ? (
                      <FiHeart className="text-red-500" size={22} aria-hidden />
                    ) : (
                      <FiPlus className="text-ad-purple" size={22} aria-hidden />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </OwnerPageShell>
  );
}
