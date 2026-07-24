import type {
  AutoshopDealFormFields,
  AutoshopDealType,
} from "@/lib/autoshopowner-deals-api";
import { isSalvagesDeal, dealId as parserDealId } from "@/lib/shop-owner-parsers";
import type { UploadPart } from "@/lib/upload-part";
import type { ShopDeal } from "@/types/shop-owner";

export type DealFormMode = "service" | "parts";
export type DealBoardSectionId = "service" | "parts" | "salvage";

export type VehicleCatalogModel = {
  id?: string;
  name: string;
  years: string[];
};

export type VehicleCatalogEntry = {
  id: string;
  name: string;
  models: VehicleCatalogModel[];
};

/** Parse vehicle catalog from GET vehicle-types-and-services (matches web ShopDealFormDialog). */
export function parseVehicleCatalog(payload: unknown): VehicleCatalogEntry[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const carDetails = Array.isArray(root.carDetails) ? root.carDetails : [];
  return carDetails
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const name = String(o.company ?? o.companyName ?? o.name ?? "").trim();
      const id = String(o.id ?? o._id ?? name).trim();
      if (!name) return null;

      const rawModels = Array.isArray(o.models) ? o.models : [];
      const models = rawModels
        .map((model) => {
          const m = model as Record<string, unknown>;
          const modelName = String(m.model ?? m.modelName ?? m.name ?? "").trim();
          if (!modelName) return null;
          const years: string[] = [];
          if (Array.isArray(m.years)) {
            for (const y of m.years) {
              const ys = String(y).trim();
              if (ys) years.push(ys);
            }
          } else if (m.year != null) {
            const ys = String(m.year).trim();
            if (ys) years.push(ys);
          }
          return {
            id: String(m.id ?? modelName),
            name: modelName,
            years: years.length > 0 ? years : [],
          };
        })
        .filter(Boolean) as VehicleCatalogModel[];

      return { id, name, models };
    })
    .filter(Boolean) as VehicleCatalogEntry[];
}

export function dealModeOf(deal: ShopDeal): DealFormMode {
  if (deal.dealType?.toLowerCase() === "parts" || deal.partName) return "parts";
  return "service";
}

export function resolveDealType(opts: {
  deal?: ShopDeal | null;
  section?: DealBoardSectionId;
  mode: DealFormMode;
}): AutoshopDealType {
  const { deal, section, mode } = opts;
  if (deal) {
    const t = (deal.dealType ?? "").toLowerCase();
    if (t.includes("salvage")) return "Salvages";
    if (t.includes("part") || deal.partName) return "Parts";
    return "Service";
  }
  if (section === "salvage") return "Salvages";
  return mode === "parts" ? "Parts" : "Service";
}

/** Rebuild API form fields from an existing deal (sell / non-active / edit seed). */
export function dealToFormFields(
  deal: ShopDeal,
  overrides?: Partial<AutoshopDealFormFields>
): AutoshopDealFormFields {
  const mode = dealModeOf(deal);
  const dealType: AutoshopDealType = isSalvagesDeal(deal)
    ? "Salvages"
    : mode === "parts"
      ? "Parts"
      : "Service";
  const fields: AutoshopDealFormFields = {
    dealType,
    discountedPrice: deal.discountedPrice != null ? String(deal.discountedPrice) : "",
    description: deal.description ?? "",
    offersEndOnDate: deal.offersEndOnDate?.slice(0, 10) ?? "",
    dealEnabled: deal.dealEnabled === false ? "false" : "true",
    soldToCustomerId: deal.soldToCustomerId,
    soldToCustomerName: deal.soldToCustomerName,
    ...overrides,
  };
  if (mode === "parts" || dealType === "Salvages") {
    fields.partName = deal.partName ?? deal.productName ?? "";
    fields.vehicleId = deal.vehicleId;
    fields.vehicleName = deal.selectedVehicle?.vehicleName ?? deal.selectedVehicle?.name;
    fields.vehicleModel = deal.selectedVehicle?.model;
    fields.vehicleYear = deal.selectedVehicle?.year;
    fields.originalPrice =
      deal.price != null ? String(deal.price) : fields.discountedPrice;
  } else {
    fields.serviceId = deal.serviceId ?? deal.service?.id;
    fields.productName = deal.subServiceName ?? deal.productName ?? deal.service?.name;
    fields.subServiceName = deal.subServiceName ?? deal.productName;
    if (deal.price != null) fields.originalPrice = String(deal.price);
    // Service API expects discountedPrice as a percent (or discountPercentage on read).
    if (deal.discountPercentage != null && String(deal.discountPercentage).trim() !== "") {
      fields.discountedPrice = String(deal.discountPercentage);
    } else {
      const original = Number(deal.price);
      const discounted = Number(deal.discountedPrice);
      if (
        Number.isFinite(original) &&
        original > 0 &&
        Number.isFinite(discounted) &&
        discounted >= 0 &&
        discounted < original
      ) {
        fields.discountedPrice = String(Math.round((1 - discounted / original) * 100));
      }
    }
  }
  return fields;
}

