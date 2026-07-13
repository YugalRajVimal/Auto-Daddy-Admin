import type {
  CarOwnerDeal,
  CarOwnerDealBucket,
  CarOwnerDealCreatedBy,
  CarOwnerDealSelectedVehicle,
  CarOwnerDealService,
  CarOwnerDealsApiFilters,
  CarOwnerDealsGrouped,
  CarOwnerDealsResponse,
  NormalizedCarOwnerDeals,
} from "../types/carOwnerDeals";

function pickString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function normalizeCreatedBy(raw: unknown): CarOwnerDealCreatedBy | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const _id = pickString(o._id) ?? pickString(o.id);
  const businessName = pickString(o.businessName);
  if (!_id || !businessName) return null;

  const contact =
    o.contactDetails && typeof o.contactDetails === "object" ? (o.contactDetails as Record<string, unknown>) : null;

  return {
    _id,
    businessName,
    businessAddress: pickString(o.businessAddress) ?? "",
    businessLogo: pickString(o.businessLogo) ?? "",
    city: pickString(o.city),
    phone: pickString(o.phone) ?? pickString(o.businessPhone),
    businessPhone: pickString(o.businessPhone),
    mobile: pickString(o.mobile) ?? pickString(o.contactPhone),
    contactPhone: pickString(o.contactPhone),
    contactDetails: contact
      ? {
          phone: pickString(contact.phone),
          mobile: pickString(contact.mobile),
          landline: pickString(contact.landline),
        }
      : undefined,
  };
}

function normalizeService(raw: unknown): CarOwnerDealService | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const _id = pickString(o._id) ?? pickString(o.id);
  const name = pickString(o.name);
  if (!_id || !name) return null;
  return {
    _id,
    name,
    desc: pickString(o.desc) ?? pickString(o.description) ?? "",
  };
}

function normalizeSelectedVehicle(raw: unknown): CarOwnerDealSelectedVehicle | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = pickString(o.id) ?? pickString(o._id);
  const name = pickString(o.name) ?? pickString(o.vehicleName);
  if (!id || !name) return null;
  return {
    id,
    name,
    model: pickString(o.model),
    year: pickString(o.year) ?? "",
  };
}

function normalizeDealKind(dealType: string | undefined): "service" | "parts" {
  return (dealType ?? "").trim().toLowerCase() === "parts" ? "parts" : "service";
}

function normalizeImagePath(o: Record<string, unknown>): string | null {
  return pickString(o.dealImage) ?? pickString(o.imagePath) ?? pickString(o.productImage) ?? null;
}

function parsePrice(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

export function normalizeCarOwnerDeal(raw: unknown): CarOwnerDeal | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  const _id = pickString(o._id) ?? pickString(o.id);
  const createdBy = normalizeCreatedBy(o.createdBy);
  const offerEndsOnDate = pickString(o.offerEndsOnDate) ?? pickString(o.offersEndOnDate);
  const createdAt = pickString(o.createdAt);
  const updatedAt = pickString(o.updatedAt);
  if (!_id || !createdBy || !offerEndsOnDate || !createdAt || !updatedAt) return null;

  const discountedPrice = parsePrice(o.discountedPrice) ?? 0;
  const originalPrice = parsePrice(o.price) ?? parsePrice(o.originalPrice);

  const base = {
    _id,
    description: pickString(o.description) ?? "",
    discountedPrice: Number.isFinite(discountedPrice) ? discountedPrice : 0,
    originalPrice,
    offerEndsOnDate,
    createdBy,
    imagePath: normalizeImagePath(o),
    createdAt,
    updatedAt,
    __v: typeof o.__v === "number" ? o.__v : undefined,
  };

  const kind = normalizeDealKind(pickString(o.dealType));

  if (kind === "parts") {
    const partName = pickString(o.partName) ?? pickString(o.productName);
    const selectedVehicle = normalizeSelectedVehicle(o.selectedVehicle);
    if (!partName || !selectedVehicle) return null;
    return {
      ...base,
      dealType: "Parts",
      partName,
      selectedVehicle,
    };
  }

  const serviceId =
    normalizeService(o.serviceId) ??
    normalizeService(o.service) ??
    (typeof o.serviceId === "string" && pickString(o.serviceId)
      ? { _id: pickString(o.serviceId)!, name: pickString(o.partName) ?? "Service deal", desc: "" }
      : null);
  if (!serviceId) return null;

  return {
    ...base,
    dealType: "Service",
    serviceId,
  };
}

