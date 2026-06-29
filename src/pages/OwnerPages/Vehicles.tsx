import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  InvoiceViewerDialog,
  JobCardViewerDialog,
} from "../../../invoice-job-card-viewer/InvoiceJobCardViewer.jsx";
import { AddNewButton } from "../../components/admin/AdminPage";
import {
  CompactFormPanel,
  compactInputClass,
} from "../../components/admin/ContentPanel";
import OwnerAddVehicleForm from "../../components/owner/OwnerAddVehicleForm";
import OwnerEditVehiclePanel from "../../components/owner/OwnerEditVehiclePanel";
import { OwnerHeroCardInlineToolbar } from "../../components/owner/OwnerHeroCardInlineToolbar";
import {
  OwnerInvoicesTable,
  OwnerJobCardsTable,
} from "../../components/owner/OwnerPanelTables";
import OwnerPageShell, { OwnerPageSidebar } from "../../components/owner/OwnerPageShell";
import OwnerVehicleSectionsSidebar, {
  type VehiclePanelSection,
} from "../../components/owner/OwnerVehicleSectionsSidebar";
import { shopAddNewButtonClass } from "../../components/shop/forms/ShopFormPage";
import { shopHeroCardCompactSearchClass } from "../../components/shop/shopLayoutStyles";
import { putJson } from "../../api/mobileAuth";
import { useAuth } from "../../auth";
import { useCarOwnerDocuments } from "../../hooks/useCarOwnerDocuments";
import { useCarOwnerJobCards } from "../../hooks/useCarOwnerJobCards";
import { useCarOwnerVehicles } from "../../hooks/useCarOwnerVehicles";
import { useCarOwnerInvoices, type CarOwnerInvoiceRow } from "../../hooks/useCarOwnerInvoices";
import { useOwnerNavReset, useOwnerSidebarDefault } from "../../hooks/useOwnerNavReset";
import {
  businessName,
  fetchCarOwnerJobCardById,
  formatBusinessPhone,
  formatJobCardDate,
  jobCardLicensePlate,
  jobChipLabel,
  serviceTypeLabel,
} from "../../lib/carOwnerJobCards";
import { formatCurrencyAmount } from "../../lib/currency";
import { resolveCarBrandLogo } from "../../lib/dummyCarBrands";
import {
  VEHICLE_DOCUMENT_FIELDS,
  type VehicleDocumentFieldKey,
} from "../../lib/carOwnerDocuments";
import { type CarOwnerVehicle } from "../../lib/carOwnerVehicles";
import type { CarOwnerJobCard } from "../../types/carOwnerJobCards";

const API_BASE_URL = (import.meta.env.VITE_API_URL as string).replace(/\/+$/, "");

type ViewerKind = "invoice" | "jobcard";

const VEHICLE_SECTIONS: { id: VehiclePanelSection; label: string }[] = [
  { id: "vehicle-details", label: "Vehicle Details" },
  { id: "job-cards", label: "Job Card Details" },
  { id: "invoices", label: "Invoice Details" },
  { id: "documents", label: "Documents" },
  { id: "update-odometer", label: "Update Odometer" },
];

const VEHICLE_SECTION_LABELS: Record<VehiclePanelSection, string> = {
  "vehicle-details": "Vehicle Details",
  "job-cards": "Job Cards",
  invoices: "Invoices",
  documents: "Documents",
  "update-odometer": "Update Odometer",
};

function vehicleSectionLabel(showForm: boolean, activeSection: VehiclePanelSection | null): string | null {
  if (showForm) return "Add your Vehicle";
  if (!activeSection) return null;
  return VEHICLE_SECTION_LABELS[activeSection];
}

function matchesListSearch(query: string, ...parts: (string | number | null | undefined)[]): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return parts.some((part) => String(part ?? "").toLowerCase().includes(q));
}

