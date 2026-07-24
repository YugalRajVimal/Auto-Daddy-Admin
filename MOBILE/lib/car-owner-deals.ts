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
} from "@/types/car-owner-deals";

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
    o.contactDetails && typeof o.contactDetails === "object"
      ? (o.contactDetails as Record<string, unknown>)
      : null;

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
  const v = (dealType ?? "").trim().toLowerCase();
  if (v === "parts" || v === "salvages" || v === "salvage") return "parts";
  return "service";
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
  const dealTypeRaw = pickString(o.dealType);

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

  const kind = normalizeDealKind(dealTypeRaw);

  if (kind === "parts") {
    const partName = pickString(o.partName) ?? pickString(o.productName);
    const selectedVehicle = normalizeSelectedVehicle(o.selectedVehicle);
    if (!partName || !selectedVehicle) return null;
    const isSalvage = (dealTypeRaw ?? "").toLowerCase().includes("salvage");
    return {
      ...base,
      dealType: isSalvage ? "Salvages" : "Parts",
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

function dealKindLabel(dealType: string | undefined): "Service" | "Parts" {
  const v = (dealType ?? "").trim().toLowerCase();
  if (v === "parts" || v.includes("salvage")) return "Parts";
  return "Service";
}

function splitFlatDealsByKind(deals: CarOwnerDeal[]): {
  Service: CarOwnerDealBucket;
  Parts: CarOwnerDealBucket;
} {
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

function mergeBuckets(a: CarOwnerDealBucket, b: CarOwnerDealBucket): CarOwnerDealBucket {
  return {
    city: sortDealsNewestFirst([...a.city, ...b.city]),
    others: sortDealsNewestFirst([...a.others, ...b.others]),
  };
}

/** Flattened list. Handles both legacy array and grouped `{ Parts, Service, Salvages }` payloads. */
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
  const Parts = mergeBuckets(
    normalizeDealBucket(grouped.Parts ?? grouped.parts),
    normalizeDealBucket(grouped.Salvages ?? grouped.salvages)
  );
  Service.city = sortDealsNewestFirst(Service.city);
  Service.others = sortDealsNewestFirst(Service.others);

  const all = sortDealsNewestFirst([...flattenBucket(Service), ...flattenBucket(Parts)]);
  return { Service, Parts, filters, all };
}
