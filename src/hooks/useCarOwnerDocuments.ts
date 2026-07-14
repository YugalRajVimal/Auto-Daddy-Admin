import { useCallback, useEffect, useState } from "react";
import { getJson } from "../api/mobileAuth";
import { useAuth } from "../auth";
import {
  busyFieldKey,
  mergeVehicleDocumentRecords,
  normalizeVehicleDocumentsList,
  vehicleDocumentSections,
  type VehicleDocumentFieldKey,
  type VehicleDocumentsSection,
} from "../lib/carOwnerDocuments";
import { normalizeVehicleList, type UserVehiclesResponse } from "../lib/carOwnerVehicles";
import type {
  UserDocumentsApiResponse,
  UserDocumentsMutationResponse,
  VehicleDocumentsVehicle,
} from "../types/carOwnerDocuments";

const API_BASE = (import.meta.env.VITE_API_URL as string).replace(/\/+$/, "");

type State = {
  sections: VehicleDocumentsSection[];
  loading: boolean;
  error: string | null;
  mutating: boolean;
  busyField: string | null;
};

export function useCarOwnerDocuments() {
  const { token } = useAuth();
  const [state, setState] = useState<State>({
    sections: [],
    loading: true,
    error: null,
    mutating: false,
    busyField: null,
  });

  const load = useCallback(async () => {
    if (!token) {
      setState((s) => ({ ...s, sections: [], loading: false, error: null }));
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    const [vehiclesRes, documentsRes] = await Promise.all([
      getJson<UserVehiclesResponse>("/api/user/vehicles", token),
      getJson<UserDocumentsApiResponse>("/api/user/documents", token),
    ]);

    if (!documentsRes.ok || !documentsRes.data?.success) {
      setState((s) => ({ ...s, sections: [], loading: false, error: "Could not load documents." }));
      return;
    }

    const documentRecords = normalizeVehicleDocumentsList(documentsRes.data);
    const garageVehicles = vehiclesRes.ok && vehiclesRes.data ? normalizeVehicleList(vehiclesRes.data) : [];
    const enabledVehicles: VehicleDocumentsVehicle[] = garageVehicles
      .filter((v) => !v.disabled)
      .map((v) => ({
        _id: v.id,
        licensePlateNo: v.licensePlateNo ?? null,
        vinNo: null,
        make: v.make ?? null,
        year: null,
        odometerReading: null,
        disabled: v.disabled ?? null,
        carImage: v.carImage ?? v.carImages?.[0] ?? null,
      }));

    const merged = mergeVehicleDocumentRecords(enabledVehicles, documentRecords);
    const sections = vehicleDocumentSections(merged);

    setState((s) => ({ ...s, sections, loading: false, error: null }));
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const uploadDocumentField = useCallback(
    async (
      vehicleId: string,
      field: VehicleDocumentFieldKey,
      file: File
    ): Promise<{ ok: boolean; message?: string }> => {
      if (!token) {
        return { ok: false, message: "Not signed in." };
      }

      const key = busyFieldKey(vehicleId, field);
      setState((s) => ({ ...s, mutating: true, busyField: key }));

      try {
        const body = new FormData();
        body.append("vehicleId", vehicleId);
        body.append(field, file, file.name || `${field}.jpg`);

        const response = await fetch(`${API_BASE}/api/user/documents`, {
          method: "POST",
          headers: { Authorization: token },
          body,
        });
        const data = (await response.json().catch(() => null)) as UserDocumentsMutationResponse | null;
        const message = typeof data?.message === "string" ? data.message.trim() : "";

        if (!response.ok || data?.success === false) {
          return { ok: false, message: message || "Could not upload document." };
        }

        await load();
        return { ok: true, message: message || undefined };
      } finally {
        setState((s) => ({ ...s, mutating: false, busyField: null }));
      }
    },
    [load, token]
  );

  return {
    sections: state.sections,
    loading: state.loading,
    error: state.error,
    mutating: state.mutating,
    busyField: state.busyField,
    refresh: load,
    uploadDocumentField,
  };
}
