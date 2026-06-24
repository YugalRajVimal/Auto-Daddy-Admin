import { useCallback, useEffect, useState } from "react";
import { getJson } from "../api/mobileAuth";
import { useAuth } from "../auth";

export type PartsDealerCard = {
  name: string;
  phone: string;
  imageUrl?: string;
};

const FALLBACK_DEALERS: PartsDealerCard[] = [
  { name: "Ram Singh & Sons", phone: "289 763 5476" },
  { name: "Hindustan Spare Parts", phone: "289 763 5476" },
];

function parseDealersFromPayload(payload: unknown): PartsDealerCard[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const raw =
    root.dealers ??
    root.partsDealers ??
    root.autoPartsDealers ??
    (root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>).dealers ??
        (root.data as Record<string, unknown>).partsDealers
      : null);
  if (!Array.isArray(raw)) return [];
  const out: PartsDealerCard[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const name = String(o.name ?? o.businessName ?? o.dealerName ?? "").trim();
    const phone = String(o.phone ?? o.contactNo ?? o.businessPhone ?? "").trim();
    const imageUrl = String(o.imageUrl ?? o.photo ?? o.image ?? o.logoUrl ?? "").trim();
    if (name) out.push({ name, phone, ...(imageUrl ? { imageUrl } : {}) });
  }
  return out;
}

/** Dealer ads for shop home sidebar — API when available, else legacy placeholders. */
export function usePartsDealers() {
  const { token } = useAuth();
  const [dealers, setDealers] = useState<PartsDealerCard[]>(FALLBACK_DEALERS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!token) {
      setDealers(FALLBACK_DEALERS);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getJson<unknown>("/api/auto-shop-owner/dashboard-details-new", token);
      const parsed = res.ok && res.data ? parseDealersFromPayload(res.data) : [];
      setDealers(parsed.length > 0 ? parsed : FALLBACK_DEALERS);
    } catch {
      setDealers(FALLBACK_DEALERS);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { dealers, loading, refresh };
}
