import { getJson } from "@/lib/api";
import { parseCitiesApiResponse, type UserCity } from "@/types/user-cities";

/** Normalize city id + display name from a car-owner / customer API row. */
export function pickCustomerCity(o: Record<string, unknown> | null | undefined): { id: string; name: string } | null {
  if (!o) {
    return null;
  }
  const cityNested = o.city && typeof o.city === "object" ? (o.city as Record<string, unknown>) : null;
  const cityIdFromNested =
    cityNested && (typeof cityNested._id === "string" || typeof cityNested.id === "string")
      ? String(cityNested._id ?? cityNested.id).trim()
      : "";
  const cityNameFromNested =
    cityNested && typeof cityNested.name === "string" ? cityNested.name.trim() : "";

  const id =
    (typeof o.cityId === "string" ? o.cityId.trim() : "") ||
    cityIdFromNested ||
    "";
  const name =
    (typeof o.cityName === "string" ? o.cityName.trim() : "") ||
    cityNameFromNested ||
    (typeof o.city === "string" ? o.city.trim() : "");

  if (!name && !id) {
    return null;
  }
  return { id: id || name, name: name || id };
}

/** Spread into API bodies only when a city is selected. */
export function optionalCityField(cityName: string | null | undefined): { city?: string } {
  const name = cityName?.trim();
  return name ? { city: name } : {};
}

export function userCityFromPick(pick: { id: string; name: string } | null): UserCity | null {
  if (!pick) {
    return null;
  }
  return { id: pick.id, name: pick.name };
}

/** Resolve a city display name when the API only returns `cityId`. */
export async function resolveUserCityById(authToken: string, cityId: string): Promise<UserCity | null> {
  const targetId = cityId.trim();
  if (!targetId) {
    return null;
  }
  let page = 1;
  let hasMore = true;
  while (hasMore && page <= 12) {
    const path = `/api/auto-shop-owner/cities?page=${page}`;
    const res = await getJson<unknown>(path, { authToken });
    if (!res.ok) {
      return null;
    }
    const parsed = parseCitiesApiResponse(res.data);
    const found = parsed.items.find((c) => c.id === targetId);
    if (found) {
      return found;
    }
    if (parsed.totalPages != null) {
      hasMore = page < parsed.totalPages;
    } else {
      hasMore = parsed.items.length >= parsed.perPage;
    }
    page += 1;
  }
  return null;
}

/** Build `UserCity` for forms; resolves name from cities API when missing. */
export async function loadCustomerCityForForm(
  authToken: string | null,
  raw: Record<string, unknown> | null | undefined
): Promise<UserCity | null> {
  const pick = pickCustomerCity(raw);
  if (!pick) {
    return null;
  }
  if (pick.name) {
    return { id: pick.id, name: pick.name };
  }
  if (!authToken) {
    return { id: pick.id, name: pick.id };
  }
  const resolved = await resolveUserCityById(authToken, pick.id);
  return resolved ?? { id: pick.id, name: pick.name || pick.id };
}
