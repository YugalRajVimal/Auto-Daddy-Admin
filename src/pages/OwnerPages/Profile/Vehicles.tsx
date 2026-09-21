import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "react-toastify";
import {
  InvoiceViewerDialog,
  JobCardViewerDialog,
} from "../../../../invoice-job-card-viewer/InvoiceJobCardViewer.jsx";
import { deleteJson } from "../../../api/mobileAuth";
import OwnerAddVehicleForm from "../../../components/owner/OwnerAddVehicleForm";
import OwnerEditVehiclePanel from "../../../components/owner/OwnerEditVehiclePanel";
import {
  OwnerInvoicesTable,
  OwnerJobCardsTable,
  OwnerVehicleDocumentsTable,
} from "../../../components/owner/OwnerPanelTables";
import OwnerPageShell from "../../../components/owner/OwnerPageShell";
import { AddVehicleTile } from "../../../components/owner/OwnerAddVehicleTile";
import OwnerUpdateOdometerPanel from "../../../components/owner/OwnerUpdateOdometerPanel";
import type { VehiclePanelSection } from "../../../components/owner/OwnerVehicleSectionsSidebar";
import { useAuth } from "../../../auth";
import { useCarOwnerDocuments } from "../../../hooks/useCarOwnerDocuments";
import { useCarOwnerJobCards } from "../../../hooks/useCarOwnerJobCards";
import { useCarOwnerVehicles } from "../../../hooks/useCarOwnerVehicles";
import { useCarOwnerInvoices, type CarOwnerInvoiceRow } from "../../../hooks/useCarOwnerInvoices";
import { useOwnerNavReset, useOwnerSidebarDefault } from "../../../hooks/useOwnerNavReset";
import {
  businessName,
  fetchCarOwnerJobCardById,
  formatBusinessPhone,
  formatJobCardDate,
  jobCardLicensePlate,
  jobChipLabel,
  resolveCarOwnerJobCardForViewer,
  serviceTypeLabel,
} from "../../../lib/carOwnerJobCards";
import { formatCurrencyAmount } from "../../../lib/currency";
import {
  VEHICLE_DOCUMENT_FIELDS,
  type VehicleDocumentFieldKey,
} from "../../../lib/carOwnerDocuments";
import { type CarOwnerVehicle } from "../../../lib/carOwnerVehicles";
import { resolveCarBrandLogo } from "../../../lib/dummyCarBrands";
import { normalizeMediaUrl } from "../../../lib/normalizeMediaUrl";
import type { CarOwnerJobCard } from "../../../types/carOwnerJobCards";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { odometerToNumber, remainingKmNumber, formatOdometerStatus } from "../../../lib/carOwnerOdometer";

const API_BASE_URL = (import.meta.env.VITE_API_URL as string).replace(/\/+$/, "");

type ViewerKind = "invoice" | "jobcard";

type VehiclesLocationState = {
  vehicleSection?: VehiclePanelSection;
};

const VEHICLE_SECTION_LABELS: Record<VehiclePanelSection, string> = {
  "vehicle-details": "Vehicle Details",
  "job-cards": "Job Cards",
  invoices: "Invoices",
  documents: "Documents",
  "update-odometer": "Update Odometer",
};

function vehicleSectionLabel(showForm: boolean, activeSection: VehiclePanelSection | null): string | null {
  if (showForm) return "Add Vehicle";
  if (!activeSection) return null;
  return VEHICLE_SECTION_LABELS[activeSection];
}

