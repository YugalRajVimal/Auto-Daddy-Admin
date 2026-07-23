import { fetchAdminServices } from "@/lib/autoshopowner-api";
import {
  SHOP_OWNER_SHOP_TYPES,
  normalizeShopOwnerShopTypes,
  type ShopOwnerShopType,
} from "@/lib/shop-owner-shop-types";
import type { ServiceCatalogCategory, ServiceCatalogLine } from "@/types/service-catalog";
import { useCallback, useMemo, useState } from "react";

type ApiEnvelope = {
  success?: boolean;
  message?: string;
  data?: unknown;
  services?: unknown;
};

function lineId(raw: Record<string, unknown>): string | undefined {
  if (typeof raw._id === "string") {
    return raw._id;
  }
  if (typeof raw.id === "string") {
    return raw.id;
  }
  return undefined;
}

function normalizeLine(raw: unknown): ServiceCatalogLine | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name.trim() : "";
  if (!name) {
    return null;
  }
  const desc =
    typeof o.desc === "string"
      ? o.desc
      : typeof o.description === "string"
        ? o.description
        : undefined;
  const price = o.price;
  const qtyRaw = o.quantity ?? o.qty;
  const quantity =
    typeof qtyRaw === "number"
      ? qtyRaw
      : typeof qtyRaw === "string"
        ? Number.parseFloat(qtyRaw)
        : undefined;
  const taxRaw = o.tax;
  const tax =
    typeof taxRaw === "number"
      ? taxRaw
      : typeof taxRaw === "string"
        ? Number.parseFloat(taxRaw)
        : undefined;
  return {
    id: lineId(o),
    name,
    desc: desc?.trim() || undefined,
    price: typeof price === "string" || typeof price === "number" ? price : undefined,
    make: typeof o.make === "string" ? o.make.trim() || undefined : undefined,
    model: typeof o.model === "string" ? o.model.trim() || undefined : undefined,
    quantity: quantity != null && Number.isFinite(quantity) ? quantity : undefined,
    tax: tax != null && Number.isFinite(tax) ? tax : undefined,
  };
}

function nestedLines(raw: Record<string, unknown>): ServiceCatalogLine[] {
  const nested = raw.services ?? raw.subServices;
  if (!Array.isArray(nested)) {
    return [];
  }
  const out: ServiceCatalogLine[] = [];
  for (const item of nested) {
    const line = normalizeLine(item);
    if (line) {
      out.push(line);
    }
  }
  return out;
}

function normalizeCategory(raw: unknown): ServiceCatalogCategory | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const id = lineId(o);
  const name =
    typeof o.name === "string"
      ? o.name.trim()
      : typeof o.title === "string"
        ? o.title.trim()
        : "";
  if (!id || !name) {
    return null;
  }
  const desc =
    typeof o.desc === "string"
      ? o.desc
      : typeof o.description === "string"
        ? o.description
        : undefined;
  const shopTypeRaw = typeof o.shopType === "string" ? o.shopType.trim() : "";
  return {
    id,
    name,
    desc: desc?.trim() || undefined,
    shopType: shopTypeRaw || undefined,
    odoOutRequired: o.odoOutRequired === true,
    items: nestedLines(o),
  };
}

function extractArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (!payload || typeof payload !== "object") {
    return [];
  }
  const root = payload as Record<string, unknown>;
  if (Array.isArray(root.data)) {
    return root.data;
  }
  const nested =
    root.data && typeof root.data === "object" && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : null;
  const candidates = [root.services, nested?.services, nested?.data, root.categories];
  for (const c of candidates) {
    if (Array.isArray(c)) {
      return c;
    }
  }
  return [];
}

export function parseServiceCatalogResponse(payload: unknown): ServiceCatalogCategory[] {
  const arr = extractArray(payload);
  const out: ServiceCatalogCategory[] = [];
  for (const item of arr) {
    const cat = normalizeCategory(item);
    if (cat) {
      out.push(cat);
    }
  }
  return out;
}

function resolveShopTypes(shopTypes?: string[] | null): ShopOwnerShopType[] {
  const normalized = normalizeShopOwnerShopTypes(shopTypes ?? null);
  return normalized.length > 0 ? normalized : [...SHOP_OWNER_SHOP_TYPES];
}

export function useAutoShopServicesCatalog(
  token: string | null,
  enabled: boolean,
  showToast: (message: string, options?: { type?: "error" | "success" | "info" }) => void,
  shopTypes?: string[] | null
) {
  const [categories, setCategories] = useState<ServiceCatalogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const typesToFetch = useMemo(() => resolveShopTypes(shopTypes), [shopTypes?.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCatalog = useCallback(async () => {
    if (!enabled || !token) {
      return;
    }
    setIsLoading(true);
    try {
      const results = await Promise.all(
        typesToFetch.map((shopType) => fetchAdminServices(token, { shopType }))
      );

      const byId = new Map<string, ServiceCatalogCategory>();
      let anyOk = false;
      let lastError = "";

      for (const response of results) {
        const json = response.data as ApiEnvelope | unknown;
        if (!response.ok) {
          if (json && typeof json === "object" && "message" in json) {
            const m = (json as ApiEnvelope).message;
            if (typeof m === "string" && m.trim()) {
              lastError = m;
            }
          }
          continue;
        }
        anyOk = true;
        for (const cat of parseServiceCatalogResponse(json)) {
          const id = cat.id?.trim();
          if (id && !byId.has(id)) {
            byId.set(id, cat);
          }
        }
      }

      if (!anyOk) {
        showToast(lastError || "Could not load services.", { type: "error" });
        setCategories([]);
        return;
      }

      setCategories([...byId.values()]);
    } catch {
      showToast("Network error while loading services.", { type: "error" });
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, showToast, token, typesToFetch]);

  return { categories, isLoading, fetchCatalog };
}
