export function extractThought(raw: unknown): string {
  if (Array.isArray(raw)) {
    for (let i = raw.length - 1; i >= 0; i--) {
      const t = extractThought(raw[i]);
      if (t) return t;
    }
    return "";
  }
  if (typeof raw === "string") return raw.trim();
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    for (const key of ["text", "quote", "thought", "message", "content"]) {
      const v = o[key];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
  }
  return "";
}
