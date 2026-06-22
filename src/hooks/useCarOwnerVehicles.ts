import { useCallback, useEffect, useState } from "react";
import { getJson } from "../api/mobileAuth";
import { useAuth } from "../auth";
import { normalizeVehicleList, type CarOwnerVehicle, type UserVehiclesResponse } from "../lib/carOwnerVehicles";

export function useCarOwnerVehicles() {
  const { token } = useAuth();
  const [vehicles, setVehicles] = useState<CarOwnerVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setVehicles([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const res = await getJson<UserVehiclesResponse>("/api/user/vehicles", token);
    if (!res.ok || !res.data) {
      setVehicles([]);
      setLoading(false);
      setError("Could not load vehicles.");
      return;
    }

    const next = normalizeVehicleList(res.data).filter((v) => !v.disabled);
    setVehicles(next);
    setLoading(false);
    setError(null);
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  return { vehicles, loading, error, refresh: load };
}
