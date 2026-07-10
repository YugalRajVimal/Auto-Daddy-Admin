import { useCallback, useEffect, useState } from "react";
import { getJson } from "../api/mobileAuth";
import { normalizeCarOwnerAutoShopsPayload } from "../lib/carOwnerAutoShops";
import type { CarOwnerAutoShopListItem } from "../types/carOwnerAutoShops";
import { useAuth } from "../auth";

export type CarOwnerAutoShopsFilters = {
  serviceIds: readonly string[];
  carCompanyIds?: readonly string[];
  shopType?: string | null;
  search?: string | null;
  /** When false, skip the network request (e.g. waiting for a make selection). */
  enabled?: boolean;
};

/**
 * GET /api/user/auto-shops?search=&service=&carCompanies=&shopType=
 * (car-owner #ref.txt — Auto Shops / Ratings / Deals)
 */
function autoShopsPath(filters: {
  serviceIds: readonly string[];
  carCompanyIds?: readonly string[];
  shopType?: string | null;
  search?: string | null;
}): string {
  const usp = new URLSearchParams();
  const services = filters.serviceIds.map((id) => id.trim()).filter(Boolean);
  const companies = (filters.carCompanyIds ?? []).map((id) => id.trim()).filter(Boolean);
  const search = filters.search?.trim();
  if (services.length > 0) {
    usp.set("service", services.join(","));
  }
  if (companies.length > 0) {
    usp.set("carCompanies", companies.join(","));
  }
  if (filters.shopType) {
    usp.set("shopType", filters.shopType);
  }
  if (search) {
    usp.set("search", search);
  }
  const qs = usp.toString();
  return qs ? `/api/user/auto-shops?${qs}` : "/api/user/auto-shops";
}

export function useCarOwnerAutoShops(filters: CarOwnerAutoShopsFilters) {
  const { token } = useAuth();
  const [shops, setShops] = useState<CarOwnerAutoShopListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const enabled = filters.enabled !== false;
  const serviceIds = filters.serviceIds.map((id) => id.trim()).filter(Boolean);
  const carCompanyIds = (filters.carCompanyIds ?? []).map((id) => id.trim()).filter(Boolean);
  const shopType = filters.shopType?.trim() || null;
  const search = filters.search?.trim() || null;
  const serviceKey = serviceIds.join(",");
  const companyKey = carCompanyIds.join(",");

  const load = useCallback(async () => {
    if (!token || !enabled) {
      setShops([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const res = await getJson<unknown>(
      autoShopsPath({
        serviceIds,
        carCompanyIds,
        shopType,
        search,
      }),
      token
    );
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
  }, [token, enabled, serviceKey, companyKey, shopType, search]);

  useEffect(() => {
    void load();
  }, [load]);

  return { shops, loading, error, refresh: load };
}
