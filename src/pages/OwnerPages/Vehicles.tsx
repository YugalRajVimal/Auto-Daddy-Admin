import { useEffect, useRef, useState, type ReactNode } from "react";
import { FiExternalLink } from "react-icons/fi";
import { toast } from "react-toastify";
import PageMeta from "../../components/common/PageMeta";
import { PortalPageContent } from "../../components/admin/PortalPageContent";
import PortalSidebarButton from "../../components/admin/PortalSidebarButton";
import { AddNewButton } from "../../components/admin/AdminPage";
import {
  CompactFormPanel,
  compactInputClass,
} from "../../components/admin/ContentPanel";
import OwnerAddVehicleForm from "../../components/owner/OwnerAddVehicleForm";
import OwnerFaqsDialog from "../../components/owner/OwnerFaqsDialog";
import { OwnerFaqsButton } from "../../components/owner/OwnerFaqsButton";
import OwnerInvoiceRow from "../../components/owner/OwnerInvoiceRow";
import OwnerJobCardRow from "../../components/owner/OwnerJobCardRow";
import VehiclePickerPopup from "../../components/owner/OwnerVehiclePicker";
import { putFormData, putJson } from "../../api/mobileAuth";
import { useAuth } from "../../auth";
import { useCarOwnerDocuments } from "../../hooks/useCarOwnerDocuments";
import { useCarOwnerJobCards } from "../../hooks/useCarOwnerJobCards";
import { useCarOwnerVehicles } from "../../hooks/useCarOwnerVehicles";
import { useCarOwnerDashboard } from "../../hooks/useOwnerPortal";
import { useCarOwnerInvoices, type CarOwnerInvoiceRow } from "../../hooks/useCarOwnerInvoices";
import { businessName } from "../../lib/carOwnerJobCards";
import { DUMMY_OWNER_INVOICES } from "../../lib/dummyOwnerInvoices";
import {
  VEHICLE_DOCUMENT_FIELDS,
  type VehicleDocumentFieldKey,
} from "../../lib/carOwnerDocuments";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";
import { vehicleSidebarLabel, type CarOwnerVehicle } from "../../lib/carOwnerVehicles";

type VehiclePanelSection = "vehicle-details" | "job-cards" | "invoices" | "documents" | "update-odometer";

function SidebarSectionItem({
  section,
  label,
  active,
  popupOpen,
  vehicles,
  onSectionClick,
  onVehicleSelect,
  children,
}: {
  section: VehiclePanelSection;
  label: string;
  active: boolean;
  popupOpen: boolean;
  vehicles: CarOwnerVehicle[];
  onSectionClick: (section: VehiclePanelSection) => void;
  onVehicleSelect: (vehicleId: string, section: VehiclePanelSection) => void;
  children?: ReactNode;
}) {
  return (
    <div className="relative">
      {children ?? (
        <PortalSidebarButton label={label} active={active} onClick={() => onSectionClick(section)} />
      )}
      {popupOpen && vehicles.length > 1 ? (
        <VehiclePickerPopup vehicles={vehicles} onSelect={(vehicleId) => onVehicleSelect(vehicleId, section)} />
      ) : null}
    </div>
  );
}

function DetailChip({
  label,
  value,
  placeholder,
  className = "",
}: {
  label: string;
  value: string;
  placeholder?: boolean;
  className?: string;
}) {
  return (
    <div className={`rounded border border-ad-green-dark/20 bg-white/90 px-2 py-1 ${className}`}>
      <p className="text-[9px] font-bold uppercase leading-tight tracking-wide text-ad-green-dark">{label}</p>
      <p
        className={`truncate text-xs leading-tight ${placeholder ? "text-gray-400" : "font-semibold text-gray-800"}`}
      >
        {value || "—"}
      </p>
    </div>
  );
}

function vehicleImageUri(v: CarOwnerVehicle): string | null {
  const path = v.carImage ?? v.carImages?.[0] ?? null;
  return normalizeMediaUrl(path);
}

