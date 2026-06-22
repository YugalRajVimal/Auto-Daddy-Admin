import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth";
import { fetchPaidJobCards, fetchUnpaidJobCards } from "../lib/shopOwnerApi";
import { parsePaidWalletPayload, parseUnpaidWalletPayload } from "../lib/shopOwnerWallet";
import type { JobCardListRow } from "../lib/shopOwnerJobCards";

export type WalletTab = "all" | "paid" | "unpaid" | "expenses";

export function useShopWallet() {
  const { token } = useAuth();
  const [paid, setPaid] = useState<JobCardListRow[]>([]);
  const [unpaid, setUnpaid] = useState<JobCardListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) {
      setPaid([]);
      setUnpaid([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [paidRes, unpaidRes] = await Promise.all([
        fetchPaidJobCards(token),
        fetchUnpaidJobCards(token),
      ]);
      if (paidRes.ok) {
        const { cash, online } = parsePaidWalletPayload(paidRes.data);
        setPaid([...cash, ...online]);
      } else {
        setPaid([]);
      }
      if (unpaidRes.ok) {
        const { cash, online } = parseUnpaidWalletPayload(unpaidRes.data);
        setUnpaid([...cash, ...online]);
      } else {
        setUnpaid([]);
      }
      if (!paidRes.ok && !unpaidRes.ok) {
        setError("Could not load wallet data.");
      }
    } catch {
      setError("Network error.");
      setPaid([]);
      setUnpaid([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { paid, unpaid, loading, error, refresh };
}
