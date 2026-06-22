import {
  buildMyCustomersQuery,
  fetchJobCards,
  type MyCustomersPeriod,
} from "@/lib/auto-shop-owner-api";
import { parseJobCardsFromPagePayload } from "@/lib/parse-job-card-page";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";

export function useJobCardPage(
  token: string | null,
  enabled: boolean,
  showToast: (message: string, options?: { type?: "error" | "success" | "info" }) => void,
  listPeriod: MyCustomersPeriod
) {
  const [payload, setPayload] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const periodAnchorMs = listPeriod.anchorDate.getTime();

  const load = useCallback(async () => {
    if (!token || !enabled) {
      return;
    }
    const query = buildMyCustomersQuery(listPeriod);
    setLoading(true);
    try {
      const res = await fetchJobCards(token, query);
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
  }, [enabled, listPeriod, showToast, token]);

  useLayoutEffect(() => {
    if (!token || !enabled) {
      return;
    }
    setLoading(true);
  }, [enabled, listPeriod.timeFilter, periodAnchorMs, token]);

  useEffect(() => {
    void load();
  }, [load, listPeriod.timeFilter, periodAnchorMs]);

  const cards = useMemo(() => parseJobCardsFromPagePayload(payload), [payload]);

  return { payload, loading, load, cards };
}
