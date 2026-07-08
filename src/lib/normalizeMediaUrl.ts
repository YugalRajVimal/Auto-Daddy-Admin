const API_BASE = (import.meta.env.VITE_API_URL as string).replace(/\/+$/, "");

/** Turn relative API paths into absolute URLs for web images. */
export function normalizeMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) {
    return url;
  }
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${API_BASE}${path}`;
}
