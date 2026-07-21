import { useCallback, useEffect } from "react";
import { useShopOwnerData } from "../context/ShopOwnerDataProvider";

export function useShopServices() {
  const { sections, loadSection, refreshSection } = useShopOwnerData();
  const state = sections.services;

  useEffect(() => {
    void loadSection("services", { force: true });
  }, [loadSection]);

  const refresh = useCallback(async () => {
    await refreshSection("services");
  }, [refreshSection]);

  return {
    categories: state.data ?? [],
    loading: state.loading,
    loaded: state.loaded,
    error: state.error,
    refresh,
  };
}
