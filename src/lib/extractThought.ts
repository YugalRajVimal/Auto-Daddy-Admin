export function extractThought(raw: unknown): string {
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
