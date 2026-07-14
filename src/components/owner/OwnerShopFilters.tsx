import { useMemo } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { SHOP_TYPE_OPTIONS, type ShopType } from "../../lib/shopTypes";
import type { ServiceCategory } from "../../lib/serviceCatalog";
import {
  ownerVehicleFieldClass,
  ownerVehicleSelectClass,
} from "./ownerVehicleFormUtils";

export type ShopAvailabilityFilter = "all" | "open" | "closed";
export type ShopFavoritesFilter = "all" | "favorites";

/** Encodes main service / subservice selection for the Services dropdown. */
export type ShopServiceSelection =
  | { kind: "all" }
  | { kind: "service"; serviceId: string; serviceName: string }
  | {
      kind: "subservice";
      serviceId: string;
      serviceName: string;
      subServiceId: string;
      subServiceName: string;
    };

export type OwnerShopListFilters = {
  search: string;
  /** Shop type category — autoShop / tyreShop / carWash / towTruck. */
  shopType: "" | ShopType;
  /** Raw `<select>` value; parse with `parseShopServiceValue`. */
  serviceValue: string;
  city: string;
  availability: ShopAvailabilityFilter;
  favorites: ShopFavoritesFilter;
};

export const EMPTY_SHOP_LIST_FILTERS: OwnerShopListFilters = {
  search: "",
  shopType: "",
  serviceValue: "",
  city: "",
  availability: "all",
  favorites: "all",
};

export function encodeShopServiceAll(): string {
  return "";
}

export function encodeShopService(serviceId: string): string {
  return `svc:${serviceId}`;
}

export function encodeShopSubService(
  serviceId: string,
  subServiceId: string,
  subServiceName: string,
): string {
  return `sub:${serviceId}:${subServiceId || encodeURIComponent(subServiceName)}`;
}

export function parseShopServiceValue(
  value: string,
  catalog: ServiceCategory[],
): ShopServiceSelection {
  const raw = value.trim();
  if (!raw) return { kind: "all" };

  if (raw.startsWith("svc:")) {
    const serviceId = raw.slice(4);
    const match = catalog.find((c) => (c.id ?? "") === serviceId);
    return {
      kind: "service",
      serviceId,
      serviceName: match?.name ?? serviceId,
    };
  }

  if (raw.startsWith("sub:")) {
    const rest = raw.slice(4);
    const colon = rest.indexOf(":");
    if (colon <= 0) return { kind: "all" };
    const serviceId = rest.slice(0, colon);
    const subKey = rest.slice(colon + 1);
    const match = catalog.find((c) => (c.id ?? "") === serviceId);
    const sub =
      match?.subServices.find(
        (s) =>
          (s.id ?? "") === subKey ||
          s.name === decodeURIComponent(subKey) ||
          encodeURIComponent(s.name) === subKey,
      ) ?? null;
    return {
      kind: "subservice",
      serviceId,
      serviceName: match?.name ?? serviceId,
      subServiceId: sub?.id ?? subKey,
      subServiceName: sub?.name ?? decodeURIComponent(subKey),
    };
  }

  return { kind: "all" };
}

/** Merge global catalog with shop `myServices` trees so sub-services appear in the filter. */
export function mergeServiceCatalogWithShopOfferings(
  catalog: ServiceCategory[],
  shops: {
    serviceOfferings?: {
      id: string;
      name: string;
      subServices: { id?: string; name: string }[];
    }[];
  }[],
): ServiceCategory[] {
  const byId = new Map<string, ServiceCategory>();

  const ensure = (id: string, name: string, shopType?: ServiceCategory["shopType"]) => {
    const existing = byId.get(id);
    if (existing) {
      if (!existing.name.trim() && name.trim()) existing.name = name;
      if (!existing.shopType && shopType) existing.shopType = shopType;
      return existing;
    }
    const created: ServiceCategory = {
      id,
      name: name.trim() || id,
      shopType,
      subServices: [],
    };
    byId.set(id, created);
    return created;
  };

  const addSub = (
    cat: ServiceCategory,
    sub: { id?: string; name: string },
  ) => {
    const name = sub.name.trim();
    if (!name) return;
    const already = cat.subServices.some(
      (s) =>
        s.name.trim().toLowerCase() === name.toLowerCase() ||
        (Boolean(sub.id) && Boolean(s.id) && s.id === sub.id),
    );
    if (already) return;
    cat.subServices.push({ id: sub.id, name });
  };

  for (const cat of catalog) {
    const id = cat.id?.trim();
    if (!id) continue;
    const entry = ensure(id, cat.name, cat.shopType);
    for (const sub of cat.subServices) addSub(entry, sub);
  }

  for (const shop of shops) {
    for (const offering of shop.serviceOfferings ?? []) {
      const id = offering.id?.trim();
      if (!id) continue;
      const entry = ensure(id, offering.name);
      for (const sub of offering.subServices) addSub(entry, sub);
    }
  }

  return [...byId.values()].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
}

