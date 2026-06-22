import { fetchMyServices, removeMyServiceSubServices, saveMyServices, updateMyServices } from "@/lib/auto-shop-owner-api";
import type { MyServiceCategoryPayload } from "@/types/auto-shop-owner-endpoints";
import { useCallback, useState } from "react";

export type MyShopServiceCategory = {
  id: string;
  name?: string;
  desc?: string;
  subServices: { id?: string; name: string; desc: string; price: number }[];
};

function extractServicePayload(payload: unknown): MyShopServiceCategory[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }
  const root = payload as Record<string, unknown>;
  const raw =
    root.services ??
    (root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>).services : null);
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: MyShopServiceCategory[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const o = item as Record<string, unknown>;

    const nestedService = o.service && typeof o.service === "object" ? (o.service as Record<string, unknown>) : null;
    const id =
      typeof o.id === "string"
        ? o.id
        : typeof o._id === "string"
          ? o._id
          : typeof nestedService?.id === "string"
            ? nestedService.id
            : typeof nestedService?._id === "string"
              ? nestedService._id
              : "";
    if (!id) {
      continue;
    }
    const name =
      typeof o.name === "string"
        ? o.name
        : typeof nestedService?.name === "string"
          ? nestedService.name
          : undefined;
    const desc =
      typeof o.desc === "string"
        ? o.desc
        : typeof o.description === "string"
          ? o.description
          : typeof nestedService?.desc === "string"
            ? nestedService.desc
            : typeof nestedService?.description === "string"
              ? nestedService.description
              : undefined;

    const subRaw = Array.isArray(o.selectedSubServices) ? o.selectedSubServices : o.subServices;
    const subServices: { name: string; desc: string; price: number }[] = [];
    if (Array.isArray(subRaw)) {
      for (const s of subRaw) {
        if (!s || typeof s !== "object") {
          continue;
        }
        const sub = s as Record<string, unknown>;
        const name = typeof sub.name === "string" ? sub.name : "";
        const desc = typeof sub.desc === "string" ? sub.desc : typeof sub.description === "string" ? sub.description : "";
        const price =
          typeof sub.price === "number" ? sub.price : typeof sub.price === "string" ? parseFloat(sub.price) : 0;
        const subId =
          typeof sub.id === "string"
            ? sub.id
            : typeof sub._id === "string"
              ? sub._id
              : typeof (sub as { subServiceId?: unknown }).subServiceId === "string"
                ? String((sub as { subServiceId: string }).subServiceId)
                : undefined;
        if (name) {
          subServices.push({
            id: subId?.trim() || undefined,
            name,
            desc,
            price: Number.isFinite(price) ? price : 0,
          });
        }
      }
    }
    out.push({ id, name: name?.trim() || undefined, desc: desc?.trim() || undefined, subServices });
  }
  return out;
}

export function useMyShopServices(
  token: string | null,
  enabled: boolean,
  showToast: (message: string, options?: { type?: "error" | "success" | "info" }) => void
) {
  const [categories, setCategories] = useState<MyShopServiceCategory[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token || !enabled) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetchMyServices(token);
      if (!res.ok) {
        showToast("Could not load your services.", { type: "error" });
        setCategories([]);
        return;
      }
      setCategories(extractServicePayload(res.data));
    } catch {
      showToast("Network error.", { type: "error" });
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, showToast, token]);

  const save = useCallback(
    async (services: MyServiceCategoryPayload[], mode: "create" | "update") => {
      if (!token) {
        return false;
      }
      try {
        const res = mode === "create" ? await saveMyServices(token, services) : await updateMyServices(token, services);
        const msg =
          res.data && typeof res.data === "object" && "message" in res.data
            ? String((res.data as { message?: string }).message ?? "")
            : "";
        if (!res.ok) {
          showToast(msg || "Save failed.", { type: "error" });
          return false;
        }
        showToast(msg || "Saved.", { type: "success" });
        await load();
        return true;
      } catch {
        showToast("Network error.", { type: "error" });
        return false;
      }
    },
    [load, showToast, token]
  );

  const removeSubServiceByName = useCallback(
    async (serviceId: string, subServiceName: string) => {
      if (!token) {
        return false;
      }
      const name = subServiceName.trim();
      if (!serviceId.trim() || !name) {
        return false;
      }
      try {
        const res = await removeMyServiceSubServices(token, {
          id: serviceId.trim(),
          removeSubServices: true,
          subServices: [{ name }],
        });
        const msg =
          res.data && typeof res.data === "object" && "message" in res.data
            ? String((res.data as { message?: string }).message ?? "")
            : "";
        if (!res.ok) {
          showToast(msg || "Delete failed.", { type: "error" });
          return false;
        }
        showToast(msg || "Deleted.", { type: "success" });
        await load();
        return true;
      } catch {
        showToast("Network error.", { type: "error" });
        return false;
      }
    },
    [load, showToast, token]
  );

  return { categories, loading, load, save, removeSubServiceByName };
}
