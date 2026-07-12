import { useCallback, useEffect, useState } from "react";
import { getJson, postJson } from "../api/mobileAuth";
import { normalizeCarOwnerDealsPayload } from "../lib/carOwnerDeals";
import type {
  CarOwnerDeal,
  CarOwnerDealsApiFilters,
  CarOwnerDealsResponse,
  NormalizedCarOwnerDeals,
} from "../types/carOwnerDeals";
import { useAuth } from "../auth";

const EMPTY_NORMALIZED: NormalizedCarOwnerDeals = {
  Service: { city: [], others: [] },
  Parts: { city: [], others: [] },
  filters: { makes: [], models: [] },
  all: [],
};

type State = {
  data: NormalizedCarOwnerDeals;
  loading: boolean;
  error: string | null;
};

export function useCarOwnerDeals(filters?: { make?: string; model?: string }) {
  const { token } = useAuth();
  const [state, setState] = useState<State>({ data: EMPTY_NORMALIZED, loading: true, error: null });
  const make = filters?.make?.trim() ?? "";
  const model = filters?.model?.trim() ?? "";

  const load = useCallback(async () => {
    if (!token) {
      setState({ data: EMPTY_NORMALIZED, loading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    const usp = new URLSearchParams();
    if (make) usp.set("make", make);
    if (model) usp.set("model", model);
    const qs = usp.toString();
    const path = qs ? `/api/user/deals?${qs}` : "/api/user/deals";
    const res = await getJson<CarOwnerDealsResponse>(path, token);

    if (!res.ok || !res.data?.success) {
      setState({ data: EMPTY_NORMALIZED, loading: false, error: "Could not load deals." });
      return;
    }

    setState({ data: normalizeCarOwnerDealsPayload(res.data), loading: false, error: null });
  }, [token, make, model]);

  useEffect(() => {
    void load();
  }, [load]);

  const discardDeal = useCallback(
    async (dealId: string): Promise<{ ok: true } | { ok: false; error: string }> => {
      if (!token) {
        return { ok: false, error: "You are not authenticated. Please log in again." };
      }

      const res = await postJson<{ success?: boolean; message?: string }>(
        "/api/user/discard-deal",
        { dealId },
        token
      );

      if (!res.ok || res.data?.success === false) {
        return { ok: false, error: res.data?.message ?? "Could not discard deal." };
      }

      setState((prev) => {
        const remove = (list: CarOwnerDeal[]) => list.filter((d) => d._id !== dealId);
        const Service = {
          city: remove(prev.data.Service.city),
          others: remove(prev.data.Service.others),
        };
        const Parts = {
          city: remove(prev.data.Parts.city),
          others: remove(prev.data.Parts.others),
        };
        return {
          ...prev,
          data: {
            Service,
            Parts,
            filters: prev.data.filters,
            all: remove(prev.data.all),
          },
        };
      });
      return { ok: true };
    },
    [token]
  );

  return {
    deals: state.data.all,
    grouped: state.data,
    apiFilters: state.data.filters as CarOwnerDealsApiFilters,
    loading: state.loading,
    error: state.error,
    refresh: load,
    discardDeal,
  };
}
