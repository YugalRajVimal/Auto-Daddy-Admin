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
import { FormFieldError, fieldErrorClass } from "../../../lib/validation/formUi";
import { partsDealSchema, serviceDealSchema } from "../../../lib/validation/schemas/deal";
import ShopDatePicker from "./ShopDatePicker";

/** serviceDealSchema field -> this form's local error-map key. */
const SERVICE_SCHEMA_TO_UI_FIELD: Record<string, string> = {
  subserviceId: "subservice",
  discountPercent: "discount",
  offerEndsOn: "offerEnd",
};

/** partsDealSchema field -> this form's local error-map key. */
const PARTS_SCHEMA_TO_UI_FIELD: Record<string, string> = {
  title: "partName",
  description: "description",
  originalPrice: "originalPrice",
  discountedPrice: "discountedPrice",
  offerEndsOn: "offerEnd",
};

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
  models: Array<{ id?: string; name: string; years: string[] }>;
};

function normalizeYearOptions(years: Array<string | number>): string[] {
  const out: string[] = [];
  for (const y of years) {
    if (typeof y === "number") out.push(String(y));
    else if (typeof y === "string") {
      y.split(",").forEach((part) => {
        const t = part.trim();
        if (t) out.push(t);
      });
    }
  }
  return [...new Set(out)].sort((a, b) => Number(b) - Number(a));
}

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
      const rawYears: Array<string | number> = [];
      if (Array.isArray(m.years)) rawYears.push(...(m.years as Array<string | number>));
      if (m.year != null) rawYears.push(m.year as string | number);
      return {
        id: String(m.id ?? modelName),
        name: modelName,
        years: normalizeYearOptions(rawYears),
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
  const [dealImages, setDealImages] = useState<File[]>([]);
  const [vehicleCatalog, setVehicleCatalog] = useState<VehicleCatalogEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    setErrors({});
    setServiceId("");
    setPartName(deal?.partName ?? "");
    setPrice(deal?.price != null ? String(deal.price) : "");
    setDescription(deal?.description ?? "");
    setOfferEnd(deal?.offersEndOnDate?.slice(0, 10) || defaultOfferEndDate());
    setAttachDealImage(mode === "parts" && Boolean(deal?.dealImage ?? deal?.productImage ?? deal?.dealImages?.length));
    setDealImages([]);
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
          discounted >= 0 &&
          discounted < original
        ) {
          const pct = Math.round((1 - discounted / original) * 100);
          setDiscountedPrice(String(pct > 0 ? pct : 1));
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
    const dealSubName =
      deal?.subServiceName?.trim() ||
      deal?.productName?.trim() ||
      deal?.description?.trim() ||
      "";
    setServiceId((current) => {
      if (current && serviceOptions.some((o) => o.value === current)) return current;

      // Prefer exact sub-service name — API serviceId is often the parent category id.
      const bySubName = dealSubName
        ? serviceOptions.find((o) => o.subName.toLowerCase() === dealSubName.toLowerCase())
        : undefined;
      if (bySubName) return bySubName.value;

      const bySubId = dealServiceId
        ? serviceOptions.find((o) => o.value === dealServiceId)
        : undefined;
      if (bySubId) return bySubId.value;

      // Fall back to first sub under the parent service category when name is missing.
      if (dealServiceId && !dealSubName) {
        const underCategory = serviceOptions.find(
          (o) => o.serviceId === dealServiceId || o.value.startsWith(`${dealServiceId}::`),
        );
        if (underCategory) return underCategory.value;
      }

      return current;
    });
  }, [deal, mode, serviceOptions]);

  const selectedVehicle = vehicleCatalog.find((v) => v.id === vehicleId);
  const selectedServiceOption = serviceOptions.find((o) => o.value === serviceId);

  const yearOptions = useMemo(() => {
    const model = (selectedVehicle?.models ?? []).find((m) => m.name === vehicleModel);
    const years = model?.years ?? [];
    if (vehicleYear && !years.includes(vehicleYear)) {
      return normalizeYearOptions([...years, vehicleYear]);
    }
    return years;
  }, [selectedVehicle, vehicleModel, vehicleYear]);

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

    const dealType = resolveDealType();
    const imageRequired = dealType === "Salvages";
    const fieldErrors: Record<string, string> = {};

    if (mode === "service") {
      const result = serviceDealSchema.omit({ images: true }).safeParse({
        mode: "service",
        subserviceId: serviceId,
        discountPercent: discountedPrice,
        offerEndsOn: offerEnd,
      });
      if (!result.success) {
        for (const issue of result.error.issues) {
          const schemaKey = String(issue.path[0] ?? "");
          const uiKey = SERVICE_SCHEMA_TO_UI_FIELD[schemaKey] ?? schemaKey;
          if (!fieldErrors[uiKey]) fieldErrors[uiKey] = issue.message;
        }
      }
    } else {
      const result = partsDealSchema.omit({ images: true }).safeParse({
        mode: "parts",
        title: partName,
        description,
        originalPrice: price.trim() || discountedPrice.trim(),
        discountedPrice,
        offerEndsOn: offerEnd,
      });
      if (!result.success) {
        for (const issue of result.error.issues) {
          const schemaKey = String(issue.path[0] ?? "");
          const uiKey = PARTS_SCHEMA_TO_UI_FIELD[schemaKey] ?? schemaKey;
          if (!fieldErrors[uiKey]) fieldErrors[uiKey] = issue.message;
        }
      }
      if (!vehicleId) fieldErrors.vehicleId = "Vehicle company is required.";
      if (!vehicleModel) fieldErrors.vehicleModel = "Model is required.";
      if (!vehicleYear) fieldErrors.vehicleYear = "Year is required.";
    }

    const hasExistingImage = Boolean(
      deal?.dealImage ?? deal?.productImage ?? (deal?.dealImages && deal.dealImages.length > 0),
    );
    if (!deal && imageRequired && (!attachDealImage || dealImages.length === 0)) {
      fieldErrors.dealImages = "Deal image is required.";
    } else if (attachDealImage && dealImages.length > 2) {
      fieldErrors.dealImages = "You can attach up to 2 images.";
    } else if (imageRequired && attachDealImage && dealImages.length === 0 && !hasExistingImage) {
      fieldErrors.dealImages = "Deal image is required.";
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setErrors({});

    const fields: AutoshopDealFormFields = {
      dealType,
      discountedPrice: discountedPrice.trim(),
      description: mode === "parts" ? description.trim() : "",
      offersEndOnDate: offerEnd.trim(),
      // Service deals have no images. Parts: omit dealImage on edit when unchecked / empty.
      dealImages: mode === "parts" && attachDealImage ? dealImages.slice(0, 2) : [],
    };
    if (mode === "parts") {
      fields.partName = partName.trim();
      fields.vehicleId = vehicleId;
      fields.vehicleName = selectedVehicle?.name;
      fields.vehicleModel = vehicleModel;
      fields.vehicleYear = vehicleYear;
      fields.originalPrice = price.trim() || discountedPrice.trim();
    } else {
      if (!serviceId || !selectedServiceOption) {
        setErrors({ subservice: "Select a subservice." });
        toast.error("Select a subservice.");
        return;
      }
      fields.serviceId = selectedServiceOption.serviceId;
      fields.productName = selectedServiceOption.subName;
      fields.subServiceName = selectedServiceOption.subName;
    }
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
  const imageRequired = section === "salvage";

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
            <select
              className={fieldErrorClass(!!errors.subservice, shopCompactInputClass)}
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              disabled={saving}
            >
              <option value="">Select subservice</option>
              {serviceOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <FormFieldError message={errors.subservice} />
          </CompactField>
          <CompactField label="Discount (%)" required className={dealFormCol1Class}>
            <input
              className={fieldErrorClass(!!errors.discount, shopCompactInputClass)}
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
            <FormFieldError message={errors.discount} />
          </CompactField>
          <CompactField label="Offer ends on" required className={dealFormDateClass}>
            <ShopDatePicker
              id="shop-deal-offer-end-service"
              value={offerEnd}
              onChange={setOfferEnd}
              disabled={saving}
              futureOnly
            />
            <FormFieldError message={errors.offerEnd} />
          </CompactField>
        </CompactFormRow>
      ) : (
        <CompactFormRow className={dealFormRowClass}>
          <CompactField label="Part name" required className={dealFormCol1Class}>
            <input
              className={fieldErrorClass(!!errors.partName, shopCompactInputClass)}
              placeholder="Part name"
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              disabled={saving}
            />
            <FormFieldError message={errors.partName} />
          </CompactField>
          <CompactField label="Vehicle company" required className={dealFormCol1Class}>
            <select
              className={fieldErrorClass(!!errors.vehicleId, shopCompactInputClass)}
              value={vehicleId}
              onChange={(e) => { setVehicleId(e.target.value); setVehicleModel(""); setVehicleYear(""); }}
              disabled={saving}
            >
              <option value="">Vehicle company</option>
              {vehicleCatalog.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            <FormFieldError message={errors.vehicleId} />
          </CompactField>
          <CompactField label="Model" required className={dealFormCol1Class}>
            <select
              className={fieldErrorClass(!!errors.vehicleModel, shopCompactInputClass)}
              value={vehicleModel}
              onChange={(e) => {
                setVehicleModel(e.target.value);
                setVehicleYear("");
              }}
              disabled={saving || !vehicleId}
            >
              <option value="">Model</option>
              {(selectedVehicle?.models ?? []).map((m) => (
                <option key={m.name} value={m.name}>{m.name}</option>
              ))}
            </select>
            <FormFieldError message={errors.vehicleModel} />
          </CompactField>
          <CompactField label="Year" required className={dealFormCol1Class}>
            <select
              className={fieldErrorClass(!!errors.vehicleYear, shopCompactInputClass)}
              value={vehicleYear}
              onChange={(e) => setVehicleYear(e.target.value)}
              disabled={saving || !vehicleModel}
            >
              <option value="">Year</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <FormFieldError message={errors.vehicleYear} />
          </CompactField>
          <CompactField label="Discounted price" required className={dealFormCol1Class}>
            <input
              className={fieldErrorClass(!!errors.discountedPrice, shopCompactInputClass)}
              placeholder="Discounted price"
              value={discountedPrice}
              onChange={(e) => setDiscountedPrice(e.target.value)}
              disabled={saving}
            />
            <FormFieldError message={errors.discountedPrice} />
          </CompactField>
        </CompactFormRow>
      )}

      {mode === "parts" ? (
        <CompactFormRow className={dealFormRowClass}>
          <CompactField label="Offer ends on" required className={dealFormDateClass}>
            <ShopDatePicker
              id="shop-deal-offer-end-parts"
              value={offerEnd}
              onChange={setOfferEnd}
              disabled={saving}
              futureOnly
            />
            <FormFieldError message={errors.offerEnd} />
          </CompactField>
          <CompactField label="Description" className={dealFormCol3Class}>
            <textarea
              className={fieldErrorClass(!!errors.description, `${shopCompactInputClass} resize-none`)}
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={1}
              disabled={saving}
            />
            <FormFieldError message={errors.description} />
          </CompactField>
          <div className={`${dealFormCol1Class} self-start`}>
            <AttachImageCheckbox
              label="Attach Image"
              required={imageRequired}
              checked={attachDealImage}
              onCheckedChange={setAttachDealImage}
              files={dealImages}
              onFilesChange={setDealImages}
              maxFiles={2}
            />
            <FormFieldError message={errors.dealImages} />
          </div>
        </CompactFormRow>
      ) : null}
    </CompactFormPanel>
  );
}