function vehicleGalleryItems(v: CarOwnerVehicle): Array<{ label: string; uri: string }> {
  const items: Array<{ label: string; path?: string | null }> = [
    { label: "Plate image", path: v.licensePlateImagePath },
    { label: "Plate front", path: v.licensePlateFrontImagePath },
    { label: "Plate back", path: v.licensePlateBackImagePath },
    { label: "Car image", path: v.carImage },
    ...(v.carImages ?? []).map((path, index) => ({ label: `Car photo ${index + 1}`, path })),
  ];
  const seen = new Set<string>();
  const out: Array<{ label: string; uri: string }> = [];
  for (const item of items) {
    const uri = normalizeMediaUrl(item.path);
    if (uri && !seen.has(uri)) {
      seen.add(uri);
      out.push({ label: item.label, uri });
    }
  }
  return out;
}

const EXCELLENCE_QUOTE_LINES = [
  "With Autodaddy, you are not just choosing a system,",
  "You are choosing a standard of excellence",
] as const;

function TypingExcellenceQuote() {
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  const lines = EXCELLENCE_QUOTE_LINES;
  const currentLine = lines[lineIndex] ?? "";
  const isComplete = lineIndex >= lines.length;

  useEffect(() => {
    if (isComplete) return;

    if (charIndex < currentLine.length) {
      const timer = window.setTimeout(() => setCharIndex((index) => index + 1), 42);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      setLineIndex((index) => index + 1);
      setCharIndex(0);
    }, 480);
    return () => window.clearTimeout(timer);
  }, [charIndex, currentLine.length, isComplete, lineIndex]);

  return (
    <footer className="text-center font-serif text-lg italic leading-snug text-gray-600 md:text-xl lg:text-2xl">
      {lines.slice(0, lineIndex).map((line) => (
        <p key={line}>{line}</p>
      ))}
      {!isComplete ? (
        <p>
          {currentLine.slice(0, charIndex)}
          <span className="ml-0.5 inline-block animate-pulse text-ad-purple" aria-hidden>
            |
          </span>
        </p>
      ) : null}
    </footer>
  );
}

function VehiclesPanelPlaceholder() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center px-6 py-10 lg:min-h-[calc(100vh-220px)]">
      <TypingExcellenceQuote />
    </div>
  );
}

