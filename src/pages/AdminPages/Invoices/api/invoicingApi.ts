// Adjust BASE_URL to match how the rest of your admin panel calls the API
// (e.g. import from your existing axios instance if you have one).
const BASE_URL = `${import.meta.env.VITE_API_URL}/api/admin/invoices`;

// Helper to get admin-token from localStorage and return Authorization header (no Bearer)
function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('admin-token');
  // Only include Authorization if token is present and non-empty as a string
  return token ? { Authorization: token } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  // Always include the Authorization header if available.
  // If FormData, don't set Content-Type to let the browser handle the boundary
  const userHeaders: Record<string, string> =
    options.headers && typeof options.headers === "object"
      ? Object.fromEntries(Object.entries(options.headers as Record<string, string>).filter(([k]) => k.toLowerCase() !== "authorization"))
      : {};

  let mergedHeaders: Record<string, string>;
  const authHeader = getAuthHeader();

  if (options.body instanceof FormData) {
    mergedHeaders = { ...authHeader, ...userHeaders };
  } else {
    mergedHeaders = { "Content-Type": "application/json", ...authHeader, ...userHeaders };
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include", // cookie-based auth
    headers: mergedHeaders,
    ...options,
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

/* ---------------------------- Items ---------------------------- */

// Only two allowed values for unitType: "Unit" or "Days"
// Removed HSN Code, itemType, and opening Stock related logic as per requirements

export type ItemView = "active" | "archived" | "deleted";

// We omit HSN Code, itemType, openingStock from parameters and payloads now
export interface InvoiceItem {
  _id?: string;
  itemName: string;
  description?: string;
  unitCost: number;
  quantity: number;
  unitType: "Unit" | "Days"; // Only "Unit" or "Days" allowed
  gstPercent?: number;
  image?: string;
  view?: ItemView;
  // No HSN Code, itemType, or openingStock!
}

export interface InvoiceSettings {
  invoicePrefix: string;
  nextNumber: number;
  padLength: number;
  nextInvoiceNumberPreview: string;
}

export function fetchInvoiceSettings() {
  return request<{ settings: InvoiceSettings }>(`/settings`);
}

export function updateInvoiceSettings(payload: {
  invoicePrefix?: string;
  nextNumber?: number;
  padLength?: number;
}) {
  return request<{ settings: InvoiceSettings }>(`/settings`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function fetchItems(params: { view: ItemView; search?: string; page?: number; limit?: number }) {
  const qs = new URLSearchParams({
    view: params.view,
    search: params.search || "",
    page: String(params.page || 1),
    limit: String(params.limit || 10),
  });
  return request<{ items: InvoiceItem[]; total: number; page: number; limit: number }>(`/items?${qs}`);
}

// FormValues for create/update should NOT include HSN Code, itemType, or openingStock
export function createItem(formValues: Record<string, string | number>, imageFile?: File | null) {
  const fd = new FormData();
  Object.entries(formValues).forEach(([k, v]) => fd.append(k, String(v)));
  if (imageFile) fd.append("itemImage", imageFile);
  return request<{ item: InvoiceItem }>(`/items`, { method: "POST", body: fd });
}

export function updateItem(
  id: string,
  formValues: Record<string, string | number>,
  imageFile?: File | null
) {
  const fd = new FormData();
  Object.entries(formValues).forEach(([k, v]) => fd.append(k, String(v)));
  if (imageFile) fd.append("itemImage", imageFile);
  return request<{ item: InvoiceItem }>(`/items/${id}`, { method: "PUT", body: fd });
}

export function bulkUpdateItems(ids: string[], action: "archive" | "delete" | "restore") {
  return request<{ message: string }>(`/items/bulk`, {
    method: "PATCH",
    body: JSON.stringify({ ids, action }),
  });
}

/* -------------------------- Invoices ---------------------------- */

export type InvoiceView = "active" | "archived" | "deleted";

// No changes required in invoice fetch payload, as InvoiceItem embedded type is covered above

export function fetchInvoices(params: { view: InvoiceView; search?: string; page?: number; limit?: number }) {
  const qs = new URLSearchParams({
    view: params.view,
    search: params.search || "",
    page: String(params.page || 1),
    limit: String(params.limit || 10),
  });
  return request<{ invoices: any[]; total: number; grandTotal: number }>(`?${qs}`);
}

export function createInvoice(payload: Record<string, any>) {
  return request<{ invoice: any }>(``, { method: "POST", body: JSON.stringify(payload) });
}

export function updateInvoice(id: string, payload: Record<string, any>) {
  return request<{ invoice: any }>(`/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function bulkUpdateInvoices(
  ids: string[],
  action: "archive" | "delete" | "restore" | "send" | "markPaid" | "markDraft"
) {
  return request<{ message: string }>(`/bulk`, {
    method: "PATCH",
    body: JSON.stringify({ ids, action }),
  });
}

// Convenience wrapper for sending a single invoice from the preview modal.
export function sendInvoiceById(id: string) {
  return bulkUpdateInvoices([id], "send");
}

export function copyInvoices(ids: string[], nextInvoiceNumbers: string[]) {
  return request<{ invoices: any[] }>(`/copy`, {
    method: "POST",
    body: JSON.stringify({ ids, nextInvoiceNumbers }),
  });
}

export function fetchBanks() {
  return request<{ banks: any[] }>(`/banks/list`);
}

/* ---------------------- Auto Shop Owners (Clients) ---------------------- */

// This endpoint lives outside /api/admin/invoices, so it hits the API root directly.
import axios from "axios";

// Utility to get the API base URL
const API = () => (import.meta.env.VITE_API_URL as string) || "";

export async function fetchAutoShopOwners() {
  const token = localStorage.getItem('admin-token');
  const res = await axios.get(`${API()}/api/admin/autoshopowners`, {
    headers: token
      ? { Authorization: token }
      : {},
  });
  const data = res.data;
  if (!data || data.success === false) {
    throw new Error(data?.message || "Failed to fetch auto shop owners");
  }
  return data as { success: boolean; data: any[] };
}