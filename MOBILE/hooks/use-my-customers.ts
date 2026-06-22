import {
  addCarOwnerToMyCustomers,
  buildMyCustomersQuery,
  fetchMyCustomers,
  type MyCustomersPeriod,
  removeCarOwnerFromMyCustomers,
  searchCarOwners,
  updateMyCustomer,
} from "@/lib/auto-shop-owner-api";
import type {
  CarOwnerSearchHit,
  CustomerVehicle,
  MyCustomer,
  UpdateMyCustomerPayload,
  UpdateMyCustomerProfilePayload,
} from "@/types/auto-shop-owner-endpoints";
import { pickCustomerCity } from "@/lib/pick-customer-city";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";

function extractList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (!payload || typeof payload !== "object") {
    return [];
  }
  const root = payload as Record<string, unknown>;
  const nested = root.data;
  if (Array.isArray(nested)) {
    return nested;
  }
  if (nested && typeof nested === "object") {
    const d = nested as Record<string, unknown>;
    for (const k of ["customers", "carOwners", "myCustomers", "data", "rows", "items", "list", "results"]) {
      if (Array.isArray(d[k])) {
        return d[k] as unknown[];
      }
    }
  }
  for (const k of ["customers", "carOwners", "myCustomers", "data", "rows", "items", "list", "results"]) {
    if (Array.isArray(root[k])) {
      return root[k] as unknown[];
    }
  }
  return [];
}

function mergeCarOwnerFields(o: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...o };
  const co = o.carOwner;
  if (co && typeof co === "object") {
    const c = co as Record<string, unknown>;
    for (const key of Object.keys(c)) {
      const v = c[key];
      if (out[key] == null || out[key] === "") {
        out[key] = v;
      }
    }
  }
  return out;
}

function parseVehiclesFromObject(o: Record<string, unknown>): CustomerVehicle[] {
  const raw = o.myVehicles ?? o.vehicles ?? o.cars;
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: CustomerVehicle[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const v = item as Record<string, unknown>;
    const make =
      v.make && typeof v.make === "object"
        ? (v.make as Record<string, unknown>)
        : v.vehicleMake && typeof v.vehicleMake === "object"
          ? (v.vehicleMake as Record<string, unknown>)
          : null;
    const vehicleName =
      typeof v.vehicleName === "string"
        ? v.vehicleName
        : typeof make?.name === "string"
          ? make.name
          : typeof v.name === "string"
            ? v.name
            : undefined;
    const model =
      typeof v.model === "string"
        ? v.model
        : typeof make?.model === "string"
          ? make.model
          : undefined;
    const disabledFlag = v.disabled ?? v.isDisabled;
    const disabled =
      typeof disabledFlag === "boolean"
        ? disabledFlag
        : disabledFlag === 1 || disabledFlag === "1" || disabledFlag === "true"
          ? true
          : undefined;
    const vehicleId =
      typeof v.vId === "string" && v.vId.trim()
        ? v.vId.trim()
        : typeof v._id === "string" && v._id.trim()
          ? v._id.trim()
          : typeof v.id === "string" && v.id.trim()
            ? v.id.trim()
            : undefined;
    out.push({
      _id: vehicleId,
      vId: typeof v.vId === "string" && v.vId.trim() ? v.vId.trim() : vehicleId,
      ...(disabled ? { disabled: true } : {}),
      licensePlateNo: typeof v.licensePlateNo === "string" ? v.licensePlateNo : undefined,
      vinNo: typeof v.vinNo === "string" ? v.vinNo : undefined,
      vehicleName,
      model,
      year: typeof v.year === "string" || typeof v.year === "number" ? String(v.year) : undefined,
      odometerReading:
        typeof v.odometerReading === "string" || typeof v.odometerReading === "number"
          ? String(v.odometerReading)
          : undefined,
      dueOdometerReading:
        typeof v.dueOdometerReading === "string" || typeof v.dueOdometerReading === "number"
          ? String(v.dueOdometerReading)
          : undefined,
    });
  }
  return out;
}

function pickTimestamp(o: Record<string, unknown>): string | undefined {
  for (const k of [
    "updatedAt",
    "createdAt",
    "addedAt",
    "joinedAt",
    "linkedAt",
    "associatedAt",
    "addedToShopAt",
  ]) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) {
      return v;
    }
  }
  return undefined;
}

