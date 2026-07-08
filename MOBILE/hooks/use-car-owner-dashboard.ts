import { useAuth } from "@/context/auth-provider";
import { getJson } from "@/lib/api";
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
    const hadCache = Boolean(cached?.success);
    if (hadCache) {
      setData(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const res = await getJson<CarOwnerDashboardApiResponse>("/api/user/dashboard", {
      authToken: token,
    });
    if (res.ok && res.data?.success) {
      await saveCarOwnerDashboardDetails(res.data);
      await syncCarOwnerProfileFromDashboard(res.data.userProfile);
      setData(res.data);
    }
    setLoading(false);
  }, [syncCarOwnerProfileFromDashboard, token]);

  useEffect(() => {
    void load();
  }, [load, sessionRevision]);

  return { data, loading, refresh: load };
}
