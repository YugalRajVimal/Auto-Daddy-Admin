const BASE_ADMIN = `${import.meta.env.VITE_API_URL}/api/admin`;

// ---------- Types ----------

// Status as stored/returned by the backend.
export type LeadApiStatus = "Pending" | "Visited" | "Completed";

export const LEAD_STATUS_OPTIONS: LeadApiStatus[] = ["Pending", "Visited", "Completed"];
export const LEAD_STATUS_DEFAULT: LeadApiStatus = "Pending";

export type LeadApiRow = {
  _id: string;
  date: string;
  name: string;
  phone: string;
  city: string;
  email: string;
  website?: string;
  notes?: string;
  sentTo?: string | null;
  status: LeadApiStatus; // Always present, required, enforced for editing
  createdAt?: string;
  updatedAt?: string;
};

export type LeadListFilters = {
  status?: LeadApiStatus;
  city?: string;
  sentTo?: string;
  search?: string;
};

export type LeadCreatePayload = {
  date: string;
  name: string;
  phone: string;
  city: string;
  email: string;
  website?: string;
  notes?: string;
  sentTo?: string | null;
  status?: LeadApiStatus; // Allow creating with status (optional, defaults to "Pending" on backend if not provided)
};

export type LeadUpdatePayload = Partial<Omit<LeadCreatePayload, "status">> & {
  status?: LeadApiStatus; // Allow editing status with enum restriction
};

// ---------- Helpers ----------

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

const jsonHeaders = { "Content-Type": "application/json" };

// ---------- API calls ----------

// GET /leads  (supports ?status= &city= &sentTo= &search=)
export async function fetchLeads(filters?: LeadListFilters): Promise<LeadApiRow[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.city) params.set("city", filters.city);
  if (filters?.sentTo) params.set("sentTo", filters.sentTo);
  if (filters?.search) params.set("search", filters.search);
  const qs = params.toString();
  const res = await fetch(`${BASE_ADMIN}/leads${qs ? `?${qs}` : ""}`, {
    method: "GET",
    credentials: "include",
  });
  const body = await handleResponse<{ data?: LeadApiRow[] } | LeadApiRow[]>(res);
  return Array.isArray(body) ? body : body.data ?? [];
}

// GET /leads/:id
export async function fetchLeadById(id: string): Promise<LeadApiRow> {
  const res = await fetch(`${BASE_ADMIN}/leads/${id}`, {
    method: "GET",
    credentials: "include",
  });
  const body = await handleResponse<{ data?: LeadApiRow } | LeadApiRow>(res);
  return (body as any).data ?? (body as LeadApiRow);
}

// POST /leads
export async function createLead(payload: LeadCreatePayload): Promise<LeadApiRow> {
  // Allow payload.status, but if not set, backend should handle default "Pending"
  const res = await fetch(`${BASE_ADMIN}/leads`, {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
  const body = await handleResponse<{ data?: LeadApiRow } | LeadApiRow>(res);
  return (body as any).data ?? (body as LeadApiRow);
}

// PATCH /leads/:id
export async function updateLead(id: string, payload: LeadUpdatePayload): Promise<LeadApiRow> {
  // Allow updating status in payload, frontend should only allow valid enum values
  if (payload.status && !LEAD_STATUS_OPTIONS.includes(payload.status)) {
    throw new Error(
      `Invalid status "${payload.status}". Must be one of: ${LEAD_STATUS_OPTIONS.join(", ")}`
    );
  }
  const res = await fetch(`${BASE_ADMIN}/leads/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
  const body = await handleResponse<{ data?: LeadApiRow } | LeadApiRow>(res);
  return (body as any).data ?? (body as LeadApiRow);
}

// DELETE /leads/:id
export async function deleteLead(id: string): Promise<void> {
  const res = await fetch(`${BASE_ADMIN}/leads/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  await handleResponse<unknown>(res);
}