import { useCallback, useEffect, useMemo } from "react";
import { dealId, useShopOwnerData } from "../context/ShopOwnerDataProvider";
import { isPartsDeal } from "../lib/shopOwnerParsers";

export type DealFilter = "all" | "service" | "parts";

export function useShopDeals(filter: DealFilter = "all") {
  const { sections, loadSection, refreshSection } = useShopOwnerData();
  const state = sections.deals;
  const deals = state.data ?? [];

  useEffect(() => {
    void loadSection("deals");
  }, [loadSection]);

  const refresh = useCallback(async () => {
    await refreshSection("deals");
  }, [refreshSection]);

  const filtered = useMemo(() => {
    if (filter === "all") return deals;
    if (filter === "parts") return deals.filter(isPartsDeal);
    return deals.filter((d) => !isPartsDeal(d));
  }, [deals, filter]);

  return {
    deals: filtered,
    allDeals: deals,
    loading: state.loading && !state.loaded,
    error: state.error,
    refresh,
    dealId,
  };
}
