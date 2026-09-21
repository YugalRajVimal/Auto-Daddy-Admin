import { useCallback, useEffect } from "react";
import { useShopOwnerData, type PartsDealerCard } from "../context/ShopOwnerDataProvider";

export type { PartsDealerCard };

/**
 * Dealer ads for the shop portal (home ads, dealers panel, People → Dealers) — loaded from
 * `/autoshop-deals/dealers`.
 */
export function usePartsDealers() {
  const { sections, loadSection, refreshSection } = useShopOwnerData();
  const state = sections.partsDealers;

  useEffect(() => {
    void loadSection("partsDealers", { force: true });
  }, [loadSection]);

  const refresh = useCallback(async () => {
    await refreshSection("partsDealers");
  }, [refreshSection]);

  const dealers = state.data ?? [];

  return {
    dealers,
    loading: state.loading,
    isDummy: false,
    refresh,
  };
}
