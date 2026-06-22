import { useAuth } from "@/context/auth-provider";
import {
  getCarOwnerOdometerReadings,
  normalizeOdometerReadings,
} from "@/lib/car-owner-odometer";
import type { CarOwnerOdometerReading } from "@/types/car-owner-odometer";
import { useCallback, useEffect, useState } from "react";

type State = {
  readings: CarOwnerOdometerReading[];
  loading: boolean;
  error: string | null;
};

const INITIAL_STATE: State = { readings: [], loading: true, error: null };

export function useCarOwnerOdometerReadings() {
  const { token, sessionRevision } = useAuth();
  const [state, setState] = useState<State>(INITIAL_STATE);

  const load = useCallback(async () => {
    if (!token) {
      setState({ readings: [], loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    const res = await getCarOwnerOdometerReadings(token);
    if (!res.ok || !res.data) {
      console.log(res.data)
      setState({ readings: [], loading: false, error: "Could not load odometer readings." });
      return;
    }
    setState({
      readings: normalizeOdometerReadings(res.data),
      loading: false,
      error: null,
    });
  }, [token]);

  useEffect(() => {
    void load();
  }, [load, sessionRevision]);

  return {
    readings: state.readings,
    loading: state.loading,
    error: state.error,
    refresh: load,
  };
}
