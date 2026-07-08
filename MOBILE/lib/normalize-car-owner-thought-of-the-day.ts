import type { CarOwnerDashboardPayload } from "@/types/car-owner-dashboard";

export type CarOwnerThoughtOfTheDayView = {
  text: string;
  liked: boolean;
  likedCount: number;
};

function readCount(obj: Record<string, unknown>): number {
  const keys = ["likedCount", "totalLikes", "likes", "likeCount", "totalLikeCount"] as const;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) return Math.floor(v);
  }
  return 0;
}

function readLiked(obj: Record<string, unknown>): boolean {
  const v = obj.liked ?? obj.isLiked ?? obj.userLiked ?? obj.hasLiked;
  return v === true;
}

function readText(obj: Record<string, unknown>): string {
  const keys = ["text", "thought", "thoughtText", "quote", "message", "content"] as const;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

/** Normalizes `dashboard.thoughtOfTheDay` from the car owner dashboard API for UI. */
export function normalizeCarOwnerThoughtOfTheDay(
  raw: CarOwnerDashboardPayload["thoughtOfTheDay"]
): CarOwnerThoughtOfTheDayView | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const text = raw.trim();
    if (!text) return null;
    return { text, liked: false, likedCount: 0 };
  }
  if (typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const text = readText(o);
  if (!text) return null;
  return {
    text,
    liked: readLiked(o),
    likedCount: readCount(o),
  };
}
