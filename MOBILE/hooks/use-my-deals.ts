import { createDealMultipart, deleteDeal, fetchMyDeals, updateDealMultipart } from "@/lib/auto-shop-owner-api";
import type { ApiEnvelope, ShopDeal } from "@/types/auto-shop-owner-endpoints";
import { useCallback, useState } from "react";

function extractDeals(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (!payload || typeof payload !== "object") {
    return [];
  }
  const root = payload as Record<string, unknown>;
  if (Array.isArray(root.serviceDeals) || Array.isArray(root.partsDeals)) {
    return [
      ...(Array.isArray(root.serviceDeals) ? (root.serviceDeals as unknown[]) : []),
      ...(Array.isArray(root.partsDeals) ? (root.partsDeals as unknown[]) : []),
    ];
  }
  if (Array.isArray(root.data)) {
    return root.data;
  }
  const data = root.data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.serviceDeals) || Array.isArray(d.partsDeals)) {
      return [
        ...(Array.isArray(d.serviceDeals) ? (d.serviceDeals as unknown[]) : []),
        ...(Array.isArray(d.partsDeals) ? (d.partsDeals as unknown[]) : []),
      ];
    }
    for (const k of ["deals", "myDeals", "items", "rows"]) {
      if (Array.isArray(d[k])) {
        return d[k] as unknown[];
      }
    }
  }
  for (const k of ["deals", "myDeals", "items"]) {
    if (Array.isArray(root[k])) {
      return root[k] as unknown[];
    }
  }
  return [];
}

function toDeal(raw: unknown): ShopDeal | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const service = o.service && typeof o.service === "object" ? (o.service as Record<string, unknown>) : null;
  const selectedVehicle =
    o.selectedVehicle && typeof o.selectedVehicle === "object" ? (o.selectedVehicle as Record<string, unknown>) : null;
  const selectedVehicleName =
    typeof selectedVehicle?.vehicleName === "string"
      ? selectedVehicle.vehicleName
      : typeof selectedVehicle?.name === "string"
        ? selectedVehicle.name
        : undefined;
  const id = typeof o._id === "string" ? o._id : typeof o.id === "string" ? o.id : undefined;
  if (!id) {
    return null;
  }
  const productName =
    typeof o.productName === "string"
      ? o.productName
      : typeof o.partName === "string"
        ? o.partName
        : typeof service?.name === "string"
          ? service.name
          : selectedVehicleName;
  return {
    _id: typeof o._id === "string" ? o._id : undefined,
    id,
    productName,
    description: typeof o.description === "string" ? o.description : undefined,
    price: o.price as ShopDeal["price"],
    discountedPrice: o.discountedPrice as ShopDeal["discountedPrice"],
    dealEnabled: typeof o.dealEnabled === "boolean" ? o.dealEnabled : undefined,
    offersEndOnDate:
      typeof o.offersEndOnDate === "string"
        ? o.offersEndOnDate
        : typeof o.offerEndsOnDate === "string"
          ? o.offerEndsOnDate
          : undefined,
    serviceId:
      typeof o.servicesId === "string"
        ? o.servicesId
        : typeof o.serviceId === "string"
          ? o.serviceId
          : undefined,
    vehicleId:
      typeof o.vehicleId === "string"
        ? o.vehicleId
        : typeof selectedVehicle?.id === "string"
          ? selectedVehicle.id
          : undefined,
    dealType: typeof o.dealType === "string" ? o.dealType : undefined,
    partName: typeof o.partName === "string" ? o.partName : undefined,
    service:
      service && (typeof service.id === "string" || typeof service.name === "string" || typeof service.desc === "string")
        ? {
            id: typeof service.id === "string" ? service.id : undefined,
            name: typeof service.name === "string" ? service.name : undefined,
            desc: typeof service.desc === "string" ? service.desc : undefined,
          }
        : undefined,
    selectedVehicle:
      selectedVehicle &&
      (selectedVehicleName ||
        typeof selectedVehicle.id === "string" ||
        typeof selectedVehicle.model === "string" ||
        typeof selectedVehicle.year === "string")
        ? {
            id: typeof selectedVehicle.id === "string" ? selectedVehicle.id : undefined,
            name: selectedVehicleName,
            vehicleName:
              selectedVehicleName ??
              (typeof o.vehicleName === "string" ? o.vehicleName : undefined),
            model:
              typeof selectedVehicle.model === "string"
                ? selectedVehicle.model
                : typeof o.vehicleModel === "string"
                  ? o.vehicleModel
                  : undefined,
            year:
              typeof selectedVehicle.year === "string"
                ? selectedVehicle.year
                : typeof o.vehicleYear === "string"
                  ? o.vehicleYear
                  : undefined,
          }
        : typeof o.vehicleName === "string" || typeof o.vehicleModel === "string" || typeof o.vehicleYear === "string"
          ? {
              vehicleName: typeof o.vehicleName === "string" ? o.vehicleName : undefined,
              model: typeof o.vehicleModel === "string" ? o.vehicleModel : undefined,
              year: typeof o.vehicleYear === "string" ? o.vehicleYear : undefined,
            }
          : undefined,
    dealImage: typeof o.dealImage === "string" ? o.dealImage : undefined,
    productImage: typeof o.productImage === "string" ? o.productImage : undefined,
  };
}

