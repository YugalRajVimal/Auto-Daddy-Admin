import { useCallback, useEffect } from "react";
import { customerKey, useShopOwnerData } from "../context/ShopOwnerDataProvider";

export function useShopCustomers() {
  const { sections, loadSection, refreshSection } = useShopOwnerData();
  const state = sections.customers;

  useEffect(() => {
    void loadSection("customers");
  }, [loadSection]);

  const refresh = useCallback(async () => {
    await refreshSection("customers");
  }, [refreshSection]);

  return {
    customers: state.data ?? [],
    loading: state.loading && !state.loaded,
    error: state.error,
    refresh,
    customerKey,
  };
}
