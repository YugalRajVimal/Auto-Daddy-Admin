import { useAuth } from "@/context/auth-provider";
import { approveCarOwnerJobCard, rejectCarOwnerJobCard } from "@/lib/car-owner-approvals";
import { useCallback, useState } from "react";

function actionFailedMessage(
  res: { ok: boolean; data: unknown },
  fallback: string
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

/**
 * Mutation-only job-card approvals (matches web Expenses).
 * List source remains GET /api/user/job-cards — do not use approvals GET as list.
 */
export function useCarOwnerJobCardApprovals() {
  const { token } = useAuth();
  const [acting, setActing] = useState(false);

  const approve = useCallback(
    async (jobCardId: string) => {
      if (!token || !jobCardId.trim()) return { ok: false as const, message: "Not signed in." };
      setActing(true);
      const res = await approveCarOwnerJobCard(token, jobCardId);
      setActing(false);
      const fail = actionFailedMessage(res, "Could not approve job card.");
      if (fail) return { ok: false as const, message: fail };
      return { ok: true as const, message: "Job card approved." };
    },
    [token]
  );

  const reject = useCallback(
    async (jobCardId: string) => {
      if (!token || !jobCardId.trim()) return { ok: false as const, message: "Not signed in." };
      setActing(true);
      const res = await rejectCarOwnerJobCard(token, jobCardId);
      setActing(false);
      const fail = actionFailedMessage(res, "Could not discard job card.");
      if (fail) return { ok: false as const, message: fail };
      return { ok: true as const, message: "Job card discarded." };
    },
    [token]
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
      }
      setActing(false);

      if (okCount === 0) return { ok: false as const, message: lastError || "Could not approve job card." };
      if (okCount < ids.length) {
        return { ok: true as const, message: `Approved ${okCount} of ${ids.length} job cards.` };
      }
      return {
        ok: true as const,
        message: okCount === 1 ? "Job card approved." : `${okCount} job cards approved.`,
      };
    },
    [token]
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
      }
      setActing(false);

      if (okCount === 0) return { ok: false as const, message: lastError || "Could not discard job card." };
      if (okCount < ids.length) {
        return { ok: true as const, message: `Discarded ${okCount} of ${ids.length} job cards.` };
      }
      return {
        ok: true as const,
        message: okCount === 1 ? "Job card discarded." : `${okCount} job cards discarded.`,
      };
    },
    [token]
  );

  return { acting, approve, reject, approveMany, rejectMany };
}
