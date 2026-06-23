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

export function isCarWashingSubCategory(
  category: Pick<ServiceCategory, "name" | "shopType">
): boolean {
  if (category.shopType === "carWash") return false;
  const n = normalizeServiceKey(category.name);
  if (n.includes("double foam")) return true;
  if ((n.includes("outdoor") || n.includes("out door")) && n.includes("wash")) return true;
  if (n === "detailing" || (n.includes("detailing") && !n.includes("car wash"))) return true;
  return false;
}

export function isTowSubCategory(category: Pick<ServiceCategory, "name">): boolean {
  const n = normalizeServiceKey(category.name);
  return n.includes("in city") || n.includes("within city") || n.includes("out of city");
}

export function isOutdoorService(name: string): boolean {
  return (
    isCarWashingServiceName(name) ||
    isTowServiceName(name) ||
    isCarWashingSubCategory({ name }) ||
    isTowSubCategory({ name })
  );
}

export function isOutdoorServiceCategory(category: Pick<ServiceCategory, "name" | "shopType">): boolean {
  if (category.shopType === "carWash" || category.shopType === "towTruck") return true;
  if (isCarWashingSubCategory(category) || isTowSubCategory(category)) return true;
  return isOutdoorService(category.name);
}

const DEFAULT_CAR_WASHING_SUBS: ServiceSubItem[] = [
  { name: "OUT DOOR CAR WASH" },
  { name: "DETAILING" },
  { name: "DOUBLE FOAM COMPLETE WASH & DETAILING" },
];

const DEFAULT_TOW_SUBS: ServiceSubItem[] = [
  { name: "WITH IN CITY" },
  { name: "OUT OF CITY" },
];

function categoryAsSubItem(category: ServiceCategory): ServiceSubItem {
  return { id: category.id, name: category.name, desc: category.desc };
}

function mergeSubServices(...sources: ServiceSubItem[][]): ServiceSubItem[] {
  const seen = new Set<string>();
  const out: ServiceSubItem[] = [];
  for (const list of sources) {
    for (const sub of list) {
      const key = normalizeServiceKey(sub.name);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(sub);
    }
  }
  return out;
}

export function partitionOwnerHomeSidebarServices(categories: ServiceCategory[]): {
  indoor: ServiceCategory[];
  outdoor: ServiceCategory[];
} {
  const indoor: ServiceCategory[] = [];
  const carWashSubs: ServiceSubItem[] = [];
  const towSubs: ServiceSubItem[] = [];
  let carWashingParent: ServiceCategory | null = null;
  let towParent: ServiceCategory | null = null;

  for (const category of categories) {
    if (isTowSubCategory(category)) {
      towSubs.push(categoryAsSubItem(category), ...category.subServices);
      continue;
    }
    if (isCarWashingSubCategory(category)) {
      carWashSubs.push(categoryAsSubItem(category), ...category.subServices);
      continue;
    }
    if (isTowServiceName(category.name) || category.shopType === "towTruck") {
      if (!towParent) towParent = category;
      towSubs.push(...category.subServices);
      continue;
    }
    if (isCarWashingServiceName(category.name) || category.shopType === "carWash") {
      if (!carWashingParent) carWashingParent = category;
      carWashSubs.push(...category.subServices);
      continue;
    }
    if (normalizeServiceKey(category.name).includes("detailing")) {
      carWashSubs.push(categoryAsSubItem(category), ...category.subServices);
      continue;
    }
    indoor.push(category);
  }

  const carWashingSubServices = mergeSubServices(carWashSubs, DEFAULT_CAR_WASHING_SUBS);
  const towSubServices = mergeSubServices(towSubs, DEFAULT_TOW_SUBS);

  const outdoor: ServiceCategory[] = [
    {
      ...(carWashingParent ?? { subServices: [] }),
      name: "Car Washing",
      shopType: "carWash",
      subServices: carWashingSubServices,
    },
    {
      ...(towParent ?? { subServices: [] }),
      name: "Tow Service",
      shopType: "towTruck",
      subServices: towSubServices,
    },
  ];

  return { indoor, outdoor };
}
