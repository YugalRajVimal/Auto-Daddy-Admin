import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth";
import { fetchMyDeals } from "../lib/shopOwnerApi";
import { dealId, isPartsDeal, parseMyDeals } from "../lib/shopOwnerParsers";
import type { ShopDeal } from "../types/shopOwner";

export type DealFilter = "all" | "service" | "parts";

export function useShopDeals(filter: DealFilter = "all") {
  const { token } = useAuth();
  const [deals, setDeals] = useState<ShopDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) {
      setDeals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMyDeals(token);
      if (!res.ok) {
        setError("Could not load deals.");
        setDeals([]);
        return;
      }
      setDeals(parseMyDeals(res.data));
    } catch {
      setError("Network error.");
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered =
    filter === "all"
      ? deals
      : filter === "parts"
        ? deals.filter(isPartsDeal)
        : deals.filter((d) => !isPartsDeal(d));

  return { deals: filtered, allDeals: deals, loading, error, refresh, dealId };
}
