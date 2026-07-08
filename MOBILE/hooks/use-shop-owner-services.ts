import { useAuth } from "@/context/auth-provider";
import { useAutoShopServicesCatalog } from "@/hooks/use-auto-shop-services-catalog";
import { useMyShopServices } from "@/hooks/use-my-shop-services";
import { updateServiceWeWorkWith } from "@/lib/auto-shop-owner-api";
import type { MyServiceCategoryPayload } from "@/types/auto-shop-owner-endpoints";
import type { ServiceCatalogCategory } from "@/types/service-catalog";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function uniqNonEmpty(ids: string[]) {
  return Array.from(new Set(ids.map((x) => x.trim()).filter(Boolean)));
}

export function useShopOwnerServices(options?: {
  showErrorToast?: (msg: string) => void;
  showSuccessToast?: (msg: string) => void;
  /** Called after a successful toggle (e.g. refreshSession + reload profile). */
  onChanged?: () => Promise<void> | void;
}) {
  const { token, meta } = useAuth();
  const isAutoShopOwner = (meta?.role ?? "").toLowerCase() === "autoshopowner";

  const showErrorToastRef = useRef(options?.showErrorToast);
  const showSuccessToastRef = useRef(options?.showSuccessToast);
  const onChangedRef = useRef(options?.onChanged);
  useEffect(() => {
    showErrorToastRef.current = options?.showErrorToast;
    showSuccessToastRef.current = options?.showSuccessToast;
    onChangedRef.current = options?.onChanged;
  }, [options?.onChanged, options?.showErrorToast, options?.showSuccessToast]);

  const toastAdapter = useCallback(
    (message: string, options?: { type?: "error" | "success" | "info" }) => {
      if (options?.type === "success") {
        showSuccessToastRef.current?.(message);
        return;
      }
      // Default to error-style toast (catalog/my-services hooks only use error+success anyway).
      showErrorToastRef.current?.(message);
    },
    []
  );

  // Catalog (all available categories)
  const { categories: catalogCategories, isLoading: catalogLoading, fetchCatalog } = useAutoShopServicesCatalog(
    token,
    isAutoShopOwner,
    toastAdapter
  );

  // Selected (my-services)
  const { categories: myCategories, loading: myLoading, load: loadMy, save } = useMyShopServices(
    token,
    isAutoShopOwner,
    toastAdapter
  );

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [optimisticIds, setOptimisticIds] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);

  const allServices = useMemo(() => catalogCategories, [catalogCategories]);

  const serverMyServiceIds = useMemo(() => uniqNonEmpty(myCategories.map((c) => c.id)), [myCategories]);
  const myServiceIds = optimisticIds ?? serverMyServiceIds;
  const myServiceIdSet = useMemo(() => new Set(myServiceIds), [myServiceIds]);

  const refresh = useCallback(async () => {
    if (!token || !isAutoShopOwner) return;
    await Promise.all([fetchCatalog(), loadMy()]);
  }, [fetchCatalog, isAutoShopOwner, loadMy, token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (serviceCategory: ServiceCatalogCategory, nextSelected: boolean) => {
      if (!token) {
        showErrorToastRef.current?.("Please log in again.");
        return false;
      }
      const id = serviceCategory.id?.trim() ?? "";
      if (!id || updatingId) {
        return false;
      }

      setUpdatingId(id);
      setOptimisticIds((prev) => {
        const base = prev ?? serverMyServiceIds;
        const set = new Set(base);
        if (nextSelected) set.add(id);
        else set.delete(id);
        return Array.from(set);
      });

      try {
        const nextIds = (() => {
          const set = new Set(serverMyServiceIds);
          if (nextSelected) set.add(id);
          else set.delete(id);
          return Array.from(set);
        })();

        const payload: MyServiceCategoryPayload[] = nextIds.map((sid) => {
          const existing = myCategories.find((x) => x.id === sid);
          return {
            id: sid,
            subServices:
              existing?.subServices?.map((s) => ({
                id: s.id,
                name: s.name,
                desc: s.desc,
                price: s.price,
              })) ?? [],
          };
        });

        const mode = myCategories.length > 0 ? "update" : "create";
        const ok = await save(payload, mode);
        if (!ok) {
          // revert optimistic
          setOptimisticIds(null);
          return false;
        }

        showSuccessToastRef.current?.(nextSelected ? "Service added." : "Service removed.");
        setOptimisticIds(null);
        await onChangedRef.current?.();
        return true;
      } catch {
        showErrorToastRef.current?.("Network error while updating services.");
        setOptimisticIds(null);
        return false;
      } finally {
        setUpdatingId(null);
      }
    },
    [myCategories, save, serverMyServiceIds, token, updatingId]
  );

  /**
   * Bulk save the current selection by sending `serviceWeWorkWith` (a JSON
   * stringified array of catalog service IDs) to the edit-business-profile
   * endpoint. Used by the checkbox + Save button flow.
   */
  const saveServiceWeWorkWith = useCallback(
    async (ids: string[]) => {
      if (!token) {
        showErrorToastRef.current?.("Please log in again.");
        return false;
      }
      const cleaned = uniqNonEmpty(ids);
      setSaving(true);
      setOptimisticIds(cleaned);
      try {
        const res = await updateServiceWeWorkWith(token, cleaned);
        const ok = res.ok && (res.data?.success ?? true);
        const msg = typeof res.data?.message === "string" ? res.data.message : "";
        if (!ok) {
          showErrorToastRef.current?.(msg || "Could not update services.");
          setOptimisticIds(null);
          return false;
        }
        showSuccessToastRef.current?.(msg || "Services updated.");
        await onChangedRef.current?.();
        await refresh();
        setOptimisticIds(null);
        return true;
      } catch {
        showErrorToastRef.current?.("Network error while updating services.");
        setOptimisticIds(null);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [refresh, token]
  );

  const loading = catalogLoading || myLoading;

  return {
    allServices,
    myServiceIds,
    myServiceIdSet,
    loading,
    updatingId,
    saving,
    refresh,
    toggle,
    saveServiceWeWorkWith,
  };
}

