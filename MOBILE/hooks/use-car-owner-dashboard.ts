import { useAuth } from "@/context/auth-provider";
import {
  coalesceCarOwnerHomePayload,
  fetchCarOwnerHome,
} from "@/lib/car-owner-home-api";
import { getCarOwnerDashboardDetails, saveCarOwnerDashboardDetails } from "@/lib/auth";
import type { CarOwnerDashboardApiResponse } from "@/types/car-owner-dashboard";
import { useCallback, useEffect, useState } from "react";

export function useCarOwnerDashboard() {
  const { token, sessionRevision, syncCarOwnerProfileFromDashboard } = useAuth();
  const [data, setData] = useState<CarOwnerDashboardApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) {
      setData(null);
      setLoading(false);
      return;
    }

    const cached = await getCarOwnerDashboardDetails<CarOwnerDashboardApiResponse>();
    const hadCache = Boolean(cached);
    if (hadCache) {
      setData(coalesceCarOwnerHomePayload(cached) ?? cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const res = await fetchCarOwnerHome(token);
    if (res.ok && res.data) {
      const next = coalesceCarOwnerHomePayload(res.data) ?? res.data;
      if (next.success !== false) {
        await saveCarOwnerDashboardDetails(next);
        await syncCarOwnerProfileFromDashboard(next.userProfile);
        setData(next);
      }
    }
    setLoading(false);
  }, [syncCarOwnerProfileFromDashboard, token]);

  useEffect(() => {
    void load();
  }, [load, sessionRevision]);

  return { data, loading, refresh: load };
}
