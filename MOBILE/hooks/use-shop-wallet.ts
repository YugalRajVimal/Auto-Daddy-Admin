import { fetchAutoshopJobCards } from "@/lib/autoshopowner-job-cards-api";
import {
  isJobCardPaid,
  parseJobCardsFromPagePayload,
  type JobCardListRow,
} from "@/lib/shop-owner-job-cards";
import { useCallback, useState } from "react";

/**
 * Wallet invoices match web ShopOwnerDataProvider:
 * only `convertedToInvoice`, then split by `invoicePaid` / paid status.
 */
export function useShopWallet(
  token: string | null,
  enabled: boolean,
  showToast: (message: string, options?: { type?: "error" | "success" | "info" }) => void
) {
  const [paid, setPaid] = useState<JobCardListRow[]>([]);
  const [unpaid, setUnpaid] = useState<JobCardListRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!token || !enabled) {
      return;
    }
    setLoading(true);
    try {
      const convertedRes = await fetchAutoshopJobCards(token, { status: "convertedToInvoice" });
      if (!convertedRes.ok) {
        setPaid([]);
        setUnpaid([]);
        showToast("Could not load wallet data.", { type: "error" });
        return;
      }
      const converted = parseJobCardsFromPagePayload(convertedRes.data);
      setPaid(converted.filter((row) => isJobCardPaid(row)));
      setUnpaid(converted.filter((row) => !isJobCardPaid(row)));
    } catch {
      showToast("Network error.", { type: "error" });
    } finally {
      setLoading(false);
    }
  }, [enabled, showToast, token]);

  return {
    paid,
    unpaid,
    /** @deprecated Prefer `paid` — kept for older call sites. */
    paidOnline: paid,
    /** @deprecated Prefer `unpaid` — kept for older call sites. */
    unpaidOnline: unpaid,
    paidCash: [] as JobCardListRow[],
    unpaidCash: [] as JobCardListRow[],
    loading,
    refresh,
  };
}
