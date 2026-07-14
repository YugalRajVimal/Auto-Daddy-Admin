import type { ShopServiceCategory } from "../types/shopOwner";
import { type ShopType } from "./shopTypes";

function serviceImage(seed: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/400/400`;
}

/** Placeholder catalog until my-services API is fully populated. */
export const DUMMY_SERVICES: ShopServiceCategory[] = [
  { id: "dummy-oil-change", name: "Oil Change", shopType: "autoShop", subServices: [] },
  { id: "dummy-brake-service", name: "Brake Service", shopType: "autoShop", subServices: [] },
  { id: "dummy-tire-rotation", name: "Tire Rotation", shopType: "tyreShop", subServices: [] },
  { id: "dummy-ac-repair", name: "AC Repair", shopType: "autoShop", subServices: [] },
  { id: "dummy-engine-diagnostic", name: "Engine Diagnostic", shopType: "autoShop", subServices: [] },
  { id: "dummy-transmission", name: "Transmission", shopType: "autoShop", subServices: [] },
  { id: "dummy-battery", name: "Battery Replacement", shopType: "autoShop", subServices: [] },
  { id: "dummy-alignment", name: "Wheel Alignment", shopType: "tyreShop", subServices: [] },
  { id: "dummy-exterior-wash", name: "Exterior Wash", shopType: "carWash", subServices: [] },
  { id: "dummy-interior-detail", name: "Interior Detailing", shopType: "carWash", subServices: [] },
  { id: "dummy-local-tow", name: "Local Towing", shopType: "towTruck", subServices: [] },
  { id: "dummy-long-distance-tow", name: "Long Distance Tow", shopType: "towTruck", subServices: [] },
];

/** Sample services shown on the shop profile for demo purposes. */
export const DUMMY_SELECTED_SERVICE_IDS = ["dummy-oil-change", "dummy-brake-service", "dummy-tire-rotation"];

/** Demo my-services payload for the shop services homepage when the API is empty. */
export const DUMMY_MY_SERVICES: ShopServiceCategory[] = [
  {
    id: "dummy-oil-change",
    name: "Oil Change",
    shopType: "autoShop",
    subServices: [
      {
        id: "dummy-oil-standard",
        name: "Standard Oil Change",
        desc: "Up to 5 quarts conventional oil with filter replacement.",
        price: 49.99,
      },
      {
        id: "dummy-oil-synthetic",
        name: "Full Synthetic Oil Change",
        desc: "Premium synthetic oil and new filter.",
        price: 89.99,
      },
      {
        id: "dummy-oil-high-mileage",
        name: "High Mileage Oil Change",
        desc: "Formulated for vehicles over 75,000 miles.",
        price: 69.99,
      },
    ],
  },
  {
    id: "dummy-brake-service",
    name: "Brake Service",
    shopType: "autoShop",
    subServices: [
      {
        id: "dummy-brake-inspection",
        name: "Brake Inspection",
        desc: "Complete brake system check including pads and rotors.",
        price: 29.99,
      },
      {
        id: "dummy-brake-pad",
        name: "Brake Pad Replacement",
        desc: "Front or rear brake pad replacement with labor.",
        price: 189.99,
      },
    ],
  },
  {
    id: "dummy-tire-rotation",
    name: "Tire Rotation",
    shopType: "tyreShop",
    subServices: [
      {
        id: "dummy-tire-rotation-basic",
        name: "Tire Rotation",
        desc: "Rotate all four tires and check tire pressure.",
        price: 24.99,
      },
      {
        id: "dummy-tire-balance",
        name: "Tire Rotation & Balance",
        desc: "Rotation plus wheel balance for smooth driving.",
        price: 59.99,
      },
    ],
  },
];

export function getDummyMyServices(): ShopServiceCategory[] {
  return DUMMY_MY_SERVICES.map((category) => ({
    ...category,
    subServices: category.subServices.map((sub) => ({ ...sub })),
  }));
}

export function getServiceId(category: ShopServiceCategory): string {
  return String(category.id);
}

export function getServiceName(category: ShopServiceCategory): string {
  return (category.name ?? "").trim() || "—";
}

function normalizeServiceName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

const DUMMY_IMAGE_BY_ID = new Map(
  DUMMY_SERVICES.map((service) => [getServiceId(service), serviceImage(`shop-service-${getServiceId(service)}`)])
);

const DUMMY_IMAGE_BY_NAME = new Map(
  DUMMY_SERVICES.map((service) => [
    normalizeServiceName(getServiceName(service)),
    serviceImage(`shop-service-${getServiceId(service)}`),
  ])
);

function findDummyServiceByName(name: string): ShopServiceCategory | undefined {
  const key = normalizeServiceName(name);
  return DUMMY_SERVICES.find((service) => normalizeServiceName(getServiceName(service)) === key);
}

function letterFallback(name: string): string {
  const label = encodeURIComponent(name || "Service");
  return `https://ui-avatars.com/api/?name=${label}&background=e8f5e9&color=006600&size=128&bold=true`;
}

