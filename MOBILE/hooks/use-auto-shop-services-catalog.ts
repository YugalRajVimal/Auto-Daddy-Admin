import { fetchAdminServices } from "@/lib/autoshopowner-api";
import type { ServiceCatalogCategory, ServiceCatalogLine } from "@/types/service-catalog";
import { useCallback, useState } from "react";

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
  return {
    id: lineId(o),
    name,
    desc: desc?.trim() || undefined,
    price: typeof price === "string" || typeof price === "number" ? price : undefined,
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

function categoryId(raw: Record<string, unknown>): string | undefined {
  return lineId(raw);
}

function normalizeCategory(raw: unknown): ServiceCatalogCategory | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const name =
    typeof o.name === "string"
      ? o.name.trim()
      : typeof o.title === "string"
        ? o.title.trim()
        : "";
  if (!name) {
    return null;
  }
  const desc =
    typeof o.desc === "string"
      ? o.desc
      : typeof o.description === "string"
        ? o.description
        : undefined;
  let items = nestedLines(o);
  if (items.length === 0) {
    const single = normalizeLine(raw);
    if (single) {
      items = [single];
    }
  }
  return {
    id: categoryId(o),
    name,
    desc: desc?.trim() || undefined,
    items,
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

export function useAutoShopServicesCatalog(
  token: string | null,
  enabled: boolean,
  showToast: (message: string, options?: { type?: "error" | "success" | "info" }) => void
) {
  const [categories, setCategories] = useState<ServiceCatalogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCatalog = useCallback(async () => {
    if (!enabled || !token) {
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetchAdminServices(token, {});
      const json = response.data as ApiEnvelope | unknown;
      if (!response.ok) {
        let msg = "Could not load services.";
        if (json && typeof json === "object" && "message" in json) {
          const m = (json as ApiEnvelope).message;
          if (typeof m === "string" && m.trim()) {
            msg = m;
          }
        }
        showToast(msg, { type: "error" });
        setCategories([]);
        return;
      }
      const parsed = parseServiceCatalogResponse(json);
      setCategories(parsed);
    } catch {
      showToast("Network error while loading services.", { type: "error" });
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, showToast, token]);

  return { categories, isLoading, fetchCatalog };
}
