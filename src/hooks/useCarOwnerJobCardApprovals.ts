import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth";
import {
  approveCarOwnerJobCard,
  fetchCarOwnerJobCardApprovals,
  normalizeCarOwnerJobCardApprovalsPayload,
  rejectCarOwnerJobCard,
} from "../lib/carOwnerApprovals";
import type { CarOwnerJobCard } from "../types/carOwnerJobCards";

function actionFailedMessage(
  res: { ok: boolean; data: unknown },
  fallback: string,
): string | null {
  if (!res.ok) {
    const msg =
      res.data && typeof res.data === "object" && "message" in res.data
        ? String((res.data as { message?: unknown }).message ?? "")
        : "";
    return msg || fallback;
  }
  if (res.data && typeof res.data === "object" && "success" in res.data && res.data.success === false) {
    const msg =
      "message" in res.data ? String((res.data as { message?: unknown }).message ?? "") : "";
    return msg || fallback;
  }
  return null;
}

export function useCarOwnerJobCardApprovals() {
  const { token } = useAuth();
  const [items, setItems] = useState<CarOwnerJobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      setItems([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetchCarOwnerJobCardApprovals(token);
    if (!res.ok) {
      setItems([]);
      setError("Could not load job card approvals.");
      setLoading(false);
      return;
    }

    const payload = res.data;
    if (payload && typeof payload === "object" && "success" in payload) {
      if ((payload as { success?: boolean }).success === false) {
        setItems([]);
        setError("Could not load job card approvals.");
        setLoading(false);
        return;
      }
    }

    setItems(normalizeCarOwnerJobCardApprovalsPayload(payload));
    setLoading(false);
  }, [token]);

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

  const approve = useCallback(
    async (jobCardId: string) => {
      if (!token || !jobCardId.trim()) return { ok: false as const, message: "Not signed in." };
      setActing(true);
      const res = await approveCarOwnerJobCard(token, jobCardId);
      setActing(false);
      const fail = actionFailedMessage(res, "Could not approve job card.");
      if (fail) return { ok: false as const, message: fail };
      setItems((prev) => prev.filter((item) => item._id !== jobCardId));
      return { ok: true as const, message: "Job card approved." };
    },
    [token],
  );

  const reject = useCallback(
    async (jobCardId: string) => {
      if (!token || !jobCardId.trim()) return { ok: false as const, message: "Not signed in." };
      setActing(true);
      const res = await rejectCarOwnerJobCard(token, jobCardId);
      setActing(false);
      const fail = actionFailedMessage(res, "Could not discard job card.");
      if (fail) return { ok: false as const, message: fail };
      setItems((prev) => prev.filter((item) => item._id !== jobCardId));
      return { ok: true as const, message: "Job card discarded." };
    },
    [token],
  );

  const approveMany = useCallback(
    async (jobCardIds: string[]) => {
      const ids = jobCardIds.map((id) => id.trim()).filter(Boolean);
      if (!token) return { ok: false as const, message: "Not signed in." };
      if (ids.length === 0) return { ok: false as const, message: "Select at least one job card." };

      setActing(true);
      let okCount = 0;
      let lastError = "";
      for (const id of ids) {
        const res = await approveCarOwnerJobCard(token, id);
        const fail = actionFailedMessage(res, "Could not approve job card.");
        if (fail) {
          lastError = fail;
          continue;
        }
        okCount += 1;
        setItems((prev) => prev.filter((item) => item._id !== id));
      }
      setActing(false);

      if (okCount === 0) return { ok: false as const, message: lastError || "Could not approve job card." };
      if (okCount < ids.length) {
        return {
          ok: true as const,
          message: `Approved ${okCount} of ${ids.length} job cards.`,
        };
      }
      return {
        ok: true as const,
        message: okCount === 1 ? "Job card approved." : `${okCount} job cards approved.`,
      };
    },
    [token],
  );

  const rejectMany = useCallback(
    async (jobCardIds: string[]) => {
      const ids = jobCardIds.map((id) => id.trim()).filter(Boolean);
      if (!token) return { ok: false as const, message: "Not signed in." };
      if (ids.length === 0) return { ok: false as const, message: "Select at least one job card." };

      setActing(true);
      let okCount = 0;
      let lastError = "";
      for (const id of ids) {
        const res = await rejectCarOwnerJobCard(token, id);
        const fail = actionFailedMessage(res, "Could not discard job card.");
        if (fail) {
          lastError = fail;
          continue;
        }
        okCount += 1;
        setItems((prev) => prev.filter((item) => item._id !== id));
      }
      setActing(false);

      if (okCount === 0) return { ok: false as const, message: lastError || "Could not discard job card." };
      if (okCount < ids.length) {
        return {
          ok: true as const,
          message: `Discarded ${okCount} of ${ids.length} job cards.`,
        };
      }
      return {
        ok: true as const,
        message: okCount === 1 ? "Job card discarded." : `${okCount} job cards discarded.`,
      };
    },
    [token],
  );

  return {
    items: sortedItems,
    loading,
    error,
    acting,
    refresh: load,
    approve,
    reject,
    approveMany,
    rejectMany,
  };
}
