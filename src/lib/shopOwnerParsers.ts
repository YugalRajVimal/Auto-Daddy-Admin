import type { MyCustomer, ShopDeal, ShopOwnerNotification, ShopServiceCategory } from "../types/shopOwner";

function extractList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const nested = root.data;
  if (Array.isArray(nested)) return nested;
  if (nested && typeof nested === "object") {
    const d = nested as Record<string, unknown>;
    for (const k of ["customers", "carOwners", "myCustomers", "data", "rows", "items", "list", "results"]) {
      if (Array.isArray(d[k])) return d[k] as unknown[];
    }
  }
  for (const k of ["customers", "carOwners", "myCustomers", "data", "rows", "items", "list", "results"]) {
    if (Array.isArray(root[k])) return root[k] as unknown[];
  }
  return [];
}

function s(v: unknown): string | undefined {
  if (typeof v === "string" && v.trim()) return v.trim();
  return undefined;
}

function mergeCarOwnerFields(o: Record<string, unknown>): Record<string, unknown> {
  const out = { ...o };
  const co = o.carOwner;
  if (co && typeof co === "object") {
    const c = co as Record<string, unknown>;
    for (const key of Object.keys(c)) {
      if (out[key] == null || out[key] === "") out[key] = c[key];
    }
  }
  return out;
}

function parseVehicles(o: Record<string, unknown>) {
  const raw = o.myVehicles ?? o.vehicles ?? o.cars;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const v = item as Record<string, unknown>;
      const make =
        v.make && typeof v.make === "object"
          ? (v.make as Record<string, unknown>)
          : v.vehicleMake && typeof v.vehicleMake === "object"
            ? (v.vehicleMake as Record<string, unknown>)
            : null;

      const odo =
        typeof v.odometerReading === "number"
          ? String(v.odometerReading)
          : typeof v.odometerReading === "string"
            ? v.odometerReading
            : undefined;
      const due =
        typeof v.dueOdometerReading === "number"
          ? String(v.dueOdometerReading)
          : typeof v.dueOdometerReading === "string"
            ? v.dueOdometerReading
            : undefined;
      return {
        _id: s(v._id) ?? s(v.vId) ?? s(v.id),
        vId: s(v.vId) ?? s(v._id) ?? s(v.id),
        licensePlateNo: s(v.licensePlateNo),
        vinNo: s(v.vinNo) ?? s(v.vin),
        vehicleName: s(v.vehicleName) ?? s(make?.name) ?? s(v.name),
        model: s(v.model) ?? s(make?.model),
        year: v.year != null ? String(v.year) : undefined,
        odometerReading: odo?.trim() || undefined,
        dueOdometerReading: due?.trim() || undefined,
      };
    });
}

function toCustomer(raw: unknown): MyCustomer | null {
  if (!raw || typeof raw !== "object") return null;
  const o = mergeCarOwnerFields(raw as Record<string, unknown>);
  const id = s(o._id) ?? s(o.id) ?? s(o.carOwnerId);
  const name = s(o.name);
  const phone = s(o.phone);
  if (!id && !name && !phone) return null;
  const recent = o.recentJobCard;
  return {
    _id: s(o._id),
    id: s(o.id),
    carOwnerId: s(o.carOwnerId) ?? id,
    name,
    email: s(o.email),
    phone,
    countryCode: s(o.countryCode),
    address: s(o.address),
    pincode: s(o.pincode),
    city: s(o.city),
    vehicles: parseVehicles(o),
    recentJobCard:
      recent && typeof recent === "object"
        ? {
            subServices: Array.isArray((recent as Record<string, unknown>).subServices)
              ? ((recent as Record<string, unknown>).subServices as string[])
              : undefined,
            date: s((recent as Record<string, unknown>).date),
            time: s((recent as Record<string, unknown>).time),
            vehicleNumberPlate: s((recent as Record<string, unknown>).vehicleNumberPlate),
          }
        : null,
    addedAt: s(o.addedAt),
    linkedAt: s(o.linkedAt),
    addedToShopAt: s(o.addedToShopAt),
    createdAt: s(o.createdAt),
    updatedAt: s(o.updatedAt),
    status: s(o.status) ?? s(o.approvalStatus),
    linkStatus: s(o.linkStatus),
    approvalStatus: s(o.approvalStatus),
  };
}

export function parseMyCustomers(payload: unknown): MyCustomer[] {
  return extractList(payload).map(toCustomer).filter(Boolean) as MyCustomer[];
}

export function customerKey(c: MyCustomer) {
  return (c.carOwnerId ?? c.id ?? c._id ?? "").trim();
}

