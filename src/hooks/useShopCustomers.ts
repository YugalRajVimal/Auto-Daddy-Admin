import { useCallback, useEffect } from "react";
import { useAuth } from "../auth";
import { customerKey, useShopOwnerData } from "../context/ShopOwnerDataProvider";

export function useShopCustomers() {
  const { token } = useAuth();
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
    loaded: state.loaded,
    loading: Boolean(token) && !state.loaded,
    error: state.error,
    refresh,
    customerKey,
  };
}
