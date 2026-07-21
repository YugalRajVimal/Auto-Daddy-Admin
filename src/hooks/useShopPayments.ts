import { useCallback, useEffect } from "react";
import { useShopOwnerData } from "../context/ShopOwnerDataProvider";

export function useShopPayments() {
  const { sections, loadSection, refreshSection } = useShopOwnerData();
  const state = sections.payments;

  useEffect(() => {
    void loadSection("payments", { force: true });
  }, [loadSection]);

  const refresh = useCallback(async () => {
    await refreshSection("payments");
  }, [refreshSection]);

  return {
    rows: state.data ?? [],
    loading: state.loading,
    error: state.error,
    refresh,
  };
}
