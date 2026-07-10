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

export function parseCitiesApiResponse(payload: unknown): UserCity[] {
  const root = (payload as { data?: unknown } | null)?.data ?? payload;
  let itemsRaw: unknown[] = [];

  if (Array.isArray(root)) itemsRaw = root;
  else if (root && typeof root === "object") {
    const r = root as Record<string, unknown>;
    if (Array.isArray(r.data)) itemsRaw = r.data;
    else if (Array.isArray(r.cities)) itemsRaw = r.cities;
    else if (Array.isArray(r.items)) itemsRaw = r.items;
    else if (Array.isArray(r.results)) itemsRaw = r.results;
  }

  // API returns plain municipality name strings; the same name can appear more than once.
  const seen = new Set<string>();
  const unique: UserCity[] = [];
  for (const city of itemsRaw.map(pickCityRow)) {
    if (!city) continue;
    const key = city.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(city);
  }
  return unique;
}
