import { Link } from "react-router";
import { useCallback, useMemo, useState } from "react";
import DashboardPanelCard from "../../components/COMP";
import OwnerPageShell, { OwnerPageSidebar } from "../../components/owner/OwnerPageShell";
import { OwnerAutoShopsTable } from "../../components/owner/OwnerPanelTables";
import {
  OwnerCollapsibleSidebarItem,
  OwnerCollapsibleSidebarList,
} from "../../components/owner/OwnerCollapsibleSidebar";
import OwnerShopExpandedPanel, { ownerShopServiceRequestKey } from "../../components/owner/OwnerShopExpandedPanel";
import OwnerVehiclePlateSidebar from "../../components/owner/OwnerVehiclePlateSidebar";
import { postJson } from "../../api/mobileAuth";
import { useAuth } from "../../auth";
import { useCarOwnerAutoShops } from "../../hooks/useCarOwnerAutoShops";
import { useCarOwnerVehicles } from "../../hooks/useCarOwnerVehicles";
import { useOwnerNavReset, useOwnerSidebarDefault } from "../../hooks/useOwnerNavReset";
import { isCarOwnerShopOpenToday } from "../../lib/carOwnerAutoShops";

const SELECT_VEHICLE_PROMPT = "Select a vehicle from the sidebar to find matching auto shops.";

export default function OwnerAutoShopsPage() {
  const { token } = useAuth();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [vehiclesExpanded, setVehiclesExpanded] = useState(true);
  const [expandedShopId, setExpandedShopId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [connectingServiceKey, setConnectingServiceKey] = useState<string | null>(null);
  const [sentServiceKeys, setSentServiceKeys] = useState<Record<string, boolean>>({});

  const shopFilters = useMemo(
    () => ({
      serviceIds: [] as string[],
      shopType: "autoShops" as const,
    }),
    []
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
    setStatusMessage(null);
    setSentServiceKeys({});
  }, []);

  const resetSidebar = useCallback(() => {
    setExpandedShopId(null);
    setStatusMessage(null);
    setSentServiceKeys({});
    setConnectingServiceKey(null);
    setVehiclesExpanded(true);
    setSelectedVehicleId(vehicles[0]?.id ?? null);
  }, [vehicles]);

  useOwnerSidebarDefault(!vehiclesLoading, resetSidebar);
  useOwnerNavReset(resetSidebar);

  const handleExpandShop = useCallback((shopId: string) => {
    setExpandedShopId(shopId);
    setStatusMessage(null);
  }, []);

  const handleCollapseShop = useCallback(() => {
    setExpandedShopId(null);
    setStatusMessage(null);
  }, []);

  const handleConnect = useCallback(
    async (serviceId: string, serviceName: string) => {
      setStatusMessage(null);

      if (!selectedVehicleId) {
        setStatusMessage("Select a vehicle from the sidebar first.");
        return;
      }
      if (!expandedShopId) {
        setStatusMessage("Select a shop from the list.");
        return;
      }
      if (!token) {
        setStatusMessage("You are not signed in.");
        return;
      }

      const shop = shops.find((s) => s.id === expandedShopId);
      if (!shop) {
        setStatusMessage("Selected shop could not be found.");
        return;
      }

      if (!isCarOwnerShopOpenToday(shop)) {
        setStatusMessage("This shop is closed right now.");
        return;
      }

      const requestKey = ownerShopServiceRequestKey(expandedShopId, serviceId, serviceName);
      setConnectingServiceKey(requestKey);
      try {
        const res = await postJson<{ success?: boolean; message?: string }>(
          "/api/user/connect-autoshopowner",
          { businessId: expandedShopId, serviceId },
          token
        );
        if (!res.ok || res.data?.success === false) {
          setStatusMessage(res.data?.message ?? "Could not connect to this service.");
          return;
        }
        setSentServiceKeys((prev) => ({ ...prev, [requestKey]: true }));
        setStatusMessage(res.data?.message ?? `Request sent to ${shop.name}!`);
      } catch {
        setStatusMessage("Network error while connecting.");
      } finally {
        setConnectingServiceKey(null);
      }
    },
    [expandedShopId, selectedVehicleId, shops, token]
  );

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
          <OwnerCollapsibleSidebarList>
            <OwnerCollapsibleSidebarItem
              label="Your Vehicles"
              expanded={vehiclesExpanded}
              active={Boolean(selectedVehicleId)}
              onToggle={() => {
                setVehiclesExpanded((open) => {
                  const next = !open;
                  if (next && vehicles[0]) {
                    handleVehicleSelect(vehicles[0].id);
                  }
                  return next;
                });
              }}
            >
              <OwnerVehiclePlateSidebar
                vehicles={vehicles}
                loading={vehiclesLoading}
                selectedVehicleId={selectedVehicleId}
                onSelect={handleVehicleSelect}
              />
            </OwnerCollapsibleSidebarItem>
          </OwnerCollapsibleSidebarList>
        </OwnerPageSidebar>
      }
      heroCardFlush
      contentTopOffset
    >
      <div className="flex min-h-[320px] flex-col">
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
              to="/owner/vehicles"
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
        ) : (
          <div className="flex flex-1 flex-col overflow-y-auto">
            {expandedShop ? (
              <DashboardPanelCard variant="form" className="mb-0 flex min-h-0 flex-1 flex-col">
                <OwnerShopExpandedPanel
                  shop={expandedShop}
                  connectingServiceKey={connectingServiceKey}
                  sentServiceKeys={sentServiceKeys}
                  statusMessage={statusMessage}
                  onCollapse={handleCollapseShop}
                  onConnect={(serviceId, serviceName) => void handleConnect(serviceId, serviceName)}
                />
              </DashboardPanelCard>
            ) : (
              <OwnerAutoShopsTable shops={shops} onRowClick={(shop) => handleExpandShop(shop.id)} />
            )}
          </div>
        )}
      </div>
    </OwnerPageShell>
  );
}
