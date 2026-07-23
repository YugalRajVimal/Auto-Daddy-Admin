import {
  addExistingCustomer,
  deleteAddedCustomer,
  editOnboardedCustomer,
  fetchAddedCustomers,
  searchCustomers,
} from "@/lib/autoshopowner-api";
import { updateMyCustomer } from "@/lib/auto-shop-owner-api";
import { pickCustomerCity } from "@/lib/pick-customer-city";
import type {
  CarOwnerSearchHit,
  CustomerVehicle,
  MyCustomer,
  UpdateMyCustomerPayload,
  UpdateMyCustomerProfilePayload,
} from "@/types/auto-shop-owner-endpoints";
import { useCallback, useEffect, useState } from "react";

/** Maps People tabs → GET /api/autoshopowner/customer/added?status=… */
export type PeopleSection = "my-list" | "approval";

export function addedCustomersStatusForSection(section: PeopleSection): string {
  return section === "approval" ? "pending" : "approved";
}

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

function pickStatusFields(o: Record<string, unknown>): Pick<MyCustomer, "status" | "linkStatus" | "approvalStatus"> {
  const s = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
  return {
    status: s(o.status) ?? s(o.approvalStatus),
    linkStatus: s(o.linkStatus),
    approvalStatus: s(o.approvalStatus),
  };
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
    ...pickStatusFields(o),
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
    ...pickStatusFields(o),
  };
}

/** Parse GET /customer/added (or search) into `MyCustomer[]`. */
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

