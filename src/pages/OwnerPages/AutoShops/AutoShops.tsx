import { Link, useLocation } from "react-router";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { FiChevronLeft, FiChevronRight, FiFilter, FiHeart, FiMapPin, FiTool } from "react-icons/fi";
import { toast } from "react-toastify";
import { Skeleton } from "../../../components/common/Skeleton";
import OwnerPageShell from "../../../components/owner/OwnerPageShell";
import { OwnerShopListRow } from "../../../components/owner/OwnerShopListRow";
import { OwnerSideButton, ownerSideListClass } from "../../../components/owner/ownerUi";
import OwnerShopFilters, {
  EMPTY_SHOP_LIST_FILTERS,
  mergeServiceCatalogWithShopOfferings,
  parseShopServiceValue,
  type OwnerShopListFilters,
} from "../../../components/owner/OwnerShopFilters";
import OwnerShopExpandedPanel from "../../../components/owner/OwnerShopExpandedPanel";
import { OwnerCustomerRequestsTable } from "../../../components/owner/OwnerPanelTables";
import {
  ownerVehicleLabelClass,
  ownerVehicleSelectClass,
} from "../../../components/owner/ownerVehicleFormUtils";
import { useOwnerShopCityFilter } from "../../../context/OwnerShopCityFilterContext";
import { useCarOwnerAutoShops } from "../../../hooks/useCarOwnerAutoShops";
import { useCarOwnerCustomerRequests } from "../../../hooks/useCarOwnerCustomerRequests";
import { useCarOwnerFavoriteShops } from "../../../hooks/useCarOwnerFavoriteShops";
import { useCarOwnerServiceSidebar } from "../../../hooks/useOwnerPortal";
import { useCarOwnerVehicles } from "../../../hooks/useCarOwnerVehicles";
import { useOwnerNavReset, useOwnerSidebarDefault } from "../../../hooks/useOwnerNavReset";
import { isCarOwnerShopOpenToday } from "../../../lib/carOwnerAutoShops";
import {
  vehicleSidebarLabel,
  type CarOwnerVehicle,
} from "../../../lib/carOwnerVehicles";
import { getShopTypeLabels } from "../../../lib/shopTypes";
import type { CarOwnerAutoShopListItem } from "../../../types/carOwnerAutoShops";

const SELECT_VEHICLE_PROMPT = "Select a vehicle to find matching auto shops.";

function vehicleOptionLabel(vehicle: CarOwnerVehicle, index: number): string {
  const plate = vehicle.licensePlateNo?.trim().toUpperCase();
  if (plate) return plate;
  const make = vehicleSidebarLabel(vehicle);
  return make || `Vehicle ${index + 1}`;
}

