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
  serviceTypeLabel,
} from "../../../lib/carOwnerJobCards";
import { formatCurrencyAmount } from "../../../lib/currency";
import {
  VEHICLE_DOCUMENT_FIELDS,
  type VehicleDocumentFieldKey,
} from "../../../lib/carOwnerDocuments";
import { type CarOwnerVehicle } from "../../../lib/carOwnerVehicles";
import { resolveCarBrandLogo } from "../../../lib/dummyCarBrands";
import { withDummyVehicles } from "../../../lib/dummyOwnerHomeProfile";
import { normalizeMediaUrl } from "../../../lib/normalizeMediaUrl";
import type { CarOwnerJobCard } from "../../../types/carOwnerJobCards";
import {
  FiClipboard,
  FiFileText,
  FiPlus,
  FiTrash2,
  FiTruck,
  FiUpload,
} from "react-icons/fi";
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
  const { vehicles: apiVehicles, loading, error, refresh } = useCarOwnerVehicles();
  const vehicleSource = withDummyVehicles(apiVehicles);
  const vehicles = vehicleSource.vehicles;
  const usingDummy = vehicleSource.usingDummy;
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
    if (!loading && !error && apiVehicles.length === 0 && !addFormDismissed && !usingDummy) {
      setShowForm(false);
      setActiveSection(null);
    }
  }, [loading, error, apiVehicles.length, addFormDismissed, usingDummy]);

  const resetSidebar = useCallback(() => {
    setShowForm(false);
    setActiveSection(null);
    setSelectedVehicleId((current) => current ?? vehicles[0]?.id ?? null);
  }, [vehicles]);

  useOwnerSidebarDefault(!loading, resetSidebar);
  useOwnerNavReset(resetSidebar);

  const deleteVehicleFromList = useCallback(
    async (vehicleId: string) => {
      if (usingDummy || vehicleId.startsWith("dummy-")) {
        toast.info("Demo vehicles can’t be removed. Add a real vehicle to manage your garage.");
        return;
      }
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
    [refresh, token, usingDummy]
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

    if (apiVehicles.length === 0 && !usingDummy) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 px-5 py-12 text-center">
          <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <FiTruck size={24} />
            </span>
            <h3 className="text-lg font-bold text-slate-900">No vehicles yet</h3>
            <p className="text-sm text-slate-600">Add your first car to track odometer, docs, and service history.</p>
            <button
              type="button"
              onClick={() => {
                setAddFormDismissed(false);
                setShowForm(true);
                setActiveSection(null);
              }}
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white hover:bg-sky-700"
            >
              <FiPlus size={16} /> Add vehicle
            </button>
          </div>
        </div>
      );
    }

    if (!activeSection) {
      const CARD_THEMES = [
        {
          shell: "from-sky-50 via-white to-cyan-50 ring-sky-100",
          bar: "bg-sky-500",
          progress: "bg-sky-500",
          chip: "bg-sky-50 text-sky-800 ring-sky-100",
        },
        {
          shell: "from-emerald-50 via-white to-teal-50 ring-emerald-100",
          bar: "bg-emerald-500",
          progress: "bg-emerald-500",
          chip: "bg-emerald-50 text-emerald-800 ring-emerald-100",
        },
        {
          shell: "from-amber-50 via-white to-orange-50 ring-amber-100",
          bar: "bg-amber-500",
          progress: "bg-amber-500",
          chip: "bg-amber-50 text-amber-900 ring-amber-100",
        },
        {
          shell: "from-indigo-50 via-white to-violet-50 ring-indigo-100",
          bar: "bg-indigo-500",
          progress: "bg-indigo-500",
          chip: "bg-indigo-50 text-indigo-800 ring-indigo-100",
        },
      ] as const;

      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {vehicles.map((v, index) => {
              const plate = plateLabel(v);
              const make = (v.make?.name ?? "").trim();
              const model = (v.make?.model ?? "").trim();
              const year = v.year != null ? String(v.year) : "";
              const title = [make, model].filter(Boolean).join(" ") || "Vehicle";
              const vin = (v.vinNo ?? "").trim();
              const current = odometerToNumber(v.odometerReading);
              const due = odometerToNumber(v.dueOdometerReading);
              const remaining = remainingKmNumber(due, current);
              const progressPct =
                current != null && due != null && due > 0
                  ? Math.min(100, Math.max(0, Math.round((current / due) * 100)))
                  : null;
              const overdue = remaining != null && remaining < 0;
              const dueSoon = remaining != null && remaining >= 0 && remaining <= 1500;
              const vehicleThumb =
                normalizeMediaUrl(v.carImage ?? v.carImages?.[0] ?? null) ||
                resolveCarBrandLogo(make ? { companyName: make } : null);
              const theme = CARD_THEMES[index % CARD_THEMES.length];
              const statusTone = overdue
                ? "bg-rose-50 text-rose-700 ring-rose-100"
                : dueSoon
                  ? "bg-amber-50 text-amber-800 ring-amber-100"
                  : "bg-emerald-50 text-emerald-800 ring-emerald-100";

              return (
                <article
                  key={v.id}
                  className={`group relative overflow-hidden rounded-2xl border border-white/90 bg-gradient-to-br ${theme.shell} shadow-[0_10px_28px_rgba(15,23,42,0.06)] ring-1 transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(15,23,42,0.12)]`}
                >
                  <div className={`h-1.5 w-full ${theme.bar}`} />
                  <div className="p-4 sm:p-5">
                    <div className="flex gap-4">
                      <div className="flex h-24 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 sm:h-28 sm:w-32">
                        <img
                          src={vehicleThumb}
                          alt=""
                          className="h-full w-full object-contain p-3"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (usingDummy) {
                                toast.info("Demo vehicle — add a real vehicle to edit details.");
                                return;
                              }
                              setSelectedVehicleId(v.id);
                              setActiveSection("vehicle-details");
                              setVehicleDetailsMode("edit");
                            }}
                            className="min-w-0 text-left"
                          >
                            <p className="text-xl font-bold tracking-tight text-slate-900 underline-offset-2 group-hover:underline sm:text-2xl">
                              {plate}
                            </p>
                            <p className="mt-1 truncate text-sm font-semibold text-slate-700">
                              {title}
                              {year ? (
                                <span className="font-medium text-slate-500">{` · ${year}`}</span>
                              ) : null}
                            </p>
                          </button>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ${theme.chip}`}
                          >
                            Garage
                          </span>
                        </div>
                        {vin ? (
                          <p className="mt-2 truncate font-mono text-[11px] text-slate-500">
                            VIN {vin}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl bg-white/80 p-3 ring-1 ring-black/5">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-slate-600">Odometer</span>
                        <span className={`rounded-full px-2 py-0.5 font-bold ring-1 ${statusTone}`}>
                          {formatOdometerStatus(remaining)}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Current
                          </p>
                          <p className="text-lg font-bold tabular-nums text-slate-900">
                            {current != null ? current.toLocaleString() : "—"}
                            <span className="ml-1 text-xs font-semibold text-slate-500">km</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Service due
                          </p>
                          <p className="text-sm font-bold tabular-nums text-slate-700">
                            {due != null ? `${due.toLocaleString()} km` : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all ${
                            overdue ? "bg-rose-500" : theme.progress
                          }`}
                          style={{ width: `${progressPct ?? 8}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate("/owner/expenses/job-cards")}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100 transition hover:bg-indigo-100"
                      >
                        <FiClipboard size={13} /> Job cards
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (usingDummy) {
                            toast.info("Demo vehicle — documents open for real vehicles.");
                            return;
                          }
                          navigate(`/owner/documents/${v.id}`);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 ring-1 ring-teal-100 transition hover:bg-teal-100"
                      >
                        <FiUpload size={13} /> Docs
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate("/owner/expenses/invoices")}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 ring-1 ring-amber-100 transition hover:bg-amber-100"
                      >
                        <FiFileText size={13} /> Invoices
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteVehicleFromList(v.id)}
                        className="ml-auto inline-flex size-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        aria-label="Delete vehicle"
                        title="Delete"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              setAddFormDismissed(false);
              setShowForm(true);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-sky-200 bg-sky-50/70 px-4 py-5 text-sm font-bold text-sky-800 transition hover:border-sky-300 hover:bg-sky-50"
          >
            <FiPlus size={16} /> Add another vehicle
          </button>
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
      pageHeading=""
      metaTitle="My Vehicles | AutoDaddy"
      metaDescription="Car owner vehicles"
      noPanel
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-slate-500">Garage</p>
              {usingDummy ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800 ring-1 ring-amber-100">
                  Demo vehicles
                </span>
              ) : null}
            </div>
            <h2 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
              {mainSectionLabel || "My vehicles"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Manage plates, documents, and service history for every car you own.
            </p>
          </div>
          {!showForm && !activeSection ? (
            <button
              type="button"
              onClick={() => {
                setAddFormDismissed(false);
                setShowForm(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white hover:bg-sky-700"
            >
              <FiPlus size={16} /> Add vehicle
            </button>
          ) : null}
          {!showForm && activeSection ? (
            <button
              type="button"
              onClick={() => {
                setActiveSection(null);
                setVehicleDetailsMode("view");
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to list
            </button>
          ) : null}
        </div>

        <div className="rounded-2xl border border-white/80 bg-white/70 p-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)] ring-1 ring-black/5 sm:p-4">
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