function extractDeals(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  if (Array.isArray(root.serviceDeals) || Array.isArray(root.partsDeals)) {
    return [
      ...(Array.isArray(root.serviceDeals) ? root.serviceDeals : []),
      ...(Array.isArray(root.partsDeals) ? root.partsDeals : []),
    ];
  }
  if (Array.isArray(root.data)) return root.data;
  const data = root.data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.serviceDeals) || Array.isArray(d.partsDeals)) {
      return [
        ...(Array.isArray(d.serviceDeals) ? d.serviceDeals : []),
        ...(Array.isArray(d.partsDeals) ? d.partsDeals : []),
      ];
    }
    for (const k of ["deals", "myDeals", "items", "rows"]) {
      if (Array.isArray(d[k])) return d[k] as unknown[];
    }
  }
  for (const k of ["deals", "myDeals", "items"]) {
    if (Array.isArray(root[k])) return root[k] as unknown[];
  }
  return [];
}

function toDeal(raw: unknown): ShopDeal | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = s(o._id) ?? s(o.id);
  if (!id) return null;
  const service = o.service && typeof o.service === "object" ? (o.service as Record<string, unknown>) : null;
  const selectedVehicle =
    o.selectedVehicle && typeof o.selectedVehicle === "object"
      ? (o.selectedVehicle as Record<string, unknown>)
      : null;
  const selectedVehicleName =
    s(selectedVehicle?.vehicleName) ?? s(selectedVehicle?.name) ?? s(o.vehicleName);
  const productName =
    s(o.productName) ?? s(o.partName) ?? (service ? s(service.name) : undefined) ?? selectedVehicleName;
  return {
    _id: s(o._id),
    id,
    dealType: s(o.dealType),
    productName,
    partName: s(o.partName),
    description: s(o.description),
    price: (o.price ?? o.originalPrice) as ShopDeal["price"],
    discountedPrice: o.discountedPrice as ShopDeal["discountedPrice"],
    dealEnabled: typeof o.dealEnabled === "boolean" ? o.dealEnabled : undefined,
    offersEndOnDate: s(o.offersEndOnDate) ?? s(o.offerEndsOnDate),
    createdAt: s(o.createdAt) ?? s(o.updatedAt),
    soldToCustomerId:
      s(o.soldToCustomerId) ??
      s(o.soldCustomerId) ??
      s(o.soldToId) ??
      (o.soldTo && typeof o.soldTo === "object"
        ? s((o.soldTo as Record<string, unknown>)._id) ?? s((o.soldTo as Record<string, unknown>).id)
        : undefined),
    soldToCustomerName:
      s(o.soldToCustomerName) ??
      s(o.soldCustomerName) ??
      s(o.soldToName) ??
      (o.soldTo && typeof o.soldTo === "object"
        ? s((o.soldTo as Record<string, unknown>).name)
        : typeof o.soldTo === "string"
          ? s(o.soldTo)
          : undefined),
    soldAt: s(o.soldAt) ?? s(o.completedAt),
    serviceId: s(o.servicesId) ?? s(o.serviceId),
    vehicleId: s(o.vehicleId) ?? s(selectedVehicle?.id),
    service:
      service && (s(service.id) || s(service.name) || s(service.desc))
        ? {
            id: s(service.id),
            name: s(service.name),
            desc: s(service.desc),
          }
        : undefined,
    selectedVehicle:
      selectedVehicleName ||
      s(selectedVehicle?.id) ||
      s(o.vehicleModel) ||
      s(o.vehicleYear)
        ? {
            id: s(selectedVehicle?.id),
            name: selectedVehicleName,
            vehicleName: selectedVehicleName,
            model: s(selectedVehicle?.model) ?? s(o.vehicleModel),
            year:
              selectedVehicle?.year != null
                ? String(selectedVehicle.year)
                : s(o.vehicleYear),
          }
        : undefined,
    dealImage: s(o.dealImage),
    productImage: s(o.productImage),
  };
}

export function parseMyDeals(payload: unknown): ShopDeal[] {
  return extractDeals(payload).map(toDeal).filter(Boolean) as ShopDeal[];
}

export function dealId(d: ShopDeal) {
  return d._id ?? d.id ?? "";
}

export function isSalvagesDeal(d: ShopDeal) {
  const t = (d.dealType ?? "").toLowerCase();
  return t.includes("salvage");
}

export function isPartsDeal(d: ShopDeal) {
  if (isSalvagesDeal(d)) return false;
  const t = (d.dealType ?? "").toLowerCase();
  return t.includes("part") || Boolean(d.partName);
}

