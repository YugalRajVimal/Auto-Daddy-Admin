import { getJson, patchJson, postFormData } from "../api/mobileAuth";
import type { ShopTicket } from "../components/shop/ShopTicketRow";

export type ApiEnvelope = { success?: boolean; message?: string };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function extractList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const root = asRecord(payload);
  if (!root) return [];
  const nested = asRecord(root.data);
  for (const key of ["inviteHelps", "invites", "tickets", "data", "rows", "items", "list", "results"]) {
    if (Array.isArray(root[key])) return root[key] as unknown[];
    if (nested && Array.isArray(nested[key])) return nested[key] as unknown[];
  }
  if (Array.isArray(root.data)) return root.data;
  return [];
}

function formatTicketDate(raw: string): string {
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function normalizeStatus(raw: unknown): ShopTicket["status"] {
  const status = asString(raw).toLowerCase();
  if (status === "resolved" || status === "closed" || status === "done") return "resolved";
  return "active";
}

export function normalizeInviteHelpTicket(raw: unknown): ShopTicket | null {
  const obj = asRecord(raw);
  if (!obj) return null;

  const id = asString(obj._id ?? obj.id);
  if (!id) return null;

  const ticketNo =
    asString(obj.ticketNo ?? obj.ticketNumber ?? obj.ticket_no) ||
    id.slice(-6).toUpperCase();

  const subject =
    asString(obj.serviceName ?? obj.subject ?? obj.title ?? obj.message) || "Help request";

  const date = formatTicketDate(
    asString(obj.date ?? obj.createdAt ?? obj.updatedAt ?? obj.created_at),
  );

  return {
    id,
    ticketNo,
    date: date || formatTicketDate(new Date().toISOString()),
    subject,
    status: normalizeStatus(obj.status),
  };
}

export function parseInviteHelpTickets(payload: unknown): ShopTicket[] {
  const out: ShopTicket[] = [];
  const seen = new Set<string>();
  for (const item of extractList(payload)) {
    const ticket = normalizeInviteHelpTicket(item);
    if (!ticket || seen.has(ticket.id)) continue;
    seen.add(ticket.id);
    out.push(ticket);
  }
  return out;
}

export function apiMessage(data: ApiEnvelope | null | undefined): string {
  return typeof data?.message === "string" ? data.message.trim() : "";
}

function buildInviteHelpFormData(serviceId: string, serviceName: string, audio: File) {
  const fd = new FormData();
  fd.append("serviceId", serviceId);
  fd.append("serviceName", serviceName);
  fd.append("audio", audio);
  return fd;
}

/** POST /api/auto-shop-owner/invite-help-admin */
export function inviteHelpAdminShopOwner(
  token: string,
  serviceId: string,
  serviceName: string,
  audio: File,
) {
  return postFormData<ApiEnvelope>(
    "/api/auto-shop-owner/invite-help-admin",
    buildInviteHelpFormData(serviceId, serviceName, audio),
    token,
  );
}

/** POST /api/carowner/invite-help-admin */
export function inviteHelpAdminCarOwner(
  token: string,
  serviceId: string,
  serviceName: string,
  audio: File,
) {
  return postFormData<ApiEnvelope>(
    "/api/carowner/invite-help-admin",
    buildInviteHelpFormData(serviceId, serviceName, audio),
    token,
  );
}

/** GET /api/auto-shop-owner/invite-help-to-shopowner */
export function fetchInviteHelpToShopOwner(token: string, serviceId?: string) {
  const qs = serviceId ? `?serviceId=${encodeURIComponent(serviceId)}` : "";
  return getJson<unknown>(`/api/auto-shop-owner/invite-help-to-shopowner${qs}`, token);
}

/** PATCH /api/auto-shop-owner/invite-help/:id */
export function updateInviteHelpStatus(
  token: string,
  inviteHelpId: string,
  status: "resolved" | "unresolved" | "active",
) {
  return patchJson<ApiEnvelope>(
    `/api/auto-shop-owner/invite-help/${encodeURIComponent(inviteHelpId)}`,
    { status },
    token,
  );
}

export function audioBlobToFile(audioBlob: Blob, basename = "help-request"): File {
  const ext = audioBlob.type.includes("webm")
    ? "webm"
    : audioBlob.type.includes("mp4") || audioBlob.type.includes("m4a")
      ? "m4a"
      : audioBlob.type.includes("mpeg") || audioBlob.type.includes("mp3")
        ? "mp3"
        : "webm";
  return new File([audioBlob], `${basename}.${ext}`, {
    type: audioBlob.type || `audio/${ext}`,
  });
}