function toSearchHit(raw: unknown): CarOwnerSearchHit | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const rawObj = raw as Record<string, unknown>;
  const o = mergeCarOwnerFields(rawObj);
  let cityPick = pickCustomerCity(o);
  if (!cityPick?.name) {
    const co = rawObj.carOwner;
    if (co && typeof co === "object") {
      cityPick = pickCustomerCity(co as Record<string, unknown>) ?? cityPick;
    }
  }
  const id =
    typeof o._id === "string"
      ? o._id
      : typeof o.id === "string"
        ? o.id
        : typeof o.carOwnerId === "string"
          ? o.carOwnerId
          : undefined;
  const name = typeof o.name === "string" ? o.name : undefined;
  const phone = typeof o.phone === "string" ? o.phone : undefined;
  if (!id && !name?.trim() && !phone?.trim()) {
    return null;
  }
  const vehicles = parseVehiclesFromObject(o);
  return {
    _id: typeof o._id === "string" ? o._id : undefined,
    id,
    carOwnerId: typeof o.carOwnerId === "string" ? o.carOwnerId : undefined,
    name,
    email: typeof o.email === "string" ? o.email : undefined,
    phone,
    countryCode: typeof o.countryCode === "string" ? o.countryCode : undefined,
    address: typeof o.address === "string" ? o.address : undefined,
    pincode: typeof o.pincode === "string" ? o.pincode : undefined,
    city: cityPick?.name,
    cityId: cityPick?.id,
    vehicles: vehicles.length > 0 ? vehicles : undefined,
    createdAt: pickTimestamp(o),
    updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : undefined,
  };
}

function pickCarOwnerIdForApi(o: Record<string, unknown>, base: CarOwnerSearchHit): string | undefined {
  const s = (v: unknown): string | undefined =>
    typeof v === "string" && v.trim() ? v.trim() : undefined;
  const co = o.carOwner;
  if (s(co)) {
    return s(co);
  }
  if (co && typeof co === "object" && s((co as { _id?: unknown })._id)) {
    return s((co as { _id: unknown })._id);
  }
  return (
    s(o.carOwnerId) ??
    s((o as { customerId?: unknown }).customerId) ??
    s((o as { userId?: unknown }).userId) ??
    s(base.carOwnerId) ??
    s(base.id) ??
    s(base._id)
  );
}

function toCustomer(raw: unknown): MyCustomer | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const o = mergeCarOwnerFields(raw as Record<string, unknown>);
  const base = toSearchHit(raw);
  if (!base) {
    return null;
  }
  const carOwnerId = pickCarOwnerIdForApi(o, base) ?? base._id ?? base.id;
  const vehicles = base.vehicles?.length ? base.vehicles : parseVehiclesFromObject(o);
  const recentJobCardRaw = o.recentJobCard;
  const recentJobCard =
    recentJobCardRaw && typeof recentJobCardRaw === "object"
      ? (recentJobCardRaw as Record<string, unknown>)
      : null;
  return {
    ...base,
    carOwnerId,
    vehicles: vehicles.length > 0 ? vehicles : base.vehicles,
    recentJobCard: recentJobCard
      ? {
          subServices: Array.isArray(recentJobCard.subServices)
            ? (recentJobCard.subServices.filter((x) => typeof x === "string") as string[])
            : undefined,
          date: typeof recentJobCard.date === "string" ? recentJobCard.date : undefined,
          time: typeof recentJobCard.time === "string" ? recentJobCard.time : undefined,
          vehicleNumberPlate:
            typeof recentJobCard.vehicleNumberPlate === "string" ? recentJobCard.vehicleNumberPlate : undefined,
        }
      : null,
    addedAt: typeof o.addedAt === "string" ? o.addedAt : undefined,
    linkedAt: typeof o.linkedAt === "string" ? o.linkedAt : undefined,
    addedToShopAt: typeof o.addedToShopAt === "string" ? o.addedToShopAt : undefined,
  };
}

/** Parse GET /my-customers (or equivalent list) into `MyCustomer[]` without period filtering. */
export function parseMyCustomersFromApiPayload(data: unknown): MyCustomer[] {
  return extractList(data).map(toCustomer).filter(Boolean) as MyCustomer[];
}

/** Prefer car owner id for API calls; avoid shop–customer link _id when carOwnerId is set. */
export function customerKey(c: MyCustomer) {
  return (c.carOwnerId ?? c.id ?? c._id ?? "").trim();
}

export function hitKey(h: CarOwnerSearchHit) {
  return h._id ?? h.id ?? h.carOwnerId ?? "";
}

/** Milliseconds for date-range filter; prefers “added to shop”-style fields over account createdAt. */
export function customerTimestampMs(c: MyCustomer): number | null {
  const raw = c.addedToShopAt ?? c.addedAt ?? c.linkedAt ?? c.updatedAt ?? c.createdAt;
  if (!raw) {
    return null;
  }
  const t = Date.parse(raw);
  return Number.isNaN(t) ? null : t;
}