/** Resolve a display image — dummy catalog match first, then generated placeholder. */
export function resolveServiceImage(category?: ShopServiceCategory | null): string {
  if (!category) return letterFallback("Service");

  const id = getServiceId(category);
  const name = getServiceName(category);

  const byId = DUMMY_IMAGE_BY_ID.get(id);
  if (byId) return byId;

  const byName = DUMMY_IMAGE_BY_NAME.get(normalizeServiceName(name));
  if (byName) return byName;

  const dummy = findDummyServiceByName(name);
  if (dummy) return DUMMY_IMAGE_BY_ID.get(getServiceId(dummy)) ?? letterFallback(name);

  return serviceImage(`shop-service-${normalizeServiceName(name) || "generic"}`);
}

/**
 * Enrich API catalog entries with dummy image/sub-service fallbacks.
 * Does not inject dummy-only rows — those would skip `addMyService` (dummy-* ids).
 */
export function mergeServiceCatalog(apiServices: ShopServiceCategory[]): ShopServiceCategory[] {
  return apiServices.map((apiService) => {
    const dummy = findDummyServiceByName(getServiceName(apiService));
    return {
      ...dummy,
      ...apiService,
      id: apiService.id,
      name: apiService.name ?? dummy?.name,
      shopType: apiService.shopType ?? dummy?.shopType,
      subServices:
        apiService.subServices.length > 0 ? apiService.subServices : (dummy?.subServices ?? []),
    };
  });
}

export function buildSelectedServiceIds(
  catalog: ShopServiceCategory[],
  apiSelected: ShopServiceCategory[]
): Set<string> {
  const ids = new Set<string>();

  for (const apiService of apiSelected) {
    const id = getServiceId(apiService);
    if (id) ids.add(id);
  }

  if (ids.size > 0) return ids;

  for (const service of catalog) {
    const id = getServiceId(service);
    if (id && apiSelected.some((s) => getServiceId(s) === id)) {
      ids.add(id);
    }
  }

  return ids;
}

export function getInitialProfileServiceIds(myServices: ShopServiceCategory[]): Set<string> {
  return new Set(myServices.map((service) => getServiceId(service)).filter(Boolean));
}

export function resolveProfileSelectedServices(
  catalog: ShopServiceCategory[],
  myServices: ShopServiceCategory[],
  selectedIds: Set<string>
): ShopServiceCategory[] {
  if (selectedIds.size === 0) return [];

  const byId = new Map<string, ShopServiceCategory>();
  for (const service of [...catalog, ...myServices]) {
    const id = getServiceId(service);
    if (id) byId.set(id, service);
  }

  return [...selectedIds]
    .map((id) => byId.get(id))
    .filter((service): service is ShopServiceCategory => Boolean(service));
}

export function getSelectedServices(
  catalog: ShopServiceCategory[],
  selectedIds: Set<string>
): ShopServiceCategory[] {
  const selectedNames = new Set<string>();
  for (const service of catalog) {
    if (selectedIds.has(getServiceId(service))) {
      selectedNames.add(normalizeServiceName(getServiceName(service)));
    }
  }

  return catalog.filter((service) => selectedNames.has(normalizeServiceName(getServiceName(service))));
}

export function isDummyServiceId(id: string): boolean {
  return id.startsWith("dummy-");
}

function extractServiceCatalogArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  if (Array.isArray(root.data)) return root.data;
  if (Array.isArray(root.services)) return root.services;
  const nested =
    root.data && typeof root.data === "object" && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : null;
  if (nested && Array.isArray(nested.services)) return nested.services;
  if (nested && Array.isArray(nested.data)) return nested.data;
  return [];
}

function parseCatalogSubServices(raw: unknown): ShopServiceCategory["subServices"] {
  if (!Array.isArray(raw)) return [];
  const out: ShopServiceCategory["subServices"] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const name = String(o.name ?? "").trim();
    if (!name) continue;
    const priceRaw = o.price;
    const qtyRaw = o.quantity ?? o.qty;
    const taxRaw = o.tax;
    const price = typeof priceRaw === "number" ? priceRaw : Number(priceRaw);
    const qty = typeof qtyRaw === "number" ? qtyRaw : Number(qtyRaw);
    const tax = typeof taxRaw === "number" ? taxRaw : Number(taxRaw);
    const make = String(o.make ?? "").trim();
    const model = String(o.model ?? "").trim();
    out.push({
      id: typeof o._id === "string" ? o._id : typeof o.id === "string" ? o.id : undefined,
      ...(make ? { make } : {}),
      ...(model ? { model } : {}),
      name,
      desc: String(o.desc ?? o.description ?? "").trim(),
      price: Number.isFinite(price) ? price : 0,
      ...(Number.isFinite(qty) && qty > 0 ? { qty } : {}),
      ...(Number.isFinite(tax) ? { tax } : {}),
    });
  }
  return out;
}

export function parseServiceCatalog(payload: unknown): ShopServiceCategory[] {
  const raw = extractServiceCatalogArray(payload);
  const out: ShopServiceCategory[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const id = String(o._id ?? o.id ?? "");
    const name = String(o.name ?? "").trim();
    const shopTypeRaw = typeof o.shopType === "string" ? o.shopType.trim() : "";
    const shopType =
      shopTypeRaw === "autoShop" ||
      shopTypeRaw === "tyreShop" ||
      shopTypeRaw === "carWash" ||
      shopTypeRaw === "towTruck"
        ? (shopTypeRaw as ShopType)
        : undefined;
    if (!id || !name) continue;
    out.push({
      id,
      name,
      shopType,
      odoOutRequired: o.odoOutRequired === true,
      subServices: parseCatalogSubServices(o.subServices),
    });
  }
  return out;
}
