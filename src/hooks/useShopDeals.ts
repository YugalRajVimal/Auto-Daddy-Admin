import { useCallback, useEffect, useMemo, useState } from "react";
import useAuth from "../auth/useAuth";
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
      setError(null);
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

  const filtered = useMemo(() => {
    if (filter === "all") return deals;
    if (filter === "parts") return deals.filter(isPartsDeal);
    return deals.filter((d) => !isPartsDeal(d));
  }, [deals, filter]);

  return {
    deals: filtered,
    allDeals: deals,
    loading,
    error,
    refresh,
    dealId,
  };
}
