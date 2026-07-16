import { useCallback, useEffect } from "react";
import { useShopOwnerData, type PartsDealerCard } from "../context/ShopOwnerDataProvider";

export type { PartsDealerCard };

/** Dealer ads for shop home sidebar — loaded from `/autoshop-deals/dealers`. */
export function usePartsDealers() {
  const { sections, loadSection, refreshSection } = useShopOwnerData();
  const state = sections.partsDealers;

  useEffect(() => {
    void loadSection("partsDealers");
  }, [loadSection]);

  const refresh = useCallback(async () => {
    await refreshSection("partsDealers");
  }, [refreshSection]);

  return {
    dealers: state.data ?? [],
    loading: state.loading && !state.loaded,
    refresh,
  };
}
