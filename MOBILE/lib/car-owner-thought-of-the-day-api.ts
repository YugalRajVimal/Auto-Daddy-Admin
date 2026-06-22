import { postJson } from "@/lib/api";

export type ToggleThoughtOfTheDayLikeResponse = {
  success?: boolean;
  message?: string;
  liked?: boolean;
  isLiked?: boolean;
  likedCount?: number;
  totalLikes?: number;
  likes?: number;
};

/**
 * POST /api/user/thought-of-the-day/toggle-like
 * Toggles the current user's like on the active thought of the day.
 */
export async function postToggleThoughtOfTheDayLike(authToken: string) {
  return postJson<ToggleThoughtOfTheDayLikeResponse>(
    "/api/user/thought-of-the-day/toggle-like",
    {},
    { authToken }
  );
}