function shopFiltersAreActive(filters: OwnerShopListFilters): boolean {
  return Boolean(
    filters.search.trim() ||
      filters.shopType ||
      filters.serviceValue ||
      filters.city ||
      filters.availability !== "all" ||
      filters.favorites !== "all",
  );
}

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
  const {
    filterCityName,
    setFilterCityName,
    clearFilterCity,
    resetFilterCityToProfile,
  } = useOwnerShopCityFilter();
  const section: AutoShopsSection =
    location.pathname.includes("/approvals") ? "approvals" : "auto-shops";
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [expandedShopId, setExpandedShopId] = useState<string | null>(null);
  const [favoriteBusyId, setFavoriteBusyId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [listFilters, setListFilters] = useState<OwnerShopListFilters>(EMPTY_SHOP_LIST_FILTERS);
  const deferredSearch = useDeferredValue(listFilters.search.trim());

  /** Keep filter panel city in sync with header city filter (shared context). */
  useEffect(() => {
    setListFilters((prev) =>
      prev.city === filterCityName ? prev : { ...prev, city: filterCityName },
    );
  }, [filterCityName]);

  const filtersActive = shopFiltersAreActive({ ...listFilters, city: filterCityName });

  const { all: sidebarCatalog, loading: servicesLoading } = useCarOwnerServiceSidebar();

  const serviceSelectionPreview = useMemo(
    () => parseShopServiceValue(listFilters.serviceValue, sidebarCatalog),
    [listFilters.serviceValue, sidebarCatalog],
  );

  const selectedServiceId =
    serviceSelectionPreview.kind === "all" ? "" : serviceSelectionPreview.serviceId;

  const { vehicles, loading: vehiclesLoading, error: vehiclesError } = useCarOwnerVehicles();

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
  const {
    isFavorite,
    toggleFavorite,
    loading: favoritesLoading,
  } = useCarOwnerFavoriteShops();
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
        // Favorites hook is source of truth after load. Do not OR with shop.isFavorite —
        // the list payload stays stale after unfavorite and would keep the heart filled.
        isFavorite: favoritesLoading
          ? shop.isFavorite || isFavorite(shop.id)
          : isFavorite(shop.id),
      })),
    [shops, isFavorite, favoritesLoading],
  );

  const catalog = useMemo(
    () => mergeServiceCatalogWithShopOfferings(sidebarCatalog, shopsWithFavorites),
    [sidebarCatalog, shopsWithFavorites],
  );

  const serviceSelection = useMemo(
    () => parseShopServiceValue(listFilters.serviceValue, catalog),
    [listFilters.serviceValue, catalog],
  );

  /** Mockup "< Oil Change Service >" selector: cycles the main service filter. */
  const serviceCarousel = useMemo(
    () => sidebarCatalog.filter((c) => Boolean(c.id?.trim())),
    [sidebarCatalog],
  );
  const carouselIndex = serviceCarousel.findIndex((c) => c.id === selectedServiceId);
  const stepService = useCallback(
    (delta: number) => {
      if (serviceCarousel.length === 0) return;
      // -1 = "All services"; wraps through every main service.
      const count = serviceCarousel.length + 1;
      const nextIndex = ((carouselIndex + 1 + delta + count) % count) - 1;
      setListFilters((prev) => ({
        ...prev,
        serviceValue: nextIndex < 0 ? "" : `svc:${serviceCarousel[nextIndex].id}`,
      }));
    },
    [carouselIndex, serviceCarousel],
  );

  const cityOptions = useMemo(() => {
    const fromShops = uniqueSortedCities(shopsWithFavorites);
    const selected = filterCityName.trim();
    if (!selected) return fromShops;
    if (fromShops.some((c) => c.toLowerCase() === selected.toLowerCase())) return fromShops;
    return [selected, ...fromShops].sort((a, b) => a.localeCompare(b));
  }, [shopsWithFavorites, filterCityName]);

  const filtersForPanel = useMemo(
    () => ({ ...listFilters, city: filterCityName }),
    [listFilters, filterCityName],
  );

  const filteredShops = useMemo(() => {
    const cityNeedle = filterCityName.trim().toLowerCase();
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

      if (cityNeedle) {
        if (shop.city.trim().toLowerCase() !== cityNeedle) {
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
  }, [shopsWithFavorites, listFilters, serviceSelection, filterCityName]);

  const expandedShop =
    filteredShops.find((s) => s.id === expandedShopId) ??
    shopsWithFavorites.find((s) => s.id === expandedShopId) ??
    null;

  const showShopList = Boolean(selectedVehicleId);

  const handleVehicleSelect = useCallback((vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setExpandedShopId(null);
  }, []);

  const handleFiltersChange = useCallback(
    (next: OwnerShopListFilters) => {
      setListFilters(next);
      setExpandedShopId(null);
      if (next.city.trim()) setFilterCityName(next.city);
      else clearFilterCity();
    },
    [setFilterCityName, clearFilterCity],
  );

  const clearAllFilters = useCallback(() => {
    setListFilters(EMPTY_SHOP_LIST_FILTERS);
    clearFilterCity();
    setExpandedShopId(null);
  }, [clearFilterCity]);

  const resetPage = useCallback(() => {
    setSelectedVehicleId(vehicles[0]?.id ?? null);
    setExpandedShopId(null);
    setFiltersOpen(false);
    setListFilters(EMPTY_SHOP_LIST_FILTERS);
    resetFilterCityToProfile();
  }, [vehicles, resetFilterCityToProfile]);

  useOwnerSidebarDefault(!vehiclesLoading && vehicles.length > 0, resetPage);
  useOwnerNavReset(resetPage);

  const pageTitle =
    section === "approvals"
      ? "Approvals"
      : "Auto Mechanics Near by";

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
    const shop = shopsWithFavorites.find((s) => s.id === shopId);
    setFavoriteBusyId(shopId);
    const result = await toggleFavorite(shopId, shop?.isFavorite);
    setFavoriteBusyId(null);
    if (!result.ok) {
      toast.error(result.error ?? "Could not update favorite.");
      return;
    }
    toast.success(result.isFavorite ? "Added to favorites." : "Removed from favorites.");
  };

  const closeShopDialog = useCallback(() => {
    setExpandedShopId(null);
  }, []);

  useEffect(() => {
    if (!expandedShop) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeShopDialog();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [expandedShop, closeShopDialog]);

  return (
    <OwnerPageShell
      pageHeading={pageTitle}
      sidebarExtra={
        section === "auto-shops" && vehicles.length > 0 ? (
          <div className={ownerSideListClass}>
            {vehicles.map((vehicle, index) => (
              <OwnerSideButton
                key={vehicle.id}
                label={vehicleOptionLabel(vehicle, index)}
                active={vehicle.id === selectedVehicleId}
                onClick={() => handleVehicleSelect(vehicle.id)}
              />
            ))}
          </div>
        ) : undefined
      }
      metaTitle="Auto Shops | AutoDaddy"
      metaDescription="Find auto shops near you"
      noPanel
    >
      <div className="flex flex-col gap-4 p-3 sm:p-4">

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
            {!vehiclesLoading && vehicles.length > 0 ? (
              <div className="flex flex-wrap items-end justify-end gap-3">
                <div className="min-w-[11rem] w-full sm:w-auto sm:min-w-[14rem] sm:max-w-[16rem]">
                  <label className={ownerVehicleLabelClass} htmlFor="auto-shops-vehicle">
                    Vehicle
                  </label>
                  <select
                    id="auto-shops-vehicle"
                    value={selectedVehicleId ?? ""}
                    onChange={(e) => handleVehicleSelect(e.target.value)}
                    aria-label="Select vehicle"
                    className={ownerVehicleSelectClass}
                  >
                    {!selectedVehicleId ? (
                      <option value="" disabled>
                        Select a vehicle
                      </option>
                    ) : null}
                    {vehicles.map((vehicle, index) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicleOptionLabel(vehicle, index)}
                      </option>
                    ))}
                  </select>
                </div>

                {showShopList ? (
                  <button
                    type="button"
                    onClick={() => setFiltersOpen((open) => !open)}
                    aria-expanded={filtersOpen}
                    aria-controls="auto-shops-filters"
                    className={`inline-flex h-10 items-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold transition ${
                      filtersOpen || filtersActive
                        ? "bg-gradient-to-br from-ad-purple to-ad-purple-dark text-white shadow-[0_6px_14px_rgba(155,48,141,0.22)]"
                        : "bg-white text-slate-700 ring-1 ring-slate-200/80 hover:bg-slate-50"
                    }`}
                  >
                    <FiFilter size={14} aria-hidden />
                    Filters
                    {filtersActive ? (
                      <span className="ml-0.5 size-1.5 rounded-full bg-white" aria-hidden />
                    ) : null}
                  </button>
                ) : null}
              </div>
            ) : null}

            {showShopList && serviceCarousel.length > 0 ? (
              <div className="mx-auto flex w-full max-w-lg items-stretch overflow-hidden rounded-lg shadow-sm ring-1 ring-ad-purple/30">
                <button
                  type="button"
                  onClick={() => stepService(-1)}
                  aria-label="Previous service"
                  className="flex w-11 items-center justify-center bg-gradient-to-b from-[#b045a4] to-ad-purple text-white transition hover:brightness-110"
                >
                  <FiChevronLeft size={24} strokeWidth={3} aria-hidden />
                </button>
                <p className="flex-1 truncate bg-[#fde6d2] px-4 py-2.5 text-center text-lg font-medium text-gray-800">
                  {carouselIndex >= 0 ? serviceCarousel[carouselIndex].name : "All Services"}
                </p>
                <button
                  type="button"
                  onClick={() => stepService(1)}
                  aria-label="Next service"
                  className="flex w-11 items-center justify-center bg-gradient-to-b from-[#b045a4] to-ad-purple text-white transition hover:brightness-110"
                >
                  <FiChevronRight size={24} strokeWidth={3} aria-hidden />
                </button>
              </div>
            ) : null}

            {showShopList && filtersOpen ? (
              <div id="auto-shops-filters">
                <OwnerShopFilters
                  filters={filtersForPanel}
                  onChange={handleFiltersChange}
                  catalog={catalog}
                  cityOptions={cityOptions}
                  servicesLoading={servicesLoading}
                  onClose={() => setFiltersOpen(false)}
                />
              </div>
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
                <p className="mb-3">
                  {filterCityName.trim()
                    ? `No shops match the selected filters in ${filterCityName.trim()}.`
                    : "No shops match the selected filters."}
                </p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="rounded-xl bg-ad-purple px-4 py-2 text-sm font-semibold text-white shadow-sm"
                >
                  Clear filters
                </button>
              </EmptyState>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredShops.map((shop) => {
                  const favoriteBusy = favoriteBusyId === shop.id;
                  const toggleFav = (e: React.SyntheticEvent) => {
                    e.stopPropagation();
                    if (!favoriteBusy) void handleToggleFavorite(shop.id);
                  };
                  return (
                    <OwnerShopListRow
                      key={shop.id}
                      shop={shop}
                      onExpand={() => setExpandedShopId(shop.id)}
                      meta={[
                        shop.city,
                        getShopTypeLabels(shop.shopTypes?.length ? shop.shopTypes : shop.shopType),
                        shop.todayHoursText,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                      trailing={
                        <span
                          role="button"
                          tabIndex={0}
                          aria-label={shop.isFavorite ? "Remove from favorites" : "Add to favorites"}
                          aria-pressed={shop.isFavorite}
                          className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-white/70 hover:text-red-500"
                          onClick={toggleFav}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              toggleFav(e);
                            }
                          }}
                        >
                          <FiHeart
                            className={shop.isFavorite ? "fill-red-500 text-red-500" : undefined}
                            size={22}
                            aria-hidden
                          />
                        </span>
                      }
                    />
                  );
                })}
              </div>
            )}

            {expandedShop
              ? createPortal(
                  <div
                    className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-6"
                    role="dialog"
                    aria-modal="true"
                    aria-label={expandedShop.name}
                  >
                    <button
                      type="button"
                      className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
                      aria-label="Close shop details"
                      onClick={closeShopDialog}
                    />
                    <div className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/80 bg-white shadow-[0_24px_48px_rgba(15,23,42,0.22)] ring-1 ring-black/5">
                      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                        <OwnerShopExpandedPanel
                          shop={expandedShop}
                          connectingServiceKey={null}
                          sentServiceKeys={{}}
                          statusMessage={null}
                          isFavorite={expandedShop.isFavorite}
                          favoriteBusy={favoriteBusyId === expandedShop.id}
                          onToggleFavorite={() => void handleToggleFavorite(expandedShop.id)}
                          onCollapse={closeShopDialog}
                          onConnect={() => {
                            // Auto Shops page is browse-first; connect flow lives in dashboard.
                          }}
                        />
                      </div>
                    </div>
                  </div>,
                  document.body,
                )
              : null}
          </div>
        )}
      </div>
    </OwnerPageShell>
  );
}