function plateLabel(vehicle: CarOwnerVehicle): string {
  return vehicle.licensePlateNo?.trim().toUpperCase() || "—";
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

export default function OwnerVehiclesPage() {
  const { token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const countryCode = "+1";
  const { vehicles, loading, error, refresh } = useCarOwnerVehicles();
  const { sections, loading: docsLoading, mutating, busyField, uploadDocumentField } = useCarOwnerDocuments();

  const [showForm, setShowForm] = useState(false);
  const [addFormDismissed, setAddFormDismissed] = useState(false);
  const [activeSection, setActiveSection] = useState<VehiclePanelSection | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [vehicleDetailsMode, setVehicleDetailsMode] = useState<"view" | "edit">("view");
  const deepLinkApplied = useRef(false);
  const [odometerMode, setOdometerMode] = useState(
    () => (location.state as VehiclesLocationState | null)?.vehicleSection === "update-odometer",
  );

  // The left-panel "Update Odometer" shortcut can be pressed while already on this page.
  useEffect(() => {
    if ((location.state as VehiclesLocationState | null)?.vehicleSection === "update-odometer") {
      setOdometerMode(true);
      setShowForm(false);
    }
  }, [location.key, location.state]);

  useEffect(() => {
    const section = (location.state as VehiclesLocationState | null)?.vehicleSection;
    if (!section || section === "update-odometer" || deepLinkApplied.current) return;
    deepLinkApplied.current = true;
    setActiveSection(section);
    if (section !== "invoices") {
      setSelectedVehicleId((current) => current ?? vehicles[0]?.id ?? null);
    }
  }, [location.state, vehicles]);

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
      setShowForm(false);
      setActiveSection(null);
    }
  }, [loading, error, vehicles.length, addFormDismissed]);

  const resetSidebar = useCallback(() => {
    setShowForm(false);
    setActiveSection(null);
    setSelectedVehicleId((current) => current ?? vehicles[0]?.id ?? null);
  }, [vehicles]);

  useOwnerSidebarDefault(!loading, resetSidebar);
  useOwnerNavReset(
    useCallback(() => {
      setOdometerMode(false);
      resetSidebar();
    }, [resetSidebar]),
  );

  const deleteVehicleFromList = useCallback(
    async (vehicleId: string) => {
      if (!token) {
        toast.error("Please log in again.");
        return;
      }
      if (!window.confirm("Remove this vehicle from your list?")) return;

      const res = await deleteJson<{ success?: boolean; message?: string }>(
        "/api/user/vehicle",
        token,
        { vehicleId }
      );

      const message = typeof res.data?.message === "string" ? res.data.message.trim() : "";
      if (!res.ok || res.data?.success === false) {
        toast.error(message || "Could not remove vehicle.");
        return;
      }
      toast.success(message || "Vehicle removed.");
      setSelectedVehicleId((current) => (current === vehicleId ? null : current));
      setActiveSection(null);
      setVehicleDetailsMode("view");
      void refresh();
    },
    [refresh, token]
  );

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
        const resolved = resolveCarOwnerJobCardForViewer(res.data);
        if (resolved) return resolved;
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
        <div className="flex min-h-[420px] items-center justify-center rounded-xl bg-[#d4fcd4]">
          <AddVehicleTile
            onClick={() => {
              setAddFormDismissed(false);
              setShowForm(true);
              setActiveSection(null);
            }}
          />
        </div>
      );
    }

    if (!activeSection) {
      const actionClass =
        "rounded-md border border-ad-purple/50 bg-[#fde6d2] px-3 py-1.5 text-xs font-semibold text-ad-purple shadow-sm transition hover:-translate-y-px hover:bg-[#fff0e3] sm:px-4 sm:text-sm";
      return (
        <div className="flex flex-col gap-3">
          {vehicles.map((v) => {
            const plate = plateLabel(v);
            const make = (v.make?.name ?? "").trim();
            const model = (v.make?.model ?? "").trim();
            const year = v.year != null ? String(v.year) : "";
            const title = [make, model, year].filter(Boolean).join(" ") || "Vehicle";
            const current = odometerToNumber(v.odometerReading);
            const due = odometerToNumber(v.dueOdometerReading);
            const remaining = remainingKmNumber(due, current);
            const overdue = remaining != null && remaining < 0;
            const vehicleThumb =
              normalizeMediaUrl(v.carImage ?? v.carImages?.[0] ?? null) ||
              resolveCarBrandLogo(make ? { companyName: make } : null);

            return (
              <article
                key={v.id}
                className="group grid grid-cols-[96px_minmax(0,1fr)] overflow-hidden rounded-xl bg-[#d4fcd4] shadow-sm ring-1 ring-green-200 transition hover:shadow-md sm:grid-cols-[136px_minmax(0,1fr)]"
              >
                <div className="flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-950 p-3">
                  <img
                    src={vehicleThumb}
                    alt=""
                    className="max-h-16 w-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.visibility = "hidden";
                    }}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVehicleId(v.id);
                      setActiveSection("vehicle-details");
                      setVehicleDetailsMode("view");
                    }}
                    className="min-w-[10rem] flex-1 text-left sm:text-center"
                  >
                    <span className="block text-2xl font-bold tracking-wide text-ad-purple sm:text-[1.75rem]">{plate}</span>
                    <span className="block truncate text-xs text-gray-600">
                      {title}
                      {v.vinNo ? ` · VIN ${v.vinNo}` : ""}
                    </span>
                    <span className="mt-0.5 block text-xs text-gray-600">
                      {current != null ? `${current.toLocaleString()} km` : "Odometer —"}
                      {due != null ? ` · due ${due.toLocaleString()} km · ` : " · "}
                      <span className={`font-semibold ${overdue ? "text-red-600" : "text-blue-700"}`}>
                        {formatOdometerStatus(remaining)}
                      </span>
                    </span>
                  </button>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/owner/expenses/job-cards?vehicleId=${encodeURIComponent(v.id)}`)}
                      className={actionClass}
                    >
                      Job-Card
                    </button>
                    <button type="button" onClick={() => navigate(`/owner/documents/${v.id}`)} className={actionClass}>
                      Docs
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/owner/expenses/invoices?vehicleId=${encodeURIComponent(v.id)}`)}
                      className={actionClass}
                    >
                      Invoices
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVehicleId(v.id);
                        setActiveSection("vehicle-details");
                        setVehicleDetailsMode("edit");
                      }}
                      className="flex size-10 items-center justify-center rounded-lg text-blue-600 transition hover:bg-white/70"
                      aria-label={`Edit ${plate}`}
                      title="Edit"
                    >
                      <FiEdit size={22} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteVehicleFromList(v.id)}
                      className="flex size-10 items-center justify-center rounded-lg text-ad-purple transition hover:bg-white/70 hover:text-red-600"
                      aria-label={`Delete ${plate}`}
                      title="Delete"
                    >
                      <FiTrash2 size={22} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          <AddVehicleTile
            compact
            onClick={() => {
              setAddFormDismissed(false);
              setShowForm(true);
            }}
          />
        </div>
      );
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
              setVehicleDetailsMode("view");
            }}
            startEditing={vehicleDetailsMode === "edit"}
            onBack={() => {
              setActiveSection(null);
              setVehicleDetailsMode("view");
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
          <OwnerVehicleDocumentsTable
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
        if (!selectedVehicle) return null;
        return (
          <OwnerUpdateOdometerPanel
            vehicles={[selectedVehicle]}
            token={token}
            skipVehiclePicker
            onBack={() => setActiveSection("vehicle-details")}
            onSaved={() => void refresh()}
          />
        );

      default:
        return null;
    }
  };

  const mainSectionLabel = vehicleSectionLabel(showForm, activeSection);

  return (
    <OwnerPageShell
      pageHeading={odometerMode ? "" : mainSectionLabel || "My Vehicle"}
      onTitlePrev={
        !odometerMode && (showForm || activeSection)
          ? () => {
              setShowForm(false);
              setActiveSection(null);
              setVehicleDetailsMode("view");
            }
          : undefined
      }
      metaTitle="My Vehicles | AutoDaddy"
      metaDescription="Car owner vehicles"
      noPanel
    >
      {odometerMode ? (
        <OwnerUpdateOdometerPanel
          vehicles={vehicles}
          loading={loading}
          error={error}
          token={token}
          onBack={() => setOdometerMode(false)}
          onExit={() => setOdometerMode(false)}
          onSaved={() => void refresh()}
        />
      ) : (
        <div className="p-3 sm:p-4">
          {showForm ? (
            <div className="flex flex-col gap-6">
              <OwnerAddVehicleForm
                onCancel={() => {
                  setShowForm(false);
                  setAddFormDismissed(true);
                }}
                onAdded={() => {
                  setAddFormDismissed(false);
                  setShowForm(false);
                  void refresh();
                  setActiveSection(null);
                }}
              />
            </div>
          ) : (
            <div className="min-h-0 flex-1">{renderRightPanel()}</div>
          )}
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