export function dealId(d: ShopDeal) {
  return d._id ?? d.id ?? "";
}

export function useMyDeals(
  token: string | null,
  enabled: boolean,
  showToast: (message: string, options?: { type?: "error" | "success" | "info" }) => void
) {
  const [deals, setDeals] = useState<ShopDeal[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDeals = useCallback(async () => {
    if (!token || !enabled) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetchMyDeals(token);
      if (__DEV__) {
        console.log("[my-deals] GET /api/auto-shop-owner/my-deals", res.data);
      }
      if (!res.ok) {
        const msg =
          res.data && typeof res.data === "object" && "message" in res.data
            ? String((res.data as { message?: string }).message ?? "")
            : "";
        showToast(msg || "Could not load deals.", { type: "error" });
        setDeals([]);
        return;
      }
      const list = extractDeals(res.data)
        .map(toDeal)
        .filter(Boolean) as ShopDeal[];
      setDeals(list);
    } catch {
      showToast("Network error loading deals.", { type: "error" });
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, showToast, token]);

  const removeDeal = useCallback(
    async (id: string) => {
      if (!token) {
        return false;
      }
      try {
        const res = await deleteDeal(token, id);
        const data = res.data as ApiEnvelope | null;
        const msg = data?.message;
        if (!res.ok) {
          showToast(typeof msg === "string" && msg ? msg : "Could not delete deal.", { type: "error" });
          return false;
        }
        showToast(typeof msg === "string" && msg ? msg : "Deal removed.", { type: "success" });
        await loadDeals();
        return true;
      } catch {
        showToast("Network error.", { type: "error" });
        return false;
      }
    },
    [loadDeals, showToast, token]
  );

  const createDeal = useCallback(
    async (params: Parameters<typeof createDealMultipart>[1]) => {
      if (!token) {
        return false;
      }
      try {
        const res = await createDealMultipart(token, params);
        const msg = res.data?.message;
        if (!res.ok) {
          showToast(typeof msg === "string" && msg ? msg : "Could not create deal.", { type: "error" });
          return false;
        }
        showToast(typeof msg === "string" && msg ? msg : "Deal created.", { type: "success" });
        await loadDeals();
        return true;
      } catch {
        showToast("Network error.", { type: "error" });
        return false;
      }
    },
    [loadDeals, showToast, token]
  );

  const saveDeal = useCallback(
    async (dealId: string, params: Parameters<typeof updateDealMultipart>[2]) => {
      if (!token) {
        return false;
      }
      try {
        const res = await updateDealMultipart(token, dealId, params);
        const msg = res.data?.message;
        if (!res.ok) {
          showToast(typeof msg === "string" && msg ? msg : "Could not update deal.", { type: "error" });
          return false;
        }
        showToast(typeof msg === "string" && msg ? msg : "Deal updated.", { type: "success" });
        await loadDeals();
        return true;
      } catch {
        showToast("Network error.", { type: "error" });
        return false;
      }
    },
    [loadDeals, showToast, token]
  );

  return { deals, loading, loadDeals, removeDeal, createDeal, saveDeal };
}
