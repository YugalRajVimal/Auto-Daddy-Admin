import { useCallback, useEffect } from "react";
import {
  FALLBACK_PARTS_DEALERS,
  useShopOwnerData,
  type PartsDealerCard,
} from "../context/ShopOwnerDataProvider";

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
    dealers: state.data ?? FALLBACK_PARTS_DEALERS,
    loading: state.loading && !state.loaded,
    refresh,
  };
}
