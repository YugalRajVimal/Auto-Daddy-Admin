import { useCallback, useEffect } from "react";
import { useShopOwnerData } from "../context/ShopOwnerDataProvider";

export type WalletTab = "all" | "paid" | "unpaid" | "expenses";

export function useShopWallet() {
  const { sections, loadSection, refreshSection } = useShopOwnerData();
  const state = sections.wallet;
  const wallet = state.data ?? { paid: [], unpaid: [] };

  useEffect(() => {
    void loadSection("wallet");
  }, [loadSection]);

  const refresh = useCallback(async () => {
    await refreshSection("wallet");
  }, [refreshSection]);

  return {
    paid: wallet.paid,
    unpaid: wallet.unpaid,
    loading: state.loading && !state.loaded,
    error: state.error,
    refresh,
  };
}
