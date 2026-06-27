import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  CompactField,
  CompactFormPanel,
  CompactFormRow,
} from "../../admin/ContentPanel";
import { shopCompactInputClass, shopCompactTextareaClass } from "../shopLayoutStyles";
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

type DealMode = "service" | "parts";

type ShopDealFormDialogProps = {
  mode: DealMode;
  deal?: ShopDeal | null;
  onCancel: () => void;
  onSaved: () => void;
};

export default function ShopDealFormDialog({ mode, deal, onCancel, onSaved }: ShopDealFormDialogProps) {
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
    if (!token || mode !== "parts") return;
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
  }, [mode, token]);

  useEffect(() => {
    setServiceId(deal?.serviceId ?? "");
    setProductName(deal?.productName ?? "");
    setPartName(deal?.partName ?? "");
    setDiscountedPrice(deal?.discountedPrice != null ? String(deal.discountedPrice) : "");
    setPrice(deal?.price != null ? String(deal.price) : "");
    setDescription(deal?.description ?? "");
    setOfferEnd(deal?.offersEndOnDate?.slice(0, 10) ?? "");
    setDealImage(null);
  }, [deal]);

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
      onCancel();
    } finally {
      setSaving(false);
    }
  };

  const isEditing = Boolean(deal);
  const saveLabel = isEditing ? "Update" : "Save";
  const savingLabel = isEditing ? "Updating…" : "Saving…";

  return (
    <CompactFormPanel
      className="mb-4 shrink-0"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-ad-form-border bg-ad-form-required-bg px-3 py-2.5">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="inline-flex min-w-[7.5rem] items-center justify-center rounded bg-ad-form-save px-6 py-1.5 text-sm font-bold text-white hover:brightness-95 disabled:opacity-60"
          >
            {saving ? savingLabel : saveLabel}
          </button>
          <span className="text-xs text-gray-700">
            or{" "}
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="font-medium text-blue-600 underline hover:text-blue-700 disabled:opacity-60"
            >
              Cancel
            </button>
          </span>
        </div>
      }
    >
      <p className="text-sm font-bold text-ad-purple">
        {isEditing ? "Edit" : "Add"} {mode === "parts" ? "Parts" : "Service"} Deal
      </p>

      {mode === "service" ? (
        <>
          <CompactFormRow>
            <CompactField label="Service" required>
              <select className={shopCompactInputClass} value={serviceId} onChange={(e) => setServiceId(e.target.value)} disabled={saving}>
                <option value="">Select service</option>
                {serviceOptions.map((o) => (
                  <option key={`${o.id}-${o.label}`} value={o.id}>{o.label}</option>
                ))}
              </select>
            </CompactField>
            <CompactField label="Product name">
              <input className={shopCompactInputClass} placeholder="Product name" value={productName} onChange={(e) => setProductName(e.target.value)} disabled={saving} />
            </CompactField>
            <CompactField label="Original price">
              <input className={shopCompactInputClass} placeholder="Original price" value={price} onChange={(e) => setPrice(e.target.value)} disabled={saving} />
            </CompactField>
          </CompactFormRow>
        </>
      ) : (
        <CompactFormRow>
          <CompactField label="Part name" required>
            <input className={shopCompactInputClass} placeholder="Part name" value={partName} onChange={(e) => setPartName(e.target.value)} disabled={saving} />
          </CompactField>
          <CompactField label="Vehicle company" required>
            <select className={shopCompactInputClass} value={vehicleId} onChange={(e) => { setVehicleId(e.target.value); setVehicleModel(""); setVehicleYear(""); }} disabled={saving}>
              <option value="">Vehicle company</option>
              {vehicleCatalog.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </CompactField>
          <CompactField label="Model" required>
            <select className={shopCompactInputClass} value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} disabled={saving}>
              <option value="">Model</option>
              {(selectedVehicle?.models ?? []).map((m) => (
                <option key={m.name} value={m.name}>{m.name}</option>
              ))}
            </select>
          </CompactField>
          <CompactField label="Year" required>
            <input className={shopCompactInputClass} placeholder="Year" value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} disabled={saving} />
          </CompactField>
        </CompactFormRow>
      )}

      <CompactFormRow>
        <CompactField label="Discounted price" required>
          <input className={shopCompactInputClass} placeholder="Discounted price" value={discountedPrice} onChange={(e) => setDiscountedPrice(e.target.value)} disabled={saving} />
        </CompactField>
        <CompactField label="Offer ends on">
          <input className={shopCompactInputClass} type="date" value={offerEnd} onChange={(e) => setOfferEnd(e.target.value)} disabled={saving} />
        </CompactField>
        <CompactField label="Deal image" required={!isEditing}>
          <input type="file" accept="image/*" onChange={(e) => setDealImage(e.target.files?.[0] ?? null)} disabled={saving} />
        </CompactField>
      </CompactFormRow>

      <CompactFormRow>
        <CompactField label="Description" className="min-w-full flex-[1_1_100%]">
          <textarea className={shopCompactTextareaClass} placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} disabled={saving} />
        </CompactField>
      </CompactFormRow>
    </CompactFormPanel>
  );
}
