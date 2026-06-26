import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { compactInputClass } from "../../admin/ContentPanel";
import { useAuth } from "../../../auth";
import {
  apiMessage,
  createDeal,
  fetchVehicleTypesAndServices,
  type DealFormFields,
  updateDeal,
} from "../../../lib/shopOwnerMutations";
import { dealId } from "../../../lib/shopOwnerParsers";
import { useShopServices } from "../../../hooks/useShopServices";
import type { ShopDeal } from "../../../types/shopOwner";
import { shopCancelButtonClass, shopSaveButtonClass } from "./ShopFormPage";
import { ShopDialogMotion } from "../ShopAnimated";

type DealMode = "service" | "parts";

type ShopDealFormDialogProps = {
  open: boolean;
  mode: DealMode;
  deal?: ShopDeal | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function ShopDealFormDialog({ open, mode, deal, onClose, onSaved }: ShopDealFormDialogProps) {
  const { token } = useAuth();
  const { categories } = useShopServices();
  const [serviceId, setServiceId] = useState("");
  const [productName, setProductName] = useState("");
  const [partName, setPartName] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [offerEnd, setOfferEnd] = useState("");
  const [dealImage, setDealImage] = useState<File | null>(null);
  const [vehicleCatalog, setVehicleCatalog] = useState<
    Array<{ id: string; name: string; models: Array<{ id?: string; name: string; year?: string }> }>
  >([]);
  const [saving, setSaving] = useState(false);

  const serviceOptions = useMemo(() => {
    const out: Array<{ id: string; label: string }> = [];
    for (const cat of categories) {
      for (const sub of cat.subServices) {
        out.push({ id: cat.id, label: `${cat.name ?? "Service"} — ${sub.name}` });
      }
    }
    return out;
  }, [categories]);

  useEffect(() => {
    if (!open || !token || mode !== "parts") return;
    void fetchVehicleTypesAndServices(token).then((res) => {
      if (!res.ok || !res.data || typeof res.data !== "object") return;
      const root = res.data as Record<string, unknown>;
      const carDetails = Array.isArray(root.carDetails) ? root.carDetails : [];
      setVehicleCatalog(
        carDetails.map((item) => {
          const o = item as Record<string, unknown>;
          const id = String(o.id ?? o._id ?? "");
          const name = String(o.company ?? o.name ?? "");
          const models = Array.isArray(o.models)
            ? (o.models as Array<Record<string, unknown>>).map((m) => ({
                id: String(m.id ?? ""),
                name: String(m.model ?? m.name ?? ""),
                year: m.year != null ? String(m.year) : undefined,
              }))
            : [];
          return { id, name, models };
        })
      );
    });
  }, [mode, open, token]);

  useEffect(() => {
    if (!open) return;
    setServiceId(deal?.serviceId ?? "");
    setProductName(deal?.productName ?? "");
    setPartName(deal?.partName ?? "");
    setDiscountedPrice(deal?.discountedPrice != null ? String(deal.discountedPrice) : "");
    setPrice(deal?.price != null ? String(deal.price) : "");
    setDescription(deal?.description ?? "");
    setOfferEnd(deal?.offersEndOnDate?.slice(0, 10) ?? "");
    setDealImage(null);
  }, [deal, open]);

  const selectedVehicle = vehicleCatalog.find((v) => v.id === vehicleId);

  const handleSave = async () => {
    if (!token) return;
    if (!discountedPrice.trim()) {
      toast.error("Discounted price is required.");
      return;
    }
    if (!dealImage && !deal) {
      toast.error("Deal image is required.");
      return;
    }
    const fields: DealFormFields = {
      dealType: mode === "parts" ? "Parts" : "Service",
      discountedPrice: discountedPrice.trim(),
      description: description.trim(),
      offersEndOnDate: offerEnd || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      dealImage,
    };
    if (mode === "parts") {
      if (!partName.trim() || !vehicleId || !vehicleModel || !vehicleYear) {
        toast.error("Fill all parts deal fields.");
        return;
      }
      fields.partName = partName.trim();
      fields.vehicleId = vehicleId;
      fields.vehicleName = selectedVehicle?.name;
      fields.vehicleModel = vehicleModel;
      fields.vehicleYear = vehicleYear;
    } else {
      if (!serviceId) {
        toast.error("Select a service.");
        return;
      }
      fields.serviceId = serviceId;
      fields.productName = productName.trim() || "Service Deal";
      fields.price = price.trim() || discountedPrice.trim();
      fields.dealEnabled = "true";
    }
    setSaving(true);
    try {
      const id = deal ? dealId(deal) : "";
      const res = id ? await updateDeal(token, id, fields) : await createDeal(token, fields);
      if (!res.ok) {
        toast.error(apiMessage(res.data) || "Could not save deal.");
        return;
      }
      toast.success(apiMessage(res.data) || "Deal saved.");
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ShopDialogMotion
      open={open}
      onClose={onClose}
      panelClassName="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-gray-200 bg-white p-5 shadow-xl"
    >
        <h2 className="mb-4 text-lg font-bold text-ad-purple">
          {deal ? "Edit" : "Add"} {mode === "parts" ? "Parts" : "Service"} Deal
        </h2>
        <div className="space-y-3">
          {mode === "service" ? (
            <>
              <select className={compactInputClass} value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                <option value="">Select service</option>
                {serviceOptions.map((o) => (
                  <option key={`${o.id}-${o.label}`} value={o.id}>{o.label}</option>
                ))}
              </select>
              <input className={compactInputClass} placeholder="Product name" value={productName} onChange={(e) => setProductName(e.target.value)} />
              <input className={compactInputClass} placeholder="Original price" value={price} onChange={(e) => setPrice(e.target.value)} />
            </>
          ) : (
            <>
              <input className={compactInputClass} placeholder="Part name" value={partName} onChange={(e) => setPartName(e.target.value)} />
              <select className={compactInputClass} value={vehicleId} onChange={(e) => { setVehicleId(e.target.value); setVehicleModel(""); setVehicleYear(""); }}>
                <option value="">Vehicle company</option>
                {vehicleCatalog.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
              <select className={compactInputClass} value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)}>
                <option value="">Model</option>
                {(selectedVehicle?.models ?? []).map((m) => (
                  <option key={m.name} value={m.name}>{m.name}</option>
                ))}
              </select>
              <input className={compactInputClass} placeholder="Year" value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} />
            </>
          )}
          <input className={compactInputClass} placeholder="Discounted price *" value={discountedPrice} onChange={(e) => setDiscountedPrice(e.target.value)} />
          <textarea className={compactInputClass} placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          <input className={compactInputClass} type="date" value={offerEnd} onChange={(e) => setOfferEnd(e.target.value)} />
          <input type="file" accept="image/*" onChange={(e) => setDealImage(e.target.files?.[0] ?? null)} />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className={shopCancelButtonClass} onClick={onClose}>Cancel</button>
          <button type="button" className={shopSaveButtonClass} disabled={saving} onClick={() => void handleSave()}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
    </ShopDialogMotion>
  );
}
