import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth";
import {
  approveCarOwnerCustomerRequest,
  fetchCarOwnerCustomerRequests,
  normalizeCarOwnerCustomerRequestsPayload,
  rejectCarOwnerCustomerRequest,
} from "../lib/carOwnerApprovals";
import type { CarOwnerCustomerRequest } from "../types/carOwnerApprovals";

export function useCarOwnerCustomerRequests() {
  const { token } = useAuth();
  const [items, setItems] = useState<CarOwnerCustomerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setItems([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetchCarOwnerCustomerRequests(token);
    if (!res.ok) {
      setItems([]);
      setError("Could not load customer requests.");
      setLoading(false);
      return;
    }

    const payload = res.data;
    if (payload && typeof payload === "object" && "success" in payload) {
      if ((payload as { success?: boolean }).success === false) {
        setItems([]);
        setError("Could not load customer requests.");
        setLoading(false);
        return;
      }
    }

    setItems(normalizeCarOwnerCustomerRequestsPayload(payload));
    setLoading(false);
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const approve = useCallback(
    async (businessId: string) => {
      if (!token || !businessId.trim()) return { ok: false as const, message: "Not signed in." };
      setActingId(businessId);
      const res = await approveCarOwnerCustomerRequest(token, businessId);
      setActingId(null);
      if (!res.ok || (res.data && typeof res.data === "object" && "success" in res.data && res.data.success === false)) {
        return {
          ok: false as const,
          message:
            (res.data && typeof res.data === "object" && "message" in res.data
              ? String((res.data as { message?: unknown }).message ?? "")
              : "") || "Could not approve request.",
        };
      }
      setItems((prev) => prev.filter((item) => item.businessId !== businessId));
      return { ok: true as const, message: "Customer add request approved." };
    },
    [token],
  );

  const reject = useCallback(
    async (businessId: string) => {
      if (!token || !businessId.trim()) return { ok: false as const, message: "Not signed in." };
      setActingId(businessId);
      const res = await rejectCarOwnerCustomerRequest(token, businessId);
      setActingId(null);
      if (!res.ok || (res.data && typeof res.data === "object" && "success" in res.data && res.data.success === false)) {
        return {
          ok: false as const,
          message:
            (res.data && typeof res.data === "object" && "message" in res.data
              ? String((res.data as { message?: unknown }).message ?? "")
              : "") || "Could not reject request.",
        };
      }
      setItems((prev) => prev.filter((item) => item.businessId !== businessId));
      return { ok: true as const, message: "Customer add request rejected." };
    },
    [token],
  );

  return { items, loading, error, actingId, refresh: load, approve, reject };
}