function sectionNeedsVehicle(section: VehiclePanelSection): boolean {
  return section !== "invoices";
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
  const makeName = (vehicle.make?.name ?? "").trim();
  const makeLogo = resolveCarBrandLogo(makeName ? { companyName: makeName } : null);

  const [value, setValue] = useState(current);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(current);
  }, [vehicle.id, current]);

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
        <div className="min-w-0">
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

          <div className="mt-5 flex items-center gap-4">
            <div className="flex h-12 w-[88px] shrink-0 items-center justify-center overflow-hidden rounded border border-gray-300 bg-white p-1.5">
              {makeName ? (
                <img src={makeLogo} alt="" className="h-full w-full object-contain" />
              ) : (
                <span className="text-[10px] font-semibold text-gray-400">No logo</span>
              )}
            </div>
            <p className="flex min-w-0 flex-1 flex-wrap items-baseline justify-center gap-x-2 text-base font-semibold text-ad-green">
              <span>{remainingKmStatusText(remainingNum)}</span>
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
  const { vehicles, loading, error, refresh } = useCarOwnerVehicles();
  const { sections, loading: docsLoading, mutating, busyField, uploadDocumentField } = useCarOwnerDocuments();

  const [showForm, setShowForm] = useState(false);
  const [addFormDismissed, setAddFormDismissed] = useState(false);
  const [activeSection, setActiveSection] = useState<VehiclePanelSection | null>(VEHICLE_SECTIONS[0].id);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const { items: jobCards, loading: jobCardsLoading, error: jobCardsError } = useCarOwnerJobCards(
    activeSection === "job-cards" || activeSection === "update-odometer" ? selectedVehicleId : null
  );
  const {
    loading: invoicesLoading,
    error: invoicesError,
    invoiceRows: visibleInvoices,
    findJobCardById,
  } = useCarOwnerInvoices();

  const [viewerKind, setViewerKind] = useState<ViewerKind | null>(null);
  const [selectedJobCardId, setSelectedJobCardId] = useState<string | null>(null);
  const [jobCardsSearch, setJobCardsSearch] = useState("");
  const [invoicesSearch, setInvoicesSearch] = useState("");
  const jobCardsRef = useRef<CarOwnerJobCard[]>([]);
  jobCardsRef.current = jobCards;

  useEffect(() => {
    if (activeSection !== "job-cards") setJobCardsSearch("");
    if (activeSection !== "invoices") setInvoicesSearch("");
  }, [activeSection]);

  const filteredJobCards = useMemo(() => {
    const q = jobCardsSearch.trim();
    if (!q) return jobCards;
    return jobCards.filter((jc) =>
      matchesListSearch(
        q,
        businessName(jc.business),
        formatBusinessPhone(jc.business),
        jobCardLicensePlate(jc),
        serviceTypeLabel(jc),
        jobChipLabel(jc),
        jc.jobNo,
        formatJobCardDate(jc.createdAt),
        jc.totalPayableAmount,
        formatCurrencyAmount(jc.totalPayableAmount, countryCode)
      )
    );
  }, [jobCards, jobCardsSearch, countryCode]);

  const filteredInvoices = useMemo(() => {
    const q = invoicesSearch.trim();
    if (!q) return visibleInvoices;
    return visibleInvoices.filter((row) =>
      matchesListSearch(
        q,
        row.shopName,
        row.phone,
        row.plate,
        row.service,
        row.vehicle,
        row.jobNo,
        row.paymentStatus,
        row.paymentMethod,
        formatJobCardDate(row.createdAt),
        row.amount,
        formatCurrencyAmount(row.amount, countryCode)
      )
    );
  }, [visibleInvoices, invoicesSearch, countryCode]);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) ?? null;
  const documentSection = sections.find((s) => s.vehicleId === selectedVehicleId) ?? null;

  useEffect(() => {
    if (!loading && !error && vehicles.length === 0 && !addFormDismissed) {
      setShowForm(true);
      setActiveSection("vehicle-details");
    }
  }, [loading, error, vehicles.length, addFormDismissed]);

  const selectSection = useCallback((id: string) => {
    const section = id as VehiclePanelSection;
    if (vehicles.length === 0) {
      toast.info("Add a vehicle first.");
      return;
    }

    if (showForm) {
      setShowForm(false);
      setAddFormDismissed(true);
    }

    setActiveSection(section);

    if (section === "invoices") {
      setSelectedVehicleId(null);
      return;
    }

    if (vehicles.length === 1) {
      setSelectedVehicleId(vehicles[0].id);
      return;
    }

    setSelectedVehicleId(vehicles[0]?.id ?? null);
  }, [showForm, vehicles]);

  const resetSidebar = useCallback(() => {
    if (vehicles.length === 0) {
      setActiveSection(VEHICLE_SECTIONS[0].id);
      return;
    }
    selectSection(VEHICLE_SECTIONS[0].id);
  }, [selectSection, vehicles.length]);

  useOwnerSidebarDefault(!loading, resetSidebar);
  useOwnerNavReset(resetSidebar);

  const handleVehicleSelect = useCallback((vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
  }, []);

  const handleDocumentUpload = async (vehicleId: string, field: VehicleDocumentFieldKey, file: File) => {
    const res = await uploadDocumentField(vehicleId, field, file);
    if (res.ok) {
      toast.success(res.message ?? "Document saved.");
    } else {
      toast.error(res.message ?? "Could not upload document.");
    }
  };

  const fetchJobCardForViewer = useCallback(
    async (id: string) => {
      if (!token) {
        throw new Error("Please log in again.");
      }

      const res = await fetchCarOwnerJobCardById(token, id);
      if (res.ok && res.data) {
        return res.data;
      }

      const cached = findJobCardById(id) ?? jobCardsRef.current.find((jc) => jc._id === id);
      if (cached) {
        return cached;
      }

      throw new Error("Could not load job card.");
    },
    [token, findJobCardById]
  );

  const handleInvoiceRowClick = (row: CarOwnerInvoiceRow) => {
    setSelectedJobCardId(row.id);
    setViewerKind("invoice");
  };

  const handleJobCardRowClick = (jc: CarOwnerJobCard) => {
    setSelectedJobCardId(jc._id);
    setViewerKind("jobcard");
  };

  const closeViewer = () => {
    setViewerKind(null);
    setSelectedJobCardId(null);
  };

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
          <AddNewButton
            onClick={() => {
              setAddFormDismissed(false);
              setShowForm(true);
              setActiveSection("vehicle-details");
            }}
          />
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
      if (filteredInvoices.length === 0) {
        return <p className="text-sm text-gray-600">No invoices match your search.</p>;
      }
      return (
        <OwnerInvoicesTable
          rows={filteredInvoices}
          countryCode={countryCode}
          onRowClick={handleInvoiceRowClick}
        />
      );
    }

    if (activeSection && sectionNeedsVehicle(activeSection) && !selectedVehicle) {
      return (
        <div className="flex min-h-[320px] items-center justify-center p-6 text-center text-sm text-gray-600">
          Select a vehicle from the sidebar.
        </div>
      );
    }

    if (!selectedVehicle) {
      return <VehiclesPanelPlaceholder />;
    }

    switch (activeSection) {
      case "vehicle-details":
        return (
          <OwnerEditVehiclePanel
            vehicle={selectedVehicle}
            onUpdated={() => void refresh()}
            onDeleted={() => {
              void refresh();
              setSelectedVehicleId(null);
              setActiveSection(null);
            }}
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
        if (filteredJobCards.length === 0) {
          return <p className="text-sm text-gray-600">No job cards match your search.</p>;
        }
        return (
          <OwnerJobCardsTable
            rows={filteredJobCards}
            countryCode={countryCode}
            onRowClick={handleJobCardRowClick}
          />
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

  const mainSectionLabel = vehicleSectionLabel(showForm, activeSection);
  const headerAction =
    !showForm && vehicles.length > 0 && (activeSection === null || activeSection === "vehicle-details") ? (
      <button
        type="button"
        onClick={() => {
          setAddFormDismissed(false);
          setShowForm(true);
          setActiveSection("vehicle-details");
        }}
        className={shopAddNewButtonClass}
      >
        Add New
      </button>
    ) : undefined;
  const sectionSearchInput =
    !showForm && activeSection === "job-cards" ? (
      <input
        id="owner-vehicle-job-cards-search"
        type="search"
        value={jobCardsSearch}
        onChange={(e) => setJobCardsSearch(e.target.value)}
        placeholder="Search job cards…"
        className={shopHeroCardCompactSearchClass}
      />
    ) : !showForm && activeSection === "invoices" ? (
      <input
        id="owner-vehicle-invoices-search"
        type="search"
        value={invoicesSearch}
        onChange={(e) => setInvoicesSearch(e.target.value)}
        placeholder="Search invoices…"
        className={shopHeroCardCompactSearchClass}
      />
    ) : null;

  const showInlineToolbar = Boolean(headerAction || sectionSearchInput);

  return (
    <OwnerPageShell
      pageHeading={mainSectionLabel || "Vehicles"}
      metaTitle="Vehicles | AutoDaddy"
      metaDescription="Car owner vehicles"
      customSidebar={
        <OwnerPageSidebar>
          <OwnerVehicleSectionsSidebar
            sections={VEHICLE_SECTIONS}
            vehicles={vehicles}
            loading={loading}
            activeSection={showForm ? "vehicle-details" : activeSection}
            selectedVehicleId={selectedVehicleId}
            onSectionSelect={selectSection}
            onVehicleSelect={handleVehicleSelect}
          />
        </OwnerPageSidebar>
      }
      heroCardFlush
      contentTopOffset
    >
      {showForm ? (
        <OwnerAddVehicleForm
          onCancel={() => {
            setShowForm(false);
            setAddFormDismissed(true);
          }}
          onAdded={() => {
            setAddFormDismissed(false);
            setShowForm(false);
            void refresh();
            setActiveSection("vehicle-details");
          }}
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-1">
          {showInlineToolbar ? (
            <OwnerHeroCardInlineToolbar>
              {sectionSearchInput}
              {headerAction}
            </OwnerHeroCardInlineToolbar>
          ) : null}
          <div className="min-h-0 flex-1 overflow-y-auto">{renderRightPanel()}</div>
        </div>
      )}

      <InvoiceViewerDialog
        open={viewerKind === "invoice"}
        onClose={closeViewer}
        jobCardId={selectedJobCardId ?? undefined}
        fetchJobCard={fetchJobCardForViewer}
        countryCode={countryCode}
        apiBaseUrl={API_BASE_URL}
      />
      <JobCardViewerDialog
        open={viewerKind === "jobcard"}
        onClose={closeViewer}
        jobCardId={selectedJobCardId ?? undefined}
        fetchJobCard={fetchJobCardForViewer}
        countryCode={countryCode}
        apiBaseUrl={API_BASE_URL}
      />
    </OwnerPageShell>
  );
}
