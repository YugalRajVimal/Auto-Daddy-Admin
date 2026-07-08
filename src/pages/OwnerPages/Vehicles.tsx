import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "react-toastify";
import {
  InvoiceViewerDialog,
  JobCardViewerDialog,
} from "../../../invoice-job-card-viewer/InvoiceJobCardViewer.jsx";
import { putJson } from "../../api/mobileAuth";
import OwnerAddVehicleForm from "../../components/owner/OwnerAddVehicleForm";
import OwnerEditVehiclePanel from "../../components/owner/OwnerEditVehiclePanel";
import {
  OwnerInvoicesTable,
  OwnerJobCardsTable,
  OwnerVehicleDocumentsTable,
} from "../../components/owner/OwnerPanelTables";
import OwnerPageShell, { OwnerPageSidebar } from "../../components/owner/OwnerPageShell";
import OwnerProfileSidebarNav from "../../components/owner/OwnerProfileSidebarNav";
import OwnerUpdateOdometerPanel from "../../components/owner/OwnerUpdateOdometerPanel";
import type { VehiclePanelSection } from "../../components/owner/OwnerVehicleSectionsSidebar";
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
import {
  VEHICLE_DOCUMENT_FIELDS,
  type VehicleDocumentFieldKey,
} from "../../lib/carOwnerDocuments";
import { type CarOwnerVehicle } from "../../lib/carOwnerVehicles";
import { resolveCarBrandLogo } from "../../lib/dummyCarBrands";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";
import type { CarOwnerJobCard } from "../../types/carOwnerJobCards";

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
  if (showForm) return "Add your Vehicle";
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
  const { token, session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const countryCode = session?.meta?.countryCode;
  const { vehicles, loading, error, refresh } = useCarOwnerVehicles();
  const { sections, loading: docsLoading, mutating, busyField, uploadDocumentField } = useCarOwnerDocuments();

  const [showForm, setShowForm] = useState(false);
  const [addFormDismissed, setAddFormDismissed] = useState(false);
  const [activeSection, setActiveSection] = useState<VehiclePanelSection | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [vehicleDetailsMode, setVehicleDetailsMode] = useState<"view" | "edit">("view");
  const deepLinkApplied = useRef(false);

  useEffect(() => {
    const section = (location.state as VehiclesLocationState | null)?.vehicleSection;
    if (!section || deepLinkApplied.current) return;
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
  useOwnerNavReset(resetSidebar);

  const deleteVehicleFromList = useCallback(
    async (vehicleId: string) => {
      if (!token) {
        toast.error("Please log in again.");
        return;
      }
      if (!window.confirm("Remove this vehicle from your list?")) return;

      const res = await putJson<{ success?: boolean; message?: string }>(
        `/api/user/vehicle/${vehicleId}`,
        { disabled: true },
        token
      );

      const message = typeof res.data?.message === "string" ? res.data.message.trim() : "";
      if (!res.ok) {
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
        <div className="rounded-[18px] bg-ad-green-light px-5 py-10 md:px-6">
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-center">
            <button
              type="button"
              onClick={() => {
                setAddFormDismissed(false);
                setShowForm(true);
                setActiveSection(null);
              }}
              className="group flex flex-col items-center gap-2"
            >
              <div className="flex h-36 w-36 items-center justify-center rounded-2xl border border-gray-400 bg-white shadow-sm transition-transform group-hover:scale-[1.01]">
                <img src="/images/add-vehicle.png" alt="" className="h-24 w-24 object-contain" />
              </div>
              <span className="text-sm font-semibold text-blue-700 underline group-hover:text-blue-800">
                Add Vehicle Info
              </span>
            </button>
          </div>
        </div>
      );
    }

    if (!activeSection) {
      return (
        <div className="w-full">
          <div className="space-y-3">
            <div className="w-full">
              <div className="space-y-3">
                {vehicles.map((v) => {
                  const plate = plateLabel(v);
                  const make = (v.make?.name ?? "").trim();
                  const vehicleThumb =
                    normalizeMediaUrl(v.carImage ?? v.carImages?.[0] ?? null) ||
                    resolveCarBrandLogo(make ? ({ companyName: make, brandLogo: null } as any) : null);
                  return (
                    <div
                      key={v.id}
                      className="flex w-full flex-wrap items-center gap-3 rounded-md bg-[#bff5bf] px-3 py-3"
                    >
                      <div className="flex h-14 w-24 items-center justify-center overflow-hidden rounded bg-white/80">
                        <img
                          src={vehicleThumb}
                          alt=""
                          className="h-full w-full object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>

                      <div className="min-w-0 flex-1 text-center text-lg font-bold text-ad-purple">
                        {plate}
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {[
                          { label: "Job-Card", section: "job-cards" as const },
                          { label: "Docs", section: "documents" as const },
                          { label: "Invoices", section: "invoices" as const },
                        ].map((btn) => (
                          <button
                            key={btn.label}
                            type="button"
                            onClick={() => {
                              setSelectedVehicleId(v.id);
                              if (btn.section === "job-cards") {
                                navigate("/owner/expenses/job-cards");
                                return;
                              }
                              if (btn.section === "invoices") {
                                navigate("/owner/invoices");
                                return;
                              }
                              setActiveSection(btn.section);
                              setVehicleDetailsMode("view");
                            }}
                            className="rounded border border-gray-400 bg-[#ffe6cc] px-4 py-1 text-xs font-semibold text-ad-purple hover:bg-[#ffd9b3]"
                          >
                            {btn.label}
                          </button>
                        ))}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVehicleId(v.id);
                            setActiveSection("vehicle-details");
                            setVehicleDetailsMode("edit");
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center bg-transparent text-blue-700 hover:text-blue-800"
                          aria-label="Edit vehicle"
                          title="Edit"
                        >
                          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                            <path d="M14.69 2.86a1.5 1.5 0 0 1 2.12 2.12l-9.4 9.4-3.2.58.58-3.2 9.4-9.4Z" />
                            <path d="M3 17h14v1H3v-1Z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            void deleteVehicleFromList(v.id);
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center bg-transparent text-ad-purple hover:text-ad-purple-dark"
                          aria-label="Delete vehicle"
                          title="Delete"
                        >
                          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                            <path
                              fillRule="evenodd"
                              d="M7 2a1 1 0 0 0-1 1v1H3.5a.5.5 0 0 0 0 1H4l.6 12.1A2 2 0 0 0 6.6 19h6.8a2 2 0 0 0 2-1.9L16 5h.5a.5.5 0 0 0 0-1H14V3a1 1 0 0 0-1-1H7Zm1 2V3h4v1H8Zm-1.4 3a.5.5 0 0 1 .5.48l.4 8a.5.5 0 0 1-1 .05l-.4-8A.5.5 0 0 1 6.6 7Zm4 .48a.5.5 0 0 0-1 0l-.1 8a.5.5 0 0 0 1 .02l.1-8Zm2.8-.48a.5.5 0 0 1 .5.53l-.4 8a.5.5 0 1 1-1-.05l.4-8a.5.5 0 0 1 .5-.48Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-center py-8">
              <button
                type="button"
                onClick={() => {
                  setAddFormDismissed(false);
                  setShowForm(true);
                }}
                className="group flex flex-col items-center gap-2"
              >
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-gray-400 bg-white shadow-sm transition-transform group-hover:scale-[1.01]">
                  <img src="/images/add-vehicle.png" alt="" className="h-16 w-16 object-contain" />
                </div>
                <span className="text-xs font-semibold text-blue-700 underline">Add Vehicle Info</span>
              </button>
            </div>
          </div>
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
      pageHeading="My Vehicle"
      metaTitle="My Vehicles | AutoDaddy"
      metaDescription="Car owner vehicles"
      customSidebar={
        <OwnerPageSidebar>
          <OwnerProfileSidebarNav />
        </OwnerPageSidebar>
      }
      heroCardFlush
      contentTopOffset
    >
      <div className="overflow-hidden rounded border border-gray-300 bg-white shadow-sm">
        <div className="flex items-center gap-2 bg-ad-purple px-3 py-2">
          {!showForm && activeSection ? (
            <button
              type="button"
              onClick={() => setActiveSection(null)}
              className="rounded border border-white/70 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/15"
            >
              Back
            </button>
          ) : (
            <span className="w-[56px]" aria-hidden />
          )}

          <h2 className="flex-1 text-center text-sm font-bold text-white sm:text-base">
            {mainSectionLabel || "My Vehicle"}
          </h2>

          <span className="w-[56px]" aria-hidden />
        </div>

        <div className="p-2 sm:p-3">
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
            setActiveSection(null);
          }}
        />
      ) : (
        <div className="min-h-0 flex-1">{renderRightPanel()}</div>
      )}
        </div>
      </div>

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
