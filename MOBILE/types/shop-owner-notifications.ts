/** GET /api/auto-shop-owner/get-notifications — list item. */
export type ShopOwnerNotification = {
  id: string;
  userId: string | null;
  message: string;
  time: string;
  arrayIdx: number | null;
};

export type ParsedShopOwnerNotificationsPage = {
  items: ShopOwnerNotification[];
  page: number;
  totalPages: number | null;
  totalNotifications: number | null;
  perPage: number;
};

function pickNotificationRow(raw: unknown): ShopOwnerNotification | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const message = String(o.message ?? o.body ?? o.title ?? "").trim();
  const time = String(o.time ?? o.createdAt ?? o.created_at ?? "").trim();
  if (!message) return null;

  const userIdRaw = o.user ?? o.userId ?? o.user_id;
  const userId = userIdRaw != null ? String(userIdRaw).trim() : null;

  const arrayIdxRaw = o._arrayIdx ?? o.arrayIdx;
  const arrayIdx =
    arrayIdxRaw != null && !Number.isNaN(Number(arrayIdxRaw)) ? Number(arrayIdxRaw) : null;

  const explicitId = String(o._id ?? o.id ?? "").trim();
  const id =
    explicitId ||
    [time, arrayIdx ?? "", userId ?? "", message.slice(0, 32)].filter(Boolean).join(":");

  return { id, userId, message, time, arrayIdx };
}

/** Parses `get-notifications` envelope (`notifications`, `page`, `totalPages`). */
export function parseShopOwnerNotificationsResponse(
  payload: unknown,
  requestedLimit: number
): ParsedShopOwnerNotificationsPage {
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

  const items = itemsRaw.map(pickNotificationRow).filter((x): x is ShopOwnerNotification => x != null);
  return { items, page, totalPages, totalNotifications, perPage: requestedLimit };
}
