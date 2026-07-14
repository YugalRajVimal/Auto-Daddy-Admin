import { Link, useLocation } from "react-router";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiHeart,
  FiMapPin,
  FiTool,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { Skeleton } from "../../../components/common/Skeleton";
import OwnerPageShell, { OwnerPageSidebar } from "../../../components/owner/OwnerPageShell";
import OwnerVehiclePlateSidebar from "../../../components/owner/OwnerVehiclePlateSidebar";
import OwnerShopExpandedPanel from "../../../components/owner/OwnerShopExpandedPanel";
import { OwnerCustomerRequestsTable } from "../../../components/owner/OwnerPanelTables";
import { useCarOwnerAutoShops } from "../../../hooks/useCarOwnerAutoShops";
import { useCarOwnerCustomerRequests } from "../../../hooks/useCarOwnerCustomerRequests";
import { useCarOwnerFavoriteShops } from "../../../hooks/useCarOwnerFavoriteShops";
import { useCarOwnerServiceSidebar } from "../../../hooks/useOwnerPortal";
import { useCarOwnerVehicles } from "../../../hooks/useCarOwnerVehicles";
import { useOwnerNavReset, useOwnerSidebarDefault } from "../../../hooks/useOwnerNavReset";
import { isCarOwnerShopOpenToday } from "../../../lib/carOwnerAutoShops";
import { normalizeMediaUrl } from "../../../lib/normalizeMediaUrl";

const SELECT_VEHICLE_PROMPT = "Select a vehicle from the sidebar to find matching auto shops.";

type AutoShopsSection = "auto-shops" | "approvals";

function EmptyState({
  children,
  icon: Icon = FiMapPin,
}: {
  children: ReactNode;
  icon?: typeof FiMapPin;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ad-purple/20 bg-white/60 px-6 py-14 text-center shadow-sm backdrop-blur-sm">
      <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-ad-bg-purple text-ad-purple">
        <Icon size={22} aria-hidden />
      </span>
      <div className="max-w-sm text-sm text-slate-600">{children}</div>
    </div>
  );
}