function normalizeDealArray(raw: unknown): CarOwnerDeal[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeCarOwnerDeal).filter((d): d is CarOwnerDeal => d != null);
}

function normalizeDealBucket(raw: unknown): CarOwnerDealBucket {
  if (!raw || typeof raw !== "object") return { city: [], others: [] };
  const o = raw as Record<string, unknown>;
  return {
    city: normalizeDealArray(o.city),
    others: normalizeDealArray(o.others),
  };
}

function emptyBucket(): CarOwnerDealBucket {
  return { city: [], others: [] };
}

function sortDealsNewestFirst(deals: CarOwnerDeal[]): CarOwnerDeal[] {
  return [...deals].sort((a, b) => {
    const at = Date.parse(a.createdAt);
    const bt = Date.parse(b.createdAt);
    if (Number.isFinite(at) && Number.isFinite(bt)) return bt - at;
    return String(b.createdAt).localeCompare(String(a.createdAt));
  });
}

function flattenBucket(bucket: CarOwnerDealBucket): CarOwnerDeal[] {
  return [...bucket.city, ...bucket.others];
}

function normalizeApiFilters(raw: CarOwnerDealsResponse["filters"] | undefined): CarOwnerDealsApiFilters {
  const makes = Array.isArray(raw?.makes)
    ? raw.makes.filter((m): m is string => typeof m === "string" && m.trim().length > 0).map((m) => m.trim())
    : [];
  const models = Array.isArray(raw?.models)
    ? raw.models.filter((m): m is string => typeof m === "string" && m.trim().length > 0).map((m) => m.trim())
    : [];
  return { makes, models };
}

function splitFlatDealsByKind(deals: CarOwnerDeal[]): { Service: CarOwnerDealBucket; Parts: CarOwnerDealBucket } {
  const service: CarOwnerDeal[] = [];
  const parts: CarOwnerDeal[] = [];
  for (const deal of deals) {
    if (dealKindLabel(deal.dealType) === "Parts") parts.push(deal);
    else service.push(deal);
  }
  return {
    Service: { city: sortDealsNewestFirst(service), others: [] },
    Parts: { city: sortDealsNewestFirst(parts), others: [] },
  };
}

/** Flattened list (backward compatible). Prefer `normalizeCarOwnerDealsPayload` for city/others. */
export function normalizeCarOwnerDealsList(
  payload: CarOwnerDealsResponse | null | undefined
): CarOwnerDeal[] {
  return normalizeCarOwnerDealsPayload(payload).all;
}

export function normalizeCarOwnerDealsPayload(
  payload: CarOwnerDealsResponse | null | undefined
): NormalizedCarOwnerDeals {
  const empty: NormalizedCarOwnerDeals = {
    Service: emptyBucket(),
    Parts: emptyBucket(),
    filters: { makes: [], models: [] },
    all: [],
  };

  if (!payload?.success || payload.deals == null) return empty;

  const filters = normalizeApiFilters(payload.filters);

  if (Array.isArray(payload.deals)) {
    const split = splitFlatDealsByKind(
      payload.deals.map(normalizeCarOwnerDeal).filter((d): d is CarOwnerDeal => d != null)
    );
    const all = flattenBucket(split.Service).concat(flattenBucket(split.Parts));
    return { ...split, filters, all: sortDealsNewestFirst(all) };
  }

  const grouped = payload.deals as CarOwnerDealsGrouped;
  const Service = normalizeDealBucket(grouped.Service ?? grouped.service);
  const Parts = normalizeDealBucket(grouped.Parts ?? grouped.parts);
  Service.city = sortDealsNewestFirst(Service.city);
  Service.others = sortDealsNewestFirst(Service.others);
  Parts.city = sortDealsNewestFirst(Parts.city);
  Parts.others = sortDealsNewestFirst(Parts.others);

  const all = sortDealsNewestFirst([...flattenBucket(Service), ...flattenBucket(Parts)]);
  return { Service, Parts, filters, all };
}

export function dealsForCategory(
  normalized: NormalizedCarOwnerDeals,
  category: DealCategory
): CarOwnerDealBucket {
  if (category === "completed") {
    const all = normalized.all.filter((d) => !isDealActive(d));
    return { city: all, others: [] };
  }

  if (category === "service") {
    return {
      city: normalized.Service.city.filter(isDealActive),
      others: normalized.Service.others.filter(isDealActive),
    };
  }
  if (category === "parts") {
    return {
      city: normalized.Parts.city.filter(isDealActive),
      others: normalized.Parts.others.filter(isDealActive),
    };
  }

  const all = normalized.all.filter((d) => matchesDealCategory(d, category));
  return { city: all, others: [] };
}

