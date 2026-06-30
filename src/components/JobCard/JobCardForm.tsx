/**
 * Inline New/Edit Job Card form — shown inside the shop job cards page.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import useAuth from "../../auth/useAuth";
import { CompactFormPanel } from "../admin/ContentPanel";
import { JobCardFormSkeleton } from "../common/JobCardFormSkeleton";
import {
  shopCompactInputClass,
  shopProfileFormPanelClass,
  shopProfileFormPanelFooterClass,
} from "../shop/shopLayoutStyles";
import { useShopOwnerCallingCode } from "../../hooks/useShopOwnerCallingCode";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { formatCurrencyAmount } from "../../lib/currency";
import { formatPhoneDisplay, phoneDigits } from "../../lib/phoneFormat";
import { extractMediaPath } from "../../lib/mediaUrl";
import {
  ADMIN_PANEL_THEAD_ROW_CLASS,
  adminPanelTableClasses,
} from "../admin/adminPanelTableStyles";
import { extractSavedJobCardId, pickJobNoFromRecord } from "./shopJobCardEstimate";
import {
  fetchJobCardByIdForForm,
  fetchJobCardFormData,
  normalizeJobCardServiceBlocks,
  resolveJobCardFromApiResponse,
  saveJobCard,
  type JobCardFormCustomer,
} from "../../lib/shopOwnerJobCardsApi";

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

const JOB_CARD_TABLE = adminPanelTableClasses(true);
const JOB_CARD_TABLE_HEAD_TH_CLASS = `${JOB_CARD_TABLE.th} h-9 py-0 align-middle`;
const JOB_CARD_TABLE_BODY_TD_CLASS = `${JOB_CARD_TABLE.td} h-9 py-0 align-middle`;

const META_LABEL_CLASS = "text-sm font-bold text-gray-900";
const META_LABEL_CELL_CLASS = `${META_LABEL_CLASS} w-[8.5rem] shrink-0 text-left`;
const META_FIELD_CELL_CLASS = "w-[14rem] max-w-full shrink-0";
const META_VALUE_CLASS = `${formCellInputClass} ${META_FIELD_CELL_CLASS}`;
const META_ROW_GRID_CLASS =
  "grid w-fit max-w-full grid-cols-[8.5rem_14rem] items-center gap-x-3 gap-y-2";

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

function displayJobCardNo(jobNo: string | undefined): string {
  const raw = (jobNo ?? "").trim().replace(/^#/, "");
  if (!raw) return "J # ——";
  const stripped = raw.replace(/^job\s*#?\s*/i, "").trim();
  if (!stripped) return "J # ——";
  if (/^j/i.test(stripped)) {
    return stripped.replace(/^j/i, "J # ");
  }
  return `J # ${stripped}`;
}

function customerLocationLabel(customer: JobCardFormCustomer | null, shopCity: string): string {
  const city = customer?.city?.trim() || shopCity.trim();
  return city || "—";
}

