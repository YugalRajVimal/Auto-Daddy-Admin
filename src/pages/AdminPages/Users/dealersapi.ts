import { DummyUserRow } from "./DummyUserListPage";

const BASE_ADMIN = `${import.meta.env.VITE_API_URL}/api/admin`;

// --- Helper to fetch admin token and auth headers (no Bearer) ---
function getAdminToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("admin-token");
  }
  return null;
}
function getAuthHeaders(): HeadersInit {
  const token = getAdminToken();
  return token ? { Authorization: token } : {};
}

// ---------- Types ----------

export type DealerApiRow = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  dealership: string;
  city: string;
  address?: string;
  categories?: string[];
  websiteUrl?: string;
  image?: string;
  dealerImage?: string;
  status?: string; // "Active" | "Suspended" | "Deleted"
  isDeleted?: boolean;
  createdAt?: string;
  date?: string;
  listings?: number;
  leads?: number;
};

export type DealerListFilters = {
  name?: string;
  city?: string;
  status?: string;
};

export type DealerPayload = {
  name?: string;
  email?: string;
  phone?: string;
  dealership?: string;
  city?: string;
  address?: string;
  categories?: string[];
  websiteUrl?: string;
  status?: string;
  listings?: number;
  leads?: number;
  dealerImage?: File | null;
};

// ---------- Mapping: API row -> UI row (DummyUserRow) ----------

export function mapDealerToRow(d: DealerApiRow): DummyUserRow {
  return {
    _id: d._id,
    name: d.name,
    email: d.email,
    countryCode: "",
    phone: d.phone,
    pincode: "",
    address: d.address ?? "",
    city: d.city,
    createdAt: d.createdAt ?? d.date ?? new Date().toISOString(),
    isDisabled: String(d.status ?? "").toLowerCase() === "suspended",
    status: d.isDeleted || String(d.status ?? "").toLowerCase() === "deleted" ? "deleted" : undefined,
    primaryLabel: d.dealership,
    websiteUrl: d.websiteUrl,
    imageUrl: d.dealerImage ?? d.image,
    categories: Array.isArray(d.categories) ? d.categories : [],
    countA: d.listings ?? 0,
    countB: d.leads ?? 0,
  };
}

// ---------- Helpers ----------

function buildFormData(payload: DealerPayload): FormData {
  const fd = new FormData();
  if (payload.name !== undefined) fd.append("name", payload.name);
  if (payload.email !== undefined) fd.append("email", payload.email);
  if (payload.phone !== undefined) fd.append("phone", payload.phone);
  if (payload.dealership !== undefined) fd.append("dealership", payload.dealership);
  if (payload.city !== undefined) fd.append("city", payload.city);
  if (payload.address !== undefined) fd.append("address", payload.address);
  if (payload.categories !== undefined) fd.append("categories", JSON.stringify(payload.categories));
  if (payload.websiteUrl !== undefined) fd.append("websiteUrl", payload.websiteUrl);
  if (payload.status !== undefined) fd.append("status", payload.status);
  if (payload.listings !== undefined) fd.append("listings", String(payload.listings));
  if (payload.leads !== undefined) fd.append("leads", String(payload.leads));
  if (payload.dealerImage) fd.append("dealerImage", payload.dealerImage);
  return fd;
}

async function handleResponse<T>(res: Response): Promise<T> {
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // no JSON body
  }
  if (!res.ok) {
    const message = body?.message || body?.error || `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return body as T;
}

// ---------- API calls ----------

// GET /dealer  (supports ?name= &city= &status=)
export async function fetchDealers(filters?: DealerListFilters): Promise<DealerApiRow[]> {
  const params = new URLSearchParams();
  if (filters?.name) params.set("name", filters.name);
  if (filters?.city) params.set("city", filters.city);
  if (filters?.status) params.set("status", filters.status);
  const qs = params.toString();
  const res = await fetch(`${BASE_ADMIN}/dealer${qs ? `?${qs}` : ""}`, {
    method: "GET",
    credentials: "include",
    headers: {
      ...getAuthHeaders(),
    },
  });
  const body = await handleResponse<{ data?: DealerApiRow[] } | DealerApiRow[]>(res);
  return Array.isArray(body) ? body : body.data ?? [];
}

// GET /dealer/:id
export async function fetchDealerById(id: string): Promise<DealerApiRow> {
  const res = await fetch(`${BASE_ADMIN}/dealer/${id}`, {
    method: "GET",
    credentials: "include",
    headers: {
      ...getAuthHeaders(),
    },
  });
  const body = await handleResponse<{ data?: DealerApiRow } | DealerApiRow>(res);
  return (body as any).data ?? (body as DealerApiRow);
}

// POST /dealer  (multipart/form-data, image optional)
export async function createDealer(payload: DealerPayload): Promise<DealerApiRow> {
  const res = await fetch(`${BASE_ADMIN}/dealer`, {
    method: "POST",
    credentials: "include",
    headers: {
      ...getAuthHeaders(),
      // Don't set Content-Type header for FormData
    },
    body: buildFormData(payload),
  });
  const body = await handleResponse<{ data?: DealerApiRow } | DealerApiRow>(res);
  return (body as any).data ?? (body as DealerApiRow);
}

// PATCH /dealer/:id  (multipart/form-data, image optional)
export async function updateDealer(id: string, payload: DealerPayload): Promise<DealerApiRow> {
  const res = await fetch(`${BASE_ADMIN}/dealer/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      ...getAuthHeaders(),
      // Don't set Content-Type header for FormData
    },
    body: buildFormData(payload),
  });
  const body = await handleResponse<{ data?: DealerApiRow } | DealerApiRow>(res);
  return (body as any).data ?? (body as DealerApiRow);
}

// DELETE /dealer/:id
export async function deleteDealer(id: string): Promise<void> {
  const res = await fetch(`${BASE_ADMIN}/dealer/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      ...getAuthHeaders(),
    },
  });
  await handleResponse<unknown>(res);
}
