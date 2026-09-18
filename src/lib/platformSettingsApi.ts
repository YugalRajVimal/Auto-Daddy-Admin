import { getJson } from "../api/mobileAuth";

const BASE = "/api/admin/platform-settings";

export type PlatformSettings = {
  trialDays: number;
  minWalletRechargeAmount: number;
  perJobCardCharge: number;
  walletCurrency: string;
  websiteSubscriptionPrice: number;
  websiteSubscriptionDays: number;
  websiteSubscriptionHstRate: number;
};

export function fetchPlatformSettings(token: string) {
  return getJson<{ success: boolean; data: PlatformSettings }>(BASE, token); // adjust to your admin fetch helper
}

export async function updatePlatformSettings(token: string, patch: Partial<PlatformSettings>) {
  const url = `${BASE}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify(patch),
  });
  const data = (await res.json().catch(() => null)) as { success: boolean; data: PlatformSettings } | null;
  const out = { ok: res.ok, status: res.status, data };
  // Optional: You may want to include debugApi here similar to the prompt, if available:
  // debugApi("PATCH", url, patch, out);
  return out;
}