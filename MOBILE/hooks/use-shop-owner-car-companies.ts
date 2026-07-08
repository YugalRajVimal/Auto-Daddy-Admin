import { useAuth } from "@/context/auth-provider";
import { fetchMainCarCompanies, addMyCarCompanies, removeMyCarCompanies } from "@/lib/auto-shop-owner-api";
import { getJson } from "@/lib/api";
import type { AutoShopOwnerProfileResponse } from "@/types/auto-shop-owner-profile";
import type { CarCompany } from "@/types/car-company";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function safeCompanyIdList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const ids = value
    .map((x) => {
      if (!x || typeof x !== "object") return "";
      const obj = x as Record<string, unknown>;
      const id = typeof obj._id === "string" ? obj._id : typeof obj.id === "string" ? obj.id : "";
      return id.trim();
    })
    .filter(Boolean);
  return Array.from(new Set(ids));
}

export function useShopOwnerCarCompanies(options?: {
  showErrorToast?: (msg: string) => void;
  showSuccessToast?: (msg: string) => void;
  /** Called after a successful add/remove (e.g. refreshSession). */
  onChanged?: () => Promise<void> | void;
}) {
  const { token } = useAuth();
  const [allCompanies, setAllCompanies] = useState<CarCompany[]>([]);
  const [myCompanyIds, setMyCompanyIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const showErrorToastRef = useRef(options?.showErrorToast);
  const showSuccessToastRef = useRef(options?.showSuccessToast);
  const onChangedRef = useRef(options?.onChanged);
  useEffect(() => {
    showErrorToastRef.current = options?.showErrorToast;
    showSuccessToastRef.current = options?.showSuccessToast;
    onChangedRef.current = options?.onChanged;
  }, [options?.onChanged, options?.showErrorToast, options?.showSuccessToast]);

  const myCompanyIdSet = useMemo(() => new Set(myCompanyIds), [myCompanyIds]);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [main, profile] = await Promise.all([
        fetchMainCarCompanies(token),
        getJson<AutoShopOwnerProfileResponse>("/api/auto-shop-owner/profile", { authToken: token }),
      ]);

      const list = (main.data?.data ?? []).filter(
        (x): x is CarCompany => Boolean(x && typeof x._id === "string" && typeof x.companyName === "string")
      );
      setAllCompanies(list);

      const businessProfile = (profile.data?.data?.businessProfile as any) ?? null;
      // Backend may send either `carCompanies` or legacy `myCarCompanies`.
      const ids = safeCompanyIdList(businessProfile?.carCompanies ?? businessProfile?.myCarCompanies);
      setMyCompanyIds(ids);
    } catch {
      showErrorToastRef.current?.("Could not load car companies.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (companyId: string, nextSelected: boolean) => {
      if (!token) {
        showErrorToastRef.current?.("Please log in again.");
        return false;
      }
      const id = companyId.trim();
      if (!id || updatingId) {
        return false;
      }

      setUpdatingId(id);
      // Optimistic.
      setMyCompanyIds((prev) => {
        const set = new Set(prev);
        if (nextSelected) set.add(id);
        else set.delete(id);
        return Array.from(set);
      });

      try {
        const res = nextSelected ? await addMyCarCompanies(token, [id]) : await removeMyCarCompanies(token, [id]);
        const ok = res.ok && (res.data?.success ?? true);
        if (!ok) {
          const msg = typeof res.data?.message === "string" ? res.data.message : "";
          showErrorToastRef.current?.(msg || "Could not update car companies.");
          // revert
          setMyCompanyIds((prev) => {
            const set = new Set(prev);
            if (nextSelected) set.delete(id);
            else set.add(id);
            return Array.from(set);
          });
          return false;
        }
        showSuccessToastRef.current?.(nextSelected ? "Car company added." : "Car company removed.");
        await onChangedRef.current?.();
        return true;
      } catch {
        showErrorToastRef.current?.("Network error while updating car companies.");
        // revert
        setMyCompanyIds((prev) => {
          const set = new Set(prev);
          if (nextSelected) set.delete(id);
          else set.add(id);
          return Array.from(set);
        });
        return false;
      } finally {
        setUpdatingId(null);
      }
    },
    [token, updatingId]
  );

  return {
    allCompanies,
    myCompanyIds,
    myCompanyIdSet,
    loading,
    updatingId,
    refresh,
    toggle,
  };
}

