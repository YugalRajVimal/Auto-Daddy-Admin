import { useCallback, useEffect, useState } from "react";
import { getJson } from "../api/mobileAuth";
import { normalizeCarOwnerAutoShopsPayload } from "../lib/carOwnerAutoShops";
import type { CarOwnerAutoShopListItem } from "../types/carOwnerAutoShops";
import { useAuth } from "../auth";

export type CarOwnerAutoShopsFilters = {
  serviceIds: readonly string[];
  shopType?: string | null;
};

function autoShopsPath(filters: CarOwnerAutoShopsFilters): string {
  const usp = new URLSearchParams();
  const services = filters.serviceIds.map((id) => id.trim()).filter(Boolean);
  if (services.length > 0) {
    usp.set("service", services.join(","));
  }
  if (filters.shopType) {
    usp.set("shopType", filters.shopType);
  }
  const qs = usp.toString();
  return qs ? `/api/user/auto-shops?${qs}` : "/api/user/auto-shops";
}

export function useCarOwnerAutoShops(filters: CarOwnerAutoShopsFilters) {
  const { token } = useAuth();
  const [shops, setShops] = useState<CarOwnerAutoShopListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const serviceKey = filters.serviceIds.join(",");
  const shopType = filters.shopType ?? null;

  const load = useCallback(async () => {
    if (!token) {
      setShops([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const res = await getJson<unknown>(autoShopsPath(filters), token);
    if (!res.ok) {
      setShops([]);
      setError("Could not load auto shops.");
      setLoading(false);
      return;
    }

    const payload = res.data;
    if (payload && typeof payload === "object" && "success" in payload) {
      const success = (payload as { success?: boolean }).success;
      if (success === false) {
        setShops([]);
        setError("Could not load auto shops.");
        setLoading(false);
        return;
      }
    }

    setShops(normalizeCarOwnerAutoShopsPayload(payload));
    setLoading(false);
  }, [token, serviceKey, shopType]);

  useEffect(() => {
    void load();
  }, [load]);

  return { shops, loading, error, refresh: load };
}
