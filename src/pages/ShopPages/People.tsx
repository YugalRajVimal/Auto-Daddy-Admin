import { useCallback, useEffect, useMemo, useState, type HTMLAttributes } from "react";
import { useNavigate } from "react-router";
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
  shopTableToolbarClass,
} from "../../components/shop/shopLayoutStyles";
import { ShopListSkeleton } from "../../components/shop/ShopListSkeletons";
import {
  ShopErrorPanel,
  ShopListFooter,
} from "../../components/shop/ShopPanels";
import { useAuth } from "../../auth";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import {
  addCarOwnerToMyCustomers,
  apiMessage,
  onboardCarOwner,
  updateMyCustomer,
  type CustomerVehiclePayload,
} from "../../lib/shopOwnerMutations";
import { searchCarOwners } from "../../lib/shopOwnerApi";
import { parseMyCustomers } from "../../lib/shopOwnerParsers";
import {
  addVehicleToOnboardedCustomer,
  fetchAddedCustomers,
  editOnboardedCustomer,
} from "../../lib/autoshopownerApi";
import { parseCitiesApiResponse } from "../../lib/carOwnerCities";
import { formatPhoneDisplay, formatPhoneLabel, phoneDigits } from "../../lib/phoneFormat";
import { resolveCarBrandLogo } from "../../lib/dummyCarBrands";
import { formatDisplayDate } from "../AdminPages/Accounts/accountData";
import type { CustomerVehicle, MyCustomer } from "../../types/shopOwner";

type PeopleSection = "my-list" | "approval";

function shouldDebugPeopleApi(): boolean {
  if (!import.meta.env.DEV) return false;
  try {
    // On by default in DEV. Off only when explicitly disabled:
    // localStorage.setItem("debug:people-api", "0") or localStorage.setItem("debug:api", "0")
    const people = window.localStorage.getItem("debug:people-api");
    if (people === "0") return false;
    if (people === "1") return true;
    return window.localStorage.getItem("debug:api") !== "0";
  } catch {
    return true;
  }
}

function logPeopleApi(method: string, path: string, request: unknown, response: unknown) {
  if (!shouldDebugPeopleApi()) return;
  // eslint-disable-next-line no-console
  console.log(`[People API] ${method} ${path}`, { request: request ?? null, response: response ?? null });
}

type DetailView =
  | { kind: "customer-info"; customer: MyCustomer; vehicleIndex: number }
  | { kind: "vehicle-list"; customer: MyCustomer };

const PEOPLE_SECTIONS = [
  { id: "my-list", label: "My Customer List", variant: "primary" as const },
  { id: "approval", label: "Approval", variant: "primary" as const },
];

/** Maps People tabs to GET /api/autoshopowner/customer/added?status=… */
function addedCustomersStatusForSection(section: PeopleSection): string {
  return section === "approval" ? "pending" : "approved";
}

const SECTION_HEADINGS: Record<PeopleSection, string> = {
  "my-list": "My Customer List",
  approval: "Approval",
};

const PEOPLE_SEARCH_INPUT_ID = "shop-people-customer-search";
const PAGE_SIZE = 10;

const SHOP_TABLE_BASE = adminPanelTableClasses(true);
const SHOP_TABLE: AdminPanelTableClasses = {
  ...SHOP_TABLE_BASE,
  th: SHOP_TABLE_BASE.th.replace("px-2", "px-4"),
  td: SHOP_TABLE_BASE.td.replace("px-2", "px-4"),
};

