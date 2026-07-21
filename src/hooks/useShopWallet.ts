import { useCallback, useEffect } from "react";
import { useShopOwnerData } from "../context/ShopOwnerDataProvider";

export type WalletTab = "all" | "paid" | "unpaid" | "expenses";

export function useShopWallet() {
  const { sections, loadSection, refreshSection } = useShopOwnerData();
  const state = sections.wallet;
  const wallet = state.data ?? {
    paid: [],
    unpaid: [],
    paidCash: [],
    paidOnline: [],
    unpaidCash: [],
    unpaidOnline: [],
  };

  useEffect(() => {
    void loadSection("wallet", { force: true });
  }, [loadSection]);

  const refresh = useCallback(async () => {
    await refreshSection("wallet");
  }, [refreshSection]);

  return {
    paid: wallet.paid,
    unpaid: wallet.unpaid,
    paidCash: wallet.paidCash,
    paidOnline: wallet.paidOnline,
    unpaidCash: wallet.unpaidCash,
    unpaidOnline: wallet.unpaidOnline,
    loading: state.loading,
    error: state.error,
    refresh,
  };
}