function VehicleDetails({
  vehicle,
  uploading,
  onUploadImage,
}: {
  vehicle: CarOwnerVehicle;
  uploading: boolean;
  onUploadImage: (vehicleId: string, file: File) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageUri = vehicleImageUri(vehicle);
  const gallery = vehicleGalleryItems(vehicle);

  const plate = vehicle.licensePlateNo?.trim() ?? "";
  const makeName = (vehicle.make?.name ?? "").trim();
  const modelName = (vehicle.make?.model ?? "").trim();
  const year = vehicle.year != null && String(vehicle.year).trim() ? String(vehicle.year).trim() : "";
  const odo =
    vehicle.odometerReading != null && String(vehicle.odometerReading).trim()
      ? `${String(vehicle.odometerReading).trim()} km`
      : "";
  const dueOdo =
    vehicle.dueOdometerReading != null && String(vehicle.dueOdometerReading).trim()
      ? `${String(vehicle.dueOdometerReading).trim()} km`
      : "";
  const vin = vehicle.vinNo?.trim() ?? "";

  return (
    <CompactFormPanel className="!mb-0 w-full">
      <div className="space-y-3">
        <div className="border-b border-ad-green-dark/15 pb-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-ad-green-dark">Selected vehicle</p>
          <p className="text-sm font-bold text-gray-900">{vehicleSidebarLabel(vehicle)}</p>
          {plate ? <p className="text-xs text-gray-600">Plate: {plate}</p> : null}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
          <div className="flex shrink-0 flex-col items-center lg:w-[108px]">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border-2 border-ad-green bg-white shadow-sm">
              {imageUri ? (
                <img src={imageUri} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-[10px] font-semibold text-gray-400">No image</span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) onUploadImage(vehicle.id, file);
              }}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="mt-1.5 w-24 rounded border border-ad-form-border bg-white px-1.5 py-1 text-[10px] font-semibold text-ad-green-dark hover:bg-ad-green-light disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Upload Image"}
            </button>
          </div>

          <div className="min-w-0 flex-1 rounded-lg bg-ad-green-light/80 p-2 ring-1 ring-ad-green-dark/10">
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              <DetailChip label="Plate" value={plate} placeholder={!plate} />
              <DetailChip label="Make" value={makeName} placeholder={!makeName} />
              <DetailChip label="Model" value={modelName} placeholder={!modelName} />
              <DetailChip label="Year" value={year} placeholder={!year} />
            </div>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              <DetailChip label="Odometer" value={odo} placeholder={!odo} />
              <DetailChip label="Due odometer" value={dueOdo} placeholder={!dueOdo} />
              <DetailChip label="VIN" value={vin} placeholder={!vin} />
              {gallery.length > 0 ? (
                <div className="rounded border border-ad-green-dark/20 bg-white/90 px-2 py-1">
                  <p className="text-[9px] font-bold uppercase leading-tight tracking-wide text-ad-green-dark">
                    Photos & documents
                  </p>
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {gallery.map((item) => (
                      <a
                        key={`${item.label}-${item.uri}`}
                        href={item.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 rounded-full border border-ad-green-dark/25 bg-ad-green-light/50 px-1.5 py-0.5 text-[9px] font-semibold text-ad-green-dark hover:bg-ad-green-light"
                      >
                        {item.label}
                        <FiExternalLink size={8} aria-hidden />
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </CompactFormPanel>
  );
}

function vehicleDetailsBracket(vehicle: CarOwnerVehicle): string {
  const makeName = (vehicle.make?.name ?? "").trim();
  const model = (vehicle.make?.model ?? "").trim();
  const year = vehicle.year != null && String(vehicle.year).trim() ? String(vehicle.year).trim() : "";
  const parts = [makeName, model, year].filter(Boolean);
  return parts.length ? `(${parts.join(" ")})` : "";
}

function DocumentFieldRow({
  vehicleId,
  fieldKey,
  label,
  uri,
  licensePlate,
  vehicleDetails,
  busy,
  disabled,
  onUpload,
}: {
  vehicleId: string;
  fieldKey: VehicleDocumentFieldKey;
  label: string;
  uri: string | null;
  licensePlate?: string;
  vehicleDetails?: string;
  busy: boolean;
  disabled: boolean;
  onUpload: (vehicleId: string, field: VehicleDocumentFieldKey, file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const plate = licensePlate?.trim().toUpperCase() ?? "";

  return (
    <div className="flex flex-wrap items-center gap-4 border-t border-[#b2e0a0] bg-white/60 px-4 py-3 first:border-t-0">
      <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded border border-gray-300 bg-gray-50">
        {uri ? (
          <a href={uri} target="_blank" rel="noopener noreferrer" className="h-full w-full">
            <img src={uri} alt="" className="h-full w-full object-cover" />
          </a>
        ) : (
          <span className="text-xs text-gray-400">No file</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[#006600]">{label}</p>
        <p className="text-xs text-gray-600">{uri ? "Tap image to view full size" : "Not uploaded yet"}</p>
      </div>

      <div className="shrink-0 text-center sm:min-w-[120px]">
        {plate ? <p className="text-base font-bold tracking-wide text-gray-900">{plate}</p> : null}
        {vehicleDetails ? <p className="text-xs font-semibold text-gray-600">{vehicleDetails}</p> : null}
      </div>

      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onUpload(vehicleId, fieldKey, file);
          }}
        />
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
          className="rounded border border-[#008000] bg-white px-3 py-1.5 text-xs font-semibold text-[#006600] hover:bg-[#CCFFCC] disabled:opacity-50"
        >
          {busy ? "Uploading…" : uri ? "Replace" : "Upload"}
        </button>
      </div>
    </div>
  );
}

function VehicleDocumentsPanel({
  vehicleId,
  licensePlate,
  vehicleDetails,
  busyField,
  mutating,
  onUpload,
  fields,
}: {
  vehicleId: string;
  licensePlate?: string;
  vehicleDetails?: string;
  busyField: string | null;
  mutating: boolean;
  onUpload: (vehicleId: string, field: VehicleDocumentFieldKey, file: File) => void;
  fields: Array<{ key: VehicleDocumentFieldKey; label: string; uri: string | null }>;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-[#b2e0a0] bg-[#e8ffe8] shadow-sm">
      {fields.map((field) => {
        const fieldBusy = busyField === `${vehicleId}:${field.key}`;
        return (
          <DocumentFieldRow
            key={field.key}
            vehicleId={vehicleId}
            fieldKey={field.key}
            label={field.label}
            uri={field.uri}
            licensePlate={licensePlate}
            vehicleDetails={vehicleDetails}
            busy={fieldBusy}
            disabled={mutating && !fieldBusy}
            onUpload={onUpload}
          />
        );
      })}
    </div>
  );
}

function odometerToNumber(value: string | number | null | undefined): number | null {
  if (value == null) return null;
  const n = Number(String(value).trim());
  return Number.isFinite(n) ? n : null;
}

function remainingKmNumber(due: number | null, reading: number | null): number | null {
  if (due == null || reading == null) return null;
  return due - reading;
}

function remainingKmStatusText(remaining: number | null): string {
  if (remaining == null) return "Service Due after Kms";
  if (remaining > 0) return "Service Due after Kms";
  if (remaining === 0) return "Service due now";
  return "Service overdue by Kms";
}

const odometerDisplayClass =
  "flex min-h-[30px] w-full cursor-default select-none items-center border border-gray-400 bg-white px-2 py-1.5 text-sm text-gray-800";

function OdometerUpdatePanel({
  vehicle,
  token,
  serviceBy,
  onSaved,
}: {
  vehicle: CarOwnerVehicle;
  token: string | null;
  serviceBy?: string | null;
  onSaved: () => void;
}) {
  const current =
    vehicle.odometerReading != null && String(vehicle.odometerReading).trim()
      ? String(vehicle.odometerReading).trim()
      : "";
  const dueNum = odometerToNumber(vehicle.dueOdometerReading);
  const dueDisplay = dueNum != null ? dueNum.toLocaleString() : "—";
  const plate = vehicle.licensePlateNo?.trim() ?? "";
  const imageUri = vehicleImageUri(vehicle);

  const [value, setValue] = useState(current);
  const [saving, setSaving] = useState(false);

  const parsed = value.trim() ? Number(value.trim()) : null;
  const currentNum = current ? Number(current) : null;
  const readingForRemaining = parsed != null && Number.isFinite(parsed) ? parsed : currentNum;
  const remainingNum = remainingKmNumber(dueNum, readingForRemaining);
  const remainingDisplay =
    remainingNum == null
      ? "—"
      : remainingNum <= 0
        ? Math.abs(remainingNum).toLocaleString()
        : remainingNum.toLocaleString();
  const serviceByDisplay = serviceBy?.trim() || "—";
  const canSave =
    !saving &&
    parsed != null &&
    Number.isFinite(parsed) &&
    parsed >= 0 &&
    (currentNum == null || parsed !== currentNum);
  const error =
    parsed != null && currentNum != null && parsed < currentNum
      ? "New reading should not be lower than the current value."
      : null;

  const handleSave = async () => {
    if (!token || parsed == null) {
      toast.error("Please log in again.");
      return;
    }

    setSaving(true);
    try {
      const res = await putJson<{ success?: boolean; message?: string }>(
        "/api/user/odometer",
        { vehicleId: vehicle.id, odometerReading: parsed },
        token
      );
      const message = typeof res.data?.message === "string" ? res.data.message.trim() : "";
      if (!res.ok || res.data?.success === false) {
        toast.error(message || "Could not update odometer.");
        return;
      }
      toast.success(message || "Odometer updated.");
      onSaved();
    } catch {
      toast.error("Network error while updating odometer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="mb-3 text-xl font-bold text-ad-purple">Update Odometer</h2>

      <CompactFormPanel
        className="!mb-0"
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-ad-form-border bg-ad-form-required-bg px-4 py-2.5">
            {error ? <p className="mr-auto text-xs text-red-600">{error}</p> : null}
            <button
              type="button"
              disabled={!canSave}
              onClick={() => void handleSave()}
              className="rounded bg-ad-form-save px-5 py-1 text-sm font-bold text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <span className="text-xs text-gray-700">
              or{" "}
              <button
                type="button"
                disabled={saving}
                onClick={() => setValue(current)}
                className="font-medium text-blue-600 underline hover:text-blue-700 disabled:opacity-50"
              >
                Reset
              </button>
            </span>
          </div>
        }
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex w-full shrink-0 flex-col sm:w-[132px]">
            <div className="flex aspect-square w-full max-w-[132px] items-center justify-center overflow-hidden border border-gray-300 bg-white">
              {imageUri ? (
                <img src={imageUri} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-semibold text-gray-400">No image</span>
              )}
            </div>
            <div className="w-full max-w-[132px] bg-ad-green-dark px-2 py-2 text-center text-sm font-bold tracking-wide text-white">
              {plate || "—"}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="odometer-input" className="mb-1 block text-sm font-medium text-gray-900">
                  New Odometer
                </label>
                <input
                  id="odometer-input"
                  type="text"
                  inputMode="numeric"
                  value={value}
                  onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder=""
                  disabled={saving}
                  className={compactInputClass}
                />
              </div>

              <div>
                <p className="mb-1 text-sm font-medium text-gray-900">Due On</p>
                <div className={odometerDisplayClass}>{dueDisplay}</div>
              </div>

              <div>
                <p className="mb-1 text-sm font-medium text-gray-900">Auto shop</p>
                <div className={odometerDisplayClass}>{serviceByDisplay}</div>
              </div>
            </div>

            <p className="mt-5 text-center text-sm font-bold text-blue-600">
              {remainingKmStatusText(remainingNum)}{" "}
              <span className="text-4xl font-bold leading-none">{remainingDisplay}</span>
            </p>
          </div>
        </div>
      </CompactFormPanel>
    </div>
  );
}

export default function OwnerVehiclesPage() {
  const { token, session } = useAuth();
  const countryCode = session?.meta?.countryCode;
  const { faqsHeading, faqsDescription } = useCarOwnerDashboard();
  const { vehicles, loading, error, refresh } = useCarOwnerVehicles();
  const { sections, loading: docsLoading, mutating, busyField, uploadDocumentField } = useCarOwnerDocuments();

  const [showForm, setShowForm] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<VehiclePanelSection | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [popupSection, setPopupSection] = useState<VehiclePanelSection | null>(null);
  const asideRef = useRef<HTMLElement>(null);

  const { items: jobCards, loading: jobCardsLoading, error: jobCardsError } = useCarOwnerJobCards(
    activeSection === "job-cards" || activeSection === "update-odometer" ? selectedVehicleId : null
  );
  const { loading: invoicesLoading, error: invoicesError, paidInvoices, unpaidInvoices } = useCarOwnerInvoices();

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) ?? null;
  const documentSection = sections.find((s) => s.vehicleId === selectedVehicleId) ?? null;

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!asideRef.current?.contains(event.target as Node)) {
        setPopupSection(null);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const openSection = (section: VehiclePanelSection) => {
    if (vehicles.length === 0) {
      toast.info("Add a vehicle first.");
      return;
    }

    if (section === "invoices") {
      setActiveSection("invoices");
      setPopupSection(null);
      return;
    }

    if (vehicles.length === 1) {
      setActiveSection(section);
      setSelectedVehicleId(vehicles[0].id);
      setPopupSection(null);
      return;
    }

    setPopupSection((current) => (current === section ? null : section));
  };

  const handleVehiclePicked = (vehicleId: string, section: VehiclePanelSection) => {
    setActiveSection(section);
    setSelectedVehicleId(vehicleId);
    setPopupSection(null);
  };

  const handleUploadImage = async (vehicleId: string, file: File) => {
    if (!token) {
      toast.error("Please log in again.");
      return;
    }

    setUploadingId(vehicleId);
    try {
      const body = new FormData();
      body.append("vehicleImage", file, file.name || "vehicle.jpg");
      const res = await putFormData<{ message?: string }>(`/api/user/vehicle/${vehicleId}`, body, token);
      const message = typeof res.data?.message === "string" ? res.data.message.trim() : "";
      if (!res.ok) {
        toast.error(message || "Could not upload image.");
        return;
      }
      toast.success(message || "Image uploaded.");
      void refresh();
    } catch {
      toast.error("Network error while uploading image.");
    } finally {
      setUploadingId(null);
    }
  };

  const handleDocumentUpload = async (vehicleId: string, field: VehicleDocumentFieldKey, file: File) => {
    const res = await uploadDocumentField(vehicleId, field, file);
    if (res.ok) {
      toast.success(res.message ?? "Document saved.");
    } else {
      toast.error(res.message ?? "Could not upload document.");
    }
  };

  const apiInvoices = [...paidInvoices, ...unpaidInvoices].filter(
    (row, index, list) => list.findIndex((r) => r.id === row.id) === index
  );
  const visibleInvoices = (() => {
    const seen = new Set<string>();
    const rows: CarOwnerInvoiceRow[] = [];
    for (const row of [...DUMMY_OWNER_INVOICES, ...apiInvoices]) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      rows.push(row);
    }
    return rows;
  })();

  const documentFields = VEHICLE_DOCUMENT_FIELDS.map((field) => {
    const match = documentSection?.fields.find((f) => f.key === field.key);
    return {
      key: field.key,
      label: field.label,
      uri: match?.uri ?? null,
    };
  });

  const renderRightPanel = () => {
    if (loading) {
      return (
        <div className="flex min-h-[420px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm font-semibold text-gray-800">{error}</p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-md bg-ad-purple px-4 py-2 text-sm font-semibold text-white hover:bg-ad-purple-dark"
          >
            Try again
          </button>
        </div>
      );
    }

    if (vehicles.length === 0) {
      return (
        <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-gray-600">No vehicles added yet.</p>
          {!showForm ? <AddNewButton onClick={() => setShowForm(true)} /> : null}
        </div>
      );
    }

    if (!activeSection) {
      return <VehiclesPanelPlaceholder />;
    }

    if (activeSection === "invoices") {
      if (invoicesLoading) {
        return (
          <div className="flex min-h-[320px] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
          </div>
        );
      }
      if (invoicesError && visibleInvoices.length === 0) {
        return <p className="text-sm text-gray-600">{invoicesError}</p>;
      }
      if (visibleInvoices.length === 0) {
        return <p className="text-sm text-gray-600">No invoices yet.</p>;
      }
      return (
        <div className="flex flex-col gap-3">
          {visibleInvoices.map((row) => (
            <OwnerInvoiceRow key={row.id} row={row} countryCode={countryCode} />
          ))}
        </div>
      );
    }

    if (!selectedVehicle) {
      return <VehiclesPanelPlaceholder />;
    }

    switch (activeSection) {
      case "vehicle-details":
        return (
          <VehicleDetails
            vehicle={selectedVehicle}
            uploading={uploadingId === selectedVehicle.id}
            onUploadImage={handleUploadImage}
          />
        );

      case "documents":
        if (docsLoading) {
          return (
            <div className="flex min-h-[320px] items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
            </div>
          );
        }
        return (
          <VehicleDocumentsPanel
            vehicleId={selectedVehicle.id}
            licensePlate={selectedVehicle.licensePlateNo ?? undefined}
            vehicleDetails={vehicleDetailsBracket(selectedVehicle)}
            fields={documentFields}
            busyField={busyField}
            mutating={mutating}
            onUpload={(vehicleId, field, file) => void handleDocumentUpload(vehicleId, field, file)}
          />
        );

      case "job-cards":
        if (jobCardsLoading) {
          return (
            <div className="flex min-h-[320px] items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
            </div>
          );
        }
        if (jobCardsError) {
          return <p className="text-sm text-gray-600">{jobCardsError}</p>;
        }
        if (jobCards.length === 0) {
          return <p className="text-sm text-gray-600">No job cards for this vehicle yet.</p>;
        }
        return (
          <div className="flex flex-col gap-3">
            {jobCards.map((jc) => (
              <OwnerJobCardRow key={jc._id} jc={jc} countryCode={countryCode} />
            ))}
          </div>
        );

      case "update-odometer":
        return (
          <OdometerUpdatePanel
            key={selectedVehicle.id}
            vehicle={selectedVehicle}
            token={token}
            serviceBy={jobCards[0] ? businessName(jobCards[0].business) : null}
            onSaved={() => void refresh()}
          />
        );

      default:
        return null;
    }
  };

  return (
    <PortalPageContent className="flex flex-col px-3 py-3 sm:px-4 md:py-4 lg:px-6">
      <PageMeta title="Vehicles | AutoDaddy" description="Car owner vehicles" />

      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="font-serif text-2xl text-gray-600 md:text-3xl">Vehicles</h1>
        {!showForm && (activeSection === null || activeSection === "vehicle-details") ? (
          <AddNewButton onClick={() => setShowForm(true)} />
        ) : null}
      </div>

      {showForm ? (
        <OwnerAddVehicleForm onCancel={() => setShowForm(false)} onAdded={() => void refresh()} />
      ) : null}

      {!showForm ? (
        <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-5">
          <aside
            ref={asideRef}
            className="relative flex w-full shrink-0 flex-col gap-3 overflow-visible lg:w-[220px] xl:w-[260px] lg:min-h-[calc(100vh-220px)]"
          >
            <div className="flex flex-col gap-3">
              <SidebarSectionItem
                section="vehicle-details"
                label="Vehicle Details"
                active={activeSection === "vehicle-details"}
                popupOpen={popupSection === "vehicle-details"}
                vehicles={vehicles}
                onSectionClick={openSection}
                onVehicleSelect={handleVehiclePicked}
              />
              <SidebarSectionItem
                section="job-cards"
                label="Job Card Details"
                active={activeSection === "job-cards"}
                popupOpen={popupSection === "job-cards"}
                vehicles={vehicles}
                onSectionClick={openSection}
                onVehicleSelect={handleVehiclePicked}
              />
              <SidebarSectionItem
                section="invoices"
                label="Invoice Details"
                active={activeSection === "invoices"}
                popupOpen={false}
                vehicles={vehicles}
                onSectionClick={openSection}
                onVehicleSelect={handleVehiclePicked}
              />
              <SidebarSectionItem
                section="documents"
                label="Documents"
                active={activeSection === "documents"}
                popupOpen={popupSection === "documents"}
                vehicles={vehicles}
                onSectionClick={openSection}
                onVehicleSelect={handleVehiclePicked}
              />
            </div>

            <div className="mt-auto mb-10 flex flex-col gap-3 pt-6 lg:mb-14">
              <SidebarSectionItem
                section="update-odometer"
                label="Update Odometer"
                active={activeSection === "update-odometer"}
                popupOpen={popupSection === "update-odometer"}
                vehicles={vehicles}
                onSectionClick={openSection}
                onVehicleSelect={handleVehiclePicked}
              >
                <button
                  type="button"
                  onClick={() => openSection("update-odometer")}
                  className={`w-full rounded-full border px-4 py-2.5 text-center text-sm font-bold uppercase tracking-wide transition-colors ${activeSection === "update-odometer"
                      ? "border-blue-700 bg-blue-600 text-white shadow-md"
                      : "border-blue-600 bg-white/70 text-blue-600 hover:bg-white"
                    }`}
                >
                  Update Odometer
                </button>
              </SidebarSectionItem>
              <OwnerFaqsButton onClick={() => setFaqsOpen(true)} />
            </div>
          </aside>

          <div className="min-w-0 flex-1 lg:min-h-[calc(100vh-220px)]">
            {renderRightPanel()}
          </div>
        </div>
      ) : null}

      <OwnerFaqsDialog
        open={faqsOpen}
        onClose={() => setFaqsOpen(false)}
        heading={faqsHeading}
        description={faqsDescription}
      />
    </PortalPageContent>
  );
}
