import { useCallback, useEffect, useState } from "react";
import { getJson } from "../api/mobileAuth";
import { useAuth } from "../auth";
import { normalizeOdometerReadingsPayload } from "../lib/carOwnerOdometer";
import type { CarOwnerOdometerReading } from "../types/carOwnerOdometer";

export function useCarOwnerOdometerReadings() {
  const { token } = useAuth();
  const [readings, setReadings] = useState<CarOwnerOdometerReading[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) {
      setReadings([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const res = await getJson<unknown>("/api/user/odometer-readings", token);
    if (!res.ok) {
      setReadings([]);
      setError("Could not load odometer readings.");
      setLoading(false);
      return;
    }
    const payload = res.data;
    if (payload && typeof payload === "object" && "success" in payload) {
      if ((payload as { success?: boolean }).success === false) {
        setReadings([]);
        setError("Could not load odometer readings.");
        setLoading(false);
        return;
      }
    }
    setReadings(normalizeOdometerReadingsPayload(payload));
    setLoading(false);
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { readings, loading, error, refresh };
}
