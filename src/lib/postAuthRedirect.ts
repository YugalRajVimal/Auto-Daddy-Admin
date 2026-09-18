/**
 * Carries a "where to go / what to do after auth" instruction across the
 * phone-OTP login step and (for brand-new users) the profile-completion
 * step. Used by the public shop-profile QR flow: a signed-out visitor taps
 * "Add to Favourite" -> we stash the shop id + the page to return to ->
 * send them to sign in -> once they have a session (and, if new, have
 * finished onboarding) we auto-favourite the shop and land them back on
 * the shop page.
 *
 * sessionStorage (not query params) so the value survives the OTP
 * request -> verify -> (optional) complete-profile hop, without every page
 * in that chain having to thread it through the URL.
 */

const STORAGE_KEY = "autodaddy.pendingRedirect";

export type PendingRedirect = {
  /** Path (with leading /) to send the user back to once auth is done. */
  returnTo: string;
  /** BusinessProfile _id to auto-favourite once the user has a car-owner session. */
  favShopId?: string;
};

export function setPendingRedirect(value: PendingRedirect): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // sessionStorage unavailable (private browsing etc.) — the flow still
    // works, it just falls back to the normal post-login destination.
  }
}

export function getPendingRedirect(): PendingRedirect | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingRedirect;
    if (!parsed?.returnTo) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingRedirect(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}