type OwnerShopFiltersProps = {
  filters: OwnerShopListFilters;
  onChange: (next: OwnerShopListFilters) => void;
  /** Service catalog (ids required), used to build service/subservice options. */
  catalog: ServiceCategory[];
  cityOptions: string[];
  servicesLoading?: boolean;
  onClose?: () => void;
};

const selectClass = `${ownerVehicleSelectClass} min-w-[8rem] flex-1 py-2 text-xs sm:min-w-[9.5rem] sm:text-sm`;

export default function OwnerShopFilters({
  filters,
  onChange,
  catalog,
  cityOptions,
  servicesLoading = false,
  onClose,
}: OwnerShopFiltersProps) {
  /** Category (shop type) and Services are independent — do not hide services by shopType. */
  const servicesForSelect = useMemo(
    () => catalog.filter((c) => Boolean(c.id?.trim())),
    [catalog],
  );

  const hasActiveFilter = Boolean(
    filters.search.trim() ||
      filters.shopType ||
      filters.serviceValue ||
      filters.city ||
      filters.availability !== "all" ||
      filters.favorites !== "all",
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)] ring-1 ring-black/5 sm:p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
              Filter shops
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Category is shop type; Services lists each service and its sub-services
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {hasActiveFilter ? (
              <button
                type="button"
                onClick={() => onChange(EMPTY_SHOP_LIST_FILTERS)}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200/80 transition hover:bg-slate-200/70"
              >
                Clear all
              </button>
            ) : null}
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close filters"
                className="inline-flex size-8 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                <FiX size={16} aria-hidden />
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative min-w-[12rem] flex-1 sm:max-w-[18rem]">
            <FiSearch
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
              aria-hidden
            />
            <input
              type="search"
              value={filters.search}
              onChange={(e) => onChange({ ...filters, search: e.target.value })}
              placeholder="Search shops…"
              aria-label="Search shops"
              className={`${ownerVehicleFieldClass} pl-9`}
            />
          </div>

          <select
            value={filters.shopType}
            aria-label="Category"
            onChange={(e) =>
              onChange({
                ...filters,
                shopType: e.target.value as "" | ShopType,
              })
            }
            className={selectClass}
          >
            <option value="">All categories</option>
            {SHOP_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.serviceValue}
            aria-label="Service"
            disabled={servicesLoading}
            onChange={(e) => onChange({ ...filters, serviceValue: e.target.value })}
            className={`${selectClass} min-w-[10rem] sm:min-w-[14rem] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`}
          >
            <option value="">
              {servicesLoading
                ? "Loading services…"
                : servicesForSelect.length === 0
                  ? "No services available"
                  : "All services"}
            </option>
            {servicesForSelect.map((service) => {
              const serviceId = service.id!.trim();
              const hasSubs = service.subServices.length > 0;
              if (!hasSubs) {
                return (
                  <option key={serviceId} value={encodeShopService(serviceId)}>
                    {service.name}
                  </option>
                );
              }
              return (
                <optgroup key={serviceId} label={service.name}>
                  <option value={encodeShopService(serviceId)}>
                    All {service.name}
                  </option>
                  {service.subServices.map((sub, index) => {
                    const subId = (sub.id ?? "").trim() || `name:${sub.name}`;
                    return (
                      <option
                        key={`${serviceId}:${subId}:${index}`}
                        value={encodeShopSubService(serviceId, subId, sub.name)}
                      >
                        {sub.name}
                      </option>
                    );
                  })}
                </optgroup>
              );
            })}
          </select>

          <select
            value={filters.city}
            aria-label="City"
            onChange={(e) => onChange({ ...filters, city: e.target.value })}
            className={selectClass}
          >
            <option value="">All cities</option>
            {cityOptions.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          <select
            value={filters.availability}
            aria-label="Open or closed"
            onChange={(e) =>
              onChange({
                ...filters,
                availability: e.target.value as ShopAvailabilityFilter,
              })
            }
            className={selectClass}
          >
            <option value="all">Open & closed</option>
            <option value="open">Open now</option>
            <option value="closed">Closed now</option>
          </select>

          <select
            value={filters.favorites}
            aria-label="Favorites"
            onChange={(e) =>
              onChange({
                ...filters,
                favorites: e.target.value as ShopFavoritesFilter,
              })
            }
            className={selectClass}
          >
            <option value="all">All shops</option>
            <option value="favorites">Favorites only</option>
          </select>
        </div>
      </div>
    </div>
  );
}
