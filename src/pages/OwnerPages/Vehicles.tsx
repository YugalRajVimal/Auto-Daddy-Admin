import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router";
import { toast } from "react-toastify";
import {
  InvoiceViewerDialog,
  JobCardViewerDialog,
} from "../../../invoice-job-card-viewer/InvoiceJobCardViewer.jsx";
import { AddNewButton } from "../../components/admin/AdminPage";
import OwnerAddVehicleForm from "../../components/owner/OwnerAddVehicleForm";
import OwnerEditVehiclePanel from "../../components/owner/OwnerEditVehiclePanel";
import { OwnerHeroCardInlineToolbar } from "../../components/owner/OwnerHeroCardInlineToolbar";
import {
  OwnerInvoicesTable,
  OwnerJobCardsTable,
  OwnerVehicleDocumentsTable,
} from "../../components/owner/OwnerPanelTables";
import OwnerPageShell, { OwnerPageSidebar } from "../../components/owner/OwnerPageShell";
import OwnerUpdateOdometerPanel from "../../components/owner/OwnerUpdateOdometerPanel";
import OwnerVehicleSectionsSidebar, {
  type VehiclePanelSection,
} from "../../components/owner/OwnerVehicleSectionsSidebar";
import { shopAddNewButtonClass } from "../../components/shop/forms/ShopFormPage";
import { shopHeroCardCompactSearchClass } from "../../components/shop/shopLayoutStyles";
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
import type { CarOwnerJobCard } from "../../types/carOwnerJobCards";

const API_BASE_URL = (import.meta.env.VITE_API_URL as string).replace(/\/+$/, "");

type ViewerKind = "invoice" | "jobcard";

type VehiclesLocationState = {
  vehicleSection?: VehiclePanelSection;
};

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

export default function OwnerVehiclesPage() {
  const { token, session } = useAuth();
  const location = useLocation();
  const countryCode = session?.meta?.countryCode;
  const { vehicles, loading, error, refresh } = useCarOwnerVehicles();
  const { sections, loading: docsLoading, mutating, busyField, uploadDocumentField } = useCarOwnerDocuments();

  const [showForm, setShowForm] = useState(false);
  const [addFormDismissed, setAddFormDismissed] = useState(false);
  const [activeSection, setActiveSection] = useState<VehiclePanelSection | null>(VEHICLE_SECTIONS[0].id);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
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
