export type ThoughtOfTheDayView = {
  title: string;
  description: string;
};

function pickString(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

/** Prefer subject (title) + notes (description); fall back to legacy string/object shapes. */
export function extractThoughtOfTheDay(raw: unknown): ThoughtOfTheDayView | null {
  if (Array.isArray(raw)) {
    for (let i = raw.length - 1; i >= 0; i--) {
      const t = extractThoughtOfTheDay(raw[i]);
      if (t) return t;
    }
    return null;
  }
  if (typeof raw === "string") {
    const description = raw.trim();
    return description ? { title: "", description } : null;
  }
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const title = pickString(o, ["subject", "title", "heading"]);
    const description = pickString(o, [
      "notes",
      "description",
      "desc",
      "text",
      "quote",
      "thought",
      "message",
      "content",
    ]);
    if (!title && !description) return null;
    return { title, description };
  }
  return null;
}

/** Flat string for callers that only need one line of copy. */
export function extractThought(raw: unknown): string {
  const view = extractThoughtOfTheDay(raw);
  if (!view) return "";
  if (view.title && view.description) return `${view.title}: ${view.description}`;
  return view.title || view.description;
}
