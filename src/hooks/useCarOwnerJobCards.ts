import { useCallback, useEffect, useMemo, useState } from "react";
import { getJson } from "../api/mobileAuth";
import { useAuth } from "../auth";
import { normalizeJobCardsPayload, resolveJobCardsBuckets } from "../lib/carOwnerJobCards";
import type { CarOwnerJobCard, CarOwnerJobCardsResponse } from "../types/carOwnerJobCards";

function jobCardsPath(vehicleId?: string | null): string {
  const id = vehicleId?.trim();
  if (!id) return "/api/user/job-cards";
  return `/api/user/job-cards?vehicleId=${encodeURIComponent(id)}`;
}

export function useCarOwnerJobCards(vehicleId?: string | null) {
  const { token } = useAuth();
  const [items, setItems] = useState<CarOwnerJobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const vehicleFilter = vehicleId?.trim() || null;

  const load = useCallback(async () => {
    if (!token) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const res = await getJson<CarOwnerJobCardsResponse>(jobCardsPath(vehicleFilter), token);
    if (!res.ok || !res.data?.success) {
      setItems([]);
      setLoading(false);
      setError("Could not load job cards.");
      return;
    }

    const buckets = resolveJobCardsBuckets(res.data as Record<string, unknown>);
    const next = normalizeJobCardsPayload(buckets);
    setItems(next);
    setLoading(false);
    setError(null);
  }, [token, vehicleFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const at = Date.parse(a.createdAt ?? "");
      const bt = Date.parse(b.createdAt ?? "");
      if (Number.isFinite(at) && Number.isFinite(bt)) return bt - at;
      return String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""));
    });
  }, [items]);

  return {
    items: sortedItems,
    loading,
    error,
    refresh: load,
  };
}
