import { useCallback, useEffect, useState } from "react";
import { getJson } from "../api/mobileAuth";
import { normalizeCarOwnerAutoShopsPayload } from "../lib/carOwnerAutoShops";
import { getDummyCarOwnerAutoShops } from "../lib/dummyCarOwnerAutoShops";
import type { CarOwnerAutoShopListItem } from "../types/carOwnerAutoShops";
import { useAuth } from "../auth";

export type CarOwnerAutoShopsFilters = {
  serviceIds: readonly string[];
  carCompanyIds?: readonly string[];
  shopType?: string | null;
  search?: string | null;
};

function autoShopsPath(filters: CarOwnerAutoShopsFilters): string {
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

  const serviceKey = filters.serviceIds.join(",");
  const companyKey = (filters.carCompanyIds ?? []).join(",");
  const shopType = filters.shopType ?? null;
  const search = filters.search?.trim() ?? "";

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

    const next = normalizeCarOwnerAutoShopsPayload(payload);
    if (next.length === 0 && import.meta.env.DEV) {
      setShops(getDummyCarOwnerAutoShops(filters));
      setLoading(false);
      return;
    }

    setShops(next);
    setLoading(false);
  }, [token, serviceKey, companyKey, shopType, search]);

  useEffect(() => {
    void load();
  }, [load]);

  return { shops, loading, error, refresh: load };
}
