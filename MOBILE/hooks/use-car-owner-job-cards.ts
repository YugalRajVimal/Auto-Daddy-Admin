import { useAuth } from "@/context/auth-provider";
import { getJson, postJson } from "@/lib/api";
import type {
  CarOwnerJobCard,
  CarOwnerJobCardsBuckets,
  CarOwnerJobCardsResponse,
} from "@/types/car-owner-job-cards";
import { useCallback, useEffect, useMemo, useState } from "react";

type State = {
  items: CarOwnerJobCard[];
  loading: boolean;
  error: string | null;
};

type SimpleApiResponse = {
  success?: boolean;
  message?: string;
};

function jobCardsPath(vehicleId?: string | null): string {
  const id = vehicleId?.trim();
  if (!id) return "/api/user/job-cards";
  return `/api/user/job-cards?vehicleId=${encodeURIComponent(id)}`;
}

function resolveJobCardsBuckets(payload: CarOwnerJobCardsResponse | undefined): CarOwnerJobCardsBuckets | undefined {
  if (!payload || typeof payload !== "object") return undefined;

  const hasBuckets = (obj: Record<string, unknown>) =>
    "pending" in obj || "approved" in obj || "rejected" in obj || "autoRejected" in obj;

  if (hasBuckets(payload as Record<string, unknown>)) {
    return payload as CarOwnerJobCardsBuckets;
  }

  const data = payload.data;
  if (data && typeof data === "object" && hasBuckets(data as Record<string, unknown>)) {
    return data;
  }

  return undefined;
}

export function useCarOwnerJobCards(vehicleId?: string | null) {
  const { token, sessionRevision } = useAuth();
  const [state, setState] = useState<State>({ items: [], loading: true, error: null });
  const vehicleFilter = vehicleId?.trim() || null;

  const normalizeJobCardsPayload = useCallback((payload: CarOwnerJobCardsBuckets | undefined): CarOwnerJobCard[] => {
    if (!payload) return [];
    const pending = (Array.isArray(payload.pending) ? payload.pending : []).map((jc) => ({
      ...jc,
      status: jc.status?.trim() ? jc.status : "Pending",
    }));
    const approved = Array.isArray(payload.approved) ? payload.approved : [];
    const rejected = Array.isArray(payload.rejected) ? payload.rejected : [];
    const autoRejected = (Array.isArray(payload.autoRejected) ? payload.autoRejected : []).map((jc) => ({
      ...jc,
      status: jc.status?.trim() ? jc.status : "AutoRejected",
    }));
    return [...pending, ...approved, ...rejected, ...autoRejected];
  }, []);

  const load = useCallback(async () => {
    if (!token) {
      setState({ items: [], loading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    const res = await getJson<CarOwnerJobCardsResponse>(jobCardsPath(vehicleFilter), { authToken: token });

    if (!res.ok) {
      setState({ items: [], loading: false, error: "Could not load service history." });
      return;
    }

    if (!res.data?.success) {
      setState({ items: [], loading: false, error: "Could not load service history." });
      return;
    }

    const next = normalizeJobCardsPayload(resolveJobCardsBuckets(res.data));
    setState({ items: next, loading: false, error: null });
  }, [normalizeJobCardsPayload, token, vehicleFilter]);

  const approveJobCard = useCallback(
    async (jobCardId: string): Promise<{ ok: boolean; error?: string }> => {
      if (!token) return { ok: false, error: "Not authenticated." };
      const res = await postJson<SimpleApiResponse>(`/api/user/job-cards/${jobCardId}/approve`, {}, { authToken: token });
      if (!res.ok) {
        return { ok: false, error: res.data?.message ?? "Could not approve job card." };
      }
      if (res.data && res.data.success === false) {
        return { ok: false, error: res.data.message ?? "Could not approve job card." };
      }
      await load();
      return { ok: true };
    },
    [token, load]
  );

  const rejectJobCard = useCallback(
    async (jobCardId: string): Promise<{ ok: boolean; error?: string }> => {
      if (!token) return { ok: false, error: "Not authenticated." };
      const res = await postJson<SimpleApiResponse>(`/api/user/job-cards/${jobCardId}/reject`, {}, { authToken: token });
      if (!res.ok) {
        return { ok: false, error: res.data?.message ?? "Could not reject job card." };
      }
      if (res.data && res.data.success === false) {
        return { ok: false, error: res.data.message ?? "Could not reject job card." };
      }
      await load();
      return { ok: true };
    },
    [token, load]
  );

  useEffect(() => {
    void load();
  }, [load, sessionRevision]);

  const sortedItems = useMemo(() => {
    return [...state.items].sort((a, b) => {
      const at = Date.parse(a.createdAt ?? "");
      const bt = Date.parse(b.createdAt ?? "");
      if (Number.isFinite(at) && Number.isFinite(bt)) return bt - at;
      return String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""));
    });
  }, [state.items]);

  return {
    items: sortedItems,
    loading: state.loading,
    error: state.error,
    refresh: load,
    approveJobCard,
    rejectJobCard,
  };
}
