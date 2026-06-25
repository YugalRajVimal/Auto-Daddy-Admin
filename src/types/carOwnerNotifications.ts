/** GET /api/user/get-notifications — list item. */
export type CarOwnerNotification = {
  id: string;
  userId: string | null;
  title: string;
  message: string;
  time: string;
  arrayIdx: number | null;
};

export function notificationDisplay(item: CarOwnerNotification): { title: string; description: string } {
  const title = item.title.trim();
  const message = item.message.trim();

  if (title) {
    return { title, description: message };
  }

  if (!message) return { title: "", description: "" };

  const sentenceEnd = message.search(/[.!?](?:\s|$)/);
  if (sentenceEnd > 0 && sentenceEnd < message.length - 1) {
    return {
      title: message.slice(0, sentenceEnd + 1).trim(),
      description: message.slice(sentenceEnd + 1).trim(),
    };
  }

  return { title: message, description: "" };
}

export type ParsedCarOwnerNotificationsPage = {
  items: CarOwnerNotification[];
  page: number;
  totalPages: number | null;
  totalNotifications: number | null;
  perPage: number;
};

function pickNotificationRow(raw: unknown): CarOwnerNotification | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const title = String(o.title ?? "").trim();
  const message = String(o.message ?? o.body ?? o.description ?? "").trim();
  const time = String(o.time ?? o.createdAt ?? o.created_at ?? "").trim();
  if (!title && !message) return null;

  const userIdRaw = o.user ?? o.userId ?? o.user_id;
  const userId = userIdRaw != null ? String(userIdRaw).trim() : null;

  const arrayIdxRaw = o._arrayIdx ?? o.arrayIdx;
  const arrayIdx =
    arrayIdxRaw != null && !Number.isNaN(Number(arrayIdxRaw)) ? Number(arrayIdxRaw) : null;

  const explicitId = String(o._id ?? o.id ?? "").trim();
  const id =
    explicitId ||
    [time, arrayIdx ?? "", userId ?? "", title, message.slice(0, 32)].filter(Boolean).join(":");

  return { id, userId, title, message, time, arrayIdx };
}

/** Parses `get-notifications` envelope (`notifications`, `page`, `totalPages`). */
export function parseCarOwnerNotificationsResponse(
  payload: unknown,
  requestedLimit: number
): ParsedCarOwnerNotificationsPage {
  const root = (payload as { data?: unknown } | null)?.data ?? payload;
  let itemsRaw: unknown[] = [];
  let page = 1;
  let totalPages: number | null = null;
  let totalNotifications: number | null = null;

  if (root && typeof root === "object") {
    const r = root as Record<string, unknown>;
    if (r.success === false) {
      return {
        items: [],
        page: 1,
        totalPages: 0,
        totalNotifications: 0,
        perPage: requestedLimit,
      };
    }

    if (Array.isArray(r.notifications)) itemsRaw = r.notifications;
    else if (Array.isArray(r.data)) itemsRaw = r.data;
    else if (Array.isArray(r.items)) itemsRaw = r.items;

    const p = r.page ?? r.current_page ?? r.currentPage;
    if (p != null && !Number.isNaN(Number(p))) page = Number(p);

    const tp = r.totalPages ?? r.total_pages ?? r.last_page ?? r.lastPage;
    if (tp != null && !Number.isNaN(Number(tp))) totalPages = Number(tp);

    const tn = r.totalNotifications ?? r.total ?? r.totalCount;
    if (tn != null && !Number.isNaN(Number(tn))) totalNotifications = Number(tn);
  } else if (Array.isArray(root)) {
    itemsRaw = root;
  }

  const items = itemsRaw.map(pickNotificationRow).filter((x): x is CarOwnerNotification => x != null);
  return { items, page, totalPages, totalNotifications, perPage: requestedLimit };
}
