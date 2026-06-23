export type ServiceSubItem = {
  id?: string;
  name: string;
  desc?: string;
};

export type OwnerShopType = "autoShop" | "tyreShop" | "carWash" | "towTruck";

export type ServiceCategory = {
  id?: string;
  name: string;
  desc?: string;
  shopType?: OwnerShopType;
  subServices: ServiceSubItem[];
};

function lineId(raw: Record<string, unknown>): string | undefined {
  if (typeof raw._id === "string") return raw._id;
  if (typeof raw.id === "string") return raw.id;
  return undefined;
}

function normalizeSubItem(raw: unknown): ServiceSubItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name.trim() : "";
  if (!name) return null;
  const desc =
    typeof o.desc === "string"
      ? o.desc.trim()
      : typeof o.description === "string"
        ? o.description.trim()
        : undefined;
  return { id: lineId(o), name, desc: desc || undefined };
}

function nestedSubItems(raw: Record<string, unknown>): ServiceSubItem[] {
  const nested = raw.services ?? raw.subServices;
  if (!Array.isArray(nested)) return [];
  const out: ServiceSubItem[] = [];
  for (const item of nested) {
    const sub = normalizeSubItem(item);
    if (sub) out.push(sub);
  }
  return out;
}

function normalizeCategory(raw: unknown): ServiceCategory | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const name =
    typeof o.name === "string"
      ? o.name.trim()
      : typeof o.title === "string"
        ? o.title.trim()
        : "";
  if (!name) return null;
  const desc =
    typeof o.desc === "string"
      ? o.desc.trim()
      : typeof o.description === "string"
        ? o.description.trim()
        : undefined;
  let subServices = nestedSubItems(o);
  const shopTypeRaw = typeof o.shopType === "string" ? o.shopType.trim() : "";
  const shopType =
    shopTypeRaw === "autoShop" ||
    shopTypeRaw === "tyreShop" ||
    shopTypeRaw === "carWash" ||
    shopTypeRaw === "towTruck"
      ? shopTypeRaw
      : undefined;
  return {
    id: lineId(o),
    name,
    desc: desc || undefined,
    shopType,
    subServices,
  };
}

function extractArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  if (Array.isArray(root.data)) return root.data;
  const nested =
    root.data && typeof root.data === "object" && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : null;
  const candidates = [root.services, nested?.services, nested?.data, root.categories];
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }
  return [];
}

export function parseServiceCatalogResponse(payload: unknown): ServiceCategory[] {
  const out: ServiceCategory[] = [];
  for (const item of extractArray(payload)) {
    const cat = normalizeCategory(item);
    if (cat) out.push(cat);
  }
  return out;
}

function normalizeServiceKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function isCarWashingServiceName(name: string): boolean {
  const n = normalizeServiceKey(name);
  return n.includes("car wash") || n.includes("car washing") || n === "washing";
}

export function isTowServiceName(name: string): boolean {
  const n = normalizeServiceKey(name);
  return n.includes("tow") || n.includes("towing");
}

export function isOutdoorService(name: string): boolean {
  return isCarWashingServiceName(name) || isTowServiceName(name) || normalizeServiceKey(name).includes("detailing");
}

export function isOutdoorServiceCategory(category: Pick<ServiceCategory, "name" | "shopType">): boolean {
  if (category.shopType === "carWash" || category.shopType === "towTruck") return true;
  return isOutdoorService(category.name);
}

const HOME_OUTDOOR_FALLBACKS: ServiceCategory[] = [
  { name: "Car Washing", subServices: [], shopType: "carWash" },
  { name: "Tow Service", subServices: [], shopType: "towTruck" },
];

export function partitionOwnerHomeSidebarServices(categories: ServiceCategory[]): {
  indoor: ServiceCategory[];
  outdoor: ServiceCategory[];
} {
  const indoor: ServiceCategory[] = [];
  let carWashing: ServiceCategory | null = null;
  let towService: ServiceCategory | null = null;

  for (const category of categories) {
    if (isCarWashingServiceName(category.name) || category.shopType === "carWash") {
      if (!carWashing) carWashing = category;
      continue;
    }
    if (isTowServiceName(category.name) || category.shopType === "towTruck") {
      if (!towService) towService = category;
      continue;
    }
    indoor.push(category);
  }

  const outdoor: ServiceCategory[] = [
    carWashing
      ? { ...carWashing, name: "Car Washing", shopType: "carWash" }
      : HOME_OUTDOOR_FALLBACKS[0],
    towService
      ? { ...towService, name: "Tow Service", shopType: "towTruck" }
      : HOME_OUTDOOR_FALLBACKS[1],
  ];

  return { indoor, outdoor };
}
