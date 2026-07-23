import { useAuth } from "@/context/auth-provider";
import { useAutoShopServicesCatalog } from "@/hooks/use-auto-shop-services-catalog";
import { useMyShopServices } from "@/hooks/use-my-shop-services";
import { addMyService } from "@/lib/autoshopowner-api";
import { updateServiceWeWorkWith } from "@/lib/auto-shop-owner-api";
import { getAutoShopOwnerProfile } from "@/lib/shop-owner-auth-cache";
import {
  SHOP_OWNER_SHOP_TYPES,
  normalizeShopOwnerShopTypes,
} from "@/lib/shop-owner-shop-types";
import type { MyServiceCategoryPayload } from "@/types/auto-shop-owner-endpoints";
import type { AutoShopOwnerProfileResponse } from "@/types/auto-shop-owner-profile";
import type { ServiceCatalogCategory } from "@/types/service-catalog";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function uniqNonEmpty(ids: string[]) {
  return Array.from(new Set(ids.map((x) => x.trim()).filter(Boolean)));
}

function readShopTypesFromProfile(profile: AutoShopOwnerProfileResponse | null): string[] {
  const business = profile?.data?.businessProfile;
  const user = profile?.data?.userProfile as
    | (AutoShopOwnerProfileResponse["data"]["userProfile"] & { shopType?: string })
    | undefined;
  const fromBusiness = normalizeShopOwnerShopTypes(business?.shopTypes ?? business?.shopType ?? null);
  if (fromBusiness.length > 0) return fromBusiness;
  return normalizeShopOwnerShopTypes(user?.shopType ?? null);
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
      showErrorToastRef.current?.(message);
    },
    []
  );

  const [shopTypes, setShopTypes] = useState<string[]>([...SHOP_OWNER_SHOP_TYPES]);
  const shopTypesKey = useMemo(() => shopTypes.join("|"), [shopTypes]);

  useEffect(() => {
    if (!isAutoShopOwner) return;
    let cancelled = false;
    void (async () => {
      try {
        const profile = await getAutoShopOwnerProfile<AutoShopOwnerProfileResponse>();
        if (cancelled) return;
        const resolved = readShopTypesFromProfile(profile);
        setShopTypes(resolved.length > 0 ? resolved : [...SHOP_OWNER_SHOP_TYPES]);
      } catch {
        if (!cancelled) setShopTypes([...SHOP_OWNER_SHOP_TYPES]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAutoShopOwner]);

  // Catalog (all available categories for the shop's vendor types)
  const { categories: catalogCategories, isLoading: catalogLoading, fetchCatalog } =
    useAutoShopServicesCatalog(token, isAutoShopOwner, toastAdapter, shopTypes);

  // Selected (my-services via GET /api/autoshopowner/services/my)
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
  }, [refresh, shopTypesKey]);

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
                make: s.make,
                model: s.model,
                quantity: s.qty,
                quantityType: s.quantityType,
                labourCost: s.labourCost,
                tax: s.tax,
              })) ?? [],
          };
        });

        const mode = myCategories.length > 0 ? "update" : "create";
        const ok = await save(payload, mode);
        if (!ok) {
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
   * Bulk save selection:
   * - newly selected IDs → PUT /api/autoshopowner/services/add
   * - removals → sync remaining IDs via serviceWeWorkWith
   */
  const saveServiceWeWorkWith = useCallback(
    async (ids: string[]) => {
      if (!token) {
        showErrorToastRef.current?.("Please log in again.");
        return false;
      }
      const cleaned = uniqNonEmpty(ids);
      const previous = new Set(serverMyServiceIds);
      const next = new Set(cleaned);
      const toAdd = cleaned.filter((id) => !previous.has(id));
      const toRemove = serverMyServiceIds.filter((id) => !next.has(id));

      setSaving(true);
      setOptimisticIds(cleaned);
      try {
        const today = new Date().toISOString().slice(0, 10);
        for (const serviceId of toAdd) {
          const addRes = await addMyService(token, {
            serviceId,
            status: "Active",
            date: today,
          });
          const ok = addRes.ok && ((addRes.data as { success?: boolean } | null)?.success ?? true);
          if (!ok) {
            const msg =
              addRes.data && typeof addRes.data === "object" && "message" in addRes.data
                ? String((addRes.data as { message?: string }).message ?? "")
                : "";
            showErrorToastRef.current?.(msg || "Could not add service.");
            setOptimisticIds(null);
            return false;
          }
        }

        if (toRemove.length > 0) {
          const res = await updateServiceWeWorkWith(token, cleaned);
          const ok = res.ok && (res.data?.success ?? true);
          const msg = typeof res.data?.message === "string" ? res.data.message : "";
          if (!ok) {
            showErrorToastRef.current?.(msg || "Could not update services.");
            setOptimisticIds(null);
            return false;
          }
        }

        showSuccessToastRef.current?.(
          toAdd.length === 0 && toRemove.length === 0
            ? "Services updated."
            : toRemove.length > 0
              ? "Services updated."
              : toAdd.length === 1
                ? "Service added."
                : "Services updated."
        );
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
    [refresh, serverMyServiceIds, token]
  );

  const loading = catalogLoading || myLoading;

  return {
    allServices,
    myServiceIds,
    myServiceIdSet,
    myCategories,
    shopTypes,
    loading,
    updatingId,
    saving,
    refresh,
    toggle,
    saveServiceWeWorkWith,
  };
}