export default function OwnerAutoShopsPage() {
  const location = useLocation();
  const section: AutoShopsSection =
    location.pathname.includes("/approvals") ? "approvals" : "auto-shops";
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedServiceIndex, setSelectedServiceIndex] = useState(0);
  const [expandedShopId, setExpandedShopId] = useState<string | null>(null);
  const [favoriteBusyId, setFavoriteBusyId] = useState<string | null>(null);

  const { indoor, outdoor, loading: servicesLoading } = useCarOwnerServiceSidebar();
  const allServices = useMemo(() => [...indoor, ...outdoor], [indoor, outdoor]);
  const safeServiceIndex =
    allServices.length === 0 ? 0 : Math.min(selectedServiceIndex, allServices.length - 1);
  const selectedService = allServices[safeServiceIndex] ?? null;

  const { vehicles, loading: vehiclesLoading, error: vehiclesError } = useCarOwnerVehicles();
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) ?? null;

  const shopFilters = useMemo(
    () => ({
      serviceIds: selectedService?.id ? [selectedService.id] : ([] as string[]),
      shopType: selectedService?.shopType ?? ("autoShop" as const),
      carCompanyIds: [] as string[],
    }),
    [selectedService?.id, selectedService?.shopType]
  );

  const { shops, loading, error, refresh } = useCarOwnerAutoShops(shopFilters);
  const { isFavorite, toggleFavorite } = useCarOwnerFavoriteShops();
  const {
    items: customerRequests,
    loading: requestsLoading,
    error: requestsError,
    actingId,
    refresh: refreshRequests,
    approve,
    reject,
  } = useCarOwnerCustomerRequests();

  const shopsWithFavorites = useMemo(
    () => shops.map((shop) => ({ ...shop, isFavorite: isFavorite(shop.id) })),
    [shops, isFavorite]
  );

  const expandedShop = shopsWithFavorites.find((s) => s.id === expandedShopId) ?? null;

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

  useOwnerSidebarDefault(!vehiclesLoading && vehicles.length > 0, resetSidebar);
  useOwnerNavReset(resetSidebar);

  const pageTitle =
    section === "approvals"
      ? "Approvals"
      : selectedVehicleId
        ? `Shops for ${vehicleMakeLabel}`
        : "Auto Repair Shops";

  const pageSubtitle =
    section === "approvals"
      ? "Review shops waiting to connect with you"
      : selectedService?.name
        ? `Nearby mechanics for ${selectedService.name}`
        : "Find mechanics near you by vehicle and service";

  const handleApprove = async (businessId: string) => {
    const result = await approve(businessId);
    if (result.ok) toast.success(result.message);
    else toast.error(result.message);
  };

  const handleReject = async (businessId: string) => {
    const result = await reject(businessId);
    if (result.ok) toast.success(result.message);
    else toast.error(result.message);
  };

  const handleToggleFavorite = async (shopId: string) => {
    setFavoriteBusyId(shopId);
    const result = await toggleFavorite(shopId);
    setFavoriteBusyId(null);
    if (!result.ok) {
      toast.error(result.error ?? "Could not update favorite.");
      return;
    }
    toast.success(result.isFavorite ? "Added to favorites." : "Removed from favorites.");
  };

  return (
    <OwnerPageShell
      pageHeading=""
      metaTitle="Auto Shops | AutoDaddy"
      metaDescription="Find auto shops near you"
      noPanel
      customSidebar={
        section === "auto-shops" ? (
          <OwnerPageSidebar>
            <OwnerVehiclePlateSidebar
              vehicles={vehicles}
              loading={vehiclesLoading}
              selectedVehicleId={selectedVehicleId}
              onSelect={handleVehicleSelect}
            />
          </OwnerPageSidebar>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-4">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm text-slate-500">{pageSubtitle}</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              {pageTitle}
            </h1>
          </div>
          {section === "auto-shops" &&
          !loading &&
          showShopList &&
          shopsWithFavorites.length > 0 &&
          !expandedShop ? (
            <p className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-black/5">
              {shopsWithFavorites.length} shop{shopsWithFavorites.length === 1 ? "" : "s"}
            </p>
          ) : null}
        </header>

        {section === "approvals" ? (
          <div className="flex min-h-[320px] flex-col gap-3">
            {requestsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full rounded-2xl" />
                <Skeleton className="h-48 w-full rounded-2xl" />
              </div>
            ) : requestsError ? (
              <EmptyState>
                <span className="mb-3 block font-semibold text-slate-800">{requestsError}</span>
                <button
                  type="button"
                  onClick={() => void refreshRequests()}
                  className="rounded-xl bg-ad-purple px-4 py-2 text-sm font-semibold text-white shadow-sm"
                >
                  Try again
                </button>
              </EmptyState>
            ) : customerRequests.length === 0 ? (
              <EmptyState>No shops are waiting for your approval right now.</EmptyState>
            ) : (
              <OwnerCustomerRequestsTable
                rows={customerRequests}
                actingId={actingId}
                onApprove={(id) => void handleApprove(id)}
                onReject={(id) => void handleReject(id)}
              />
            )}
          </div>
        ) : (
          <div className="flex min-h-[320px] flex-col gap-4">
            <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-black/5">
              <div className="bg-gradient-to-r from-ad-purple/95 to-ad-purple-dark px-4 py-3 text-center">
                <p className="text-sm font-bold tracking-wide text-white">Auto Mechanics Nearby</p>
              </div>
              <div className="flex items-center justify-center gap-3 bg-gradient-to-b from-slate-50/80 to-white px-4 py-3">
                <button
                  type="button"
                  className="flex size-8 items-center justify-center rounded-full bg-slate-600 text-white shadow-sm transition hover:bg-slate-700 disabled:opacity-40"
                  onClick={() => setSelectedServiceIndex((i) => Math.max(0, i - 1))}
                  disabled={servicesLoading || allServices.length === 0 || safeServiceIndex === 0}
                  aria-label="Previous service"
                >
                  <FiChevronLeft />
                </button>
                <div className="min-w-[220px] rounded-full bg-white px-5 py-2 text-center text-sm font-semibold text-slate-800 ring-1 ring-slate-200/80">
                  {selectedService?.name ?? "Select a service"}
                </div>
                <button
                  type="button"
                  className="flex size-8 items-center justify-center rounded-full bg-slate-600 text-white shadow-sm transition hover:bg-slate-700 disabled:opacity-40"
                  onClick={() =>
                    setSelectedServiceIndex((i) => Math.min(allServices.length - 1, i + 1))
                  }
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
              <div className="space-y-3">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl" />
              </div>
            ) : vehiclesError ? (
              <EmptyState>
                <span className="font-semibold text-rose-700">{vehiclesError}</span>
              </EmptyState>
            ) : vehicles.length === 0 ? (
              <EmptyState icon={FiTool}>
                <p className="mb-3">Add a vehicle before finding auto shops.</p>
                <Link
                  to="/owner/profile/vehicles"
                  className="inline-flex rounded-xl bg-gradient-to-br from-ad-purple to-ad-purple-dark px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-105"
                >
                  Add vehicle
                </Link>
              </EmptyState>
            ) : !selectedVehicleId ? (
              <EmptyState>{SELECT_VEHICLE_PROMPT}</EmptyState>
            ) : !showShopList ? null : loading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl" />
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
            ) : shopsWithFavorites.length === 0 ? (
              <EmptyState>No auto repair shops found in your area yet.</EmptyState>
            ) : expandedShop ? (
              <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-black/5 sm:p-5">
                <OwnerShopExpandedPanel
                  shop={expandedShop}
                  connectingServiceKey={null}
                  sentServiceKeys={{}}
                  statusMessage={null}
                  isFavorite={expandedShop.isFavorite}
                  favoriteBusy={favoriteBusyId === expandedShop.id}
                  onToggleFavorite={() => void handleToggleFavorite(expandedShop.id)}
                  onCollapse={() => setExpandedShopId(null)}
                  onConnect={() => {
                    // Auto Shops page is browse-first; connect flow lives in dashboard.
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {shopsWithFavorites.map((shop) => {
                  const open = isCarOwnerShopOpenToday(shop);
                  const phone = shop.phone.trim();
                  const logo = normalizeMediaUrl(shop.logoUrl);
                  const favoriteBusy = favoriteBusyId === shop.id;
                  return (
                    <button
                      key={shop.id}
                      type="button"
                      onClick={() => setExpandedShopId(shop.id)}
                      className="group flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-white/80 bg-white/95 px-3 py-3 text-left shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-black/5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(15,23,42,0.1)] hover:ring-sky-100 sm:px-4"
                    >
                      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 ring-1 ring-slate-200/70 sm:size-14">
                        {logo ? (
                          <img src={logo} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <FiTool className="text-slate-300" size={22} aria-hidden />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold tracking-tight text-slate-900">{shop.name}</p>
                        <p className="mt-0.5 truncate text-xs font-semibold text-sky-700 sm:text-sm">
                          {phone || "—"}
                        </p>
                        {shop.city ? (
                          <p className="mt-0.5 truncate text-xs text-slate-500">{shop.city}</p>
                        ) : null}
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold text-white ${
                          open ? "bg-emerald-600" : "bg-slate-400"
                        }`}
                      >
                        {open ? "Shop is Open" : "Closed"}
                      </span>

                      <span
                        role="button"
                        tabIndex={0}
                        aria-label={
                          shop.isFavorite ? "Remove from favorites" : "Add to favorites"
                        }
                        className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!favoriteBusy) void handleToggleFavorite(shop.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!favoriteBusy) void handleToggleFavorite(shop.id);
                          }
                        }}
                      >
                        <FiHeart
                          className={
                            shop.isFavorite ? "fill-rose-500 text-rose-500" : undefined
                          }
                          size={20}
                          aria-hidden
                        />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </OwnerPageShell>
  );
}