export function parseMyServices(payload: unknown): ShopServiceCategory[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  // Supports both legacy and new shop-owner API envelopes:
  // - legacy: { services: [...] } OR { data: { services: [...] } }
  // - new:    { data: [...] }
  const raw =
    root.services ??
    (Array.isArray(root.data)
      ? root.data
      : root.data && typeof root.data === "object"
        ? (root.data as Record<string, unknown>).services
        : null);
  if (!Array.isArray(raw)) return [];
  const out: ShopServiceCategory[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const nested = o.service && typeof o.service === "object" ? (o.service as Record<string, unknown>) : null;
    const id = s(o.id) ?? s(o._id) ?? (nested ? s(nested.id) ?? s(nested._id) : undefined);
    if (!id) continue;
    const subRaw = Array.isArray(o.selectedSubServices) ? o.selectedSubServices : o.subServices;
    const subServices: ShopServiceCategory["subServices"] = [];
    if (Array.isArray(subRaw)) {
      for (const sItem of subRaw) {
        if (!sItem || typeof sItem !== "object") continue;
        const sub = sItem as Record<string, unknown>;
        const name = s(sub.name);
        if (!name) continue;
        const price =
          typeof sub.price === "number"
            ? sub.price
            : typeof sub.price === "string"
              ? parseFloat(sub.price)
              : 0;
        const qtyRaw = sub.quantity ?? sub.qty;
        const qty =
          typeof qtyRaw === "number"
            ? qtyRaw
            : typeof qtyRaw === "string"
              ? parseFloat(qtyRaw)
              : undefined;
        const taxRaw = sub.tax;
        const tax =
          typeof taxRaw === "number"
            ? taxRaw
            : typeof taxRaw === "string"
              ? parseFloat(taxRaw)
              : undefined;
        subServices.push({
          id: s(sub.id) ?? s(sub._id),
          make: s(sub.make) ?? "",
          model: s(sub.model) ?? "",
          name,
          desc: s(sub.desc) ?? s(sub.description) ?? "",
          price: Number.isFinite(price) ? price : 0,
          ...(Number.isFinite(qty) && (qty as number) > 0 ? { qty: qty as number } : {}),
          ...(Number.isFinite(tax) ? { tax: tax as number } : {}),
        });
      }
    }
    out.push({
      id,
      name: s(o.name) ?? (nested ? s(nested.name) : undefined),
      desc: s(o.desc) ?? s(o.description) ?? (nested ? s(nested.desc) : undefined),
      shopType: s(o.shopType) ?? (nested ? s(nested.shopType) : undefined),
      createdAt: s(o.createdAt) ?? (nested ? s(nested.createdAt) : undefined),
      updatedAt: s(o.updatedAt) ?? (nested ? s(nested.updatedAt) : undefined),
      isActive:
        typeof o.isActive === "boolean"
          ? o.isActive
          : nested && typeof nested.isActive === "boolean"
            ? nested.isActive
            : undefined,
      odoOutRequired:
        typeof o.odoOutRequired === "boolean"
          ? o.odoOutRequired
          : nested && typeof nested.odoOutRequired === "boolean"
            ? nested.odoOutRequired
            : undefined,
      subServices,
    });
  }
  return out;
}

export function parseShopOwnerNotifications(
  payload: unknown,
  requestedLimit: number
): { items: ShopOwnerNotification[]; totalPages: number | null; hasMore: boolean } {
  const root = (payload as { data?: unknown } | null)?.data ?? payload;
  let itemsRaw: unknown[] = [];
  let page = 1;
  let totalPages: number | null = null;

  if (root && typeof root === "object") {
    const r = root as Record<string, unknown>;
    if (Array.isArray(r.notifications)) itemsRaw = r.notifications;
    else if (Array.isArray(r.data)) itemsRaw = r.data;
    else if (Array.isArray(r.items)) itemsRaw = r.items;
    const p = r.page ?? r.current_page;
    if (p != null && !Number.isNaN(Number(p))) page = Number(p);
    const tp = r.totalPages ?? r.total_pages ?? r.last_page;
    if (tp != null && !Number.isNaN(Number(tp))) totalPages = Number(tp);
  } else if (Array.isArray(root)) {
    itemsRaw = root;
  }

  const items = itemsRaw
    .map((raw) => {
      if (!raw || typeof raw !== "object") return null;
      const o = raw as Record<string, unknown>;
      const message = String(o.message ?? o.body ?? o.title ?? "").trim();
      const time = String(o.time ?? o.createdAt ?? "").trim();
      if (!message) return null;
      const explicitId = String(o._id ?? o.id ?? "").trim();
      const id = explicitId || [time, message.slice(0, 32)].filter(Boolean).join(":");
      return {
        id,
        userId: o.userId != null ? String(o.userId) : null,
        message,
        time,
        arrayIdx: null,
      } satisfies ShopOwnerNotification;
    })
    .filter(Boolean) as ShopOwnerNotification[];

  const hasMore = totalPages != null ? page < totalPages : items.length >= requestedLimit;
  return { items, totalPages, hasMore };
}

export function parsePayments(payload: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(payload)) return payload as Array<Record<string, unknown>>;
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  for (const k of ["payments", "data", "items", "rows", "expenses"]) {
    const v = root[k];
    if (Array.isArray(v)) return v as Array<Record<string, unknown>>;
    if (v && typeof v === "object") {
      const inner = v as Record<string, unknown>;
      for (const ik of ["payments", "items", "rows", "expenses"]) {
        if (Array.isArray(inner[ik])) return inner[ik] as Array<Record<string, unknown>>;
      }
    }
  }
  return [];
}
