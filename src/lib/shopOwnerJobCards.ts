/**
 * Normalizes rows from GET /api/auto-shop-owner/job-cards (shape varies by backend).
 */

export type JobCardListBucket = "pending" | "approved" | "rejected" | "autoRejected";

export type JobCardListRow = {
  id: string;
  raw: unknown;
  /** When GET /job-cards returns grouped lists, which bucket this row came from */
  listBucket?: JobCardListBucket;
  customerName?: string;
  jobNo?: string;
  vehiclePlate?: string;
  vehicleMakeModel?: string;
  servicesSummary?: string;
  odometerCurrent?: string;
  odometerDue?: string;
  phone?: string;
  date?: string;
  /** Job workflow status (e.g. Pending, Approved) */
  status?: string;
  /** Payment state from API */
  paymentStatus?: string;
  total?: number | string;
  issueDescription?: string;
  /** Present on some list payloads when payment still due */
  unpaid?: boolean;
};

function s(v: unknown): string | undefined {
  if (typeof v === "string" && v.trim()) {
    return v.trim();
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    return String(v);
  }
  return undefined;
}

function pickId(o: Record<string, unknown>): string {
  const raw = o._id ?? o.id ?? o.jobCardId ?? o.jobId;
  if (typeof raw === "string" && raw) {
    return raw;
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return String(raw);
  }
  if (raw && typeof raw === "object" && "$oid" in raw && typeof (raw as { $oid?: unknown }).$oid === "string") {
    return (raw as { $oid: string }).$oid;
  }
  return "";
}

function nestedObj(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function extractJobCardArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (!payload || typeof payload !== "object") {
    return [];
  }
  const root = payload as Record<string, unknown>;
  const tryKeys = (obj: Record<string, unknown>): unknown[] | null => {
    for (const k of [
      "jobCards",
      "cards",
      "items",
      "rows",
      "list",
      "results",
      "data",
      "unpaid",
      "paid",
      "records",
    ]) {
      const v = obj[k];
      if (Array.isArray(v)) {
        return v as unknown[];
      }
    }
    return null;
  };
  const direct = tryKeys(root);
  if (direct) {
    return direct;
  }
  const data = nestedObj(root.data);
  if (data) {
    const inner = tryKeys(data);
    if (inner) {
      return inner;
    }
  }
  for (const v of Object.values(root)) {
    if (Array.isArray(v) && v.length > 0 && v[0] && typeof v[0] === "object") {
      const first = v[0] as Record<string, unknown>;
      if (
        pickId(first) ||
        s(first.jobNo) ||
        s(first.jobNumber) ||
        s(first.jobCardNumber) ||
        nestedObj(first.customer) ||
        nestedObj(first.customerId) ||
        nestedObj(first.vehicleId)
      ) {
        return v as unknown[];
      }
    }
  }
  return [];
}

/** GET /job-cards grouped response: `{ success, pending, approved, rejected, autoRejected }` */
function extractRowsWithBuckets(payload: unknown): { raw: unknown; bucket?: JobCardListBucket }[] {
  const buckets: JobCardListBucket[] = ["pending", "approved", "rejected", "autoRejected"];
  const collectFrom = (obj: Record<string, unknown>): { raw: unknown; bucket: JobCardListBucket }[] | null => {
    let sawBucketKey = false;
    const out: { raw: unknown; bucket: JobCardListBucket }[] = [];
    for (const b of buckets) {
      if (!(b in obj)) {
        continue;
      }
      sawBucketKey = true;
      const arr = obj[b];
      if (!Array.isArray(arr)) {
        continue;
      }
      for (const raw of arr) {
        out.push({ raw, bucket: b });
      }
    }
    return sawBucketKey ? out : null;
  };
  if (!payload || typeof payload !== "object") {
    return [];
  }
  const root = payload as Record<string, unknown>;
  const grouped = collectFrom(root);
  if (grouped) {
    return grouped;
  }
  const data = nestedObj(root.data);
  if (data) {
    const groupedData = collectFrom(data);
    if (groupedData) {
      return groupedData;
    }
  }
  return extractJobCardArray(payload).map((raw) => ({ raw }));
}

function pickCustomerPhone(o: Record<string, unknown>, customer: Record<string, unknown> | null): string | undefined {
  const fromRoot =
    s(o.customerContactNo) ??
    s(o.customer_contact_no) ??
    s(o.phone) ??
    s(o.mobile) ??
    s(o.mobileNo) ??
    s(o.mobileNumber) ??
    s(o.customerPhone) ??
    s(o.ownerPhone) ??
    s(o.contactNumber) ??
    s(o.phoneNumber) ??
    s(o.customerMobile) ??
    s(o.carOwnerPhone);
  if (fromRoot) {
    return fromRoot;
  }
  if (customer) {
    const cc = s(customer.countryCode);
    const p = s(customer.phone) ?? s(customer.mobile) ?? s(customer.mobileNo);
    if (cc && p) {
      return `${cc} ${p}`;
    }
    return p;
  }
  return undefined;
}

