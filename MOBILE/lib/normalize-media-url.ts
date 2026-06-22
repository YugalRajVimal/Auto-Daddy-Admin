import { API_BASE_URL } from "@/lib/api";

/** Turn relative API paths into absolute URLs for <Image source={{ uri }} />. */
export function normalizeMediaUrl(url?: string | null): string | null {
  if (!url) {
    return null;
  }
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("file://") ||
    url.startsWith("content://")
  ) {
    return url;
  }
  const base = API_BASE_URL.replace(/\/+$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base}${path}`;
}
