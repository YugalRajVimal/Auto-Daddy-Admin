import { useAuth } from "@/context/auth-provider";
import { getJson } from "@/lib/api";
import { normalizeCarOwnerAutoShopsPayload } from "@/lib/car-owner-auto-shops";
import { carOwnerShopTypeMatches, type CarOwnerShopType } from "@/lib/car-owner-shop-types";
import type { CarOwnerAutoShopListItem } from "@/types/car-owner-auto-shops";
import { useCallback, useEffect, useState } from "react";

export type CarOwnerAutoShopsFilters = {
  /** Main service category ids (comma-separated in query). */
  serviceIds: readonly string[];
  /** Car company ids (comma-separated in query). */
  carCompanyIds: readonly string[];
  /** Filter by backend `shopType` (tyreShop, carWash, towTruck, autoShops, …). */
  shopType?: CarOwnerShopType | null;
};

function autoShopsPath(filters: CarOwnerAutoShopsFilters): string {
  const usp = new URLSearchParams();
  const services = filters.serviceIds.map((id) => id.trim()).filter(Boolean);
  const companies = filters.carCompanyIds.map((id) => id.trim()).filter(Boolean);
  if (services.length > 0) {
    usp.set("service", services.join(","));
  }
  if (companies.length > 0) {
    usp.set("carCompanies", companies.join(","));
  }
  if (filters.shopType) {
    usp.set("shopType", filters.shopType);
  }
  const qs = usp.toString();
  return qs ? `/api/user/auto-shops?${qs}` : "/api/user/auto-shops";
}

export function useCarOwnerAutoShops(filters: CarOwnerAutoShopsFilters) {
  const { token, sessionRevision } = useAuth();
  const [shops, setShops] = useState<CarOwnerAutoShopListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setShops([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const res = await getJson<unknown>(autoShopsPath(filters), { authToken: token });
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

    const rows = normalizeCarOwnerAutoShopsPayload(payload);
    const shopTypeFilter = filters.shopType ?? null;
    setShops(
      shopTypeFilter
        ? rows.filter((shop) => carOwnerShopTypeMatches(shop.shopType, shopTypeFilter))
        : rows
    );
    setLoading(false);
  }, [token, filters.serviceIds, filters.carCompanyIds, filters.shopType]);

  useEffect(() => {
    void load();
  }, [load, sessionRevision]);

  return { shops, loading, error, refresh: load };
}
