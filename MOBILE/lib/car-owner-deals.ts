import type {
  CarOwnerDeal,
  CarOwnerDealCreatedBy,
  CarOwnerDealSelectedVehicle,
  CarOwnerDealService,
  CarOwnerDealsResponse,
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

export function normalizeCarOwnerDeal(raw: unknown): CarOwnerDeal | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  const _id = pickString(o._id) ?? pickString(o.id);
  const createdBy = normalizeCreatedBy(o.createdBy);
  const offerEndsOnDate = pickString(o.offerEndsOnDate) ?? pickString(o.offersEndOnDate);
  const createdAt = pickString(o.createdAt);
  const updatedAt = pickString(o.updatedAt);
  if (!_id || !createdBy || !offerEndsOnDate || !createdAt || !updatedAt) return null;

  const discountedPrice =
    typeof o.discountedPrice === "number"
      ? o.discountedPrice
      : typeof o.discountedPrice === "string"
        ? Number(o.discountedPrice)
        : 0;

  const base = {
    _id,
    description: pickString(o.description) ?? "",
    discountedPrice: Number.isFinite(discountedPrice) ? discountedPrice : 0,
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

export function normalizeCarOwnerDealsList(
  payload: CarOwnerDealsResponse | null | undefined
): CarOwnerDeal[] {
  if (!payload?.success || !Array.isArray(payload.deals)) return [];
  return payload.deals.map(normalizeCarOwnerDeal).filter((d): d is CarOwnerDeal => d != null);
}
