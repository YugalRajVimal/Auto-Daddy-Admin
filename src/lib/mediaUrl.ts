export { normalizeMediaUrl } from "./normalizeMediaUrl";

/** Strip API base from absolute URLs so edits can re-send stored paths. */
export function extractMediaPath(url: string): string {
  const trimmed = (url ?? "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const pathname = new URL(trimmed).pathname;
      return pathname.startsWith("/") ? pathname.slice(1) : pathname;
    } catch {
      return trimmed;
    }
  }
  return trimmed.replace(/^\/+/, "");
}
