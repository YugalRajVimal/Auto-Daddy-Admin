import { useAuth } from "@/context/auth-provider";
import { getJson, postJson } from "@/lib/api";
import { normalizeCarOwnerDealsList } from "@/lib/car-owner-deals";
import type { CarOwnerDeal, CarOwnerDealsResponse } from "@/types/car-owner-deals";
import { useCallback, useEffect, useMemo, useState } from "react";

type State = {
  deals: CarOwnerDeal[];
  loading: boolean;
  error: string | null;
};

export function useCarOwnerDeals() {
  const { token, sessionRevision } = useAuth();
  const [state, setState] = useState<State>({ deals: [], loading: true, error: null });

  const load = useCallback(async () => {
    if (!token) {
      setState({ deals: [], loading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    const res = await getJson<CarOwnerDealsResponse>("/api/user/deals", { authToken: token });

    if (!res.ok || !res.data?.success) {
      setState({ deals: [], loading: false, error: "Could not load deals." });
      return;
    }

    setState({ deals: normalizeCarOwnerDealsList(res.data), loading: false, error: null });
  }, [token]);

  useEffect(() => {
    void load();
  }, [load, sessionRevision]);

  const sortedDeals = useMemo(() => {
    return [...state.deals].sort((a, b) => {
      const at = Date.parse(a.createdAt);
      const bt = Date.parse(b.createdAt);
      if (Number.isFinite(at) && Number.isFinite(bt)) return bt - at;
      return String(b.createdAt).localeCompare(String(a.createdAt));
    });
  }, [state.deals]);

  const discardDeal = useCallback(
    async (dealId: string): Promise<{ ok: true } | { ok: false; error: string }> => {
      if (!token) {
        return { ok: false, error: "You are not authenticated. Please log in again." };
      }

      const res = await postJson<{ success?: boolean; message?: string }>(
        "/api/user/discard-deal",
        { dealId },
        { authToken: token }
      );

      if (!res.ok || res.data?.success === false) {
        return { ok: false, error: res.data?.message ?? "Could not discard deal." };
      }

      setState((prev) => ({ ...prev, deals: prev.deals.filter((d) => d._id !== dealId) }));
      return { ok: true };
    },
    [token]
  );

  return {
    deals: sortedDeals,
    loading: state.loading,
    error: state.error,
    refresh: load,
    discardDeal,
  };
}
