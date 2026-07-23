import {
  addMyService,
  addSubServices,
  deleteSubService,
  editSubService,
  type SubServiceInput,
} from "@/lib/autoshopowner-api";
import { fetchMyServices } from "@/lib/shop-owner-api";
import { parseMyServices } from "@/lib/shop-owner-parsers";
import type { MyServiceCategoryPayload } from "@/types/auto-shop-owner-endpoints";
import type { ShopServiceCategory } from "@/types/shop-owner";
import { useCallback, useState } from "react";

export type MyShopSubService = ShopServiceCategory["subServices"][number];

export type MyShopServiceCategory = {
  id: string;
  name?: string;
  desc?: string;
  shopType?: string;
  odoOutRequired?: boolean;
  subServices: MyShopSubService[];
};

function toMyShopCategories(payload: unknown): MyShopServiceCategory[] {
  return parseMyServices(payload).map((cat) => ({
    id: cat.id,
    name: cat.name,
    desc: cat.desc,
    shopType: cat.shopType,
    odoOutRequired: cat.odoOutRequired,
    subServices: cat.subServices,
  }));
}

function toSubServiceInput(s: {
  name: string;
  desc?: string;
  price?: number;
  make?: string;
  model?: string;
  quantity?: number;
  qty?: number;
  quantityType?: "Unit" | "Days";
  labourCost?: number;
  tax?: number;
}): SubServiceInput {
  const quantity = s.quantity ?? s.qty;
  return {
    name: s.name.trim(),
    desc: (s.desc ?? "").trim(),
    price: typeof s.price === "number" && Number.isFinite(s.price) ? s.price : 0,
    make: s.make?.trim() || undefined,
    model: s.model?.trim() || undefined,
    quantity: quantity != null && Number.isFinite(quantity) && quantity > 0 ? quantity : undefined,
    quantityType: s.quantityType,
    labourCost: s.labourCost != null && Number.isFinite(s.labourCost) ? s.labourCost : undefined,
    tax: s.tax != null && Number.isFinite(s.tax) ? s.tax : undefined,
  };
}

function apiMessage(data: unknown): string {
  if (data && typeof data === "object" && "message" in data) {
    const msg = (data as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg.trim();
  }
  return "";
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
      setCategories(toMyShopCategories(res.data));
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
        for (const svc of services) {
          const serviceId = String(svc.id ?? "").trim();
          if (!serviceId) continue;
          if (mode === "create") {
            const today = new Date().toISOString().slice(0, 10);
            const addRes = await addMyService(token, {
              serviceId,
              status: "Active",
              date: today,
            });
            if (!addRes.ok) {
              showToast(apiMessage(addRes.data) || "Save failed.", { type: "error" });
              return false;
            }
          }
          const subs = (svc.subServices ?? []).map((s) => toSubServiceInput(s));
          if (subs.length > 0) {
            const subRes = await addSubServices(token, { serviceId, subServices: subs });
            if (!subRes.ok) {
              showToast(apiMessage(subRes.data) || "Could not save sub-services.", { type: "error" });
              return false;
            }
          }
        }
        showToast("Saved.", { type: "success" });
        await load();
        return true;
      } catch {
        showToast("Network error.", { type: "error" });
        return false;
      }
    },
    [load, showToast, token]
  );

  const addSubServiceLine = useCallback(
    async (serviceId: string, line: SubServiceInput) => {
      if (!token) return false;
      const id = serviceId.trim();
      if (!id || !line.name.trim()) return false;
      try {
        const res = await addSubServices(token, {
          serviceId: id,
          subServices: [toSubServiceInput(line)],
        });
        if (!res.ok) {
          showToast(apiMessage(res.data) || "Could not add subcategory.", { type: "error" });
          return false;
        }
        showToast(apiMessage(res.data) || "Subcategory added.", { type: "success" });
        await load();
        return true;
      } catch {
        showToast("Network error.", { type: "error" });
        return false;
      }
    },
    [load, showToast, token]
  );

  const editSubServiceLine = useCallback(
    async (serviceId: string, subServiceIndex: number, update: SubServiceInput) => {
      if (!token) return false;
      const id = serviceId.trim();
      if (!id || subServiceIndex < 0) return false;
      try {
        const res = await editSubService(token, {
          serviceId: id,
          subServiceIndex,
          update: toSubServiceInput(update),
        });
        if (!res.ok) {
          showToast(apiMessage(res.data) || "Could not update subcategory.", { type: "error" });
          return false;
        }
        showToast(apiMessage(res.data) || "Subcategory updated.", { type: "success" });
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
        const current = categories.find((c) => c.id === serviceId.trim());
        const idx = (current?.subServices ?? []).findIndex((s) => s.name.trim() === name);
        if (idx < 0) {
          showToast("Sub-service not found.", { type: "error" });
          return false;
        }
        const res = await deleteSubService(token, {
          serviceId: serviceId.trim(),
          subServiceIndex: idx,
        });
        const msg = apiMessage(res.data);
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
    [categories, load, showToast, token]
  );

  return {
    categories,
    loading,
    load,
    save,
    addSubServiceLine,
    editSubServiceLine,
    removeSubServiceByName,
  };
}
