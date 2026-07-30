import { useCallback, useEffect, useSyncExternalStore } from "react";
import { getJson } from "../api/mobileAuth";
import { useAuth } from "../auth";
import {
  normalizeVehicleList,
  type CarOwnerVehicle,
  type UserVehiclesResponse,
} from "../lib/carOwnerVehicles";

type VehiclesSnapshot = {
  token: string | null;
  vehicles: CarOwnerVehicle[];
  loading: boolean;
  error: string | null;
};

let snapshot: VehiclesSnapshot = {
  token: null,
  vehicles: [],
  loading: true,
  error: null,
};

const listeners = new Set<() => void>();

function setSnapshot(next: VehiclesSnapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return snapshot;
}

let inflight: Promise<void> | null = null;
let inflightToken: string | null = null;
let loadGeneration = 0;

async function loadVehicles(token: string | null, opts?: { force?: boolean }) {
  if (!token) {
    loadGeneration += 1;
    inflight = null;
    inflightToken = null;
    if (snapshot.token !== null || snapshot.vehicles.length > 0 || snapshot.loading || snapshot.error) {
      setSnapshot({ token: null, vehicles: [], loading: false, error: null });
    }
    return;
  }

  if (inflight && inflightToken === token && !opts?.force) {
    return inflight;
  }

  const generation = ++loadGeneration;
  setSnapshot({ ...snapshot, token, loading: true, error: null });

  const run = (async () => {
    const res = await getJson<UserVehiclesResponse>("/api/user/vehicles", token);
    if (generation !== loadGeneration || snapshot.token !== token) return;

    if (!res.ok || !res.data) {
      setSnapshot({
        token,
        vehicles: [],
        loading: false,
        error: "Could not load vehicles.",
      });
      return;
    }

    const next = normalizeVehicleList(res.data).filter((v) => !v.disabled);
    setSnapshot({
      token,
      vehicles: next,
      loading: false,
      error: null,
    });
  })();

  inflightToken = token;
  inflight = run.finally(() => {
    if (generation === loadGeneration) {
      inflight = null;
      inflightToken = null;
    }
  });

  return inflight;
}

/**
 * Shared across the owner portal so Documents sub-nav (and every other consumer)
 * stays in sync after vehicle add/delete/refresh.
 */
export function useCarOwnerVehicles() {
  const { token } = useAuth();
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const authToken = token ?? null;

  useEffect(() => {
    void loadVehicles(authToken);
  }, [authToken]);

  const refresh = useCallback(async () => {
    await loadVehicles(authToken, { force: true });
  }, [authToken]);

  const tokenMismatch = state.token !== authToken;

  return {
    vehicles: tokenMismatch ? [] : state.vehicles,
    loading: tokenMismatch || state.loading,
    error: tokenMismatch ? null : state.error,
    refresh,
  };
}
