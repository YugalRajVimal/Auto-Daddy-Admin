import {
  createAutoshopDeal,
  deleteAutoshopDeal,
  fetchAutoshopMyDeals,
  updateAutoshopDeal,
  type AutoshopDealFormFields,
} from "@/lib/autoshopowner-deals-api";
import { dealId as parserDealId, parseMyDeals } from "@/lib/shop-owner-parsers";
import type { UploadPart } from "@/lib/upload-part";
import type { ShopDeal } from "@/types/auto-shop-owner-endpoints";
import { useCallback, useState } from "react";

/** Mobile form fields (legacy UI) mapped onto new autoshop deals API. */
export type DealFormFields = AutoshopDealFormFields & {
  productName?: string;
  price?: string;
  dealImageUri?: string | null;
  dealImageMimeType?: string | null;
  dealImageFileName?: string | null;
};

function toAutoshopFields(params: DealFormFields): AutoshopDealFormFields {
  const dealImage: UploadPart | null | undefined =
    params.dealImage ??
    (params.dealImageUri
      ? {
          uri: params.dealImageUri,
          name: params.dealImageFileName ?? "deal.jpg",
          type: params.dealImageMimeType ?? "image/jpeg",
        }
      : null);

  return {
    dealType: params.dealType,
    description: params.description,
    originalPrice: params.originalPrice ?? params.price,
    discountedPrice: params.discountedPrice,
    offersEndOnDate: params.offersEndOnDate,
    dealImage,
    serviceId: params.serviceId,
    partName: params.partName ?? params.productName,
    vehicleId: params.vehicleId,
    vehicleName: params.vehicleName,
    vehicleModel: params.vehicleModel,
    vehicleYear: params.vehicleYear,
    dealEnabled: params.dealEnabled,
    soldToCustomerId: params.soldToCustomerId,
    soldToCustomerName: params.soldToCustomerName,
  };
}

export function dealId(d: ShopDeal) {
  return parserDealId(d as never) || d._id || d.id || "";
}

export function useMyDeals(
  token: string | null,
  enabled: boolean,
  showToast: (message: string, options?: { type?: "error" | "success" | "info" }) => void
) {
  const [deals, setDeals] = useState<ShopDeal[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDeals = useCallback(async () => {
    if (!token || !enabled) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetchAutoshopMyDeals(token);
      
      if (!res.ok) {
        console.log(res.data);
        const msg =
          res.data && typeof res.data === "object" && "message" in res.data
            ? String((res.data as { message?: string }).message ?? "")
            : "";
        showToast(msg || "Could not load deals.", { type: "error" });
        setDeals([]);
        return;
      }
      setDeals(parseMyDeals(res.data) as ShopDeal[]);
    } catch {
      showToast("Network error loading deals.", { type: "error" });
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, showToast, token]);

  const removeDeal = useCallback(
    async (id: string) => {
      if (!token) {
        return false;
      }
      try {
        const res = await deleteAutoshopDeal(token, id);
        const msg =
          res.data && typeof res.data === "object" && "message" in res.data
            ? String((res.data as { message?: string }).message ?? "")
            : "";
        if (!res.ok) {
          showToast(msg || "Could not delete deal.", { type: "error" });
          return false;
        }
        showToast(msg || "Deal removed.", { type: "success" });
        await loadDeals();
        return true;
      } catch {
        showToast("Network error.", { type: "error" });
        return false;
      }
    },
    [loadDeals, showToast, token]
  );

  const createDeal = useCallback(
    async (params: DealFormFields) => {
      if (!token) {
        return false;
      }
      try {
        const res = await createAutoshopDeal(token, toAutoshopFields(params));
        const msg =
          res.data && typeof res.data === "object" && "message" in res.data
            ? String((res.data as { message?: string }).message ?? "")
            : "";
        if (!res.ok) {
          showToast(msg || "Could not create deal.", { type: "error" });
          return false;
        }
        showToast(msg || "Deal created.", { type: "success" });
        await loadDeals();
        return true;
      } catch {
        showToast("Network error.", { type: "error" });
        return false;
      }
    },
    [loadDeals, showToast, token]
  );

  const saveDeal = useCallback(
    async (id: string, params: DealFormFields) => {
      if (!token) {
        return false;
      }
      try {
        const res = await updateAutoshopDeal(token, id, toAutoshopFields(params));
        const msg =
          res.data && typeof res.data === "object" && "message" in res.data
            ? String((res.data as { message?: string }).message ?? "")
            : "";
        if (!res.ok) {
          showToast(msg || "Could not update deal.", { type: "error" });
          return false;
        }
        showToast(msg || "Deal updated.", { type: "success" });
        await loadDeals();
        return true;
      } catch {
        showToast("Network error.", { type: "error" });
        return false;
      }
    },
    [loadDeals, showToast, token]
  );

  return { deals, loading, loadDeals, removeDeal, createDeal, saveDeal };
}