const SHOP_TABLE_HEAD_TH_CLASS = `${SHOP_TABLE.th} h-9 py-0 align-middle`;
const SHOP_TABLE_BODY_TD_CLASS = `${SHOP_TABLE.td} h-9 py-0 align-middle whitespace-nowrap`;

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
  showSearch = true,
}: {
  value: string;
  onChange: (value: string) => void;
  inputId: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  showSearch?: boolean;
}) {
  return (
    <div className={shopTableToolbarClass}>
      <div className="flex items-center gap-2">{leading}</div>
      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        {showSearch ? (
          <input
            id={inputId}
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search"
            aria-label="Search"
            className="h-[26px] min-w-[9rem] border border-gray-400 bg-white px-2 text-sm text-gray-800 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
          />
        ) : null}
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

function validateVehicleDraft(draft: VehicleDraft): string | null {
  if (!draft.licensePlateNo.trim()) return "License plate is required.";
  if (!draft.vehicleName.trim()) return "Make is required.";
  if (!draft.model.trim()) return "Model is required.";
  if (!draft.year.trim() || !isValidVehicleYear(draft.year.trim())) return "Enter a valid vehicle year.";
  if (!draft.vinNo?.trim()) return "VIN is required.";
  if (draft.vinNo.trim().length !== 17) return "VIN must be exactly 17 characters.";
  if (!draft.odometerReading?.trim()) return "Current odo is required.";
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

function customerApprovalStatus(customer: MyCustomer): string {
  return (customer.status ?? customer.linkStatus ?? customer.approvalStatus ?? "").trim().toLowerCase();
}

function isPendingApproval(customer: MyCustomer): boolean {
  const status = customerApprovalStatus(customer);
  if (
    status.includes("pending") ||
    status === "sent" ||
    status === "requested" ||
    status === "awaiting" ||
    status.includes("awaiting")
  ) {
    return true;
  }
  // "pending approval" / similar — but not "approved"
  if (status.includes("approval") && !status.includes("approved")) {
    return true;
  }
  if (status.includes("approved") || status === "active" || status.includes("linked") || status === "onboarded") {
    return false;
  }
  return !customer.linkedAt?.trim();
}

function customerListDate(customer: MyCustomer): string {
  const raw =
    customer.addedToShopAt ?? customer.linkedAt ?? customer.addedAt ?? customer.createdAt;
  if (!raw?.trim()) return "—";
  return formatDisplayDate(raw.trim());
}

function approvalStatusLabel(customer: MyCustomer): string {
  const status = (customer.status ?? customer.linkStatus ?? customer.approvalStatus ?? "").trim();
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

function SearchInviteNotice() {
  return (
    <div className="mt-3 flex flex-col items-center gap-2 py-2 text-center">
      <img
        src="/images/shop/attention-stamp.png"
        alt="Attention"
        className="h-20 w-20 object-contain"
      />
      <p className="max-w-md text-sm font-serif italic text-gray-800">
        this customer is not on your list, Invite to add in your permanent customer list
      </p>
    </div>
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
  const { token } = useAuth();
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

    const company = companies.find((c) => c.companyName === draft.vehicleName);
    const carCompanyId = company?._id ?? company?.id;
    if (!carCompanyId) {
      setError("Please select a make from the list.");
      return;
    }

    const vinNo = draft.vinNo?.trim() ?? "";
    const odometerReading = draft.odometerReading?.trim() ?? "";
    const payload = {
      carCompanyId,
      make: draft.vehicleName.trim(),
      model: draft.model.trim(),
      year: Number(draft.year.trim()),
      licensePlateNo: draft.licensePlateNo.trim().slice(0, 14),
      vinNo,
      odometerReading: Number(odometerReading),
    };

    setSaving(true);
    setError(null);
    try {
      const res = await addVehicleToOnboardedCustomer(token, id, payload);
      logPeopleApi(
        "POST",
        `/api/autoshopowner/customer/onboarded/${encodeURIComponent(id)}/vehicles`,
        payload,
        res,
      );
      if (!res.ok) {
        setError(apiMessage(res.data) || "Could not add vehicle.");
        return;
      }
      toast.success(apiMessage(res.data) || "Vehicle added.");

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
  onShowVehicles,
  showCity = false,
  showStatus = false,
  showAction = false,
  isCustomerAdded,
  invitingCustomerId,
  onAddCustomer,
}: {
  customers: MyCustomer[];
  onEdit: (customer: MyCustomer) => void;
  onShowVehicles: (customer: MyCustomer) => void;
  showCity?: boolean;
  showStatus?: boolean;
  showAction?: boolean;
  isCustomerAdded?: (customer: MyCustomer) => boolean;
  invitingCustomerId?: string | null;
  onAddCustomer?: (customer: MyCustomer) => void;
}) {
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
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Name</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Phone</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Email</th>
              {showCity ? <th className={SHOP_TABLE_HEAD_TH_CLASS}>City</th> : null}
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Vehicles</th>
              {showStatus ? <th className={SHOP_TABLE_HEAD_TH_CLASS}>Status</th> : null}
              {showAction ? <th className={SHOP_TABLE_HEAD_TH_CLASS}>Action</th> : null}
            </tr>
          </thead>
          <tbody>
            {customers.map((customer, index) => {
              const name = customer.name ?? "—";
              const rowKey = customerTableRowKey(customer, index);
              const alreadyAdded = showAction ? Boolean(isCustomerAdded?.(customer)) : false;
              return (
                <tr key={rowKey} className={adminPanelRowClass(index)}>
                  <td className={SHOP_TABLE_BODY_TD_CLASS}>
                    <button
                      type="button"
                      title={`Edit ${name}`}
                      aria-label={`Edit ${name}`}
                      onClick={() => onEdit(customer)}
                      className="font-semibold text-blue-700 underline hover:text-blue-800"
                    >
                      {name}
                    </button>
                  </td>
                  <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-gray-800`}>
                    {customer.phone ? formatPhoneLabel(customer.phone) : "—"}
                  </td>
                  <td className={SHOP_TABLE_BODY_TD_CLASS}>{customer.email?.trim() || "—"}</td>
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
                  {showStatus ? (
                    <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-blue-700`}>
                      {approvalStatusLabel(customer)}
                    </td>
                  ) : null}
                  {showAction ? (
                    <td className={SHOP_TABLE_BODY_TD_CLASS}>
                      {alreadyAdded ? (
                        <span className="text-xs font-semibold text-gray-600">Added</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onAddCustomer?.(customer)}
                          disabled={Boolean(invitingCustomerId)}
                          className="rounded border border-ad-purple bg-white px-3 py-0.5 text-xs font-bold text-ad-purple hover:bg-[#f5cce8] disabled:opacity-60"
                        >
                          {invitingCustomerId && invitingCustomerId === customerId(customer)
                            ? "Inviting…"
                            : "Invite"}
                        </button>
                      )}
                    </td>
                  ) : null}
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
}: {
  customers: MyCustomer[];
  onEdit: (customer: MyCustomer) => void;
}) {
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
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Phone</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Email</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Name Customer</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>City</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Date</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Approval</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer, index) => {
              const name = customer.name ?? "—";
              const rowKey = customerTableRowKey(customer, index);
              const phoneLabel = customer.phone ? formatPhoneLabel(customer.phone) : "—";
              return (
                <tr key={rowKey} className={adminPanelRowClass(index)}>
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
                  <td className={SHOP_TABLE_BODY_TD_CLASS}>{customer.email?.trim() || "—"}</td>
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
  const { token } = useAuth();
  const countryCode = "+1";
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
  const { token } = useAuth();
  const countryCode = "+1";
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
          saveLabel={addToListAfterSave ? "+ Add" : "Update"}
          savingLabel={addToListAfterSave ? "Adding…" : "Updating…"}
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

export default function ShopPeoplePage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { faqsHeading, faqsDescription, city: shopCity } = useShopOwnerPortal();
  const [section, setSection] = useState<PeopleSection>("my-list");
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState("");
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [editingCustomer, setEditingCustomer] = useState<MyCustomer | null>(null);
  const [detailView, setDetailView] = useState<DetailView | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [sectionCustomers, setSectionCustomers] = useState<MyCustomer[]>([]);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [sectionError, setSectionError] = useState<string | null>(null);
  const [addedCustomerIds, setAddedCustomerIds] = useState<Set<string>>(() => new Set());
  const [invitingCustomerId, setInvitingCustomerId] = useState<string | null>(null);

  // Directory search only applies to My Customer List; Approval filters client-side.
  const myListSearch = section === "my-list" ? search : "";

  const loadSectionCustomers = useCallback(async () => {
    if (!token) {
      setSectionCustomers([]);
      setAddedCustomerIds(new Set());
      setSectionLoading(false);
      setSectionError(null);
      return;
    }

    setSectionLoading(true);
    setSectionError(null);
    try {
      // My Customer List: search merges directory results with already-added customers.
      if (section === "my-list") {
        const q = myListSearch.trim();

        if (!q) {
          const approvedRes = await fetchAddedCustomers(token, "approved");
          logPeopleApi(
            "GET",
            "/api/autoshopowner/customer/added?status=approved",
            null,
            approvedRes,
          );
          if (!approvedRes.ok) {
            setSectionCustomers([]);
            setAddedCustomerIds(new Set());
            setSectionError("Could not load approved customers.");
            return;
          }
          const approved = parseMyCustomers(approvedRes.data);
          setAddedCustomerIds(
            new Set(approved.map((customer) => customerId(customer)).filter(Boolean)),
          );
          setSectionCustomers(approved);
          return;
        }

        const [addedRes, approvedRes, searchRes] = await Promise.all([
          fetchAddedCustomers(token),
          fetchAddedCustomers(token, "approved"),
          searchCarOwners(token, q),
        ]);

        logPeopleApi("GET", "/api/autoshopowner/customer/added", null, addedRes);
        logPeopleApi(
          "GET",
          "/api/autoshopowner/customer/added?status=approved",
          null,
          approvedRes,
        );
        logPeopleApi(
          "GET",
          `/api/autoshopowner/customer/search?search=${encodeURIComponent(q)}`,
          null,
          searchRes,
        );

        if (!addedRes.ok || !approvedRes.ok || !searchRes.ok) {
          setSectionCustomers([]);
          setAddedCustomerIds(new Set());
          setSectionError("Could not search customers.");
          return;
        }

        const allAdded = parseMyCustomers(addedRes.data);
        setAddedCustomerIds(
          new Set(allAdded.map((customer) => customerId(customer)).filter(Boolean)),
        );

        const approved = parseMyCustomers(approvedRes.data);
        const searchHits = parseMyCustomers(searchRes.data);
        const byId = new Map<string, MyCustomer>();
        for (const customer of searchHits) {
          const id = customerId(customer);
          if (id) byId.set(id, customer);
          else byId.set(`anon-${byId.size}`, customer);
        }
        for (const customer of approved) {
          if (!matchesMyCustomerSearch(customer, q)) continue;
          const id = customerId(customer);
          if (id) byId.set(id, customer);
          else byId.set(`anon-approved-${byId.size}`, customer);
        }
        setSectionCustomers([...byId.values()]);
        return;
      }

      const status = addedCustomersStatusForSection(section);
      const res = await fetchAddedCustomers(token, status);
      const path = `/api/autoshopowner/customer/added?status=${encodeURIComponent(status)}`;
      logPeopleApi("GET", path, null, res);
      if (!res.ok) {
        setSectionCustomers([]);
        setSectionError(
          section === "approval"
            ? "Could not load customers awaiting approval."
            : "Could not load approved customers.",
        );
        return;
      }
      setSectionCustomers(parseMyCustomers(res.data));
    } catch {
      setSectionCustomers([]);
      setAddedCustomerIds(new Set());
      setSectionError("Network error.");
    } finally {
      setSectionLoading(false);
    }
  }, [token, section, myListSearch]);

  useEffect(() => {
    if (section === "my-list") {
      const handle = window.setTimeout(() => {
        void loadSectionCustomers();
      }, 250);
      return () => {
        window.clearTimeout(handle);
      };
    }
    void loadSectionCustomers();
  }, [loadSectionCustomers, section]);

  const listCustomers = useMemo(() => {
    if (section !== "approval") return sectionCustomers;
    return sectionCustomers.filter((customer) => matchesMyCustomerSearch(customer, search));
  }, [section, sectionCustomers, search]);

  const showListLoading = sectionLoading;
  const showListError = sectionError;

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
    setEditingCustomer(null);
  }, [search, section, page]);

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

  const isCustomerAlreadyAdded = useCallback(
    (customer: MyCustomer) => {
      const id = customerId(customer);
      return Boolean(id && addedCustomerIds.has(id));
    },
    [addedCustomerIds],
  );

  const handleAddToListSaved = async (message: string) => {
    setStatusMessage(message);
    setDetailView(null);
    toast.success("Customer added to your list.");
    await loadSectionCustomers();
    setSection("approval");
  };

  const handleAddNewSaved = async (message: string) => {
    setStatusMessage(message);
    setShowAddForm(false);
    toast.success("Customer saved.");
    await loadSectionCustomers();
  };

  const handleEditSaved = async (message: string) => {
    const addingFromDirectory =
      section === "my-list" &&
      editingCustomer != null &&
      !isCustomerAlreadyAdded(editingCustomer);
    setStatusMessage(message);
    setEditingCustomer(null);
    if (addingFromDirectory) {
      toast.success("Customer added to your list.");
      await loadSectionCustomers();
      setSection("approval");
      return;
    }
    toast.success("Customer updated.");
    await loadSectionCustomers();
  };

  const showList = !detailView;
  const showAddNewAction =
    section === "my-list" &&
    !detailView &&
    !showAddForm &&
    !editingCustomer;
  const showMyListSearchActions = section === "my-list" && search.trim().length > 0;

  const handleEditCustomer = (customer: MyCustomer) => {
    setShowAddForm(false);
    setDetailView(null);
    setStatusMessage(null);
    setEditingCustomer(customer);
  };

  const handleAddCustomerFromSearch = async (customer: MyCustomer) => {
    if (!token || invitingCustomerId) return;
    const id = customerId(customer);
    if (!id) {
      toast.error("Missing customer id.");
      return;
    }

    setShowAddForm(false);
    setEditingCustomer(null);
    setDetailView(null);
    setStatusMessage(null);
    setInvitingCustomerId(id);

    const edits = {
      name: (customer.name ?? "").trim(),
      email: (customer.email ?? "").trim(),
      city: (customer.city ?? "").trim(),
    };

    try {
      const addRes = await addCarOwnerToMyCustomers(token, id, edits);
      logPeopleApi(
        "POST",
        "/api/autoshopowner/customer/add",
        { customerId: id, edits },
        addRes,
      );
      if (!addRes.ok) {
        toast.error(apiMessage(addRes.data) || "Could not add customer to your list.");
        return;
      }
      await handleAddToListSaved(
        apiMessage(addRes.data) ||
          "Notification sent for approval. Pl. wait or contact with Customer",
      );
    } catch {
      toast.error("Network error.");
    } finally {
      setInvitingCustomerId(null);
    }
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
      await loadSectionCustomers();
    },
    [loadSectionCustomers],
  );

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
        {detailView?.kind === "customer-info" ? (
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
              showSearch
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
                  addToListAfterSave={
                    section === "my-list" &&
                    search.trim().length > 0 &&
                    !isCustomerAlreadyAdded(editingCustomer) &&
                    (editingCustomer.status ?? "").toLowerCase() !== "onboarded"
                  }
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
                  void loadSectionCustomers();
                }}
              />
            ) : (
              <>
                {section === "approval" ? (
                  <ApprovalCustomerListTable
                    customers={paginatedCustomers}
                    onEdit={handleEditCustomer}
                  />
                ) : (
                  <>
                    <CustomerListTable
                      customers={paginatedCustomers}
                      onEdit={handleEditCustomer}
                      onShowVehicles={handleShowVehicles}
                      showCity
                      showStatus={!showMyListSearchActions}
                      showAction={showMyListSearchActions}
                      isCustomerAdded={isCustomerAlreadyAdded}
                      invitingCustomerId={invitingCustomerId}
                      onAddCustomer={(customer) => void handleAddCustomerFromSearch(customer)}
                    />
                    {showMyListSearchActions ? <SearchInviteNotice /> : null}
                  </>
                )}

                <ShopListFooter>
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
            )}
          </>
        ) : null}
      </div>
    </ShopPageShell>
  );
}
