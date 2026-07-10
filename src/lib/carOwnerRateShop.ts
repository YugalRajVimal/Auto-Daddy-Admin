import { postJson } from "../api/mobileAuth";

type RateAutoShopResponse = {
  success?: boolean;
  message?: string;
};

export async function rateCarOwnerAutoShop(
  token: string,
  autoShopId: string,
  rating: number
): Promise<{ ok: boolean; message: string }> {
  const id = autoShopId.trim();
  if (!id) return { ok: false, message: "Missing shop id." };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, message: "Rating must be between 1 and 5." };
  }

  const res = await postJson<RateAutoShopResponse>(
    "/api/user/rate-auto-shop",
    { autoShopId: id, rating },
    token
  );

  const message =
    typeof res.data?.message === "string" && res.data.message.trim()
      ? res.data.message.trim()
      : res.ok
        ? "Rating saved."
        : "Could not save rating.";

  if (!res.ok || res.data?.success === false) {
    return { ok: false, message };
  }
  return { ok: true, message };
}
