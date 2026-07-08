// Fix for VITE_API_URL possibly being undefined
const rawApiUrl = import.meta.env?.VITE_API_URL;
const API_BASE = typeof rawApiUrl === "string" && rawApiUrl.length > 0
  ? rawApiUrl.replace(/\/+$/, "")
  : "";

/** Turn relative API paths into absolute URLs for web images. */
export function normalizeMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) {
    return url;
  }
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${API_BASE}${path}`;
}