function joinServiceNames(raw: unknown): string | undefined {
  if (!Array.isArray(raw)) {
    return undefined;
  }
  const parts: string[] = [];
  for (const item of raw) {
    const o = nestedObj(item);
    if (!o) {
      continue;
    }
    const name = s(o.name) ?? s(o.serviceName);
    const subs = o.subServices ?? o.selectedSubServices;
    if (Array.isArray(subs) && subs.length > 0) {
      for (const sub of subs) {
        const so = nestedObj(sub);
        const sn = so ? s(so.name) : undefined;
        if (sn) {
          parts.push(sn);
        }
      }
    } else if (name) {
      parts.push(name);
    }
  }
  return parts.length ? parts.join(", ") : undefined;
}

function toRow(raw: unknown, listBucket?: JobCardListBucket): JobCardListRow | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const id = pickId(o);
  if (!id) {
    return null;
  }
  const customer =
    nestedObj(o.customer) ??
    nestedObj(o.customerId) ??
    nestedObj(o.carOwner) ??
    nestedObj(o.owner);
  const vehicle =
    nestedObj(o.vehicle) ??
    nestedObj(o.vehicleId) ??
    nestedObj(o.myVehicle) ??
    nestedObj(o.car);
  const make = vehicle ? nestedObj(vehicle.make) ?? nestedObj(vehicle.vehicleMake) : null;
  const customerName =
    s(o.customerName) ??
    s(o.ownerName) ??
    (customer ? s(customer.name) : undefined);
  const jobNo =
    s(o.jobCardNumber) ?? s(o.jobNo) ?? s(o.jobNumber) ?? s(o.jobCode) ?? s(o.displayJobNo);
  const vehiclePlate =
    s(o.licensePlateNo) ??
    s(o.registration) ??
    (vehicle ? s(vehicle.licensePlateNo) ?? s(vehicle.registration) : undefined);
  const modelPart =
    (vehicle ? s(vehicle.vehicleName) ?? s(vehicle.model) : undefined) ??
    (make ? s(make.name) : undefined);
  const model2 = make ? s(make.model) : undefined;
  const vehicleMakeModel =
    s(o.vehicleMakeModel) ??
    (modelPart && model2 ? `${modelPart} ${model2}`.trim() : modelPart ?? model2);
  const phone = pickCustomerPhone(o, customer);
  const odometerCurrent =
    s(o.odometerReading) ??
    s(o.currentOdometerReading) ??
    (vehicle ? s(vehicle.odometerReading) : undefined);
  const odometerDue = s(o.dueOdometerReading) ?? s(o.dueAtOdometer);
  const date =
    s(o.serviceDate) ??
    s(o.jobDate) ??
    s(o.date) ??
    s(o.createdAt)?.slice(0, 10) ??
    s(o.scheduledDate);
  const status = s(o.status) ?? s(o.jobStatus);
  const paymentStatus = s(o.paymentStatus);
  const unpaid = typeof o.unpaid === "boolean" ? o.unpaid : undefined;
  const totalRaw =
    o.totalPayableAmount ?? o.total ?? o.grandTotal ?? o.amount ?? o.price;
  const total =
    typeof totalRaw === "number" || typeof totalRaw === "string" ? totalRaw : undefined;
  const servicesSummary = joinServiceNames(o.services) ?? s(o.servicesSummary) ?? s(o.serviceSummary);
  const issueDescription = s(o.issueDescription);

  return {
    id,
    raw,
    listBucket,
    customerName,
    jobNo,
    vehiclePlate,
    vehicleMakeModel,
    servicesSummary,
    odometerCurrent,
    odometerDue,
    phone,
    date,
    status,
    paymentStatus,
    total,
    issueDescription,
    unpaid,
  };
}

export function isJobCardPending(row: JobCardListRow): boolean {
  const status = (row.status ?? "").trim().toLowerCase();
  if (status === "pending") return true;
  if (row.listBucket === "pending") return true;
  const raw = row.raw;
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const s = String(o.status ?? o.jobStatus ?? "").trim().toLowerCase();
    return s === "pending";
  }
  return false;
}

export function parseJobCardsFromPagePayload(payload: unknown): JobCardListRow[] {
  return extractRowsWithBuckets(payload)
    .map(({ raw, bucket }) => toRow(raw, bucket))
    .filter(Boolean) as JobCardListRow[];
}
