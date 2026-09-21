import { useCallback, useEffect } from "react";
import { useShopOwnerData, type PartsDealerCard } from "../context/ShopOwnerDataProvider";
import { DUMMY_PARTS_DEALERS } from "../lib/dummyPartsDealers";

export type { PartsDealerCard };

/**
 * Dealer ads for the shop portal (home ads, dealers panel, People → Dealers) — loaded from
 * `/autoshop-deals/dealers`. Falls back to sample dealers while none are listed.
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

  const realDealers = state.data ?? [];
  const isDummy = !state.loading && realDealers.length === 0;

  return {
    dealers: isDummy ? DUMMY_PARTS_DEALERS : realDealers,
    loading: state.loading,
    isDummy,
    refresh,
  };
}
