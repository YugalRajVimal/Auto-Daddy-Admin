import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth";
import {
  parseJobCardsFromPagePayload,
  useShopOwnerData,
  type JobCardListRow,
} from "../context/ShopOwnerDataProvider";
import { searchJobCards } from "../lib/shopOwnerApi";

export function useShopJobCards(search?: string) {
  const { token } = useAuth();
  const { sections, loadSection, refreshSection } = useShopOwnerData();
  const state = sections.jobCards;
  const q = (search ?? "").trim();

  const [searchPayload, setSearchPayload] = useState<unknown>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (!q) {
      void loadSection("jobCards", { force: true });
      return;
    }

    if (!token) {
      setSearchPayload(null);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const res = await searchJobCards(token, q);
          if (!res.ok) {
            setSearchError("Could not load job cards.");
            setSearchPayload(null);
            return;
          }
          setSearchPayload(res.data);
        } catch {
          setSearchError("Network error.");
          setSearchPayload(null);
        } finally {
          setSearchLoading(false);
        }
      })();
    }, 300);

    return () => clearTimeout(timer);
  }, [loadSection, q, token]);

  const refresh = useCallback(async () => {
    if (q) {
      if (!token) return;
      setSearchLoading(true);
      setSearchError(null);
      try {
        const res = await searchJobCards(token, q);
        if (!res.ok) {
          setSearchError("Could not load job cards.");
          setSearchPayload(null);
          return;
        }
        setSearchPayload(res.data);
      } catch {
        setSearchError("Network error.");
        setSearchPayload(null);
      } finally {
        setSearchLoading(false);
      }
      return;
    }
    await refreshSection("jobCards");
  }, [q, refreshSection, token]);

  const cards = useMemo(() => {
    const payload = q ? searchPayload : state.data;
    return parseJobCardsFromPagePayload(payload);
  }, [q, searchPayload, state.data]);

  return {
    cards,
    loading: q ? searchLoading : state.loading,
    error: q ? searchError : state.error,
    refresh,
  };
}

export type { JobCardListRow };
