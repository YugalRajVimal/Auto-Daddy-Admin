import { useCallback, useEffect, useMemo, useRef, useState, type HTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { FiEdit2, FiPaperclip } from "react-icons/fi";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { getJson } from "../../api/mobileAuth";
import {
  CompactField,
  CompactFormPanel,
  CompactFormRow,
  compactFixedFieldWidth,
  ContentPanel,
} from "../../components/admin/ContentPanel";
import {
  ADMIN_PANEL_THEAD_ROW_CLASS,
  adminPanelRowClass,
  adminPanelTableClasses,
  type AdminPanelTableClasses,
} from "../../components/admin/adminPanelTableStyles";
import ShopPageShell from "../../components/shop/ShopPageShell";
import { ShopReveal } from "../../components/shop/ShopAnimated";
import { shopAddNewButtonClass } from "../../components/shop/forms/ShopFormPage";
import {
  shopCompactInputClass,
  shopProfileFormPanelClass,
  shopProfileFormPanelFooterClass,
} from "../../components/shop/shopLayoutStyles";
import { ShopListSkeleton } from "../../components/shop/ShopListSkeletons";
import {
  ShopErrorPanel,
  ShopListFooter,
} from "../../components/shop/ShopPanels";
import { useAuth } from "../../auth";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { useShopCustomers } from "../../hooks/useShopCustomers";
import {
  addCarOwnerToMyCustomers,
  apiMessage,
  onboardCarOwner,
  removeCarOwnerFromMyCustomers,
  updateMyCustomer,
  type CustomerVehiclePayload,
} from "../../lib/shopOwnerMutations";
import { searchCarOwners } from "../../lib/shopOwnerApi";
import { parseMyCustomers } from "../../lib/shopOwnerParsers";
import {
  addVehicleToOnboardedCustomer,
  fetchOnboardedCustomers,
  editOnboardedCustomer,
} from "../../lib/autoshopownerApi";
import { parseCitiesApiResponse } from "../../lib/carOwnerCities";
import { formatPhoneDisplay, formatPhoneLabel, phoneDigits } from "../../lib/phoneFormat";
import { resolveCarBrandLogo } from "../../lib/dummyCarBrands";
import type { CustomerVehicle, MyCustomer } from "../../types/shopOwner";

type PeopleSection = "customers" | "my-list" | "approval";

function shouldDebugPeopleApi(): boolean {
  if (!import.meta.env.DEV) return false;
  try {
    return window.localStorage.getItem("debug:people-api") === "1";
  } catch {
    return false;
  }
}

function logPeopleApi(method: string, path: string, request: unknown, response: unknown) {
  if (!shouldDebugPeopleApi()) return;
  // eslint-disable-next-line no-console
  console.groupCollapsed(`[People API] ${method} ${path}`);
  // eslint-disable-next-line no-console
  console.log("request:", request ?? null);
  // eslint-disable-next-line no-console
  console.log("response:", response ?? null);
  // eslint-disable-next-line no-console
  console.groupEnd();
}

type DetailView =
  | { kind: "add-to-list"; customer: MyCustomer }
  | { kind: "customer-info"; customer: MyCustomer; vehicleIndex: number }
  | { kind: "vehicle-list"; customer: MyCustomer };

const PEOPLE_SECTIONS = [
  { id: "customers", label: "Customers", variant: "primary" as const },
  { id: "my-list", label: "My Customer List", variant: "primary" as const },
  { id: "approval", label: "Approval", variant: "primary" as const },
];

const SECTION_HEADINGS: Record<PeopleSection, string> = {
  customers: "Customers",
  "my-list": "My Customer List",
  approval: "Approval",
};

const PEOPLE_SEARCH_INPUT_ID = "shop-people-customer-search";
const PAGE_SIZE = 10;

const SHOP_TABLE_BASE = adminPanelTableClasses(true);
const SHOP_TABLE: AdminPanelTableClasses = {
  ...SHOP_TABLE_BASE,
  th: SHOP_TABLE_BASE.th.replace("px-2", "px-4"),
  thCheckbox: SHOP_TABLE_BASE.thCheckbox.replace("px-2", "px-4"),
  td: SHOP_TABLE_BASE.td.replace("px-2", "px-4"),
  tdCheckbox: SHOP_TABLE_BASE.tdCheckbox.replace("px-2", "px-4"),
};

const SHOP_TABLE_HEAD_TH_CLASS = `${SHOP_TABLE.th} h-9 py-0 align-middle`;
const SHOP_TABLE_HEAD_TH_CHECKBOX_CLASS = `${SHOP_TABLE.thCheckbox} h-9 py-0 align-middle`;
const SHOP_TABLE_BODY_TD_CLASS = `${SHOP_TABLE.td} h-9 py-0 align-middle whitespace-nowrap`;
const SHOP_TABLE_BODY_TD_CHECKBOX_CLASS = `${SHOP_TABLE.tdCheckbox} h-9 py-0 align-middle`;

const SHOP_PEOPLE_BULK_DELETE_BUTTON_CLASS =
  "rounded border border-ad-purple bg-white px-3 py-1 text-xs font-bold text-ad-purple hover:bg-[#f5cce8] disabled:cursor-not-allowed disabled:opacity-60";

const SHOP_TABLE_CHECKBOX_CLASS = "h-3.5 w-3.5 accent-ad-purple";

function customerTableRowKey(customer: MyCustomer, index: number) {
  return customerId(customer) || `row-${index}`;
}

function AddNewButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={shopAddNewButtonClass}>
      + Add New
    </button>
  );
}

