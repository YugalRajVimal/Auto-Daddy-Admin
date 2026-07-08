import { useCallback, useEffect } from "react";
import { useShopOwnerData } from "../context/ShopOwnerDataProvider";

export function useShopPayments() {
  const { sections, loadSection, refreshSection } = useShopOwnerData();
  const state = sections.payments;

  useEffect(() => {
    void loadSection("payments");
  }, [loadSection]);

  const refresh = useCallback(async () => {
    await refreshSection("payments");
  }, [refreshSection]);

  return {
    rows: state.data ?? [],
    loading: state.loading && !state.loaded,
    error: state.error,
    refresh,
  };
}
