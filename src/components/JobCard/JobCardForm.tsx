/**
 * Inline New/Edit Job Card form — shown inside DashboardPanelCard (COMP.tsx), not a modal.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { FiArrowRight, FiPlus, FiUpload, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import useAuth from "../../auth/useAuth";
import DashboardPanelCard from "../COMP";
import { useFormRevealFocus } from "../shop/ShopAnimated";
import { JobCardFormSkeleton } from "../common/JobCardFormSkeleton";
import { shopCompactInputClass } from "../shop/shopLayoutStyles";
import { useShopOwnerCallingCode } from "../../hooks/useShopOwnerCallingCode";
import { formatCurrencyAmount } from "../../lib/currency";
import { extractMediaPath, normalizeMediaUrl } from "../../lib/mediaUrl";
import {
  fetchJobCardByIdForForm,
  fetchJobCardFormData,
  MAX_JOB_CARD_VEHICLE_PHOTOS,
  normalizeJobCardServiceBlocks,
  resolveJobCardFromApiResponse,
  saveJobCard,
  type JobCardFormCustomer,
} from "../../lib/shopOwnerJobCardsApi";

const MAX_VEHICLE_PHOTOS = MAX_JOB_CARD_VEHICLE_PHOTOS;
const PLACEHOLDER_JOB_CARD_NO = "J00027";
const formCellInputClass = shopCompactInputClass;

const DEFAULT_FORM = {
  customerId: "",
  vehicleId: "",
  odometerReading: "",
  dueOdometerReading: "",
  issueDescription: "",
  serviceType: "Repair",
  priorityLevel: "Normal",
  services: [] as unknown[],
  vehiclePhotos: [] as string[],
  technicalRemarks: "",
  labourCharge: "",
  discount: "",
};

const JOB_CARD_FIELD_GRID = "grid grid-cols-[7.25rem_minmax(0,1fr)] gap-x-2 gap-y-1.5";
const JOB_CARD_FIELD_LABEL_CLASS =
  "text-xs font-bold text-ad-green-dark leading-tight self-center";
const TABLE_WRAP_CLASS = "overflow-x-auto rounded border border-gray-300";
const TABLE_CLASS = "w-full min-w-[720px] border-collapse text-xs";
const TH_CLASS = "border border-ad-purple-dark px-2 py-1 text-xs font-medium text-white";
const TD_CLASS = "border border-gray-300 px-2 py-1 align-top";

type ServiceLine = {
  id: string;
  subKey: string;
  desc: string;
  unitPriceStr: string;
  qtyStr: string;
  labourCostStr: string;
  priceStr: string;
  included?: boolean;
};

type ServiceBlock = { id: string; catId: string };

type ServiceCategory = {
  id: string;
  name?: string;
  desc?: string;
  subServices: Array<{ name: string; desc?: string; price?: number }>;
};

function parseNumberFromText(input: unknown) {
  const n = parseFloat(String(input ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function vehicleOdometerPlaceholders(vehicle: JobCardFormCustomer["myVehicles"][number] | null) {
  if (!vehicle) return { in: "In", out: "Out" };
  const inVal =
    vehicle.odometerReading != null && String(vehicle.odometerReading).trim() !== ""
      ? String(vehicle.odometerReading).trim()
      : "0";
  const dueRaw = vehicle.dueOdometerReading;
  if (dueRaw != null && String(dueRaw).trim() !== "") {
    return { in: inVal, out: String(dueRaw).trim() };
  }
  const n = Number(inVal);
  return { in: inVal, out: String(Number.isFinite(n) ? n + 500 : 500) };
}

function JobCardFormField({
  label,
  labelClassName,
  children,
}: {
  label: string;
  labelClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={JOB_CARD_FIELD_GRID}>
      <label className={labelClassName ?? JOB_CARD_FIELD_LABEL_CLASS}>{label}</label>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function vehicleDisplayTitle(vehicle: JobCardFormCustomer["myVehicles"][number] | null) {
  if (!vehicle) return "";
  const make = vehicle.make && typeof vehicle.make === "object" ? vehicle.make : null;
  const fromMake = make ? `${make.name || ""} ${make.model || ""}`.trim() : "";
  const fromFields = [vehicle.vehicleName, vehicle.model].filter(Boolean).join(" ").trim();
  const brand = typeof vehicle.brand === "string" ? vehicle.brand.trim() : "";
  return fromFields || fromMake || brand;
}

function calcLinePrice(line: Pick<ServiceLine, "unitPriceStr" | "qtyStr" | "labourCostStr">) {
  const unit = parseNumberFromText(line.unitPriceStr);
  const qty = parseNumberFromText(line.qtyStr);
  const labour = parseNumberFromText(line.labourCostStr);
  return unit * qty + labour;
}

function priceStrFromLine(line: Pick<ServiceLine, "unitPriceStr" | "qtyStr" | "labourCostStr">) {
  const total = calcLinePrice(line);
  return Number.isFinite(total) ? String(total) : "0";
}

function buildLabourTechnicalRemarks(chargeStr: string, discountStr: string, countryCode: string) {
  const c = parseNumberFromText(chargeStr);
  const other = String(discountStr ?? "").trim();
  const otherAmt = parseNumberFromText(other);
  if (c <= 0 && !other) return "";
  const fmt = (x: number) => formatCurrencyAmount(x, countryCode, { fallback: "" });
  const parts: string[] = [];
  if (c > 0) parts.push(fmt(c));
  if (other) parts.push(otherAmt > 0 ? `Discount: ${fmt(otherAmt)}` : `Discount: ${other}`);
  return parts.length ? `Labour: ${parts.join("; ")}` : "";
}

function subServiceKey(catId: string, subIdx: number) {
  return `${catId}:${subIdx}`;
}

function parseSubServiceKey(key: string) {
  const sep = String(key).lastIndexOf(":");
  if (sep < 0) return null;
  const catId = key.slice(0, sep);
  const subIdx = parseInt(key.slice(sep + 1), 10);
  if (!catId || !Number.isFinite(subIdx)) return null;
  return { catId, subIdx };
}

function normalizeServiceCategories(myServices: ServiceCategory[]) {
  return (myServices || [])
    .map((svc) => ({
      id: svc.id,
      name: svc.name ?? "Service",
      desc: svc.desc ?? "",
      subServices: Array.isArray(svc.subServices) ? svc.subServices : [],
    }))
    .filter((x) => x.id);
}

function apiServiceBlocksToLines(blocks: unknown[], categories: ServiceCategory[]) {
  const lines: ServiceLine[] = [];
  let n = 0;
  for (const block of blocks || []) {
    const b = block as { service?: string; subServices?: Array<Record<string, unknown>> };
    const catId = String(b.service || "").trim();
    if (!catId) continue;
    const cat = categories.find((c) => c.id === catId);
    if (!cat) continue;
    for (const ss of b.subServices || []) {
      const subName = String(ss.name || "").trim();
      if (!subName) continue;
      const subIdx = cat.subServices.findIndex((s) => s.name === subName);
      if (subIdx < 0) continue;
      const catalogSub = cat.subServices[subIdx];
      const qtyStr = String(ss.qty ?? ss.unit ?? ss.labourDuration ?? "1");
      const labourCostStr = String(ss.labourCost ?? ss.labourCharge ?? "0");
      const qty = parseNumberFromText(qtyStr) || 1;
      const labour = parseNumberFromText(labourCostStr);
      const savedTotal = parseNumberFromText(ss.price);
      let unitPriceStr = ss.unitPrice != null ? String(ss.unitPrice) : "";
      if (!unitPriceStr && savedTotal > 0 && qty > 0) {
        unitPriceStr = String((savedTotal - labour) / qty);
      } else if (!unitPriceStr) {
        unitPriceStr = String(catalogSub?.price ?? 0);
      }
      n += 1;
      const draft = { unitPriceStr, qtyStr, labourCostStr };
      lines.push({
        id: `line-${n}`,
        subKey: subServiceKey(catId, subIdx),
        desc: String(ss.desc ?? ""),
        ...draft,
        priceStr: priceStrFromLine(draft),
      });
    }
  }
  return lines;
}

function serviceLinesToBlocks(lines: ServiceLine[], categories: ServiceCategory[]) {
  const map = new Map<string, Array<Record<string, unknown>>>();
  for (const line of lines) {
    if (!line.subKey) continue;
    const parsed = parseSubServiceKey(line.subKey);
    if (!parsed) continue;
    const cat = categories.find((c) => c.id === parsed.catId);
    const sub = cat?.subServices?.[parsed.subIdx];
    if (!sub?.name) continue;
    const bucket = map.get(parsed.catId) ?? [];
    const qty = String(line.qtyStr || "").trim();
    const labourCost = parseNumberFromText(line.labourCostStr);
    const unitPrice = parseNumberFromText(line.unitPriceStr);
    bucket.push({
      name: sub.name,
      desc: String(line.desc || "").trim(),
      unit: qty,
      qty,
      unitPrice,
      price: calcLinePrice(line),
      labourCharge: labourCost,
      labourCost,
    });
    map.set(parsed.catId, bucket);
  }
  return [...map.entries()].map(([service, subServices]) => ({ service, subServices }));
}

function emptyServiceBlock(id: string): ServiceBlock {
  return { id, catId: "" };
}

function defaultLineForSub(catId: string, subIdx: number, sub: { desc?: string; price?: number }) {
  const draft = {
    unitPriceStr: String(sub?.price ?? 0),
    qtyStr: "1",
    labourCostStr: "0",
  };
  return {
    subKey: subServiceKey(catId, subIdx),
    desc: sub?.desc ?? "",
    ...draft,
    priceStr: priceStrFromLine(draft),
  };
}

function isLineActive(line: ServiceLine) {
  if (!line?.subKey) return false;
  if (line.included === false) return false;
  return true;
}

function collectLinesForSave(serviceLines: ServiceLine[], manualLines: ServiceLine[]) {
  const seen = new Set<string>();
  const out: ServiceLine[] = [];
  for (const line of serviceLines) {
    if (!isLineActive(line) || seen.has(line.subKey)) continue;
    seen.add(line.subKey);
    out.push(line);
  }
  for (const line of manualLines) {
    if (!isLineActive(line) || seen.has(line.subKey)) continue;
    seen.add(line.subKey);
    out.push(line);
  }
  return out;
}

function ServiceTableColgroup() {
  return (
    <colgroup>
      <col style={{ width: "18%" }} />
      <col style={{ width: "14%" }} />
      <col style={{ width: "28%" }} />
      <col style={{ width: "10%" }} />
      <col style={{ width: "8%" }} />
      <col style={{ width: "10%" }} />
      <col style={{ width: "10%" }} />
      <col style={{ width: "6%" }} />
    </colgroup>
  );
}

function ServiceTableHeader() {
  return (
    <thead>
      <tr className="bg-ad-purple text-white">
        <th className={`${TH_CLASS} text-left`}>Service</th>
        <th className={`${TH_CLASS} text-left`}>Sub Service</th>
        <th className={`${TH_CLASS} text-left`}>Description</th>
        <th className={`${TH_CLASS} text-right`}>Unit price</th>
        <th className={`${TH_CLASS} text-center`}>Qty</th>
        <th className={`${TH_CLASS} text-right`}>Labour cost</th>
        <th className={`${TH_CLASS} text-right`}>Price</th>
        <th className={`${TH_CLASS} text-center`}>Incl.</th>
      </tr>
    </thead>
  );
}

function pickJobId(job: Record<string, unknown>) {
  const raw = job._id ?? job.id ?? job.jobCardId;
  return typeof raw === "string" && raw ? raw : "";
}

type JobCardFormProps = {
  active: boolean;
  mode?: "add" | "edit";
  jobCardId?: string | null;
  onCancel: () => void;
  onSaved?: () => void;
};

export default function JobCardForm({
  active,
  mode: modeProp = "add",
  jobCardId = null,
  onCancel,
  onSaved,
}: JobCardFormProps) {
  const { token } = useAuth();
  const callingCode = useShopOwnerCallingCode();
  const formatMoney = (x: number) => formatCurrencyAmount(x, callingCode, { fallback: "" });

  const [formMode, setFormMode] = useState(modeProp);
  const [formLoading, setFormLoading] = useState(false);
  const [editPrefillLoading, setEditPrefillLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [myCustomers, setMyCustomers] = useState<JobCardFormCustomer[]>([]);
  const [myServices, setMyServices] = useState<ServiceCategory[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([]);
  const [serviceBlocks, setServiceBlocks] = useState<ServiceBlock[]>([]);
  const [manualLines] = useState<ServiceLine[]>([]);
  const [vehiclePhotoFiles, setVehiclePhotoFiles] = useState<File[]>([]);
  const [keptVehiclePhotoUrls, setKeptVehiclePhotoUrls] = useState<string[]>([]);
  const lineIdRef = useRef(1);
  const blockIdRef = useRef(1);
  const vehiclePhotoInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useFormRevealFocus(active, panelRef);

  const mkBlockId = () => {
    blockIdRef.current += 1;
    return `svc-block-${blockIdRef.current}`;
  };

  const mkLineId = () => {
    lineIdRef.current += 1;
    return `svc-line-${lineIdRef.current}`;
  };

  const newPhotoPreviews = useMemo(
    () => vehiclePhotoFiles.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [vehiclePhotoFiles],
  );

  useEffect(() => {
    return () => {
      for (const p of newPhotoPreviews) {
        URL.revokeObjectURL(p.url);
      }
    };
  }, [newPhotoPreviews]);

  const totalPhotoCount = keptVehiclePhotoUrls.length + vehiclePhotoFiles.length;
  const canAddMorePhotos = totalPhotoCount < MAX_VEHICLE_PHOTOS;

  const formSelectedCustomer = useMemo(() => {
    if (!form.customerId) return null;
    return myCustomers.find((x) => x._id === form.customerId) ?? null;
  }, [myCustomers, form.customerId]);

  const formSelectedVehicle = useMemo(() => {
    if (!form.vehicleId || !formSelectedCustomer) return null;
    return (formSelectedCustomer.myVehicles || []).find((v) => v._id === form.vehicleId) ?? null;
  }, [formSelectedCustomer, form.vehicleId]);

  const odometerPlaceholders = useMemo(
    () => vehicleOdometerPlaceholders(formSelectedVehicle),
    [formSelectedVehicle],
  );

  const normalizedCategories = useMemo(
    () => normalizeServiceCategories(myServices),
    [myServices],
  );

  const categoriesWithSubs = useMemo(
    () => normalizedCategories.filter((c) => (c.subServices || []).length > 0),
    [normalizedCategories],
  );

  const canAddAnotherServiceBlock = useMemo(() => {
    if (serviceBlocks.length === 0) return false;
    if (serviceBlocks.length >= categoriesWithSubs.length) return false;
    return serviceBlocks.every((b) => Boolean(b.catId));
  }, [serviceBlocks, categoriesWithSubs.length]);

  const linesBySubKey = useMemo(() => {
    const map = new Map<string, ServiceLine>();
    for (const line of serviceLines) {
      if (line.subKey) map.set(line.subKey, line);
    }
    return map;
  }, [serviceLines]);

  const activeLines = useMemo(() => {
    const map = new Map<string, ServiceLine>();
    for (const line of serviceLines) {
      if (isLineActive(line)) map.set(line.subKey, line);
    }
    for (const line of manualLines) {
      if (isLineActive(line) && !map.has(line.subKey)) map.set(line.subKey, line);
    }
    return [...map.values()];
  }, [serviceLines, manualLines]);

  const partsSubTotal = useMemo(() => {
    let sum = 0;
    for (const line of activeLines) {
      sum += parseNumberFromText(line.unitPriceStr) * parseNumberFromText(line.qtyStr);
    }
    return sum;
  }, [activeLines]);

  const labourSubTotal = useMemo(() => {
    let sum = 0;
    for (const line of activeLines) {
      sum += parseNumberFromText(line.labourCostStr);
    }
    return sum;
  }, [activeLines]);

  const discountAmount = parseNumberFromText(form.discount);
  const grandTotal = partsSubTotal + labourSubTotal - discountAmount;

  function resetForm() {
    setForm({ ...DEFAULT_FORM });
    setEditId(null);
    setEditPrefillLoading(false);
    setSaveError(null);
    lineIdRef.current = 1;
    blockIdRef.current = 1;
    setServiceBlocks([emptyServiceBlock(mkBlockId())]);
    setServiceLines([]);
    setVehiclePhotoFiles([]);
    setKeptVehiclePhotoUrls([]);
  }

  function handleCancel() {
    if (formLoading || editPrefillLoading) return;
    resetForm();
    onCancel();
  }

  useEffect(() => {
    if (!active || !token) return;
    setFormMode(modeProp);
    resetForm();
    setDataLoading(true);
    setDataError(null);

    void (async () => {
      try {
        const data = await fetchJobCardFormData(token);
        setMyCustomers(data.myCustomers);
        setMyServices(data.myServices);

        if (modeProp === "edit" && jobCardId) {
          setEditPrefillLoading(true);
          const resp = await fetchJobCardByIdForForm(token, jobCardId);
          const job = resolveJobCardFromApiResponse(resp);
          if (!job) throw new Error("Could not load job card.");

          const services = normalizeJobCardServiceBlocks(job);
          setEditId(pickJobId(job));
          setForm({
            customerId: String(
              (typeof job.customerId === "object"
                ? (job.customerId as { _id?: string })._id
                : job.customerId) ||
                (job.customer as { _id?: string } | undefined)?._id ||
                "",
            ),
            vehicleId: String(
              (typeof job.vehicleId === "object"
                ? (job.vehicleId as { _id?: string })._id
                : job.vehicleId) ||
                (job.vehicle as { _id?: string } | undefined)?._id ||
                "",
            ),
            odometerReading: String(job.odometerReading ?? ""),
            dueOdometerReading: String(job.dueOdometerReading ?? ""),
            issueDescription: String(job.issueDescription || ""),
            serviceType: String(job.serviceType || "Repair"),
            priorityLevel: String(job.priorityLevel || "Normal"),
            services,
            vehiclePhotos: Array.isArray(job.vehiclePhotos)
              ? (job.vehiclePhotos as string[])
              : [],
            technicalRemarks: String(job.technicalRemarks || ""),
            labourCharge: String(job.labourCharge ?? ""),
            discount: String(job.otherCharges ?? job.labourDuration ?? ""),
          });
          setVehiclePhotoFiles([]);
          setKeptVehiclePhotoUrls(
            Array.isArray(job.vehiclePhotos)
              ? (job.vehiclePhotos as string[])
                  .map((p) => extractMediaPath(String(p)) || String(p))
                  .filter(Boolean)
              : [],
          );
          const cats = normalizeServiceCategories(data.myServices);
          const blocksFromJob: ServiceBlock[] = [];
          for (const block of services as Array<{ service?: string }>) {
            const catId = String(block.service || "").trim();
            if (!catId || !cats.find((c) => c.id === catId)) continue;
            blocksFromJob.push({ id: mkBlockId(), catId });
          }
          setServiceBlocks(
            blocksFromJob.length > 0 ? blocksFromJob : [emptyServiceBlock(mkBlockId())],
          );
          setServiceLines(apiServiceBlocksToLines(services as unknown[], cats));
          setEditId(jobCardId);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "Could not load form.";
        setDataError(message);
        if (modeProp === "edit") {
          toast.error(message);
          handleCancel();
        }
      } finally {
        setDataLoading(false);
        setEditPrefillLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, modeProp, jobCardId, token]);

  function handleVehiclePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    if (!picked.length) return;
    const room = MAX_VEHICLE_PHOTOS - totalPhotoCount;
    if (room <= 0) {
      setSaveError(`Maximum ${MAX_VEHICLE_PHOTOS} images allowed.`);
      return;
    }
    setSaveError(null);
    setVehiclePhotoFiles((prev) => [...prev, ...picked.slice(0, room)]);
  }

  function removeNewVehiclePhoto(index: number) {
    setVehiclePhotoFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function removeExistingVehiclePhoto(index: number) {
    setKeptVehiclePhotoUrls((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setFormLoading(true);
    setSaveError(null);
    const categories = normalizeServiceCategories(myServices);
    const linesToSave = collectLinesForSave(serviceLines, manualLines);
    const services = serviceLinesToBlocks(linesToSave, categories);
    if (services.length === 0) {
      setSaveError("Select at least one sub-service (included).");
      setFormLoading(false);
      return;
    }
    try {
      const tech = buildLabourTechnicalRemarks(String(labourSubTotal), form.discount, callingCode);
      await saveJobCard(token, {
        jobCardId: formMode === "edit" ? editId ?? undefined : undefined,
        form: {
          ...form,
          services,
          labourCharge: "0",
          labourDuration: "0",
          issueDescription: "Walk-in / scheduled service",
          serviceType: "Repair",
          priorityLevel: "Normal",
          technicalRemarks: tech,
        },
        vehiclePhotoFiles,
        existingVehiclePhotoUrls: keptVehiclePhotoUrls,
      });
      toast.success(formMode === "edit" ? "Job card updated." : "Job card created.");
      resetForm();
      onSaved?.();
      onCancel();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error saving job card");
    }
    setFormLoading(false);
  }

  function setServiceBlockCategory(blockId: string, catId: string) {
    setServiceBlocks((prev) => {
      const oldCatId = prev.find((b) => b.id === blockId)?.catId ?? "";
      const next = prev.map((b) => (b.id === blockId ? { ...b, catId } : b));
      if (oldCatId && oldCatId !== catId) {
        const stillUsed = next.some((b) => b.catId === oldCatId);
        if (!stillUsed) {
          setServiceLines((lines) =>
            lines.filter((l) => {
              const parsed = l.subKey ? parseSubServiceKey(l.subKey) : null;
              return parsed?.catId !== oldCatId;
            }),
          );
        }
      }
      return next;
    });

    if (!catId) return;
    const cat = normalizedCategories.find((c) => c.id === catId);
    if (!cat?.subServices?.length) return;

    setServiceLines((prev) => {
      const withoutCat = prev.filter((l) => {
        const parsed = l.subKey ? parseSubServiceKey(l.subKey) : null;
        return parsed?.catId !== catId;
      });
      const existingKeys = new Set(withoutCat.map((l) => l.subKey));
      const additions: ServiceLine[] = [];
      cat.subServices.forEach((sub, subIdx) => {
        const key = subServiceKey(catId, subIdx);
        if (existingKeys.has(key)) return;
        additions.push({ id: mkLineId(), ...defaultLineForSub(catId, subIdx, sub) });
      });
      return [...withoutCat, ...additions];
    });
  }

  function addServiceBlock() {
    setServiceBlocks((prev) => [...prev, emptyServiceBlock(mkBlockId())]);
  }

  function toggleIncludeSubService(catId: string, subIdx: number) {
    const key = subServiceKey(catId, subIdx);
    const cat = normalizedCategories.find((c) => c.id === catId);
    const sub = cat?.subServices?.[subIdx];
    if (!sub) return;

    setServiceLines((prev) => {
      const existing = prev.find((l) => l.subKey === key);
      if (existing) {
        return prev.filter((l) => l.id !== existing.id);
      }
      return [...prev, { id: mkLineId(), ...defaultLineForSub(catId, subIdx, sub) }];
    });
  }

  function updateServiceLine(lineId: string, patch: Partial<ServiceLine>) {
    setServiceLines((prev) =>
      prev.map((l) => {
        if (l.id !== lineId) return l;
        const next = { ...l, ...patch };
        if ("unitPriceStr" in patch || "qtyStr" in patch || "labourCostStr" in patch) {
          next.priceStr = priceStrFromLine(next);
        }
        return next;
      }),
    );
  }

  function renderNumericCell(
    lineId: string,
    field: "unitPrice" | "labourCost" | "price",
    line: ServiceLine | undefined,
    included: boolean,
    { readOnly = false } = {},
  ) {
    const fieldKey = `${field}Str` as keyof ServiceLine;
    const display = readOnly
      ? included && line
        ? calcLinePrice(line).toFixed(2)
        : "0"
      : included
        ? String(line?.[fieldKey] ?? "")
        : "";
    return (
      <input
        readOnly={readOnly}
        value={display}
        disabled={formLoading || (!readOnly && !included)}
        tabIndex={readOnly ? -1 : undefined}
        onChange={
          readOnly
            ? undefined
            : (ev) => {
                if (!lineId) return;
                updateServiceLine(lineId, { [fieldKey]: ev.target.value } as Partial<ServiceLine>);
              }
        }
        inputMode="decimal"
        placeholder="0"
        className={`${formCellInputClass} job-card-numeric-input text-right ${readOnly ? "cursor-default bg-[#f5f5f5]" : ""} ${!included ? "opacity-50" : ""}`}
      />
    );
  }

  if (!active) return null;

  return (
    <div ref={panelRef} className="flex min-h-0 flex-1 flex-col">
      <DashboardPanelCard variant="form" className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 border-b border-ad-form-border pb-3">
        <h2 className="text-lg font-bold text-ad-green-dark">
          {formMode === "add" ? "New Job Card" : "Edit Job Card"}
        </h2>
        <p className="mt-1 text-sm font-semibold text-ad-green">{PLACEHOLDER_JOB_CARD_NO}</p>
      </div>

      {dataError && !dataLoading ? (
        <div className="mb-3 rounded bg-[#fff3e0] px-4 py-3 text-sm text-[#c0392b]">{dataError}</div>
      ) : null}

      <form id="job-card-form" onSubmit={(e) => void handleSave(e)} className="min-h-0 flex-1">
        {dataLoading || editPrefillLoading ? (
          <JobCardFormSkeleton />
        ) : (
          <>
            <div className="mb-5 grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-2">
              <JobCardFormField label="Customer">
                <select
                  disabled={formMode === "edit"}
                  value={form.customerId}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      customerId: e.target.value,
                      vehicleId: "",
                      ...(formMode === "add"
                        ? { odometerReading: "", dueOdometerReading: "" }
                        : {}),
                    }))
                  }
                  className={`${formCellInputClass} w-full`}
                >
                  <option value="">Select customer</option>
                  {myCustomers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} – {c.phone}
                    </option>
                  ))}
                </select>
              </JobCardFormField>

              <JobCardFormField label="Date">
                <input
                  readOnly
                  value={new Date().toLocaleDateString("en-GB")}
                  className={`${formCellInputClass} job-card-date-input bg-[#f5f5f5]`}
                />
              </JobCardFormField>

              <JobCardFormField label="Vehicle">
                <select
                  disabled={!form.customerId || formMode === "edit"}
                  value={form.vehicleId}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      vehicleId: e.target.value,
                      ...(formMode === "add"
                        ? { odometerReading: "", dueOdometerReading: "" }
                        : {}),
                    }))
                  }
                  className={`${formCellInputClass} w-full`}
                >
                  <option value="">Select vehicle</option>
                  {(formSelectedCustomer?.myVehicles || []).map((v) => (
                    <option key={v._id} value={v._id}>
                      {vehicleDisplayTitle(v) || "Vehicle"} (
                      {v.licensePlateNo || v.regNo || v.vinNo || v.vin || "—"})
                    </option>
                  ))}
                </select>
              </JobCardFormField>

              <JobCardFormField label="Odometer">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.odometerReading}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        odometerReading: e.target.value.replace(/\D/g, ""),
                      }))
                    }
                    placeholder={odometerPlaceholders.in}
                    aria-label="Odometer in"
                    className={`${formCellInputClass} job-card-odo-input text-blue-700`}
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.dueOdometerReading}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        dueOdometerReading: e.target.value.replace(/\D/g, ""),
                      }))
                    }
                    placeholder={odometerPlaceholders.out}
                    aria-label="Odometer out"
                    className={`${formCellInputClass} job-card-odo-input text-[#c0392b]`}
                  />
                </div>
              </JobCardFormField>
            </div>

            <div className="mb-3 space-y-4">
              {categoriesWithSubs.length === 0 ? (
                <div className={TABLE_WRAP_CLASS}>
                  <div className="p-4 text-center text-sm text-gray-600">
                    No services configured. Add sub-services under My Services first.
                  </div>
                </div>
              ) : (
                <div>
                  <p className="mb-1.5 text-xs font-bold text-blue-700">Service breakdown</p>
                  <p className="mb-2 text-[11px] text-gray-500">
                    Select a service to list all sub-services on the rows below (included as Y).
                  </p>
                  <div className={TABLE_WRAP_CLASS}>
                    <table className={TABLE_CLASS}>
                      <ServiceTableColgroup />
                      <ServiceTableHeader />
                      <tbody>
                        {(serviceBlocks.length > 0
                          ? serviceBlocks
                          : [emptyServiceBlock("fallback")]
                        ).flatMap((block) => {
                          const cat = block.catId
                            ? categoriesWithSubs.find((c) => c.id === block.catId)
                            : null;
                          const usedCatIds = new Set(
                            serviceBlocks
                              .filter((b) => b.id !== block.id && b.catId)
                              .map((b) => b.catId),
                          );
                          const serviceSelect = (
                            <select
                              value={block.catId}
                              disabled={formLoading}
                              onChange={(e) => setServiceBlockCategory(block.id, e.target.value)}
                              className={`${formCellInputClass} w-full min-w-0`}
                            >
                              <option value="">Select service</option>
                              {categoriesWithSubs.map((c) => (
                                <option
                                  key={c.id}
                                  value={c.id}
                                  disabled={usedCatIds.has(c.id)}
                                >
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          );
                          if (!cat) {
                            return [
                              <tr key={block.id}>
                                <td className={`${TD_CLASS} align-top`}>{serviceSelect}</td>
                                <td colSpan={6} className={TD_CLASS} aria-hidden />
                                <td className={TD_CLASS} aria-hidden />
                              </tr>,
                            ];
                          }
                          if (cat.subServices.length === 0) {
                            return [
                              <tr key={block.id}>
                                <td className={`${TD_CLASS} align-top`}>{serviceSelect}</td>
                                <td colSpan={6} className={`${TD_CLASS} text-xs text-gray-500`}>
                                  No sub-services for this service.
                                </td>
                                <td className={TD_CLASS} aria-hidden />
                              </tr>,
                            ];
                          }
                          return cat.subServices.map((sub, subIdx) => {
                            const key = subServiceKey(cat.id, subIdx);
                            const line = linesBySubKey.get(key);
                            const included = Boolean(line);
                            const lineId = line?.id ?? "";
                            return (
                              <tr key={`${block.id}-${key}`}>
                                <td className={`${TD_CLASS} align-top font-semibold text-[#333]`}>
                                  {cat.name}
                                </td>
                                <td className={`${TD_CLASS} align-top font-semibold text-[#333]`}>
                                  {sub.name}
                                </td>
                                <td className={TD_CLASS}>
                                  <input
                                    value={line?.desc ?? sub.desc ?? ""}
                                    disabled={formLoading || !included}
                                    onChange={(e) => {
                                      if (!lineId) return;
                                      updateServiceLine(lineId, { desc: e.target.value });
                                    }}
                                    placeholder="Description"
                                    className={`${formCellInputClass} ${!included ? "opacity-50" : ""}`}
                                  />
                                </td>
                                <td className={`${TD_CLASS} align-top text-right`}>
                                  {renderNumericCell(lineId, "unitPrice", line, included)}
                                </td>
                                <td className={`${TD_CLASS} align-top text-center`}>
                                  <input
                                    value={included ? (line?.qtyStr ?? "1") : ""}
                                    disabled={formLoading || !included}
                                    onChange={(e) => {
                                      if (!lineId) return;
                                      updateServiceLine(lineId, { qtyStr: e.target.value });
                                    }}
                                    inputMode="decimal"
                                    placeholder="1"
                                    className={`${formCellInputClass} job-card-qty-input text-center ${!included ? "opacity-50" : ""}`}
                                  />
                                </td>
                                <td className={`${TD_CLASS} align-top text-right`}>
                                  {renderNumericCell(lineId, "labourCost", line, included)}
                                </td>
                                <td className={`${TD_CLASS} align-top text-right`}>
                                  {renderNumericCell(lineId, "price", line, included, {
                                    readOnly: true,
                                  })}
                                </td>
                                <td className={`${TD_CLASS} align-top text-center`}>
                                  <button
                                    type="button"
                                    title={
                                      included
                                        ? "Included — click to exclude"
                                        : "Excluded — click to include"
                                    }
                                    disabled={formLoading}
                                    onClick={() => toggleIncludeSubService(cat.id, subIdx)}
                                    className={`job-card-incl-btn ${included ? "job-card-incl-btn-on" : "job-card-incl-btn-off"}`}
                                  >
                                    {included ? "Y" : "X"}
                                  </button>
                                </td>
                              </tr>
                            );
                          });
                        })}
                      </tbody>
                    </table>
                  </div>
                  <button
                    type="button"
                    disabled={formLoading || !canAddAnotherServiceBlock}
                    onClick={addServiceBlock}
                    className="mt-2 inline-flex items-center gap-1.5 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-ad-purple hover:bg-gray-50 disabled:opacity-60"
                  >
                    <FiPlus size={14} aria-hidden />
                    Add service
                  </button>
                </div>
              )}
            </div>

            <div className="mb-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-800">
                  Upload images
                </label>
                <p className="mb-2 text-[11px] text-gray-500">
                  Up to {MAX_VEHICLE_PHOTOS} photos ({totalPhotoCount}/{MAX_VEHICLE_PHOTOS}{" "}
                  selected)
                </p>
                <input
                  ref={vehiclePhotoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  disabled={formLoading || !canAddMorePhotos}
                  onChange={handleVehiclePhotoSelect}
                />
                <button
                  type="button"
                  disabled={formLoading || !canAddMorePhotos}
                  onClick={() => vehiclePhotoInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-ad-purple hover:bg-gray-50 disabled:opacity-60"
                >
                  <FiUpload size={14} aria-hidden />
                  Choose images
                </button>
                {totalPhotoCount > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {keptVehiclePhotoUrls.map((photo, i) => {
                      const src = normalizeMediaUrl(photo);
                      if (!src) return null;
                      return (
                        <div key={`saved-${i}`} className="group relative">
                          <img
                            src={src}
                            alt={`Saved ${i + 1}`}
                            className="h-14 w-[4.5rem] rounded border border-gray-300 object-cover"
                          />
                          <button
                            type="button"
                            title="Remove"
                            disabled={formLoading}
                            onClick={() => removeExistingVehiclePhoto(i)}
                            className="absolute -top-1.5 -right-1.5 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border-0 bg-[#c0392b] text-white shadow"
                          >
                            <FiX size={12} />
                          </button>
                        </div>
                      );
                    })}
                    {newPhotoPreviews.map((preview, i) => (
                      <div key={`new-${preview.file.name}-${i}`} className="group relative">
                        <img
                          src={preview.url}
                          alt={preview.file.name}
                          className="h-14 w-[4.5rem] rounded border border-gray-300 object-cover"
                        />
                        <button
                          type="button"
                          title="Remove"
                          disabled={formLoading}
                          onClick={() => removeNewVehiclePhoto(i)}
                          className="absolute -top-1.5 -right-1.5 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border-0 bg-[#c0392b] text-white shadow"
                        >
                          <FiX size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] text-gray-500">No images yet.</p>
                )}
              </div>

              <div className="flex flex-col items-stretch gap-2 text-sm lg:items-end">
                <div className="flex justify-between gap-8 py-1 lg:w-[min(100%,320px)]">
                  <span className="font-semibold text-gray-800">Subtotal</span>
                  <span className="font-semibold tabular-nums">{formatMoney(partsSubTotal)}</span>
                </div>
                <div className="flex justify-between gap-8 py-1 lg:w-[min(100%,320px)]">
                  <span className="font-semibold text-gray-800">Labour cost</span>
                  <span className="font-semibold tabular-nums">{formatMoney(labourSubTotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 py-1 lg:w-[min(100%,320px)]">
                  <span className="shrink-0 font-semibold text-gray-800">Discount</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.discount}
                    onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))}
                    placeholder="0.00"
                    className={`${formCellInputClass} w-[7rem] text-right tabular-nums`}
                  />
                </div>
                <div className="mt-1 flex justify-between gap-8 rounded border border-gray-300 bg-[#f5f5f5] px-3 py-2 text-base font-bold lg:w-[min(100%,320px)]">
                  <span>Total</span>
                  <span className="tabular-nums text-blue-700">{formatMoney(grandTotal)}</span>
                </div>
              </div>
            </div>

            {saveError ? (
              <div className="mb-3 text-xs text-[#c0392b]">{saveError}</div>
            ) : null}
          </>
        )}
      </form>

      <div className="mt-4 flex flex-wrap items-stretch justify-between gap-2 border-t border-ad-form-border bg-ad-form-bg">
        <div className="flex min-w-[180px] flex-1 items-center bg-ad-form-required-bg px-3 py-2.5 text-xs text-gray-800">
          Select at least one included sub-service to save.
        </div>
        <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
          <button
            type="submit"
            form="job-card-form"
            disabled={
              formLoading || editPrefillLoading || dataLoading || categoriesWithSubs.length === 0
            }
            className="inline-flex items-center gap-1.5 rounded bg-ad-form-save px-4 py-1 text-sm font-bold text-white hover:brightness-95 disabled:opacity-60"
          >
            {formLoading
              ? "Saving..."
              : editPrefillLoading || dataLoading
                ? "Loading…"
                : "Save and Send"}
            {!formLoading && <FiArrowRight size={16} aria-hidden />}
          </button>
          <span className="text-xs text-gray-700">
            or{" "}
            <button
              type="button"
              onClick={handleCancel}
              disabled={formLoading || editPrefillLoading}
              className="font-medium text-blue-600 underline hover:text-blue-700 disabled:opacity-60"
            >
              Cancel
            </button>
          </span>
        </div>
      </div>
    </DashboardPanelCard>
    </div>
  );
}