export function dealKindLabel(dealType: string | undefined): "Service" | "Parts" {
  return (dealType ?? "").trim().toLowerCase() === "parts" ? "Parts" : "Service";
}

export function dealTitle(d: CarOwnerDeal): string {
  const kind = dealKindLabel(d.dealType);
  if (kind === "Service") {
    return d.serviceId?.name?.trim() || "Service deal";
  }
  return d.partName?.trim() || "Parts deal";
}

export function dealDiscountPercent(d: CarOwnerDeal): number | null {
  const original = d.originalPrice;
  const discounted = d.discountedPrice;
  if (original == null || original <= 0 || discounted <= 0 || discounted >= original) return null;
  return Math.round((1 - discounted / original) * 100);
}

export function isDealActive(d: CarOwnerDeal): boolean {
  const ends = Date.parse(d.offerEndsOnDate);
  return !Number.isFinite(ends) || ends >= Date.now();
}

export type DealCategory = "service" | "parts" | "tire" | "salvage" | "completed";

export function matchesDealCategory(d: CarOwnerDeal, category: DealCategory): boolean {
  const haystack = [
    dealTitle(d),
    d.description,
    d.partName,
    d.serviceId?.name,
    d.createdBy.businessName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (category === "completed") return !isDealActive(d);
  if (category === "service") return dealKindLabel(d.dealType) === "Service" && isDealActive(d);
  if (category === "parts") return dealKindLabel(d.dealType) === "Parts" && isDealActive(d);
  if (category === "tire") return /\b(tire|tyre)\b/i.test(haystack) && isDealActive(d);
  if (category === "salvage") return /\bsalvage/i.test(haystack) && isDealActive(d);
  return true;
}

export type DealListFilters = {
  make: string;
  model: string;
  city: string;
};

export const EMPTY_DEAL_LIST_FILTERS: DealListFilters = { make: "", model: "", city: "" };

export function dealMake(d: CarOwnerDeal): string | null {
  if ("selectedVehicle" in d && d.selectedVehicle?.name?.trim()) {
    return d.selectedVehicle.name.trim();
  }
  return null;
}

export function dealModel(d: CarOwnerDeal): string | null {
  if ("selectedVehicle" in d && d.selectedVehicle?.model?.trim()) {
    return d.selectedVehicle.model.trim();
  }
  return null;
}

export function dealCity(d: CarOwnerDeal): string | null {
  return d.createdBy.city?.trim() || null;
}

function sameFilterValue(a: string | null | undefined, b: string): boolean {
  if (!b) return true;
  return (a ?? "").trim().toLowerCase() === b.trim().toLowerCase();
}

export function matchesDealListFilters(d: CarOwnerDeal, filters: DealListFilters): boolean {
  if (filters.make && !sameFilterValue(dealMake(d), filters.make)) return false;
  if (filters.model && !sameFilterValue(dealModel(d), filters.model)) return false;
  if (filters.city && !sameFilterValue(dealCity(d), filters.city)) return false;
  return true;
}

function uniqueSorted(values: Array<string | null | undefined>): string[] {
  const set = new Set<string>();
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) set.add(trimmed);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function dealMakeOptions(deals: CarOwnerDeal[]): string[] {
  return uniqueSorted(deals.map(dealMake));
}

export function dealModelOptions(deals: CarOwnerDeal[], make: string): string[] {
  if (!make.trim()) return [];
  const scoped = deals.filter((d) => sameFilterValue(dealMake(d), make));
  return uniqueSorted(scoped.map(dealModel));
}

export function dealCityOptions(deals: CarOwnerDeal[], make: string, model: string): string[] {
  const hasVehicleMakes = deals.some((d) => dealMake(d));
  if (!hasVehicleMakes) {
    return uniqueSorted(deals.map(dealCity));
  }
  if (!make.trim() || !model.trim()) return [];
  const scoped = deals.filter(
    (d) => sameFilterValue(dealMake(d), make) && sameFilterValue(dealModel(d), model)
  );
  return uniqueSorted(scoped.map(dealCity));
}

export function dealFiltersUseVehicleCascade(deals: CarOwnerDeal[]): boolean {
  return deals.some((d) => dealMake(d));
}
