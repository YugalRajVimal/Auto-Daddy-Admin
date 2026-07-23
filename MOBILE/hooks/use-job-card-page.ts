import {
  fetchAutoshopJobCards,
  fetchAutoshopPendingApprovalJobCards,
  type AutoshopJobCardStatus,
} from "@/lib/autoshopowner-job-cards-api";
import { parseJobCardsFromPagePayload } from "@/lib/shop-owner-job-cards";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";

export type JobCardListSection = "all" | "approvals" | "invoice" | "paid";

function statusForSection(section: JobCardListSection): AutoshopJobCardStatus | undefined {
  if (section === "invoice") return "convertedToInvoice";
  if (section === "paid") return "CashPaid";
  return undefined;
}

export function useJobCardPage(
  token: string | null,
  enabled: boolean,
  showToast: (message: string, options?: { type?: "error" | "success" | "info" }) => void,
  section: JobCardListSection = "all",
  search?: string
) {
  const [payload, setPayload] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const searchTrimmed = (search ?? "").trim();

  const load = useCallback(async () => {
    if (!token || !enabled) {
      return;
    }
    setLoading(true);
    try {
      const res =
        section === "approvals"
          ? await fetchAutoshopPendingApprovalJobCards(token)
          : await fetchAutoshopJobCards(token, {
              status: statusForSection(section),
              search: searchTrimmed || undefined,
            });
      if (!res.ok) {
        showToast("Could not load job card overview.", { type: "error" });
        setPayload(null);
        return;
      }
      setPayload(res.data);
    } catch {
      showToast("Network error.", { type: "error" });
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, searchTrimmed, section, showToast, token]);

  useLayoutEffect(() => {
    if (!token || !enabled) {
      return;
    }
    setLoading(true);
  }, [enabled, searchTrimmed, section, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const cards = useMemo(() => parseJobCardsFromPagePayload(payload), [payload]);

  return { payload, loading, load, cards };
}
