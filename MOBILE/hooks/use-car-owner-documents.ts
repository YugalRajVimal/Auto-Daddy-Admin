import { appendImage, trimMessage, type PickedImage } from "@/components/car-owner/my-vehicles/add-vehicle-helpers";
import { normalizeVehicleList, type UserVehiclesResponse } from "@/components/car-owner/my-vehicles/user-vehicles";
import { useAuth } from "@/context/auth-provider";
import {
  busyFieldKey,
  mergeVehicleDocumentRecords,
  normalizeVehicleDocumentsList,
  vehicleDocumentSections,
  type VehicleDocumentFieldKey,
  type VehicleDocumentsSection,
} from "@/lib/car-owner-documents";
import { getJson, postFormData } from "@/lib/api";
import type { UserDocumentsApiResponse, UserDocumentsMutationResponse, VehicleDocumentsVehicle } from "@/types/user-documents";
import { useCallback, useEffect, useState } from "react";

type State = {
  sections: VehicleDocumentsSection[];
  loading: boolean;
  error: string | null;
  mutating: boolean;
  busyField: string | null;
};

export function useCarOwnerDocuments() {
  const { token, sessionRevision } = useAuth();
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
    const authToken = token;

    if (__DEV__) {
      console.log("[documents] GET /api/user/documents request");
    }
    const [vehiclesRes, documentsRes] = await Promise.all([
      getJson<UserVehiclesResponse>("/api/user/vehicles", { authToken }),
      getJson<UserDocumentsApiResponse>("/api/user/documents", { authToken }),
    ]);
    if (__DEV__) {
      console.log("[documents] GET /api/user/documents response", {
        ok: documentsRes.ok,
        status: documentsRes.status,
        data: documentsRes.data,
      });
    }

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
        vinNo: v.vinNo ?? null,
        make: v.make ?? null,
        year: v.year ?? null,
        odometerReading: v.odometerReading ?? null,
        disabled: v.disabled ?? null,
        carImage: v.carImage ?? null,
      }));

    const merged = mergeVehicleDocumentRecords(enabledVehicles, documentRecords);
    const sections = vehicleDocumentSections(merged);

    setState((s) => ({ ...s, sections, loading: false, error: null }));
  }, [token]);

  useEffect(() => {
    void load();
  }, [load, sessionRevision]);

  const uploadDocumentField = useCallback(
    async (
      vehicleId: string,
      field: VehicleDocumentFieldKey,
      picked: PickedImage
    ): Promise<{ ok: boolean; message?: string }> => {
      if (!token) {
        return { ok: false, message: "Not signed in." };
      }
      const key = busyFieldKey(vehicleId, field);
      setState((s) => ({ ...s, mutating: true, busyField: key }));
      try {
        const body = new FormData();
        body.append("vehicleId", vehicleId);
        appendImage(body, field, picked, field);

        if (__DEV__) {
          console.log("[documents] POST /api/user/documents request", {
            vehicleId,
            field,
            image: { uri: picked.uri, fileName: picked.fileName, mimeType: picked.mimeType },
          });
        }
        const res = await postFormData<UserDocumentsMutationResponse>("/api/user/documents", body, {
          authToken: token,
        });
        if (__DEV__) {
          console.log("[documents] POST /api/user/documents response", {
            ok: res.ok,
            status: res.status,
            data: res.data,
          });
        }
        const message = trimMessage(res.data);
        if (!res.ok) {
          return { ok: false, message: message || "Could not upload document." };
        }
        if (res.data?.success === false) {
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