export type ShopDealSaveInput = {
  mode: DealFormMode;
  section: DealBoardSectionId;
  deal?: ShopDeal | null;
  discountedPrice: string;
  description: string;
  offersEndOnDate: string | Date;
  /** Service option */
  serviceId?: string;
  serviceOption?: { serviceId: string; subName: string } | null;
  /** Parts fields */
  partName?: string;
  vehicleId?: string;
  vehicleName?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  originalPrice?: string;
  /** Image — only for parts/salvages; pass local UploadPart when attaching a new file. */
  dealImage?: UploadPart | null;
  attachDealImage?: boolean;
};

/**
 * Build create/update payload exactly like web ShopDealFormDialog.handleSave.
 * Returns `{ ok: false, error }` on validation failure.
 */
export function buildShopDealSaveFields(
  input: ShopDealSaveInput
): { ok: true; fields: AutoshopDealFormFields } | { ok: false; error: string } {
  const {
    mode,
    section,
    deal,
    discountedPrice,
    description,
    offersEndOnDate,
    serviceOption,
    partName,
    vehicleId,
    vehicleName,
    vehicleModel,
    vehicleYear,
    originalPrice,
    dealImage,
    attachDealImage,
  } = input;

  if (!discountedPrice.trim()) {
    return {
      ok: false,
      error: mode === "service" ? "Discount (%) is required." : "Discounted price is required.",
    };
  }
  if (mode === "service") {
    const pct = Number(discountedPrice.trim());
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
      return { ok: false, error: "Enter a discount between 1 and 100%." };
    }
  }

  const offerEnd =
    offersEndOnDate instanceof Date
      ? offersEndOnDate.toISOString().slice(0, 10)
      : String(offersEndOnDate).trim().slice(0, 10);
  if (!offerEnd) {
    return { ok: false, error: "Offer ends on date is required." };
  }
  {
    const selected = new Date(`${offerEnd}T00:00:00`);
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (Number.isNaN(selected.getTime()) || selected < tomorrow) {
      return { ok: false, error: "Offer ends on must be a future date." };
    }
  }

  const dealType = resolveDealType({ deal, section, mode });
  const imageRequired = dealType === "Salvages";
  if (!deal && imageRequired && (!attachDealImage || !dealImage?.uri)) {
    return { ok: false, error: "Deal image is required." };
  }

  const fields: AutoshopDealFormFields = {
    dealType,
    discountedPrice: discountedPrice.trim(),
    description: mode === "parts" ? description.trim() : "",
    offersEndOnDate: offerEnd,
    dealImage: mode === "parts" && attachDealImage && dealImage?.uri ? dealImage : null,
  };

  if (mode === "parts") {
    if (!partName?.trim() || !vehicleId || !vehicleModel || !vehicleYear) {
      return { ok: false, error: "Fill all parts deal fields." };
    }
    fields.partName = partName.trim();
    fields.vehicleId = vehicleId;
    fields.vehicleName = vehicleName;
    fields.vehicleModel = vehicleModel;
    fields.vehicleYear = vehicleYear;
    fields.originalPrice = (originalPrice?.trim() || discountedPrice.trim());
  } else {
    if (!serviceOption?.serviceId || !serviceOption.subName) {
      return { ok: false, error: "Select a subservice." };
    }
    fields.serviceId = serviceOption.serviceId;
    fields.productName = serviceOption.subName;
    fields.subServiceName = serviceOption.subName;
  }

  return { ok: true, fields };
}

export function shopDealRecordId(deal: ShopDeal): string {
  return parserDealId(deal) || deal._id || deal.id || "";
}
