import { Link, useLocation } from "react-router";
import { useCallback, useDeferredValue, useMemo, useState, type ReactNode } from "react";
import { FiHeart, FiMapPin, FiTool } from "react-icons/fi";
import { toast } from "react-toastify";
import { Skeleton } from "../../../components/common/Skeleton";
import OwnerPageShell, { OwnerPageSidebar } from "../../../components/owner/OwnerPageShell";
import OwnerShopFilters, {
  EMPTY_SHOP_LIST_FILTERS,
  mergeServiceCatalogWithShopOfferings,
  parseShopServiceValue,
  type OwnerShopListFilters,
} from "../../../components/owner/OwnerShopFilters";
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
import { getShopTypeLabel, getShopTypeLabels } from "../../../lib/shopTypes";
import { normalizeMediaUrl } from "../../../lib/normalizeMediaUrl";
import type { CarOwnerAutoShopListItem } from "../../../types/carOwnerAutoShops";

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

function uniqueSortedCities(shops: CarOwnerAutoShopListItem[]): string[] {
  const set = new Set<string>();
  for (const shop of shops) {
    const city = shop.city?.trim();
    if (city) set.add(city);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

function matchesShopSearch(shop: CarOwnerAutoShopListItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    shop.name,
    shop.city,
    shop.phone,
    shop.address,
    shop.shopType,
    ...(shop.shopTypes ?? []),
    getShopTypeLabels(shop.shopTypes?.length ? shop.shopTypes : shop.shopType),
    ...shop.mainServices,
    ...shop.subServices,
    ...shop.carCompanies,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function shopOffersService(
  shop: CarOwnerAutoShopListItem,
  serviceId: string,
): boolean {
  const id = serviceId.trim();
  if (!id) return true;
  if (shop.serviceOfferings?.some((o) => o.id === id)) return true;
  return shop.mainServiceItems.some((item) => item.id === id);
}

function shopOffersSubService(
  shop: CarOwnerAutoShopListItem,
  serviceId: string,
  subName: string,
): boolean {
  const needle = subName.trim().toLowerCase();
  if (!needle) return true;
  const offering = shop.serviceOfferings?.find((o) => o.id === serviceId);
  if (offering) {
    if (offering.subServices.length === 0) return false;
    return offering.subServices.some((s) => s.name.trim().toLowerCase() === needle);
  }
  return shop.subServices.some((name) => name.trim().toLowerCase() === needle);
}

export default function OwnerAutoShopsPage() {
  const location = useLocation();
  const section: AutoShopsSection =
    location.pathname.includes("/approvals") ? "approvals" : "auto-shops";
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [expandedShopId, setExpandedShopId] = useState<string | null>(null);
  const [favoriteBusyId, setFavoriteBusyId] = useState<string | null>(null);
  const [listFilters, setListFilters] = useState<OwnerShopListFilters>(EMPTY_SHOP_LIST_FILTERS);
  const deferredSearch = useDeferredValue(listFilters.search.trim());

  const { all: sidebarCatalog, loading: servicesLoading } = useCarOwnerServiceSidebar();

  const serviceSelectionPreview = useMemo(
    () => parseShopServiceValue(listFilters.serviceValue, sidebarCatalog),
    [listFilters.serviceValue, sidebarCatalog],
  );

  const selectedServiceId =
    serviceSelectionPreview.kind === "all" ? "" : serviceSelectionPreview.serviceId;

  const { vehicles, loading: vehiclesLoading, error: vehiclesError } = useCarOwnerVehicles();
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) ?? null;

  const shopFilters = useMemo(
    () => ({
      // Only send main service id to API; sub-service narrowing is client-side.
      serviceIds: selectedServiceId ? [selectedServiceId] : ([] as string[]),
      shopType: listFilters.shopType || null,
      carCompanyIds: [] as string[],
      search: deferredSearch || null,
      enabled: Boolean(selectedVehicleId),
    }),
    [selectedServiceId, listFilters.shopType, deferredSearch, selectedVehicleId],
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
    () =>
      shops.map((shop) => ({
        ...shop,
        isFavorite: isFavorite(shop.id) || shop.isFavorite,
      })),
    [shops, isFavorite],
  );

  const catalog = useMemo(
    () => mergeServiceCatalogWithShopOfferings(sidebarCatalog, shopsWithFavorites),
    [sidebarCatalog, shopsWithFavorites],
  );

  const serviceSelection = useMemo(
    () => parseShopServiceValue(listFilters.serviceValue, catalog),
    [listFilters.serviceValue, catalog],
  );

  const cityOptions = useMemo(
    () => uniqueSortedCities(shopsWithFavorites),
    [shopsWithFavorites],
  );

  const filteredShops = useMemo(() => {
    return shopsWithFavorites.filter((shop) => {
      if (!matchesShopSearch(shop, listFilters.search)) return false;

      if (listFilters.shopType) {
        const types =
          shop.shopTypes?.length > 0
            ? shop.shopTypes
            : [shop.shopType || "autoShop"];
        if (!types.includes(listFilters.shopType)) return false;
      }

      if (serviceSelection.kind === "service") {
        if (!shopOffersService(shop, serviceSelection.serviceId)) return false;
      }

      if (serviceSelection.kind === "subservice") {
        if (
          !shopOffersSubService(
            shop,
            serviceSelection.serviceId,
            serviceSelection.subServiceName,
          )
        ) {
          return false;
        }
      }

      if (listFilters.city) {
        if (shop.city.trim().toLowerCase() !== listFilters.city.trim().toLowerCase()) {
          return false;
        }
      }

      if (listFilters.availability !== "all") {
        const open = isCarOwnerShopOpenToday(shop);
        if (listFilters.availability === "open" && !open) return false;
        if (listFilters.availability === "closed" && open) return false;
      }

      if (listFilters.favorites === "favorites" && !shop.isFavorite) return false;

      return true;
    });
  }, [shopsWithFavorites, listFilters, serviceSelection]);

  const expandedShop =
    filteredShops.find((s) => s.id === expandedShopId) ??
    shopsWithFavorites.find((s) => s.id === expandedShopId) ??
    null;

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

  const handleFiltersChange = useCallback((next: OwnerShopListFilters) => {
    setListFilters(next);
    setExpandedShopId(null);
  }, []);

  const resetSidebar = useCallback(() => {
    setSelectedVehicleId(vehicles[0]?.id ?? null);
    setExpandedShopId(null);
    setListFilters(EMPTY_SHOP_LIST_FILTERS);
  }, [vehicles]);

  useOwnerSidebarDefault(!vehiclesLoading && vehicles.length > 0, resetSidebar);
  useOwnerNavReset(resetSidebar);

  const pageTitle =
    section === "approvals"
      ? "Approvals"
      : selectedVehicleId
        ? `Shops for ${vehicleMakeLabel}`
        : "Auto Repair Shops";

  const pageSubtitle = (() => {
    if (section === "approvals") return "Review shops waiting to connect with you";
    if (serviceSelection.kind === "subservice") {
      return `Nearby shops for ${serviceSelection.subServiceName}`;
    }
    if (serviceSelection.kind === "service") {
      return `Nearby shops for ${serviceSelection.serviceName}`;
    }
    if (listFilters.shopType) {
      return `Nearby ${getShopTypeLabel(listFilters.shopType).toLowerCase()} shops`;
    }
    return "Find mechanics near you by shop type, service, and filters";
  })();

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
          filteredShops.length > 0 &&
          !expandedShop ? (
            <p className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-black/5">
              {filteredShops.length} shop{filteredShops.length === 1 ? "" : "s"}
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
            {showShopList ? (
              <OwnerShopFilters
                filters={listFilters}
                onChange={handleFiltersChange}
                catalog={catalog}
                cityOptions={cityOptions}
                servicesLoading={servicesLoading}
              />
            ) : null}

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
            ) : filteredShops.length === 0 ? (
              <EmptyState>
                <p className="mb-3">No shops match the selected filters.</p>
                <button
                  type="button"
                  onClick={() => handleFiltersChange(EMPTY_SHOP_LIST_FILTERS)}
                  className="rounded-xl bg-ad-purple px-4 py-2 text-sm font-semibold text-white shadow-sm"
                >
                  Clear filters
                </button>
              </EmptyState>
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
                {filteredShops.map((shop) => {
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
                        <p className="truncate font-bold tracking-tight text-slate-900">
                          {shop.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs font-semibold text-sky-700 sm:text-sm">
                          {phone || "—"}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {[
                            shop.city,
                            getShopTypeLabels(
                              shop.shopTypes?.length ? shop.shopTypes : shop.shopType,
                            ),
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
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