function PeopleFormFooter({
  message,
  saving = false,
  saveLabel,
  savingLabel,
  onSave,
  onCancel,
  cancelLabel = "Cancel",
}: {
  message: string;
  saving?: boolean;
  saveLabel: string;
  savingLabel?: string;
  onSave: () => void;
  onCancel: () => void;
  cancelLabel?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 px-4 py-1 ${shopProfileFormPanelFooterClass}`}
    >
      <div className="flex min-w-[180px] flex-1 items-center text-xs font-serif italic text-gray-800">
        {message}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex min-w-[7.5rem] items-center justify-center gap-1.5 rounded bg-ad-form-save px-5 py-1 text-sm font-bold text-white hover:brightness-95 disabled:opacity-60"
        >
          {saving ? (savingLabel ?? "Saving…") : saveLabel}
        </button>
        <span className="text-xs text-gray-700">
          or{" "}
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="font-medium text-blue-600 underline hover:text-blue-700 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
        </span>
      </div>
    </div>
  );
}

function PeopleFormError({ message }: { message: string }) {
  return (
    <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
      {message}
    </div>
  );
}

function PeopleSearchBar({
  value,
  onChange,
  inputId,
  leading,
  trailing,
}: {
  value: string;
  onChange: (value: string) => void;
  inputId: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-9 shrink-0 flex-wrap items-center justify-between gap-2 py-1.5 sm:gap-3">
      <div className="flex items-center gap-2">{leading}</div>
      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <input
          id={inputId}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search"
          aria-label="Search"
          className="h-[26px] min-w-[9rem] border border-gray-400 bg-white px-2 text-sm text-gray-800 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
        />
        {trailing}
      </div>
    </div>
  );
}

function customerId(c: MyCustomer) {
  return c.carOwnerId ?? c.id ?? c._id ?? "";
}

type CarCompanyCatalogItem = {
  _id?: string;
  id?: string;
  companyName: string;
  models: Array<{ modelName: string; years: Array<string | number> }>;
};

type VehicleDraft = CustomerVehiclePayload;

const VEHICLE_YEAR_MAX = new Date().getFullYear() + 1;

function emptyVehicleDraft(): VehicleDraft {
  return {
    licensePlateNo: "",
    vinNo: "",
    vehicleName: "",
    model: "",
    year: "",
    odometerReading: "",
  };
}

function isValidVehicleYear(value: string) {
  const year = Number(value);
  return /^\d{4}$/.test(value) && year >= 1900 && year <= VEHICLE_YEAR_MAX;
}

function mapCustomerVehiclesForUpdate(customer: MyCustomer): CustomerVehiclePayload[] {
  return (customer.vehicles ?? []).map((v) => ({
    ...(v.vId ?? v._id ? { vId: v.vId ?? v._id } : {}),
    licensePlateNo: v.licensePlateNo?.trim() ?? "",
    vinNo: v.vinNo?.trim(),
    vehicleName: v.vehicleName?.trim() ?? "",
    model: v.model?.trim() ?? "",
    year: v.year?.trim() ?? "",
    odometerReading: v.odometerReading?.trim(),
  }));
}

function vehicleDraftToPayload(draft: VehicleDraft): CustomerVehiclePayload {
  return {
    licensePlateNo: draft.licensePlateNo.trim().slice(0, 14),
    vinNo: draft.vinNo?.trim() || undefined,
    vehicleName: draft.vehicleName.trim(),
    model: draft.model.trim(),
    year: draft.year.trim(),
    odometerReading: draft.odometerReading?.trim() || undefined,
  };
}

function validateVehicleDraft(draft: VehicleDraft): string | null {
  if (!draft.licensePlateNo.trim()) return "License plate is required.";
  if (!draft.vehicleName.trim()) return "Make is required.";
  if (!draft.model.trim()) return "Model is required.";
  if (!draft.year.trim() || !isValidVehicleYear(draft.year.trim())) return "Enter a valid vehicle year.";
  if (draft.vinNo?.trim() && draft.vinNo.trim().length !== 17) {
    return "VIN must be exactly 17 characters when provided.";
  }
  return null;
}


function vehicleCount(customer: MyCustomer) {
  return customer.vehicles?.length ?? 0;
}

function vehicleRowKey(vehicle: CustomerVehicle, index: number) {
  return vehicle.vId ?? vehicle._id ?? `vehicle-${index}`;
}

function vehicleMakeName(vehicle: CustomerVehicle) {
  return vehicle.vehicleName?.trim() || "—";
}

function vehicleModelLabel(vehicle: CustomerVehicle) {
  const model = vehicle.model?.trim();
  const year = vehicle.year?.trim();
  if (model && year) return `${model} - ${year}`;
  return model || year || vehicleMakeName(vehicle);
}

function vehicleFieldValue(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed || "—";
}

function isPendingApproval(customer: MyCustomer): boolean {
  const status = (customer.status ?? customer.linkStatus ?? "").trim().toLowerCase();
  if (status.includes("pending") || status.includes("approval") || status === "sent") {
    return true;
  }
  if (status.includes("approved") || status === "active" || status.includes("linked")) {
    return false;
  }
  return !customer.linkedAt?.trim();
}

function customerListDate(customer: MyCustomer): string {
  const raw =
    customer.addedToShopAt ?? customer.linkedAt ?? customer.addedAt ?? customer.createdAt;
  if (!raw?.trim()) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw.trim();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function approvalStatusLabel(customer: MyCustomer): string {
  const status = (customer.status ?? customer.linkStatus ?? "").trim();
  if (status) return status;
  return isPendingApproval(customer) ? "Pending" : "Approved";
}

function matchesMyCustomerSearch(customer: MyCustomer, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    customer.name,
    customer.email,
    customer.phone,
    customer.city,
    customer.address,
    ...(customer.vehicles ?? []).flatMap((v) => [
      v.licensePlateNo,
      v.vehicleName,
      v.model,
      v.vinNo,
    ]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function StatusBanner({ message }: { message: string }) {
  return (
    <p className="mt-3 text-center text-sm font-semibold text-blue-700">{message}</p>
  );
}

const CUSTOMER_EMAIL_TOOLTIP_GAP_PX = 12;

function CustomerEmailClip({ email }: { email?: string | null }) {
  const label = email?.trim() || "No email on file";
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback((clientX: number, clientY: number) => {
    setCoords({
      top: clientY,
      left: clientX - CUSTOMER_EMAIL_TOOLTIP_GAP_PX,
    });
  }, []);

  const showTooltip = (event: React.MouseEvent<HTMLSpanElement>) => {
    updatePosition(event.clientX, event.clientY);
    setOpen(true);
  };

  const moveTooltip = (event: React.MouseEvent<HTMLSpanElement>) => {
    updatePosition(event.clientX, event.clientY);
  };

  const showFocusTooltip = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    updatePosition(rect.left, rect.top + rect.height / 2);
    setOpen(true);
  };

  const hideTooltip = () => setOpen(false);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseMove={moveTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showFocusTooltip}
        onBlur={hideTooltip}
        className="inline-flex h-7 w-7 cursor-default items-center justify-center rounded text-blue-600 hover:text-ad-purple"
        aria-label={`Email: ${label}`}
        tabIndex={0}
      >
        <FiPaperclip size={13} aria-hidden />
      </span>
      {open
        ? createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[10000] -translate-x-full -translate-y-1/2 whitespace-nowrap rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-800 shadow-sm"
            style={{ top: coords.top, left: coords.left }}
          >
            {label}
          </div>,
          document.body
        )
        : null}
    </>
  );
}

function VehicleInfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="mb-1 text-[11px] font-bold text-gray-700">{label}</p>
      <div className="min-h-[26px] truncate rounded border border-gray-300 bg-gray-200/90 px-2 py-0.5 text-sm font-semibold leading-[26px] text-gray-900">
        {value}
      </div>
    </div>
  );
}

function VehicleInfoInputField({
  label,
  value,
  onChange,
  maxLength,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div className="min-w-0 flex-1">
      <p className="mb-1 text-[11px] font-bold text-gray-700">{label}</p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        inputMode={inputMode}
        className="min-h-[26px] w-full rounded border border-gray-300 bg-gray-100 px-2 py-0.5 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none"
      />
    </div>
  );
}

function VehicleInfoCard({
  vehicle,
  onGoToJobCard,
  onCancel,
}: {
  vehicle: CustomerVehicle;
  onGoToJobCard: () => void;
  onCancel: () => void;
}) {
  const makeName = vehicleMakeName(vehicle);
  const makeLogo = resolveCarBrandLogo(
    makeName !== "—" ? { companyName: makeName } : null,
  );

  return (
    <article className="overflow-hidden rounded-lg border border-gray-300/80 bg-white shadow-sm">
      <div className="flex flex-col gap-4 p-3 sm:p-4 lg:flex-row lg:items-stretch">
        <div className="mx-auto w-full max-w-[108px] shrink-0 self-start lg:mx-0">
          <div className="overflow-hidden rounded-t-md border border-gray-300 bg-[#1a1a1a]">
            <div className="flex h-[52px] items-center justify-center px-2">
              <img src={makeLogo} alt="" className="max-h-9 max-w-[72px] object-contain" />
            </div>
          </div>
          <div className="rounded-b-md border border-t-0 border-gray-300 bg-white px-2 py-2 text-center">
            <p className="text-sm font-bold uppercase leading-tight tracking-wide text-gray-900">
              {vehicleModelLabel(vehicle)}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:flex-nowrap">
            <VehicleInfoField label="License Plate" value={vehicleFieldValue(vehicle.licensePlateNo)} />
            <VehicleInfoField label="VIN" value={vehicleFieldValue(vehicle.vinNo)} />
            <VehicleInfoField label="Current odo" value={vehicleFieldValue(vehicle.odometerReading)} />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={onGoToJobCard}
              className="inline-flex min-w-[9rem] items-center justify-center rounded bg-ad-form-save px-5 py-1 text-sm font-bold text-white hover:brightness-95"
            >
              Go to Job Card
            </button>
            <span className="text-xs text-gray-700">
              or{" "}
              <button
                type="button"
                onClick={onCancel}
                className="font-medium text-blue-600 underline hover:text-blue-700"
              >
                Cancel
              </button>
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function AddVehicleCard({
  customer,
  onCancel,
  onSaved,
}: {
  customer: MyCustomer;
  onCancel: () => void;
  onSaved: (vehicle: CustomerVehicle) => void;
}) {
  const { token, session } = useAuth();
  const countryCode = session?.meta?.countryCode ?? "+1";
  const [draft, setDraft] = useState<VehicleDraft>(emptyVehicleDraft);
  const [companies, setCompanies] = useState<CarCompanyCatalogItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    void getJson<{ data?: CarCompanyCatalogItem[] }>("/api/user/car-companies", token).then((res) => {
      if (res.ok && Array.isArray(res.data?.data)) setCompanies(res.data.data);
    });
  }, [token]);

  const modelOptions = useMemo(() => {
    const company = companies.find((c) => c.companyName === draft.vehicleName);
    return company?.models ?? [];
  }, [companies, draft.vehicleName]);

  const yearOptions = useMemo(() => {
    const model = modelOptions.find((m) => m.modelName === draft.model);
    return (model?.years ?? []).map(String);
  }, [modelOptions, draft.model]);

  const makeLogo = resolveCarBrandLogo(
    draft.vehicleName.trim() ? { companyName: draft.vehicleName.trim() } : null,
  );

  const patchDraft = (patch: Partial<VehicleDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setError(null);
  };

  const handleSave = async () => {
    if (!token) return;
    const id = customerId(customer);
    if (!id) {
      setError("Missing customer id.");
      return;
    }

    const validationError = validateVehicleDraft(draft);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const isOnboarded = (customer.status ?? "").toLowerCase() === "onboarded";

      if (isOnboarded) {
        const company = companies.find((c) => c.companyName === draft.vehicleName);
        const carCompanyId = company?._id ?? company?.id;
        if (!carCompanyId) {
          setError("Please select a make from the list.");
          return;
        }
        if (!draft.vinNo?.trim()) {
          setError("VIN is required.");
          return;
        }
        if (draft.vinNo.trim().length !== 17) {
          setError("VIN must be exactly 17 characters.");
          return;
        }
        if (!draft.odometerReading?.trim()) {
          setError("Current odo is required.");
          return;
        }

        const res = await addVehicleToOnboardedCustomer(token, id, {
          carCompanyId,
          make: draft.vehicleName.trim(),
          model: draft.model.trim(),
          year: Number(draft.year.trim()),
          licensePlateNo: draft.licensePlateNo.trim().slice(0, 14),
          vinNo: draft.vinNo.trim(),
          odometerReading: Number(draft.odometerReading.trim()),
        });
        logPeopleApi(
          "POST",
          `/api/autoshopowner/customer/onboarded/${encodeURIComponent(id)}/vehicles`,
          {
            carCompanyId,
            make: draft.vehicleName.trim(),
            model: draft.model.trim(),
            year: Number(draft.year.trim()),
            licensePlateNo: draft.licensePlateNo.trim().slice(0, 14),
            vinNo: draft.vinNo.trim(),
            odometerReading: Number(draft.odometerReading.trim()),
          },
          res,
        );
        if (!res.ok) {
          setError(apiMessage(res.data) || "Could not add vehicle.");
          return;
        }
        toast.success(apiMessage(res.data) || "Vehicle added.");
      } else {
        const vehicles = [...mapCustomerVehiclesForUpdate(customer), vehicleDraftToPayload(draft)];
        const res = await updateMyCustomer(token, {
          carOwnerId: id,
          name: customer.name?.trim() ?? "",
          email: customer.email?.trim() ?? "",
          countryCode,
          phone: phoneDigits(customer.phone ?? ""),
          pincode: customer.pincode?.trim() ?? "",
          address: customer.address?.trim() ?? "",
          city: customer.city?.trim() ?? "",
          vehicles,
        });
        logPeopleApi("PUT", "/api/auto-shop-owner/my-customers", { carOwnerId: id, vehicles }, res);
        if (!res.ok) {
          setError(apiMessage(res.data) || "Could not add vehicle.");
          return;
        }
        toast.success(apiMessage(res.data) || "Vehicle added.");
      }

      onSaved({
        licensePlateNo: draft.licensePlateNo.trim(),
        vinNo: draft.vinNo?.trim(),
        vehicleName: draft.vehicleName.trim(),
        model: draft.model.trim(),
        year: draft.year.trim(),
        odometerReading: draft.odometerReading?.trim(),
      });
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-lg border-2 border-dashed border-ad-green-dark/40 bg-white shadow-sm">
      <div className="border-b border-ad-green-dark/20 bg-ad-green-light/40 px-3 py-1.5 text-center text-xs font-bold uppercase tracking-wide text-ad-green-dark">
        Add vehicle
      </div>
      <div className="flex flex-col gap-4 p-3 sm:p-4 lg:flex-row lg:items-stretch">
        <div className="mx-auto w-full max-w-[108px] shrink-0 self-start lg:mx-0">
          <div className="overflow-hidden rounded-t-md border border-gray-300 bg-[#1a1a1a]">
            <div className="flex h-[52px] items-center justify-center px-2">
              <img src={makeLogo} alt="" className="max-h-9 max-w-[72px] object-contain" />
            </div>
          </div>
          <div className="space-y-1 rounded-b-md border border-t-0 border-gray-300 bg-white p-1.5">
            <select
              value={draft.vehicleName}
              onChange={(e) => patchDraft({ vehicleName: e.target.value, model: "", year: "" })}
              className={`${shopCompactInputClass} text-xs font-bold`}
            >
              <option value="">Make</option>
              {companies.map((company) => (
                <option key={company.companyName} value={company.companyName}>
                  {company.companyName}
                </option>
              ))}
            </select>
            <select
              value={draft.model}
              onChange={(e) => patchDraft({ model: e.target.value, year: "" })}
              disabled={!draft.vehicleName}
              className={`${shopCompactInputClass} text-xs font-bold disabled:opacity-60`}
            >
              <option value="">Model</option>
              {modelOptions.map((model) => (
                <option key={model.modelName} value={model.modelName}>
                  {model.modelName}
                </option>
              ))}
            </select>
            <select
              value={draft.year}
              onChange={(e) => patchDraft({ year: e.target.value })}
              disabled={!draft.model}
              className={`${shopCompactInputClass} text-xs font-bold disabled:opacity-60`}
            >
              <option value="">Year</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
          {error ? <PeopleFormError message={error} /> : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:flex-nowrap">
            <VehicleInfoInputField
              label="License Plate"
              value={draft.licensePlateNo}
              onChange={(licensePlateNo) => patchDraft({ licensePlateNo })}
              maxLength={14}
            />
            <VehicleInfoInputField
              label="VIN"
              value={draft.vinNo ?? ""}
              onChange={(vinNo) => patchDraft({ vinNo })}
              maxLength={17}
            />
            <VehicleInfoInputField
              label="Current odo"
              value={draft.odometerReading ?? ""}
              onChange={(odometerReading) => patchDraft({ odometerReading })}
              inputMode="numeric"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="inline-flex min-w-[9rem] items-center justify-center rounded bg-ad-form-save px-5 py-1 text-sm font-bold text-white hover:brightness-95 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
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
        </div>
      </div>
    </article>
  );
}

function CustomerVehicleListView({
  customer,
  onCancel,
  onGoToJobCard,
  onVehicleSaved,
}: {
  customer: MyCustomer;
  onCancel: () => void;
  onGoToJobCard: (vehicleIndex: number) => void;
  onVehicleSaved: (vehicle: CustomerVehicle) => void;
}) {
  const [showAddCard, setShowAddCard] = useState(false);
  const vehicles = customer.vehicles ?? [];

  const handleVehicleSaved = (vehicle: CustomerVehicle) => {
    setShowAddCard(false);
    onVehicleSaved(vehicle);
  };

  return (
    <ContentPanel title="Vehicle info" className="!mb-0 shadow-none">
      {vehicles.length === 0 && !showAddCard ? (
        <p className="text-center text-sm text-gray-600">No vehicles on file for this customer.</p>
      ) : (
        <div className="space-y-3">
          {vehicles.map((vehicle, index) => (
            <VehicleInfoCard
              key={vehicleRowKey(vehicle, index)}
              vehicle={vehicle}
              onGoToJobCard={() => onGoToJobCard(index)}
              onCancel={onCancel}
            />
          ))}
        </div>
      )}

      {showAddCard ? (
        <div className={vehicles.length > 0 ? "mt-3" : ""}>
          <AddVehicleCard
            customer={customer}
            onCancel={() => setShowAddCard(false)}
            onSaved={handleVehicleSaved}
          />
        </div>
      ) : null}

      {!showAddCard ? (
        <div className="mt-5 flex justify-center">
          <button type="button" onClick={() => setShowAddCard(true)} className={shopAddNewButtonClass}>
            + Add New
          </button>
        </div>
      ) : null}
    </ContentPanel>
  );
}

function CustomerListTable({
  customers,
  onEdit,
  onAddToList,
  canAddToList,
  onShowVehicles,
  showCity = false,
  selectedIds,
  onToggleRow,
  onTogglePage,
}: {
  customers: MyCustomer[];
  onEdit: (customer: MyCustomer) => void;
  onAddToList: (customer: MyCustomer) => void;
  canAddToList: (customer: MyCustomer) => boolean;
  onShowVehicles: (customer: MyCustomer) => void;
  showCity?: boolean;
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onTogglePage: (ids: string[], checked: boolean) => void;
}) {
  const selectAllRef = useRef<HTMLInputElement>(null);
  const actionHeadClass = `${SHOP_TABLE_HEAD_TH_CLASS} text-center`;
  const pageRowKeys = customers.map((customer, index) => customerTableRowKey(customer, index));
  const allPageSelected =
    customers.length > 0 && pageRowKeys.every((id) => selectedIds.has(id));
  const somePageSelected = pageRowKeys.some((id) => selectedIds.has(id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = somePageSelected && !allPageSelected;
    }
  }, [somePageSelected, allPageSelected]);

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
      className="shop-hero-surface overflow-hidden rounded border border-gray-300 bg-white shadow-sm"
    >
      <div className="overflow-x-auto">
        <table className={SHOP_TABLE.table}>
          <thead>
            <tr className={ADMIN_PANEL_THEAD_ROW_CLASS}>
              <th className={SHOP_TABLE_HEAD_TH_CHECKBOX_CLASS}>
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={(e) => onTogglePage(pageRowKeys, e.target.checked)}
                  aria-label="Select all customers on this page"
                  className={SHOP_TABLE_CHECKBOX_CLASS}
                />
              </th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Name</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Phone</th>
              {showCity ? <th className={SHOP_TABLE_HEAD_TH_CLASS}>City</th> : null}
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Vehicles</th>
              <th className={actionHeadClass}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer, index) => {
              const name = customer.name ?? "—";
              const rowKey = pageRowKeys[index];
              return (
                <tr key={rowKey} className={adminPanelRowClass(index)}>
                  <td className={SHOP_TABLE_BODY_TD_CHECKBOX_CLASS}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(rowKey)}
                      onChange={() => onToggleRow(rowKey)}
                      aria-label={`Select ${name}`}
                      className={SHOP_TABLE_CHECKBOX_CLASS}
                    />
                  </td>
                  <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-blue-700`}>{name}</td>
                  <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-gray-800`}>
                    {customer.phone ? formatPhoneLabel(customer.phone) : "—"}
                  </td>
                  {showCity ? (
                    <td className={SHOP_TABLE_BODY_TD_CLASS}>{customer.city?.trim() || "—"}</td>
                  ) : null}
                  <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-gray-800`}>
                    {(() => {
                      const count = vehicleCount(customer);
                      return (
                        <button
                          type="button"
                          onClick={() => onShowVehicles(customer)}
                          className="font-semibold text-blue-600 underline hover:text-blue-700"
                          aria-label={`View ${count} vehicle${count === 1 ? "" : "s"} for ${name}`}
                        >
                          {count}
                        </button>
                      );
                    })()}
                  </td>
                  <td className={`${SHOP_TABLE_BODY_TD_CLASS} text-center`}>
                    <div className="inline-flex h-7 items-center justify-center gap-0.5">
                      <CustomerEmailClip email={customer.email} />
                      {canAddToList(customer) ? (
                        <button
                          type="button"
                          title={`Add ${name} to my list`}
                          aria-label={`Add ${name} to my list`}
                          onClick={() => onAddToList(customer)}
                          className="inline-flex h-7 items-center justify-center rounded px-2 text-xs font-bold text-ad-purple hover:bg-[#f5cce8]"
                        >
                          + Add
                        </button>
                      ) : null}
                      <button
                        type="button"
                        title={`Edit ${name}`}
                        aria-label={`Edit ${name}`}
                        onClick={() => onEdit(customer)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded text-blue-600 hover:text-ad-purple"
                      >
                        <FiEdit2 size={13} aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function ApprovalCustomerListTable({
  customers,
  onEdit,
  selectedIds,
  onToggleRow,
  onTogglePage,
}: {
  customers: MyCustomer[];
  onEdit: (customer: MyCustomer) => void;
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onTogglePage: (ids: string[], checked: boolean) => void;
}) {
  const selectAllRef = useRef<HTMLInputElement>(null);
  const pageRowKeys = customers.map((customer, index) => customerTableRowKey(customer, index));
  const allPageSelected =
    customers.length > 0 && pageRowKeys.every((id) => selectedIds.has(id));
  const somePageSelected = pageRowKeys.some((id) => selectedIds.has(id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = somePageSelected && !allPageSelected;
    }
  }, [somePageSelected, allPageSelected]);

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
      className="shop-hero-surface overflow-hidden rounded border border-gray-300 bg-white shadow-sm"
    >
      <div className="overflow-x-auto">
        <table className={SHOP_TABLE.table}>
          <thead>
            <tr className={ADMIN_PANEL_THEAD_ROW_CLASS}>
              <th className={SHOP_TABLE_HEAD_TH_CHECKBOX_CLASS}>
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={(e) => onTogglePage(pageRowKeys, e.target.checked)}
                  aria-label="Select all customers on this page"
                  className={SHOP_TABLE_CHECKBOX_CLASS}
                />
              </th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Phone</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Name Customer</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>City</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Date</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Approval</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer, index) => {
              const name = customer.name ?? "—";
              const rowKey = pageRowKeys[index];
              const phoneLabel = customer.phone ? formatPhoneLabel(customer.phone) : "—";
              return (
                <tr key={rowKey} className={adminPanelRowClass(index)}>
                  <td className={SHOP_TABLE_BODY_TD_CHECKBOX_CLASS}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(rowKey)}
                      onChange={() => onToggleRow(rowKey)}
                      aria-label={`Select ${name}`}
                      className={SHOP_TABLE_CHECKBOX_CLASS}
                    />
                  </td>
                  <td className={SHOP_TABLE_BODY_TD_CLASS}>
                    {customer.phone ? (
                      <button
                        type="button"
                        onClick={() => onEdit(customer)}
                        className="font-semibold text-blue-700 underline hover:text-blue-800"
                      >
                        {phoneLabel}
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-gray-800`}>{name}</td>
                  <td className={SHOP_TABLE_BODY_TD_CLASS}>{customer.city?.trim() || "—"}</td>
                  <td className={SHOP_TABLE_BODY_TD_CLASS}>{customerListDate(customer)}</td>
                  <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-blue-700`}>
                    {approvalStatusLabel(customer)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function AddNewCustomerForm({
  defaultCity,
  onCancel,
  onSaved,
}: {
  defaultCity: string;
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const { token, session } = useAuth();
  const countryCode = session?.meta?.countryCode ?? "+1";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState(defaultCity);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultCity) setCity((prev) => prev || defaultCity);
  }, [defaultCity]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void getJson<unknown>("/api/user/cities?page=1", token).then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setCityOptions(parseCitiesApiResponse(res.data).map((c) => c.name));
      } else {
        setCityOptions([]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const citySelectOptions = useMemo(() => {
    const names = new Set(cityOptions);
    if (defaultCity.trim()) names.add(defaultCity.trim());
    if (city.trim()) names.add(city.trim());
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [cityOptions, city, defaultCity]);

  const handleSave = async () => {
    if (!token) return;
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (phoneDigits(phone).length !== 10) {
      setError("Phone must be 10 digits.");
      return;
    }
    if (!city.trim()) {
      setError("City is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await onboardCarOwner(token, {
        name: name.trim(),
        email: email.trim(),
        countryCode,
        phone: phoneDigits(phone),
        pincode: "",
        address: "",
        city: city.trim(),
        role: "carowner",
        vehicles: [],
      });
      logPeopleApi("POST", "/api/autoshopowner/customer/onboard", { name, email, phone, city }, res);
      if (!res.ok) {
        setError(apiMessage(res.data) || "Could not add customer.");
        return;
      }
      const msg =
        apiMessage(res.data) ||
        "Notification sent for Verification. Pl. wait or contact with Customer.";
      onSaved(msg);
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CompactFormPanel
      className={shopProfileFormPanelClass}
      showBottomBorder={false}
      footer={
        <PeopleFormFooter
          message="You are adding a new customer"
          saving={submitting}
          saveLabel="Save"
          onSave={() => void handleSave()}
          onCancel={onCancel}
        />
      }
    >
      {error ? <PeopleFormError message={error} /> : null}
      <CompactFormRow className="items-end">
        <CompactField label="Name" required className={compactFixedFieldWidth}>
          <input
            className={shopCompactInputClass}
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
          />
        </CompactField>
        <CompactField label="Phone" required className={compactFixedFieldWidth}>
          <input
            className={shopCompactInputClass}
            value={formatPhoneDisplay(phone)}
            onChange={(e) => setPhone(phoneDigits(e.target.value))}
          />
        </CompactField>
        <CompactField label="City" required className={compactFixedFieldWidth}>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={shopCompactInputClass}
          >
            <option value="">Select city</option>
            {citySelectOptions.map((cityName) => (
              <option key={cityName} value={cityName}>
                {cityName}
              </option>
            ))}
          </select>
        </CompactField>
        <CompactField label="Email" className={compactFixedFieldWidth}>
          <input
            className={shopCompactInputClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </CompactField>
      </CompactFormRow>
    </CompactFormPanel>
  );
}

function EditCustomerForm({
  customer,
  defaultCity,
  addToListAfterSave = false,
  onCancel,
  onSaved,
}: {
  customer: MyCustomer;
  defaultCity: string;
  addToListAfterSave?: boolean;
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const { token, session } = useAuth();
  const countryCode = session?.meta?.countryCode ?? "+1";
  const id = customerId(customer);
  const [name, setName] = useState(customer.name ?? "");
  const [phone, setPhone] = useState(phoneDigits(customer.phone ?? ""));
  const [email, setEmail] = useState(customer.email ?? "");
  const [city, setCity] = useState(customer.city?.trim() || defaultCity);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(customer.name ?? "");
    setPhone(phoneDigits(customer.phone ?? ""));
    setEmail(customer.email ?? "");
    setCity(customer.city?.trim() || defaultCity);
  }, [customer, defaultCity]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void getJson<unknown>("/api/user/cities?page=1", token).then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setCityOptions(parseCitiesApiResponse(res.data).map((c) => c.name));
      } else {
        setCityOptions([]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const citySelectOptions = useMemo(() => {
    const names = new Set(cityOptions);
    if (defaultCity.trim()) names.add(defaultCity.trim());
    if (city.trim()) names.add(city.trim());
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [cityOptions, city, defaultCity]);

  const handleSave = async () => {
    if (!token || !id) {
      setError("Missing customer id.");
      return;
    }
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (phoneDigits(phone).length !== 10) {
      setError("Phone must be 10 digits.");
      return;
    }
    if (!city.trim()) {
      setError("City is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const isOnboarded = (customer.status ?? "").toLowerCase() === "onboarded";

      if (addToListAfterSave) {
        const addRes = await addCarOwnerToMyCustomers(token, id, {
          name: name.trim(),
          email: email.trim(),
          city: city.trim(),
        });
        logPeopleApi("POST", "/api/autoshopowner/customer/add", { customerId: id, edits: { name, email, city } }, addRes);
        if (!addRes.ok) {
          setError(apiMessage(addRes.data) || "Could not add customer to your list.");
          return;
        }
        onSaved(
          apiMessage(addRes.data) ||
          "Notification sent for approval. Pl. wait or contact with Customer",
        );
        return;
      }

      if (isOnboarded) {
        const res = await editOnboardedCustomer(token, id, {
          name: name.trim(),
          phone: phoneDigits(phone),
          email: email.trim(),
          city: city.trim(),
        });
        logPeopleApi(
          "PUT",
          `/api/autoshopowner/customer/onboarded/${encodeURIComponent(id)}`,
          { name, phone, email, city },
          res,
        );
        if (!res.ok) {
          setError(apiMessage(res.data) || "Could not update customer.");
          return;
        }
        onSaved(apiMessage(res.data) || "Customer updated.");
        return;
      }

      const res = await updateMyCustomer(token, {
        carOwnerId: id,
        name: name.trim(),
        email: email.trim(),
        countryCode,
        phone: phoneDigits(phone),
        pincode: customer.pincode?.trim() ?? "",
        address: customer.address?.trim() ?? "",
        city: city.trim(),
        vehicles: mapCustomerVehiclesForUpdate(customer),
      });
      logPeopleApi("PUT", "/api/auto-shop-owner/my-customers", { carOwnerId: id }, res);
      if (!res.ok) {
        setError(apiMessage(res.data) || "Could not update customer.");
        return;
      }

      onSaved(apiMessage(res.data) || "Customer updated.");
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CompactFormPanel
      className={shopProfileFormPanelClass}
      showBottomBorder={false}
      footer={
        <PeopleFormFooter
          message={
            addToListAfterSave
              ? "You are editing a customer before adding to your list"
              : "You are editing a customer"
          }
          saving={submitting}
          saveLabel={addToListAfterSave ? "+ Add" : "Save"}
          savingLabel={addToListAfterSave ? "Adding…" : "Saving…"}
          onSave={() => void handleSave()}
          onCancel={onCancel}
        />
      }
    >
      {error ? <PeopleFormError message={error} /> : null}
      <CompactFormRow className="items-end">
        <CompactField label="Name" required className={compactFixedFieldWidth}>
          <input
            className={shopCompactInputClass}
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
          />
        </CompactField>
        <CompactField label="Phone" required className={compactFixedFieldWidth}>
          <input
            className={shopCompactInputClass}
            value={formatPhoneDisplay(phone)}
            onChange={(e) => setPhone(phoneDigits(e.target.value))}
          />
        </CompactField>
        <CompactField label="City" required className={compactFixedFieldWidth}>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={shopCompactInputClass}
          >
            <option value="">Select city</option>
            {citySelectOptions.map((cityName) => (
              <option key={cityName} value={cityName}>
                {cityName}
              </option>
            ))}
          </select>
        </CompactField>
        <CompactField label="Email" className={compactFixedFieldWidth}>
          <input
            className={shopCompactInputClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </CompactField>
      </CompactFormRow>
    </CompactFormPanel>
  );
}

function AddToListForm({
  customer,
  onCancel,
  onSaved,
}: {
  customer: MyCustomer;
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const { token, session } = useAuth();
  void session;
  const name = customer.name ?? "";
  const phone = customer.phone ?? "";
  const city = customer.city ?? "";
  const [email, setEmail] = useState(customer.email ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = customerId(customer);

  const handleAdd = async () => {
    if (!token || !id) {
      setError("Missing customer id.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const addRes = await addCarOwnerToMyCustomers(token, id, {
        name: name.trim(),
        email: email.trim(),
        city: city.trim(),
      });
      logPeopleApi("POST", "/api/autoshopowner/customer/add", { customerId: id, edits: { name, email, city } }, addRes);
      if (!addRes.ok) {
        setError(apiMessage(addRes.data) || "Could not add customer to your list.");
        return;
      }

      onSaved(
        apiMessage(addRes.data) ||
        "Notification sent for approval. Pl. wait or contact with Customer",
      );
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CompactFormPanel
      className={shopProfileFormPanelClass}
      showBottomBorder={false}
      footer={
        <PeopleFormFooter
          message="You are adding a customer to your list"
          saving={submitting}
          saveLabel="+ Add"
          savingLabel="Adding…"
          onSave={() => void handleAdd()}
          onCancel={onCancel}
        />
      }
    >
      {error ? <PeopleFormError message={error} /> : null}
      <CompactFormRow className="items-end">
        <CompactField label="Name" className={compactFixedFieldWidth}>
          <input className={`${shopCompactInputClass} bg-gray-100`} value={name} readOnly />
        </CompactField>
        <CompactField label="Phone" className={compactFixedFieldWidth}>
          <input
            className={`${shopCompactInputClass} bg-gray-100`}
            value={formatPhoneLabel(phone)}
            readOnly
          />
        </CompactField>
        <CompactField label="City" className={compactFixedFieldWidth}>
          <input className={`${shopCompactInputClass} bg-gray-100`} value={city} readOnly />
        </CompactField>
        <CompactField label="Email" className={compactFixedFieldWidth}>
          <input
            className={shopCompactInputClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </CompactField>
      </CompactFormRow>
    </CompactFormPanel>
  );
}

function CustomerInfoView({
  customer,
  vehicleIndex,
  onCancel,
  onGoToJobCard,
}: {
  customer: MyCustomer;
  vehicleIndex: number;
  onCancel: () => void;
  onGoToJobCard: () => void;
}) {
  const vehicle = customer.vehicles?.[vehicleIndex];

  return (
    <CompactFormPanel
      className={shopProfileFormPanelClass}
      showBottomBorder={false}
      footer={
        <PeopleFormFooter
          message="Customer and vehicle details"
          saveLabel="Go to Job Card"
          onSave={onGoToJobCard}
          onCancel={onCancel}
        />
      }
    >
      <CompactFormRow className="items-end">
        <CompactField label="Name" className={compactFixedFieldWidth}>
          <input className={`${shopCompactInputClass} bg-gray-100`} value={customer.name ?? "—"} readOnly />
        </CompactField>
        <CompactField label="Phone" className={compactFixedFieldWidth}>
          <input
            className={`${shopCompactInputClass} bg-gray-100`}
            value={formatPhoneLabel(customer.phone)}
            readOnly
          />
        </CompactField>
        <CompactField label="City" className={compactFixedFieldWidth}>
          <input
            className={`${shopCompactInputClass} bg-gray-100`}
            value={customer.city?.trim() || "—"}
            readOnly
          />
        </CompactField>
        <CompactField label="Email" className={compactFixedFieldWidth}>
          <input
            className={`${shopCompactInputClass} bg-gray-100`}
            value={customer.email?.trim() || "—"}
            readOnly
          />
        </CompactField>
      </CompactFormRow>

      {vehicle ? (
        <CompactFormRow className="mt-4 items-end">
          <CompactField label="Car Model" className={compactFixedFieldWidth}>
            <input
              className={`${shopCompactInputClass} bg-gray-100`}
              value={[vehicle.model, vehicle.year].filter(Boolean).join(" - ") || "—"}
              readOnly
            />
          </CompactField>
          <CompactField label="License Plate" className={compactFixedFieldWidth}>
            <input
              className={`${shopCompactInputClass} bg-gray-100`}
              value={vehicle.licensePlateNo?.trim() || "—"}
              readOnly
            />
          </CompactField>
          <CompactField label="VIN" className={compactFixedFieldWidth}>
            <input
              className={`${shopCompactInputClass} bg-gray-100`}
              value={vehicle.vinNo?.trim() || "—"}
              readOnly
            />
          </CompactField>
          <CompactField label="Current odo" className={compactFixedFieldWidth}>
            <input
              className={`${shopCompactInputClass} bg-gray-100`}
              value={vehicle.odometerReading?.trim() || "—"}
              readOnly
            />
          </CompactField>
        </CompactFormRow>
      ) : null}
    </CompactFormPanel>
  );
}

function customersMatchingSelection(
  selectedIds: Set<string>,
  listCustomers: MyCustomer[],
  paginatedCustomers: MyCustomer[],
): MyCustomer[] {
  const found = new Map<string, MyCustomer>();
  for (const customer of listCustomers) {
    const id = customerId(customer);
    if (id && selectedIds.has(id)) {
      found.set(id, customer);
    }
  }
  for (let index = 0; index < paginatedCustomers.length; index++) {
    const customer = paginatedCustomers[index];
    const key = customerTableRowKey(customer, index);
    if (selectedIds.has(key)) {
      found.set(key, customer);
    }
  }
  return [...found.values()];
}

export default function ShopPeoplePage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { faqsHeading, faqsDescription, city: shopCity } = useShopOwnerPortal();
  const [section, setSection] = useState<PeopleSection>("customers");
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState("");
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [editingCustomer, setEditingCustomer] = useState<MyCustomer | null>(null);
  const [detailView, setDetailView] = useState<DetailView | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(() => new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [directoryCustomers, setDirectoryCustomers] = useState<MyCustomer[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [directoryError, setDirectoryError] = useState<string | null>(null);
  const [onboardedCustomers, setOnboardedCustomers] = useState<MyCustomer[]>([]);
  const [onboardedLoading, setOnboardedLoading] = useState(false);
  const [onboardedError, setOnboardedError] = useState<string | null>(null);

  const {
    customers: myCustomers,
    loading: listLoading,
    error: listError,
    refresh,
  } = useShopCustomers();

  const myIdSet = useMemo(() => {
    const ids = new Set<string>();
    for (const customer of myCustomers) {
      const id = customerId(customer);
      if (id) ids.add(id);
    }
    return ids;
  }, [myCustomers]);

  useEffect(() => {
    if (!token) {
      setDirectoryCustomers([]);
      setDirectoryError(null);
      setDirectoryLoading(false);
      return;
    }
    if (section !== "customers") return;

    setDirectoryLoading(true);
    setDirectoryError(null);
    const handle = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await searchCarOwners(token, search.trim());
          logPeopleApi("GET", `/api/autoshopowner/customer/search?search=${encodeURIComponent(search.trim())}`, null, res);
          if (!res.ok) {
            setDirectoryCustomers([]);
            setDirectoryError("Could not load customers.");
            return;
          }
          setDirectoryCustomers(parseMyCustomers(res.data));
        } catch {
          setDirectoryCustomers([]);
          setDirectoryError("Network error.");
        } finally {
          setDirectoryLoading(false);
        }
      })();
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [token, section, search]);

  useEffect(() => {
    if (!token) {
      setOnboardedCustomers([]);
      setOnboardedLoading(false);
      setOnboardedError(null);
      return;
    }
    // Onboarded customers are only shown under "My Customer List".
    if (section !== "my-list") return;

    setOnboardedLoading(true);
    setOnboardedError(null);
    void (async () => {
      try {
        const res = await fetchOnboardedCustomers(token);
        logPeopleApi("GET", "/api/autoshopowner/customer/onboarded", null, res);
        if (!res.ok) {
          setOnboardedCustomers([]);
          setOnboardedError("Could not load onboarded customers.");
          return;
        }
        setOnboardedCustomers(parseMyCustomers(res.data).map((c) => ({ ...c, status: "onboarded" })));
      } catch {
        setOnboardedCustomers([]);
        setOnboardedError("Network error.");
      } finally {
        setOnboardedLoading(false);
      }
    })();
  }, [token, section]);

  const listCustomers = useMemo(() => {
    const q = search.trim();
    const filterSearch = (customers: MyCustomer[]) =>
      q ? customers.filter((customer) => matchesMyCustomerSearch(customer, q)) : customers;

    if (section === "customers") {
      return filterSearch(directoryCustomers);
    }
    if (section === "my-list") {
      return filterSearch([
        ...myCustomers.filter((customer) => !isPendingApproval(customer)),
        ...onboardedCustomers,
      ]);
    }
    if (section === "approval") {
      return filterSearch(myCustomers.filter(isPendingApproval));
    }
    return [];
  }, [section, directoryCustomers, myCustomers, onboardedCustomers, search]);

  const showListLoading =
    section === "customers"
      ? directoryLoading
      : section === "my-list"
        ? listLoading || onboardedLoading
        : listLoading;
  const showListError =
    section === "customers"
      ? directoryError
      : section === "my-list"
        ? onboardedError || listError
        : listError;

  const totalPages = Math.max(1, Math.ceil(listCustomers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedCustomers = useMemo(
    () => listCustomers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [listCustomers, safePage],
  );

  useEffect(() => {
    setPage(1);
  }, [search, section, detailView, editingCustomer]);

  useEffect(() => {
    setSelectedCustomerIds(new Set());
  }, [search, section]);

  useEffect(() => {
    setEditingCustomer(null);
  }, [search, section, page]);

  useEffect(() => {
    const q = search.trim();
    if (!q) return;

    const digits = phoneDigits(q);
    if (digits.length === 10) {
      const match = listCustomers.find((c) => phoneDigits(c.phone) === digits);
      if (match) {
        setEditingCustomer(match);
      }
      return;
    }
    if (listCustomers.length === 1) {
      setEditingCustomer(listCustomers[0]);
    }
  }, [search, listCustomers]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const resetDetail = () => {
    setDetailView(null);
  };

  const selectSection = (id: string) => {
    const next = id as PeopleSection;
    setSection(next);
    setShowAddForm(false);
    setSearch("");
    setStatusMessage(null);
    setEditingCustomer(null);
    resetDetail();
  };

  const isInMyList = useCallback(
    (customer: MyCustomer) => {
      const id = customerId(customer);
      if (id && myIdSet.has(id)) return true;
      const digits = phoneDigits(customer.phone);
      if (digits.length === 10) {
        return myCustomers.some((c) => phoneDigits(c.phone) === digits);
      }
      return false;
    },
    [myCustomers, myIdSet],
  );

  const handleAddToListSaved = async (message: string) => {
    setStatusMessage(message);
    setDetailView(null);
    toast.success("Customer added to your list.");
    await refresh();
    setSection("approval");
  };

  const handleAddNewSaved = async (message: string) => {
    setStatusMessage(message);
    setShowAddForm(false);
    toast.success("Customer saved.");
    await refresh();
  };

  const handleEditSaved = async (message: string) => {
    const addingFromDirectory =
      section === "customers" &&
      editingCustomer != null &&
      !isInMyList(editingCustomer);
    setStatusMessage(message);
    setEditingCustomer(null);
    if (addingFromDirectory) {
      toast.success("Customer added to your list.");
      await refresh();
      setSection("approval");
      return;
    }
    toast.success("Customer updated.");
    await refresh();
  };

  const emptyMessage =
    section === "customers"
      ? "No customers yet."
      : section === "approval"
        ? "No customers awaiting approval."
        : myCustomers.some(isPendingApproval)
          ? "No approved customers in your list yet. Check the Approval tab for pending requests."
          : "No customers in your list yet.";

  const showList = !detailView;
  const showAddNewAction =
    section === "customers" &&
    !detailView &&
    !showAddForm &&
    !editingCustomer;

  const handleEditCustomer = (customer: MyCustomer) => {
    setShowAddForm(false);
    setDetailView(null);
    setStatusMessage(null);
    setEditingCustomer(customer);
  };

  const handleAddToList = (customer: MyCustomer) => {
    setShowAddForm(false);
    setEditingCustomer(null);
    setStatusMessage(null);
    setDetailView({ kind: "add-to-list", customer });
  };

  const handleShowVehicles = (customer: MyCustomer) => {
    setShowAddForm(false);
    setEditingCustomer(null);
    setStatusMessage(null);
    setDetailView({ kind: "vehicle-list", customer });
  };

  const handleVehicleSaved = useCallback(
    async (addedVehicle: CustomerVehicle) => {
      setDetailView((current) => {
        if (current?.kind !== "vehicle-list") return current;
        return {
          kind: "vehicle-list",
          customer: {
            ...current.customer,
            vehicles: [...(current.customer.vehicles ?? []), addedVehicle],
          },
        };
      });
      await refresh();
    },
    [refresh],
  );

  const toggleCustomerSelection = (id: string) => {
    setSelectedCustomerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCustomerPageSelection = (ids: string[], checked: boolean) => {
    setSelectedCustomerIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  const hasBulkSelection = selectedCustomerIds.size > 0;

  const handleBulkDelete = async () => {
    if (!hasBulkSelection || bulkDeleting) return;
    if (section === "customers") return;

    const selectedCustomers = customersMatchingSelection(
      selectedCustomerIds,
      listCustomers,
      paginatedCustomers,
    );
    if (selectedCustomers.length === 0) return;

    const count = selectedCustomers.length;
    if (!window.confirm(`Delete ${count} selected customer${count === 1 ? "" : "s"}?`)) return;

    setBulkDeleting(true);
    try {
      if (!token) return;

      let failed = 0;
      for (const customer of selectedCustomers) {
        const id = customerId(customer);
        if (!id) {
          failed += 1;
          continue;
        }
        const res = await removeCarOwnerFromMyCustomers(token, id);
        logPeopleApi("DELETE", `/api/autoshopowner/customer/added/${encodeURIComponent(id)}`, null, res);
        if (!res.ok) failed += 1;
      }

      await refresh();
      setSelectedCustomerIds(new Set());
      const removedIds = new Set(
        selectedCustomers.map((customer) => customerId(customer)).filter(Boolean),
      );
      if (editingCustomer && removedIds.has(customerId(editingCustomer))) {
        setEditingCustomer(null);
      }

      if (failed > 0) {
        toast.error(`Could not delete ${failed} customer${failed === 1 ? "" : "s"}.`);
      } else {
        toast.success(`Deleted ${count} customer${count === 1 ? "" : "s"}.`);
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <ShopPageShell
      title="Customers"
      pageHeading={SECTION_HEADINGS[section]}
      metaTitle="Customers | AutoDaddy"
      metaDescription="Auto shop customers"
      sidebarVariant="nav"
      sidebarItems={PEOPLE_SECTIONS}
      activeSidebarId={detailView ? null : section}
      onSidebarSelect={selectSection}
      heroBackgroundImage={false}
      contentTopOffset
      heroCardFlush
      onFaqsOpen={() => setFaqsOpen(true)}
      onFaqsClose={() => setFaqsOpen(false)}
      faqsOpen={faqsOpen}
      faqsHeading={faqsHeading}
      faqsDescription={faqsDescription}
    >
      <div className="space-y-1">
        {detailView?.kind === "add-to-list" ? (
          <>
            <AddToListForm
              customer={detailView.customer}
              onCancel={resetDetail}
              onSaved={(message) => void handleAddToListSaved(message)}
            />
            {statusMessage ? <StatusBanner message={statusMessage} /> : null}
          </>
        ) : detailView?.kind === "customer-info" ? (
          <CustomerInfoView
            customer={detailView.customer}
            vehicleIndex={detailView.vehicleIndex}
            onCancel={resetDetail}
            onGoToJobCard={() => navigate("/shop/job-cards")}
          />
        ) : detailView?.kind === "vehicle-list" ? (
          <CustomerVehicleListView
            customer={detailView.customer}
            onCancel={resetDetail}
            onGoToJobCard={() => navigate("/shop/job-cards")}
            onVehicleSaved={(vehicle) => void handleVehicleSaved(vehicle)}
          />
        ) : showList ? (
          <>
            <PeopleSearchBar
              value={search}
              onChange={setSearch}
              inputId={PEOPLE_SEARCH_INPUT_ID}
              leading={
                section === "customers" ? null : (
                  <button
                    type="button"
                    onClick={() => void handleBulkDelete()}
                    disabled={!hasBulkSelection || bulkDeleting}
                    className={SHOP_PEOPLE_BULK_DELETE_BUTTON_CLASS}
                  >
                    {bulkDeleting ? "Deleting…" : "Delete"}
                  </button>
                )
              }
              trailing={
                showAddNewAction ? (
                  <AddNewButton onClick={() => setShowAddForm(true)} />
                ) : null
              }
            />

            <ShopReveal show={showAddForm}>
              <AddNewCustomerForm
                defaultCity={shopCity}
                onCancel={() => {
                  setShowAddForm(false);
                  setStatusMessage(null);
                }}
                onSaved={(message) => void handleAddNewSaved(message)}
              />
              {statusMessage && showAddForm ? <StatusBanner message={statusMessage} /> : null}
            </ShopReveal>

            <ShopReveal show={editingCustomer != null}>
              {editingCustomer ? (
                <EditCustomerForm
                  key={customerId(editingCustomer) || editingCustomer.phone}
                  customer={editingCustomer}
                  defaultCity={shopCity}
                  addToListAfterSave={section === "customers" && !isInMyList(editingCustomer)}
                  onCancel={() => {
                    setEditingCustomer(null);
                    setStatusMessage(null);
                  }}
                  onSaved={(message) => void handleEditSaved(message)}
                />
              ) : null}
              {statusMessage && editingCustomer ? <StatusBanner message={statusMessage} /> : null}
            </ShopReveal>

            {showListLoading ? (
              <ShopListSkeleton variant="profile-table" className="w-full" />
            ) : showListError ? (
              <ShopErrorPanel
                message={showListError}
                onRetry={() => {
                  if (section === "customers") {
                    // re-trigger directory fetch by forcing a state update
                    setDirectoryCustomers((prev) => [...prev]);
                    return;
                  }
                  void refresh();
                }}
              />
            ) : listCustomers.length === 0 && !showAddForm ? (
              <p className="text-center text-sm text-gray-600">{emptyMessage}</p>
            ) : listCustomers.length > 0 ? (
              <>
                {section === "approval" ? (
                  <ApprovalCustomerListTable
                    customers={paginatedCustomers}
                    onEdit={handleEditCustomer}
                    selectedIds={selectedCustomerIds}
                    onToggleRow={toggleCustomerSelection}
                    onTogglePage={toggleCustomerPageSelection}
                  />
                ) : (
                  <CustomerListTable
                    customers={paginatedCustomers}
                    onEdit={handleEditCustomer}
                    onAddToList={handleAddToList}
                    canAddToList={(customer) => section === "customers" && !isInMyList(customer)}
                    onShowVehicles={handleShowVehicles}
                    showCity
                    selectedIds={selectedCustomerIds}
                    onToggleRow={toggleCustomerSelection}
                    onTogglePage={toggleCustomerPageSelection}
                  />
                )}

                <ShopListFooter className="text-sm font-semibold text-gray-600">
                  <p>{listCustomers.length} Entries</p>
                  {totalPages > 1 ? (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => {
                        const isActive = pageNumber === safePage;
                        return (
                          <button
                            key={pageNumber}
                            type="button"
                            onClick={() => setPage(pageNumber)}
                            className={`flex h-8 min-w-8 items-center justify-center rounded-sm px-2 text-sm font-bold ${
                              isActive
                                ? "bg-gray-500 text-white"
                                : "border border-gray-400 bg-white text-gray-700 hover:bg-gray-100"
                            }`}
                            aria-current={isActive ? "page" : undefined}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </ShopListFooter>
              </>
            ) : null}
          </>
        ) : null}
      </div>
    </ShopPageShell>
  );
}
