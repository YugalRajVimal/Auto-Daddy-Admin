import { fetchPaidJobCards, fetchUnpaidJobCards } from "@/lib/shop-owner-api";
import type { JobCardListRow } from "@/lib/shop-owner-job-cards";
import { parsePaidWalletPayload, parseUnpaidWalletPayload } from "@/lib/wallet-helpers";
import { useCallback, useState } from "react";

export function useShopWallet(
  token: string | null,
  enabled: boolean,
  showToast: (message: string, options?: { type?: "error" | "success" | "info" }) => void
) {
  const [paidCash, setPaidCash] = useState<JobCardListRow[]>([]);
  const [paidOnline, setPaidOnline] = useState<JobCardListRow[]>([]);
  const [unpaidCash, setUnpaidCash] = useState<JobCardListRow[]>([]);
  const [unpaidOnline, setUnpaidOnline] = useState<JobCardListRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!token || !enabled) {
      return;
    }
    setLoading(true);
    try {
      const [paid, unpaid] = await Promise.all([fetchPaidJobCards(token), fetchUnpaidJobCards(token)]);

      if (paid.ok) {
        const { cash, online } = parsePaidWalletPayload(paid.data);
        setPaidCash(cash as JobCardListRow[]);
        setPaidOnline(online as JobCardListRow[]);
      } else {
        setPaidCash([]);
        setPaidOnline([]);
      }
      if (unpaid.ok) {
        const { cash, online } = parseUnpaidWalletPayload(unpaid.data);
        setUnpaidCash(cash as JobCardListRow[]);
        setUnpaidOnline(online as JobCardListRow[]);
      } else {
        setUnpaidCash([]);
        setUnpaidOnline([]);
      }

      if (!paid.ok && !unpaid.ok) {
        showToast("Could not load wallet data.", { type: "error" });
      }
    } catch {
      showToast("Network error.", { type: "error" });
    } finally {
      setLoading(false);
    }
  }, [enabled, showToast, token]);

  return { paidCash, paidOnline, unpaidCash, unpaidOnline, loading, refresh };
}
