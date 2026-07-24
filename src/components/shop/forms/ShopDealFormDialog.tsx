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
  apiMessageFromEnvelope,
  createAutoshopDeal,
  type AutoshopDealFormFields,
  type AutoshopDealType,
  updateAutoshopDeal,
} from "../../../lib/autoshopownerDealsApi";
import { fetchVehicleTypesAndServices } from "../../../lib/shopOwnerMutations";
import { dealId } from "../../../lib/shopOwnerParsers";
import { useShopServices } from "../../../hooks/useShopServices";
import type { ShopDeal } from "../../../types/shopOwner";
import ShopDatePicker from "./ShopDatePicker";

type DealMode = "service" | "parts";

const dealFormRowClass = "flex-nowrap items-start gap-x-3 overflow-x-auto";
const dealFormCol1Class = "min-w-0 flex-[1_1_0%]";
const dealFormDateClass = "min-w-[10.5rem] flex-[1_1_0%]";
const dealFormCol3Class = "min-w-0 flex-[3_1_0%]";

function defaultOfferEndDate() {
  return new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
}

type DealSectionId = "service" | "parts" | "salvage";

type ShopDealFormDialogProps = {
  mode: DealMode;
  section?: DealSectionId;
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

export default function ShopDealFormDialog({ mode, section = "service", deal, onCancel, onSaved }: ShopDealFormDialogProps) {
  const { token } = useAuth();
  const { categories } = useShopServices();
  const [serviceId, setServiceId] = useState("");
  const [partName, setPartName] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [offerEnd, setOfferEnd] = useState(defaultOfferEndDate);
  const [attachDealImage, setAttachDealImage] = useState(false);
  const [dealImage, setDealImage] = useState<File | null>(null);
  const [vehicleCatalog, setVehicleCatalog] = useState<VehicleCatalogEntry[]>([]);
  const [saving, setSaving] = useState(false);

  const serviceOptions = useMemo(() => {
    const out: Array<{ value: string; serviceId: string; label: string; subName: string }> = [];
    for (const cat of categories) {
      const catId = cat.id?.trim() ?? "";
      if (!catId) continue;
      (cat.subServices ?? []).forEach((sub, index) => {
        const subLabel = sub.name?.trim();
        if (!subLabel) return;
        const subId = sub.id?.trim() ?? "";
        out.push({
          value: subId || `${catId}::${index}`,
          serviceId: subId || catId,
          label: subLabel,
          subName: subLabel,
        });
      });
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
    const dealServiceId = deal?.serviceId ?? deal?.service?.id ?? "";
    setServiceId(dealServiceId);
    setPartName(deal?.partName ?? "");
    setPrice(deal?.price != null ? String(deal.price) : "");
    setDescription(deal?.description ?? "");
    setOfferEnd(deal?.offersEndOnDate?.slice(0, 10) || defaultOfferEndDate());
    setAttachDealImage(Boolean(deal?.dealImage ?? deal?.productImage));
    setDealImage(null);
    if (mode === "service" && deal) {
      if (deal.discountPercentage != null) {
        setDiscountedPrice(String(deal.discountPercentage));
      } else {
        const discounted = Number(deal.discountedPrice);
        const original = Number(deal.price);
        if (
          Number.isFinite(original) &&
          original > 0 &&
          Number.isFinite(discounted) &&
          discounted > 0 &&
          discounted < original
        ) {
          setDiscountedPrice(String(Math.round((1 - discounted / original) * 100)));
        } else {
          setDiscountedPrice(deal.discountedPrice != null ? String(deal.discountedPrice) : "");
        }
      }
 
    } else {
      setDiscountedPrice(deal?.discountedPrice != null ? String(deal.discountedPrice) : "");
    }
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

  useEffect(() => {
    if (mode !== "service" || serviceOptions.length === 0) return;
    const dealServiceId = deal?.serviceId ?? deal?.service?.id ?? "";
    const dealProductName = deal?.productName?.trim() || deal?.service?.name?.trim() || "";
    setServiceId((current) => {
      if (current && serviceOptions.some((o) => o.value === current)) return current;
      const matched =
        serviceOptions.find((o) => o.value === dealServiceId || o.serviceId === dealServiceId) ??
        (dealProductName
          ? serviceOptions.find(
              (o) =>
                o.subName.toLowerCase() === dealProductName.toLowerCase() ||
                o.label.toLowerCase().endsWith(dealProductName.toLowerCase()),
            )
          : undefined);
      return matched?.value ?? (dealServiceId && serviceOptions.some((o) => o.value === dealServiceId) ? dealServiceId : current);
    });
  }, [deal, mode, serviceOptions]);

  const selectedVehicle = vehicleCatalog.find((v) => v.id === vehicleId);
  const selectedServiceOption = serviceOptions.find((o) => o.value === serviceId);

  const resolveDealType = (): AutoshopDealType => {
    if (deal) {
      const t = (deal.dealType ?? "").toLowerCase();
      if (t.includes("salvage")) return "Salvages";
      if (t.includes("part") || deal.partName) return "Parts";
      return "Service";
    }
    if (section === "salvage") return "Salvages";
    return mode === "parts" ? "Parts" : "Service";
  };

  const handleSave = async () => {
    if (!token) return;
    if (!discountedPrice.trim()) {
      toast.error(mode === "service" ? "Discount (%) is required." : "Discounted price is required.");
      return;
    }
    if (mode === "service") {
      const pct = Number(discountedPrice.trim());
      if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
        toast.error("Enter a discount between 1 and 100%.");
        return;
      }
    }
    if (!offerEnd.trim()) {
      toast.error("Offer ends on date is required.");
      return;
    }
    {
      const selected = new Date(`${offerEnd.trim()}T00:00:00`);
      const tomorrow = new Date();
      tomorrow.setHours(0, 0, 0, 0);
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (Number.isNaN(selected.getTime()) || selected < tomorrow) {
        toast.error("Offer ends on must be a future date.");
        return;
      }
    }
    const dealType = resolveDealType();
    const imageRequired = dealType !== "Parts";
    if (!deal && imageRequired && (!attachDealImage || !dealImage)) {
      toast.error("Deal image is required.");
      return;
    }
    const fields: AutoshopDealFormFields = {
      dealType,
      discountedPrice: discountedPrice.trim(),
      description: mode === "parts" ? description.trim() : "",
      offersEndOnDate: offerEnd.trim(),
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
      fields.originalPrice = price.trim() || discountedPrice.trim();
    } else {
      if (!serviceId || !selectedServiceOption) {
        toast.error("Select a subservice.");
        return;
      }
      fields.serviceId = selectedServiceOption.serviceId;
      fields.productName = selectedServiceOption.subName;
      fields.subServiceName = selectedServiceOption.subName; // add subServiceName as required
    }
    console.log(fields);
    setSaving(true);
    try {
      const id = deal ? dealId(deal) : "";
      const res = id ? await updateAutoshopDeal(token, id, fields) : await createAutoshopDeal(token, fields);
      if (!res.ok) {
        toast.error(apiMessageFromEnvelope(res.data) || "Could not save deal.");
        return;
      }
      toast.success(apiMessageFromEnvelope(res.data) || "Deal saved.");
      onSaved();
      onCancel();
    } finally {
      setSaving(false);
    }
  };

  const isEditing = Boolean(deal);
  const saveLabel = isEditing ? "Update" : "Save";
  const savingLabel = isEditing ? "Updating…" : "Saving…";
  const imageRequired = mode === "service" || section === "salvage";

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
          <CompactField label="Subservice" required className={dealFormCol1Class}>
            <select className={shopCompactInputClass} value={serviceId} onChange={(e) => setServiceId(e.target.value)} disabled={saving}>
              <option value="">Select subservice</option>
              {serviceOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </CompactField>
          <CompactField label="Discount (%)" required className={dealFormCol1Class}>
            <input
              className={shopCompactInputClass}
              placeholder="e.g. 20"
              inputMode="decimal"
              value={discountedPrice}
              max={100}
              min={0}
              onChange={(e) => {
                let v = e.target.value.replace(/[^0-9.]/g, "");
                let nextValue: string = v;
                if (v) {
                  const n = parseFloat(v);
                  if (isNaN(n)) nextValue = "";
                  else if (n > 100) nextValue = "100";
                  else if (n < 0) nextValue = "0";
                  else nextValue = n.toString();
                }
                setDiscountedPrice(nextValue);
              }}
              disabled={saving}
            />
      
      
          </CompactField>
          <CompactField label="Offer ends on" required className={dealFormDateClass}>
            <ShopDatePicker
              id="shop-deal-offer-end-service"
              value={offerEnd}
              onChange={setOfferEnd}
              disabled={saving}
              futureOnly
            />
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
          <>
            <CompactField label="Offer ends on" required className={dealFormDateClass}>
              <ShopDatePicker
                id="shop-deal-offer-end-parts"
                value={offerEnd}
                onChange={setOfferEnd}
                disabled={saving}
                futureOnly
              />
            </CompactField>
            <CompactField label="Description" className={dealFormCol3Class}>
              <textarea
                className={`${shopCompactInputClass} resize-none`}
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={1}
                disabled={saving}
              />
            </CompactField>
          </>
        ) : null}
        <div className={`${dealFormCol1Class} self-start`}>
          <AttachImageCheckbox
            label="Attach Image"
            required={imageRequired}
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
