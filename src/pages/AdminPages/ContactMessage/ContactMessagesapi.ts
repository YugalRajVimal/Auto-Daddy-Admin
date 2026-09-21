const BASE_ADMIN = `${import.meta.env.VITE_API_URL}/api/admin`;

// --- Helpers to get admin-token for headers (same pattern as leadsAPI.ts) ---
function getAdminToken(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("admin-token") || "";
  }
  return "";
}
function getAuthHeaders(): HeadersInit | undefined {
  const token = getAdminToken();
  return token ? { Authorization: token } : undefined;
}

// ---------- Types ----------

export type ContactMessageStatus = "New" | "Read" | "Replied" | "Archived";

export const CONTACT_MESSAGE_STATUS_OPTIONS: ContactMessageStatus[] = [
  "New",
  "Read",
  "Replied",
  "Archived",
];

export type ContactMessageApiRow = {
  _id: string;
  firstName: string;
  lastName?: string;
  email: string;
  subject?: string;
  message: string;
  status: ContactMessageStatus;
  createdAt: string;
  updatedAt?: string;
};

export type ContactMessageListFilters = {
  status?: ContactMessageStatus;
  search?: string;
  page?: number;
  limit?: number;
};

export type ContactMessagePagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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

// ---------- API calls ----------

// GET /contact-messages  (supports ?status= &search= &page= &limit=)
export async function fetchContactMessages(
  filters?: ContactMessageListFilters
): Promise<{ data: ContactMessageApiRow[]; pagination: ContactMessagePagination }> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();
  const headers = getAuthHeaders();
  const res = await fetch(`${BASE_ADMIN}/contact-messages${qs ? `?${qs}` : ""}`, {
    method: "GET",
    credentials: "include",
    ...(headers ? { headers } : {}),
  });
  const body = await handleResponse<{ data: ContactMessageApiRow[]; pagination: ContactMessagePagination }>(res);
  return body;
}

// GET /contact-messages/:id — also flips "New" -> "Read" server-side.
export async function fetchContactMessageById(id: string): Promise<ContactMessageApiRow> {
  const headers = getAuthHeaders();
  const res = await fetch(`${BASE_ADMIN}/contact-messages/${id}`, {
    method: "GET",
    credentials: "include",
    ...(headers ? { headers } : {}),
  });
  const body = await handleResponse<{ data: ContactMessageApiRow }>(res);
  return body.data;
}

// PATCH /contact-messages/:id  { status }
export async function updateContactMessageStatus(
  id: string,
  status: ContactMessageStatus
): Promise<ContactMessageApiRow> {
  const headers = getAuthHeaders();
  const res = await fetch(`${BASE_ADMIN}/contact-messages/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(headers || {}) },
    body: JSON.stringify({ status }),
  });
  const body = await handleResponse<{ data: ContactMessageApiRow }>(res);
  return body.data;
}

// DELETE /contact-messages/:id
export async function deleteContactMessage(id: string): Promise<void> {
  const headers = getAuthHeaders();
  const res = await fetch(`${BASE_ADMIN}/contact-messages/${id}`, {
    method: "DELETE",
    credentials: "include",
    ...(headers ? { headers } : {}),
  });
  await handleResponse<{ message: string }>(res);
}