export function matchesMyCustomerSearch(customer: MyCustomer, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    customer.name,
    customer.email,
    customer.phone,
    customer.city,
    customer.address,
    ...(customer.vehicles ?? []).flatMap((v) => [v.licensePlateNo, v.vehicleName, v.model, v.vinNo]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function approvalStatusLabel(customer: MyCustomer): string {
  const status = (customer.status ?? customer.linkStatus ?? customer.approvalStatus ?? "").trim();
  if (status) return status;
  return "Pending";
}

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

export type InviteCustomerEdits = { name?: string; email?: string; city?: string };

export function useMyCustomers(
  token: string | null,
  enabled: boolean,
  showToast: (message: string, options?: { type?: "error" | "success" | "info" }) => void,
  section: PeopleSection
) {
  const [customers, setCustomers] = useState<MyCustomer[]>([]);
  const [searchHits, setSearchHits] = useState<CarOwnerSearchHit[]>([]);
  const [addedCustomerIds, setAddedCustomerIds] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  /** True when My List is showing directory+approved merge (search active). */
  const [directorySearchActive, setDirectorySearchActive] = useState(false);

  const loadSectionCustomers = useCallback(
    async (search = "") => {
      if (!token || !enabled) {
        setLoading(false);
        setCustomers([]);
        setSearchHits([]);
        setAddedCustomerIds(new Set());
        setDirectorySearchActive(false);
        return;
      }

      setLoading(true);
      try {
        if (section === "my-list") {
          const q = search.trim();

          if (!q) {
            setDirectorySearchActive(false);
            const approvedRes = await fetchAddedCustomers(token, "approved");
            if (!approvedRes.ok) {
              const msg =
                approvedRes.data && typeof approvedRes.data === "object" && "message" in approvedRes.data
                  ? String((approvedRes.data as { message?: string }).message ?? "")
                  : "";
              showToast(msg || "Could not load customers.", { type: "error" });
              setCustomers([]);
              setSearchHits([]);
              setAddedCustomerIds(new Set());
              return;
            }
            const approved = parseMyCustomersFromApiPayload(approvedRes.data);
            setAddedCustomerIds(new Set(approved.map((c) => customerKey(c)).filter(Boolean)));
            setCustomers(approved);
            setSearchHits([]);
            return;
          }

          setDirectorySearchActive(true);
          setSearching(true);
          const [addedRes, approvedRes, searchRes] = await Promise.all([
            fetchAddedCustomers(token),
            fetchAddedCustomers(token, "approved"),
            searchCustomers(token, q),
          ]);

          if (!addedRes.ok || !approvedRes.ok || !searchRes.ok) {
            setCustomers([]);
            setSearchHits([]);
            setAddedCustomerIds(new Set());
            showToast("Could not search customers.", { type: "error" });
            return;
          }

          const allAdded = parseMyCustomersFromApiPayload(addedRes.data);
          setAddedCustomerIds(new Set(allAdded.map((c) => customerKey(c)).filter(Boolean)));

          const approved = parseMyCustomersFromApiPayload(approvedRes.data);
          const hits = parseMyCustomersFromApiPayload(searchRes.data);
          const byId = new Map<string, MyCustomer>();
          for (const customer of hits) {
            const id = customerKey(customer);
            if (id) byId.set(id, customer);
            else byId.set(`anon-${byId.size}`, customer);
          }
          for (const customer of approved) {
            if (!matchesMyCustomerSearch(customer, q)) continue;
            const id = customerKey(customer);
            if (id) byId.set(id, customer);
            else byId.set(`anon-approved-${byId.size}`, customer);
          }
          const merged = [...byId.values()];
          setCustomers(merged);
          setSearchHits(merged);
          return;
        }

        setDirectorySearchActive(false);
        const status = addedCustomersStatusForSection(section);
        const res = await fetchAddedCustomers(token, status);
        if (!res.ok) {
          const msg =
            res.data && typeof res.data === "object" && "message" in res.data
              ? String((res.data as { message?: string }).message ?? "")
              : "";
          showToast(
            msg ||
              (section === "approval"
                ? "Could not load customers awaiting approval."
                : "Could not load customers."),
            { type: "error" }
          );
          setCustomers([]);
          setSearchHits([]);
          return;
        }
        setCustomers(parseMyCustomersFromApiPayload(res.data));
        setSearchHits([]);
      } catch {
        showToast("Network error loading customers.", { type: "error" });
        setCustomers([]);
        setSearchHits([]);
        setAddedCustomerIds(new Set());
      } finally {
        setLoading(false);
        setSearching(false);
      }
    },
    [enabled, section, showToast, token]
  );

  const loadCustomers = useCallback(async () => {
    await loadSectionCustomers("");
  }, [loadSectionCustomers]);

  useEffect(() => {
    void loadSectionCustomers("");
  }, [loadSectionCustomers]);

  const runSearch = useCallback(
    async (search: string) => {
      if (!token || !enabled) {
        return;
      }
      if (section !== "my-list") {
        return;
      }
      await loadSectionCustomers(search);
    },
    [enabled, loadSectionCustomers, section, token]
  );

  const addCustomer = useCallback(
    async (carOwnerId: string, edits?: InviteCustomerEdits) => {
      if (!token) {
        return false;
      }
      try {
        const body = {
          customerId: carOwnerId,
          ...(edits
            ? {
                edits: {
                  name: (edits.name ?? "").trim(),
                  email: (edits.email ?? "").trim(),
                  city: (edits.city ?? "").trim(),
                },
              }
            : {}),
        };
        const res = await addExistingCustomer(token, body);
        const msg =
          res.data && typeof res.data === "object" && "message" in res.data
            ? String((res.data as { message?: string }).message ?? "")
            : "";
        if (!res.ok) {
          showToast(msg || "Could not add customer.", { type: "error" });
          return false;
        }
        showToast(
          msg || "Notification sent for approval. Pl. wait or contact with Customer",
          { type: "success" }
        );
        return true;
      } catch {
        showToast("Network error.", { type: "error" });
        return false;
      }
    },
    [showToast, token]
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
        const res = await deleteAddedCustomer(token, id);
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
    async (
      payload: (UpdateMyCustomerProfilePayload | UpdateMyCustomerPayload) & { status?: string }
    ) => {
      if (!token) {
        return false;
      }
      try {
        const customerId = String(
          (payload as { carOwnerId?: string; customerId?: string }).carOwnerId ??
            (payload as { customerId?: string }).customerId ??
            ""
        ).trim();
        if (!customerId) {
          showToast("Could not update customer (missing id).", { type: "error" });
          return false;
        }
        const isOnboarded = (payload.status ?? "").toLowerCase() === "onboarded";
        let res;
        if (isOnboarded) {
          const patch = { ...(payload as Record<string, unknown>) };
          delete patch.carOwnerId;
          delete patch.customerId;
          delete patch.vehicles;
          delete patch.status;
          res = await editOnboardedCustomer(token, customerId, patch);
        } else {
          const { status: _status, ...rest } = payload;
          void _status;
          res = await updateMyCustomer(token, rest);
        }
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

  const isCustomerAlreadyAdded = useCallback(
    (customer: MyCustomer | CarOwnerSearchHit) => {
      const id = "carOwnerId" in customer ? customerKey(customer as MyCustomer) : hitKey(customer);
      return Boolean(id && addedCustomerIds.has(id));
    },
    [addedCustomerIds]
  );

  return {
    customers,
    searchHits,
    addedCustomerIds,
    directorySearchActive,
    loading,
    searching,
    loadCustomers,
    loadSectionCustomers,
    runSearch,
    addCustomer,
    removeCustomer,
    updateCustomer,
    setSearchHits,
    isCustomerAlreadyAdded,
  };
}
