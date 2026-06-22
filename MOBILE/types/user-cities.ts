/** GET /api/user/cities — list item (shape varies by backend; normalized here). */
export type UserCity = { id: string; name: string };

function pickCityRow(raw: unknown): UserCity | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const s = raw.trim();
    return s ? { id: s, name: s } : null;
  }
  if (typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = String(o._id ?? o.id ?? o.cityId ?? "").trim();
  const name = String(o.name ?? o.city ?? o.cityName ?? o.label ?? "").trim();
  if (!name) return null;
  return { id: id || name, name };
}

export type ParsedCitiesPage = {
  items: UserCity[];
  page: number;
  /** When unknown, callers can infer "more" from items.length vs perPage. */
  totalPages: number | null;
  perPage: number;
};

/** Accepts several common envelope + pagination shapes. */
export function parseCitiesApiResponse(payload: unknown): ParsedCitiesPage {
  const root = (payload as { data?: unknown } | null)?.data ?? payload;
  let itemsRaw: unknown[] = [];
  let page = 1;
  let totalPages: number | null = null;
  let perPage = 100;

  if (Array.isArray(root)) {
    itemsRaw = root;
  } else if (root && typeof root === "object") {
    const r = root as Record<string, unknown>;
    if (Array.isArray(r.data)) itemsRaw = r.data;
    else if (Array.isArray(r.cities)) itemsRaw = r.cities;
    else if (Array.isArray(r.items)) itemsRaw = r.items;
    else if (Array.isArray(r.results)) itemsRaw = r.results;

    const p = r.current_page ?? r.page ?? r.currentPage;
    if (p != null && !Number.isNaN(Number(p))) page = Number(p);

    const lp = r.last_page ?? r.lastPage ?? r.totalPages ?? r.total_pages;
    if (lp != null && !Number.isNaN(Number(lp))) totalPages = Number(lp);

    const pp = r.per_page ?? r.perPage ?? r.limit;
    if (pp != null && !Number.isNaN(Number(pp))) perPage = Number(pp);
  }

  const items = itemsRaw.map(pickCityRow).filter((x): x is UserCity => x != null);
  return { items, page, totalPages, perPage };
}