export function timeWindowForAnchor(
  mode: "daily" | "weekly" | "monthly",
  anchor: Date
): { start: number; end: number } {
  const a = new Date(anchor);
  a.setHours(0, 0, 0, 0);
  if (mode === "daily") {
    const start = a.getTime();
    const endDay = new Date(a);
    endDay.setHours(23, 59, 59, 999);
    return { start, end: endDay.getTime() };
  }
  if (mode === "weekly") {
    const day = a.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const startD = new Date(a);
    startD.setDate(a.getDate() + diff);
    startD.setHours(0, 0, 0, 0);
    const endD = new Date(startD);
    endD.setDate(startD.getDate() + 6);
    endD.setHours(23, 59, 59, 999);
    return { start: startD.getTime(), end: endD.getTime() };
  }
  const start = new Date(a.getFullYear(), a.getMonth(), 1).getTime();
  const end = new Date(a.getFullYear(), a.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
  return { start, end };
}

export function useMyCustomers(
  token: string | null,
  enabled: boolean,
  showToast: (message: string, options?: { type?: "error" | "success" | "info" }) => void,
  listPeriod: MyCustomersPeriod
) {
  const [customers, setCustomers] = useState<MyCustomer[]>([]);
  const [searchHits, setSearchHits] = useState<CarOwnerSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const loadCustomers = useCallback(async () => {
    if (!token || !enabled) {
      setLoading(false);
      return;
    }
    const query = buildMyCustomersQuery(listPeriod);
    setLoading(true);
    try {
      const res = await fetchMyCustomers(token, query);
      if (!res.ok) {
        const msg =
          res.data && typeof res.data === "object" && "message" in res.data
            ? String((res.data as { message?: string }).message ?? "")
            : "";
        showToast(msg || "Could not load customers.", { type: "error" });
        setCustomers([]);
        return;
      }
      const list = extractList(res.data).map(toCustomer).filter(Boolean) as MyCustomer[];
      setCustomers(list);
    } catch {
      showToast("Network error loading customers.", { type: "error" });
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, listPeriod, showToast, token]);

  const periodAnchorMs = listPeriod.anchorDate.getTime();

  useLayoutEffect(() => {
    if (!token || !enabled) {
      return;
    }
    setLoading(true);
  }, [enabled, listPeriod.timeFilter, periodAnchorMs, token]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers, listPeriod.timeFilter, periodAnchorMs]);

  const runSearch = useCallback(
    async (search: string) => {
      if (!token || !enabled) {
        return;
      }
      const q = search.trim();
      if (!q) {
        setSearchHits([]);
        return;
      }
      setSearching(true);
      try {
        const res = await searchCarOwners(token, q);
        if (!res.ok) {
          setSearchHits([]);
          return;
        }
        const list = extractList(res.data).map(toSearchHit).filter(Boolean) as CarOwnerSearchHit[];
        setSearchHits(list);
      } catch {
        setSearchHits([]);
      } finally {
        setSearching(false);
      }
    },
    [enabled, token]
  );

  const addCustomer = useCallback(
    async (carOwnerId: string) => {
      if (!token) {
        return false;
      }
      try {
        const res = await addCarOwnerToMyCustomers(token, carOwnerId);
        const msg =
          res.data && typeof res.data === "object" && "message" in res.data
            ? String((res.data as { message?: string }).message ?? "")
            : "";
        if (!res.ok) {
          showToast(msg || "Could not add customer.", { type: "error" });
          return false;
        }
        showToast(msg || "Customer added.", { type: "success" });
        await loadCustomers();
        return true;
      } catch {
        showToast("Network error.", { type: "error" });
        return false;
      }
    },
    [loadCustomers, showToast, token]
  );

  const removeCustomer = useCallback(
    async (carOwnerId: string) => {
      if (!token) {
        return false;
      }
      const id = carOwnerId.trim();
      if (!id) {
        showToast("Could not remove customer (missing id).", { type: "error" });
        return false;
      }
      try {
        const res = await removeCarOwnerFromMyCustomers(token, id);
        const msg =
          res.data && typeof res.data === "object" && "message" in res.data
            ? String((res.data as { message?: string }).message ?? "")
            : "";
        if (!res.ok) {
          showToast(msg || "Could not remove customer.", { type: "error" });
          return false;
        }
        showToast(msg || "Removed from your list.", { type: "success" });
        await loadCustomers();
        return true;
      } catch {
        showToast("Network error.", { type: "error" });
        return false;
      }
    },
    [loadCustomers, showToast, token]
  );

  const updateCustomer = useCallback(
    async (payload: UpdateMyCustomerProfilePayload | UpdateMyCustomerPayload) => {
      if (!token) {
        return false;
      }
      try {
        const res = await updateMyCustomer(token, payload);
        const msg =
          res.data && typeof res.data === "object" && "message" in res.data
            ? String((res.data as { message?: string }).message ?? "")
            : "";
        if (!res.ok) {
          showToast(msg || "Could not update customer.", { type: "error" });
          return false;
        }
        showToast(msg || "Customer updated.", { type: "success" });
        await loadCustomers();
        return true;
      } catch {
        showToast("Network error.", { type: "error" });
        return false;
      }
    },
    [loadCustomers, showToast, token]
  );

  return {
    customers,
    searchHits,
    loading,
    searching,
    loadCustomers,
    runSearch,
    addCustomer,
    removeCustomer,
    updateCustomer,
    setSearchHits,
  };
}
