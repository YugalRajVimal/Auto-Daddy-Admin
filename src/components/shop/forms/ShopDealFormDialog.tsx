import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import AttachImageCheckbox from "../../admin/AttachImageCheckbox";
import {
  CompactField,
  CompactFormPanel,
  CompactFormRow,
} from "../../admin/ContentPanel";
import { shopCompactInputClass } from "../shopLayoutStyles";
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

const dealFormRowClass = "flex-nowrap items-start gap-x-3 overflow-x-auto";
const dealFormCol1Class = "min-w-0 flex-[1_1_0%]";
const dealFormCol3Class = "min-w-0 flex-[3_1_0%]";
const dealFormCol4Class = "min-w-0 flex-[4_1_0%]";

type ShopDealFormDialogProps = {
  mode: DealMode;
  deal?: ShopDeal | null;
  onCancel: () => void;
  onSaved: () => void;
};

type VehicleCatalogEntry = {
  id: string;
  name: string;
  models: Array<{ id?: string; name: string; year?: string }>;
};

function parseVehicleCatalogItem(item: unknown): VehicleCatalogEntry | null {
  if (!item || typeof item !== "object") return null;
  const o = item as Record<string, unknown>;
  const name = String(o.company ?? o.companyName ?? o.name ?? "").trim();
  const id = String(o.id ?? o._id ?? name).trim();
  if (!name) return null;

  const rawModels = Array.isArray(o.models) ? o.models : [];
  const models = rawModels
    .map((model) => {
      const m = model as Record<string, unknown>;
      const modelName = String(m.model ?? m.modelName ?? m.name ?? "").trim();
      if (!modelName) return null;
      const year =
        m.year != null
          ? String(m.year)
          : Array.isArray(m.years) && m.years.length > 0
            ? String(m.years[0])
            : undefined;
      return {
        id: String(m.id ?? modelName),
        name: modelName,
        year,
      };
    })
    .filter(Boolean) as VehicleCatalogEntry["models"];

  return { id, name, models };
}

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
  const [attachDealImage, setAttachDealImage] = useState(false);
  const [dealImage, setDealImage] = useState<File | null>(null);
  const [vehicleCatalog, setVehicleCatalog] = useState<VehicleCatalogEntry[]>([]);
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
        carDetails.map(parseVehicleCatalogItem).filter(Boolean) as VehicleCatalogEntry[],
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
    setAttachDealImage(Boolean(deal?.dealImage ?? deal?.productImage));
    setDealImage(null);
    if (mode === "parts" && deal) {
      setVehicleId(deal.vehicleId ?? deal.selectedVehicle?.id ?? "");
      setVehicleModel(deal.selectedVehicle?.model ?? "");
      setVehicleYear(deal.selectedVehicle?.year ?? "");
    } else if (!deal) {
      setVehicleId("");
      setVehicleModel("");
      setVehicleYear("");
    }
  }, [deal, mode]);

  const selectedVehicle = vehicleCatalog.find((v) => v.id === vehicleId);

  const handleSave = async () => {
    if (!token) return;
    if (!discountedPrice.trim()) {
      toast.error("Discounted price is required.");
      return;
    }
    if (!deal && (!attachDealImage || !dealImage)) {
      toast.error("Deal image is required.");
      return;
    }
    const fields: DealFormFields = {
      dealType: mode === "parts" ? "Parts" : "Service",
      discountedPrice: discountedPrice.trim(),
      description: description.trim(),
      offersEndOnDate: offerEnd || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      dealImage: attachDealImage ? dealImage : null,
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
        <CompactFormRow className={dealFormRowClass}>
          <CompactField label="Service" required className={dealFormCol1Class}>
            <select className={shopCompactInputClass} value={serviceId} onChange={(e) => setServiceId(e.target.value)} disabled={saving}>
              <option value="">Select service</option>
              {serviceOptions.map((o) => (
                <option key={`${o.id}-${o.label}`} value={o.id}>{o.label}</option>
              ))}
            </select>
          </CompactField>
          <CompactField label="Product name" className={dealFormCol1Class}>
            <input className={shopCompactInputClass} placeholder="Product name" value={productName} onChange={(e) => setProductName(e.target.value)} disabled={saving} />
          </CompactField>
          <CompactField label="Original price" className={dealFormCol1Class}>
            <input className={shopCompactInputClass} placeholder="Original price" value={price} onChange={(e) => setPrice(e.target.value)} disabled={saving} />
          </CompactField>
          <CompactField label="Discounted price" required className={dealFormCol1Class}>
            <input className={shopCompactInputClass} placeholder="Discounted price" value={discountedPrice} onChange={(e) => setDiscountedPrice(e.target.value)} disabled={saving} />
          </CompactField>
          <CompactField label="Offer ends on" className={dealFormCol1Class}>
            <input className={shopCompactInputClass} type="date" value={offerEnd} onChange={(e) => setOfferEnd(e.target.value)} disabled={saving} />
          </CompactField>
        </CompactFormRow>
      ) : (
        <CompactFormRow className={dealFormRowClass}>
          <CompactField label="Part name" required className={dealFormCol1Class}>
            <input className={shopCompactInputClass} placeholder="Part name" value={partName} onChange={(e) => setPartName(e.target.value)} disabled={saving} />
          </CompactField>
          <CompactField label="Vehicle company" required className={dealFormCol1Class}>
            <select className={shopCompactInputClass} value={vehicleId} onChange={(e) => { setVehicleId(e.target.value); setVehicleModel(""); setVehicleYear(""); }} disabled={saving}>
              <option value="">Vehicle company</option>
              {vehicleCatalog.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </CompactField>
          <CompactField label="Model" required className={dealFormCol1Class}>
            <select
              className={shopCompactInputClass}
              value={vehicleModel}
              onChange={(e) => {
                const nextModel = e.target.value;
                setVehicleModel(nextModel);
                const match = (selectedVehicle?.models ?? []).find((m) => m.name === nextModel);
                if (match?.year) setVehicleYear(match.year);
              }}
              disabled={saving}
            >
              <option value="">Model</option>
              {(selectedVehicle?.models ?? []).map((m) => (
                <option key={m.name} value={m.name}>{m.name}</option>
              ))}
            </select>
          </CompactField>
          <CompactField label="Year" required className={dealFormCol1Class}>
            <input className={shopCompactInputClass} placeholder="Year" value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} disabled={saving} />
          </CompactField>
          <CompactField label="Discounted price" required className={dealFormCol1Class}>
            <input className={shopCompactInputClass} placeholder="Discounted price" value={discountedPrice} onChange={(e) => setDiscountedPrice(e.target.value)} disabled={saving} />
          </CompactField>
        </CompactFormRow>
      )}

      <CompactFormRow className={dealFormRowClass}>
        {mode === "parts" ? (
          <CompactField label="Offer ends on" className={dealFormCol1Class}>
            <input className={shopCompactInputClass} type="date" value={offerEnd} onChange={(e) => setOfferEnd(e.target.value)} disabled={saving} />
          </CompactField>
        ) : null}
        <CompactField
          label="Description"
          className={mode === "parts" ? dealFormCol3Class : dealFormCol4Class}
        >
          <textarea className={`${shopCompactInputClass} resize-none`} placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={1} disabled={saving} />
        </CompactField>
        <div className={`${dealFormCol1Class} self-start`}>
          <AttachImageCheckbox
            label="Attach Image"
            checked={attachDealImage}
            onCheckedChange={setAttachDealImage}
            file={dealImage}
            onFileChange={setDealImage}
          />
        </div>
      </CompactFormRow>
    </CompactFormPanel>
  );
}