function vehiclePlateLabel(vehicle: JobCardFormCustomer["myVehicles"][number] | null): string {
  if (!vehicle) return "—";
  return vehicle.licensePlateNo?.trim() || vehicle.regNo?.trim() || "—";
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
  const fmt = (x: number) =>
    formatCurrencyAmount(x, countryCode, { fallback: "", includeSign: false });
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

function emptyTableLine(id: string): ServiceLine {
  return {
    id,
    subKey: "",
    desc: "",
    unitPriceStr: "",
    qtyStr: "1",
    labourCostStr: "0",
    priceStr: "0",
  };
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

function collectLinesForSave(serviceLines: ServiceLine[]) {
  const seen = new Set<string>();
  const out: ServiceLine[] = [];
  for (const line of serviceLines) {
    if (!isLineActive(line) || seen.has(line.subKey)) continue;
    seen.add(line.subKey);
    out.push(line);
  }
  return out;
}

function pickJobId(job: Record<string, unknown>) {
  const raw = job._id ?? job.id ?? job.jobCardId;
  return typeof raw === "string" && raw ? raw : "";
}

function pickJobNo(job: Record<string, unknown>) {
  const raw =
    job.jobCardNumber ?? job.jobNo ?? job.jobNumber ?? job.jobCode ?? job.displayJobNo;
  return typeof raw === "string" && raw.trim() ? raw.trim() : "";
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function findCustomerByPhone(
  customers: JobCardFormCustomer[],
  digits: string,
): JobCardFormCustomer | null {
  if (digits.length !== 10) return null;
  return customers.find((customer) => phoneDigits(customer.phone) === digits) ?? null;
}

type JobCardFormProps = {
  active: boolean;
  mode?: "add" | "edit";
  jobCardId?: string | null;
  onCancel: () => void;
  onSaved?: (jobCardId?: string, jobCardNo?: string) => void;
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
  const { city: shopCity } = useShopOwnerPortal();
  const formatMoney = (x: number) =>
    formatCurrencyAmount(x, callingCode, { fallback: "", includeSign: false });
  const currencyLabel = callingCode === "+91" ? "INR" : "CAD";

  const [formMode, setFormMode] = useState(modeProp);
  const [formLoading, setFormLoading] = useState(false);
  const [editPrefillLoading, setEditPrefillLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [displayJobNo, setDisplayJobNo] = useState("");
  const [serviceDate, setServiceDate] = useState(todayIsoDate);
  const [myCustomers, setMyCustomers] = useState<JobCardFormCustomer[]>([]);
  const [myServices, setMyServices] = useState<ServiceCategory[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([]);
  const [customerPhone, setCustomerPhone] = useState("");
  const [vehiclePhotoFiles, setVehiclePhotoFiles] = useState<File[]>([]);
  const [keptVehiclePhotoUrls, setKeptVehiclePhotoUrls] = useState<string[]>([]);
  const lineIdRef = useRef(1);

  const mkLineId = () => {
    lineIdRef.current += 1;
    return `svc-line-${lineIdRef.current}`;
  };

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

  const categoryOptions = useMemo(() => {
    const opts: Array<{ value: string; label: string }> = [];
    for (const cat of categoriesWithSubs) {
      cat.subServices.forEach((sub, subIdx) => {
        opts.push({
          value: subServiceKey(cat.id, subIdx),
          label: sub.name?.trim() || "Service",
        });
      });
    }
    return opts;
  }, [categoriesWithSubs]);

  const activeLines = useMemo(
    () => serviceLines.filter(isLineActive),
    [serviceLines],
  );

  const partsSubTotal = useMemo(() => {
    let sum = 0;
    for (const line of activeLines) {
      sum += parseNumberFromText(line.unitPriceStr) * parseNumberFromText(line.qtyStr);
    }
    return sum;
  }, [activeLines]);

  const labourAmount = parseNumberFromText(form.labourCharge);
  const discountAmount = parseNumberFromText(form.discount);
  const grandTotal = partsSubTotal + labourAmount - discountAmount;

  function resetForm() {
    setForm({ ...DEFAULT_FORM });
    setEditId(null);
    setDisplayJobNo("");
    setServiceDate(todayIsoDate());
    setCustomerPhone("");
    setEditPrefillLoading(false);
    setSaveError(null);
    lineIdRef.current = 1;
    setServiceLines([emptyTableLine(mkLineId())]);
    setVehiclePhotoFiles([]);
    setKeptVehiclePhotoUrls([]);
  }

  function applyCustomerPhoneLookup(digits: string) {
    const match = findCustomerByPhone(myCustomers, digits);
    setForm((f) => ({
      ...f,
      customerId: match?._id ?? "",
      vehicleId: match ? "" : "",
      odometerReading: "",
      dueOdometerReading: "",
    }));
  }

  function handleCustomerPhoneChange(raw: string) {
    if (formMode === "edit") return;
    const digits = phoneDigits(raw);
    setCustomerPhone(digits);
    applyCustomerPhoneLookup(digits);
  }

  function handleCancel() {
    if (formLoading || editPrefillLoading) return;
    resetForm();
    onCancel();
  }

  useEffect(() => {
    if (formMode !== "add" || !formSelectedCustomer) return;
    const vehicles = formSelectedCustomer.myVehicles || [];
    if (vehicles.length === 1 && vehicles[0]._id && !form.vehicleId) {
      setForm((f) => ({ ...f, vehicleId: vehicles[0]._id ?? "" }));
    }
  }, [formMode, formSelectedCustomer, form.vehicleId]);

  useEffect(() => {
    if (!formSelectedVehicle || form.odometerReading) return;
    const inVal = formSelectedVehicle.odometerReading;
    const dueVal = formSelectedVehicle.dueOdometerReading;
    if (inVal != null && String(inVal).trim()) {
      setForm((f) => ({
        ...f,
        odometerReading: String(inVal).replace(/\D/g, ""),
        dueOdometerReading:
          f.dueOdometerReading ||
          (dueVal != null && String(dueVal).trim() ? String(dueVal).replace(/\D/g, "") : ""),
      }));
    }
  }, [formSelectedVehicle, form.odometerReading]);

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
          setDisplayJobNo(pickJobNo(job));
          setServiceDate(
            String(job.serviceDate ?? job.jobDate ?? job.date ?? "").slice(0, 10) || todayIsoDate(),
          );
          const loadedCustomerId = String(
            (typeof job.customerId === "object"
              ? (job.customerId as { _id?: string })._id
              : job.customerId) ||
              (job.customer as { _id?: string } | undefined)?._id ||
              "",
          );
          const loadedCustomer =
            data.myCustomers.find((customer) => customer._id === loadedCustomerId) ??
            (typeof job.customerId === "object"
              ? data.myCustomers.find(
                  (customer) =>
                    phoneDigits(customer.phone) ===
                    phoneDigits((job.customerId as { phone?: string }).phone),
                )
              : null);
          if (loadedCustomer?.phone) {
            setCustomerPhone(phoneDigits(loadedCustomer.phone));
          } else if (typeof job.customerId === "object") {
            const jobPhone = phoneDigits((job.customerId as { phone?: string }).phone);
            if (jobPhone) setCustomerPhone(jobPhone);
          }
          const cats = normalizeServiceCategories(data.myServices);
          const loadedLines = apiServiceBlocksToLines(services as unknown[], cats);
          let labourCharge = String(job.labourCharge ?? "");
          if (!parseNumberFromText(labourCharge)) {
            const fromLines = loadedLines.reduce(
              (sum, line) => sum + parseNumberFromText(line.labourCostStr),
              0,
            );
            if (fromLines > 0) labourCharge = String(fromLines);
          }
          setForm({
            customerId: loadedCustomerId,
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
            labourCharge,
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
          setServiceLines(loadedLines.length > 0 ? loadedLines : [emptyTableLine(mkLineId())]);
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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setFormLoading(true);
    setSaveError(null);
    const categories = normalizeServiceCategories(myServices);
    const linesToSave = collectLinesForSave(serviceLines);
    const services = serviceLinesToBlocks(linesToSave, categories);
    if (!form.customerId) {
      setSaveError(
        customerPhone.length === 10
          ? "No customer found for this phone number."
          : "Enter the customer's 10-digit phone number.",
      );
      setFormLoading(false);
      return;
    }
    if (!form.vehicleId) {
      setSaveError("Select a vehicle for this customer.");
      setFormLoading(false);
      return;
    }
    if (services.length === 0) {
      setSaveError("Add at least one line item with a service.");
      setFormLoading(false);
      return;
    }
    try {
      const tech = buildLabourTechnicalRemarks(form.labourCharge, form.discount, callingCode);
      const res = await saveJobCard(token, {
        jobCardId: formMode === "edit" ? editId ?? undefined : undefined,
        form: {
          ...form,
          services,
          labourCharge: form.labourCharge || "0",
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
      const savedJob = resolveJobCardFromApiResponse(res.data);
      const savedId = extractSavedJobCardId(res.data, editId);
      const savedNo = savedJob ? pickJobNoFromRecord(savedJob) : undefined;
      resetForm();
      onSaved?.(savedId, savedNo);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error saving job card");
    }
    setFormLoading(false);
  }

  function addTableLine() {
    setServiceLines((prev) => [...prev, emptyTableLine(mkLineId())]);
  }

  function removeTableLine(lineId: string) {
    setServiceLines((prev) => {
      const next = prev.filter((line) => line.id !== lineId);
      return next.length > 0 ? next : [emptyTableLine(mkLineId())];
    });
  }

  function setLineCategory(lineId: string, subKey: string) {
    if (!subKey) {
      updateServiceLine(lineId, {
        subKey: "",
        desc: "",
        unitPriceStr: "",
        qtyStr: "1",
        labourCostStr: "0",
        priceStr: "0",
      });
      return;
    }
    const parsed = parseSubServiceKey(subKey);
    if (!parsed) return;
    const cat = normalizedCategories.find((c) => c.id === parsed.catId);
    const sub = cat?.subServices?.[parsed.subIdx];
    if (!sub) return;
    updateServiceLine(lineId, { id: lineId, ...defaultLineForSub(parsed.catId, parsed.subIdx, sub) });
  }

  function updateServiceLine(lineId: string, patch: Partial<ServiceLine>) {
    setServiceLines((prev) =>
      prev.map((line) => {
        if (line.id !== lineId) return line;
        const next = { ...line, ...patch };
        if ("unitPriceStr" in patch || "qtyStr" in patch || "labourCostStr" in patch) {
          next.priceStr = priceStrFromLine(next);
        }
        return next;
      }),
    );
  }

  if (!active) return null;

  const customerVehicles = formSelectedCustomer?.myVehicles ?? [];
  const showVehiclePicker = customerVehicles.length > 1;

  const footerMessage =
    saveError ??
    (formMode === "edit" ? "You are editing a job card" : "You are creating a new job card");
  const saveDisabled =
    formLoading ||
    editPrefillLoading ||
    dataLoading ||
    categoriesWithSubs.length === 0;

  return (
    <CompactFormPanel
      className={shopProfileFormPanelClass}
      showBottomBorder={false}
      focusOnMount={active}
      footer={
        <div
          className={`flex flex-wrap items-center justify-between gap-2 px-4 py-1 ${shopProfileFormPanelFooterClass}`}
        >
          <div
            className={`flex min-w-[180px] flex-1 items-center text-xs font-serif italic ${
              saveError ? "text-red-700" : "text-gray-800"
            }`}
          >
            {footerMessage}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              form="job-card-form"
              disabled={saveDisabled}
              className="inline-flex min-w-[7.5rem] items-center justify-center gap-1.5 rounded bg-ad-form-save px-5 py-1 text-sm font-bold text-white hover:brightness-95 disabled:opacity-60"
            >
              {formLoading
                ? "Saving..."
                : editPrefillLoading || dataLoading
                  ? "Loading…"
                  : "Save"}
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
      }
    >
      {dataError && !dataLoading ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {dataError}
        </div>
      ) : null}

      <form id="job-card-form" onSubmit={(e) => void handleSave(e)}>
          {dataLoading || editPrefillLoading ? (
            <JobCardFormSkeleton />
          ) : (
            <>
              <div className="mb-4 border-b border-gray-300 pb-4">
                <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-x-12">
                  <div className={META_ROW_GRID_CLASS}>
                    <span className={META_LABEL_CELL_CLASS}>Customer info</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      disabled={formMode === "edit"}
                      value={formatPhoneDisplay(customerPhone)}
                      onChange={(e) => handleCustomerPhoneChange(e.target.value)}
                      placeholder="705 991 3785"
                      aria-label="Customer phone number"
                      className={META_VALUE_CLASS}
                    />

                    {customerPhone.length === 10 && !formSelectedCustomer ? (
                      <>
                        <span aria-hidden />
                        <p className="text-xs font-semibold text-red-700">
                          No customer found for this phone number.
                        </p>
                      </>
                    ) : null}

                    {formSelectedCustomer ? (
                      <>
                        <span aria-hidden />
                        <div className="space-y-0.5 text-sm font-semibold text-gray-900">
                          <p>{formSelectedCustomer.name ?? "—"}</p>
                          <p>{customerLocationLabel(formSelectedCustomer, shopCity)}</p>
                          <p className="font-bold">{vehiclePlateLabel(formSelectedVehicle)}</p>
                        </div>
                      </>
                    ) : customerPhone.length > 0 && customerPhone.length < 10 ? (
                      <>
                        <span aria-hidden />
                        <p className="text-xs text-gray-600">
                          Enter 10 digits to look up the customer.
                        </p>
                      </>
                    ) : null}

                    {showVehiclePicker ? (
                      <>
                        <span aria-hidden />
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
                          className={META_VALUE_CLASS}
                          aria-label="Vehicle"
                        >
                          <option value="">Select vehicle</option>
                          {customerVehicles.map((vehicle) => (
                            <option key={vehicle._id} value={vehicle._id}>
                              {vehicleDisplayTitle(vehicle) || "Vehicle"} (
                              {vehicle.licensePlateNo || vehicle.regNo || "—"})
                            </option>
                          ))}
                        </select>
                      </>
                    ) : null}
                  </div>

                  <div className={`${META_ROW_GRID_CLASS} lg:justify-self-end`}>
                    <span className={META_LABEL_CELL_CLASS}>Job Card No.</span>
                    <input
                      readOnly
                      value={displayJobCardNo(displayJobNo)}
                      className={`${META_VALUE_CLASS} bg-gray-100`}
                    />
                    <span className={META_LABEL_CELL_CLASS}>Date</span>
                    <input
                      type="date"
                      value={serviceDate}
                      onChange={(e) => setServiceDate(e.target.value)}
                      className={META_VALUE_CLASS}
                    />
                    <span className={META_LABEL_CELL_CLASS}>Odo In</span>
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
                      className={META_VALUE_CLASS}
                    />
                    <span className={META_LABEL_CELL_CLASS}>Odo Out</span>
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
                      className={META_VALUE_CLASS}
                    />
                  </div>
                </div>
              </div>

              <div className="mb-3">
                {categoriesWithSubs.length === 0 ? (
                  <div className="rounded border border-gray-300 p-4 text-center text-sm text-gray-600">
                    No services configured. Add sub-services under My Services first.
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto rounded border border-gray-300 bg-white">
                      <table className={JOB_CARD_TABLE.table}>
                        <thead>
                          <tr className={ADMIN_PANEL_THEAD_ROW_CLASS}>
                            <th className={JOB_CARD_TABLE_HEAD_TH_CLASS}>Service</th>
                            <th className={JOB_CARD_TABLE_HEAD_TH_CLASS}>Description</th>
                            <th className={`${JOB_CARD_TABLE_HEAD_TH_CLASS} text-right`}>Unit Cost</th>
                            <th className={`${JOB_CARD_TABLE_HEAD_TH_CLASS} text-center`}>Qty</th>
                            <th className={`${JOB_CARD_TABLE_HEAD_TH_CLASS} text-right`}>Amount</th>
                            <th className={`${JOB_CARD_TABLE_HEAD_TH_CLASS} w-10`} aria-label="Remove" />
                          </tr>
                        </thead>
                        <tbody>
                          {serviceLines.map((line, index) => (
                            <tr key={line.id} className={index % 2 === 1 ? "bg-gray-100" : "bg-white"}>
                              <td className={JOB_CARD_TABLE_BODY_TD_CLASS}>
                                <select
                                  value={line.subKey}
                                  disabled={formLoading}
                                  onChange={(e) => setLineCategory(line.id, e.target.value)}
                                  className={`${formCellInputClass} min-w-[9rem]`}
                                >
                                  <option value="">Select service</option>
                                  {categoryOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className={JOB_CARD_TABLE_BODY_TD_CLASS}>
                                <input
                                  value={line.desc}
                                  disabled={formLoading || !line.subKey}
                                  onChange={(e) =>
                                    updateServiceLine(line.id, { desc: e.target.value })
                                  }
                                  placeholder="Description"
                                  className={formCellInputClass}
                                />
                              </td>
                              <td className={`${JOB_CARD_TABLE_BODY_TD_CLASS} text-right`}>
                                <input
                                  value={line.unitPriceStr}
                                  disabled={formLoading || !line.subKey}
                                  onChange={(e) =>
                                    updateServiceLine(line.id, { unitPriceStr: e.target.value })
                                  }
                                  inputMode="decimal"
                                  placeholder="0"
                                  className={`${formCellInputClass} text-right`}
                                />
                              </td>
                              <td className={`${JOB_CARD_TABLE_BODY_TD_CLASS} text-center`}>
                                <input
                                  value={line.qtyStr}
                                  disabled={formLoading || !line.subKey}
                                  onChange={(e) =>
                                    updateServiceLine(line.id, { qtyStr: e.target.value })
                                  }
                                  inputMode="decimal"
                                  placeholder="1"
                                  className={`${formCellInputClass} mx-auto w-14 text-center`}
                                />
                              </td>
                              <td className={`${JOB_CARD_TABLE_BODY_TD_CLASS} text-right`}>
                                <input
                                  readOnly
                                  value={
                                    line.subKey
                                      ? (
                                          parseNumberFromText(line.unitPriceStr) *
                                          parseNumberFromText(line.qtyStr)
                                        ).toFixed(2)
                                      : ""
                                  }
                                  className={`${formCellInputClass} bg-gray-100 text-right`}
                                />
                              </td>
                              <td className={`${JOB_CARD_TABLE_BODY_TD_CLASS} text-center`}>
                                <button
                                  type="button"
                                  title="Remove line"
                                  disabled={formLoading}
                                  onClick={() => removeTableLine(line.id)}
                                  className="inline-flex h-7 w-7 items-center justify-center text-lg font-bold text-red-600 hover:text-red-700"
                                >
                                  <FiX size={16} aria-hidden />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <button
                      type="button"
                      disabled={formLoading}
                      onClick={addTableLine}
                      className="mt-2 inline-flex items-center gap-1.5 rounded border border-gray-400 bg-gray-200 px-3 py-1 text-xs font-bold text-gray-800 hover:bg-gray-300 disabled:opacity-60"
                    >
                      <FiPlus size={13} aria-hidden />
                      Add Line
                    </button>
                  </>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-300 pt-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900">Terms of Service :</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-700">
                    Payment is due upon completion unless otherwise agreed. All work is subject to shop
                    terms and applicable taxes.
                  </p>
                </div>

                <div className="flex flex-col items-stretch gap-3 lg:items-end">
                  <div className="w-full min-w-[15rem] rounded border border-gray-400 bg-white p-3 text-sm lg:w-[18rem]">
                    <div className="flex items-center justify-between gap-4 py-1">
                      <span className="font-semibold text-gray-800">Sub Total ({currencyLabel})</span>
                      <span className="font-semibold tabular-nums">{formatMoney(partsSubTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 py-1">
                      <span className="font-semibold text-gray-800">Labour</span>
                      <input
                        value={form.labourCharge}
                        disabled={formLoading}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, labourCharge: e.target.value }))
                        }
                        inputMode="decimal"
                        placeholder="0"
                        className={`${formCellInputClass} w-16 max-w-[4.5rem] text-right tabular-nums`}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-4 border-t border-gray-300 pt-2">
                      <span className="text-base font-bold text-gray-900">Total {currencyLabel}</span>
                      <span className="text-base font-bold tabular-nums text-gray-900">
                        {formatMoney(grandTotal)}
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            </>
          )}
      </form>
    </CompactFormPanel>
  );
}
