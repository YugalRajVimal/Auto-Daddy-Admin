import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth";
import {
  buildMyCustomersQuery,
  fetchJobCards,
  searchJobCards,
  type MyCustomersPeriod,
} from "../lib/shopOwnerApi";
import { parseJobCardsFromPagePayload, type JobCardListRow } from "../lib/shopOwnerJobCards";

const DEFAULT_PERIOD: MyCustomersPeriod = { timeFilter: "All", anchorDate: new Date() };

export function useShopJobCards(search?: string) {
  const { token } = useAuth();
  const [payload, setPayload] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) {
      setPayload(null);
      setLoading(false);
      return;
    }
    const q = (search ?? "").trim();
    setLoading(true);
    setError(null);
    try {
      const res = q
        ? await searchJobCards(token, q)
        : await fetchJobCards(token, buildMyCustomersQuery(DEFAULT_PERIOD));
      if (!res.ok) {
        setError("Could not load job cards.");
        setPayload(null);
        return;
      }
      setPayload(res.data);
    } catch {
      setError("Network error.");
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [token, search]);

  useEffect(() => {
    const t = setTimeout(() => void refresh(), search?.trim() ? 300 : 0);
    return () => clearTimeout(t);
  }, [refresh, search]);

  const cards = useMemo(() => parseJobCardsFromPagePayload(payload), [payload]);

  return { cards, loading, error, refresh };
}

export type { JobCardListRow };
