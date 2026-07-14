import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  FiChevronDown,
  FiChevronUp,
  FiFileText,
  FiImage,
  FiUpload,
} from "react-icons/fi";
import { Navigate, useParams } from "react-router";
import { toast } from "react-toastify";
import OwnerPageShell from "../../../components/owner/OwnerPageShell";
import { Skeleton } from "../../../components/common/Skeleton";
import { useOwnerNavReset } from "../../../hooks/useOwnerNavReset";
import { useCarOwnerDocuments } from "../../../hooks/useCarOwnerDocuments";
import { useCarOwnerVehicles } from "../../../hooks/useCarOwnerVehicles";
import {
  DIGI_PURSE_CATEGORIES,
  fieldLabelForCategory,
  fieldsForCategory,
  type DigiPurseCategoryId,
  type VehicleDocumentFieldKey,
  type VehicleDocumentsSection,
} from "../../../lib/carOwnerDocuments";

function uploadedCount(section: VehicleDocumentsSection, category: DigiPurseCategoryId) {
  const keys = fieldsForCategory(category);
  if (keys.length === 0) return { done: 0, total: 0 };
  const visible = section.fields.filter((f) => keys.includes(f.key));
  const done = visible.filter((f) => Boolean(f.uri)).length;
  return { done, total: visible.length };
}

function DocumentFieldPanel({
  category,
  vehicleId,
  fieldKey,
  uri,
  busy,
  disabled,
  onUpload,
}: {
  category: DigiPurseCategoryId;
  vehicleId: string;
  fieldKey: VehicleDocumentFieldKey;
  uri: string | null;
  busy: boolean;
  disabled: boolean;
  onUpload: (vehicleId: string, field: VehicleDocumentFieldKey, file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const label = fieldLabelForCategory(category, fieldKey);
  const hasImage = Boolean(uri);

  return (
    <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 bg-white/70 px-4 py-3.5 first:border-t-0 sm:px-5">
      <div className="relative flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-slate-100 shadow-inner">
        {uri ? (
          <a href={uri} target="_blank" rel="noopener noreferrer" className="h-full w-full">
            <img src={uri} alt="" className="h-full w-full object-cover" />
          </a>
        ) : (
          <FiImage className="text-slate-300" size={22} aria-hidden />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">
          {hasImage ? "Tap preview to view full size" : "Not uploaded yet"}
        </p>
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
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-ad-purple to-ad-purple-dark px-3.5 py-2 text-xs font-semibold text-white shadow-[0_6px_14px_rgba(155,48,141,0.28)] transition hover:brightness-105 disabled:opacity-50"
        >
          <FiUpload size={13} aria-hidden />
          {busy ? "Uploading…" : hasImage ? "Replace" : "Upload"}
        </button>
      </div>
    </div>
  );
}

function VehicleDocumentRow({
  section,
  category,
  expanded,
  onToggle,
  busyField,
  mutating,
  onUpload,
}: {
  section: VehicleDocumentsSection;
  category: DigiPurseCategoryId;
  expanded: boolean;
  onToggle: () => void;
  busyField: string | null;
  mutating: boolean;
  onUpload: (vehicleId: string, field: VehicleDocumentFieldKey, file: File) => void;
}) {
  const categoryFields = fieldsForCategory(category);
  const visibleFields = section.fields.filter((f) => categoryFields.includes(f.key));
  const { done, total } = uploadedCount(section, category);
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <article className="overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-black/5">
      <button
        type="button"
        onClick={onToggle}
        className="group flex w-full items-center gap-3 bg-gradient-to-r from-ad-purple/95 to-ad-purple-dark px-4 py-3.5 text-left text-white sm:px-5"
      >
        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/15 ring-1 ring-white/25">
          {section.thumbUri ? (
            <img src={section.thumbUri} alt="" className="h-full w-full object-cover" />
          ) : (
            <FiFileText size={18} aria-hidden />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold tracking-wide">
            {section.title || section.subtitle || "Vehicle"}
          </span>
          {section.subtitle ? (
            <span className="mt-0.5 block truncate text-xs text-white/70">{section.subtitle}</span>
          ) : null}
          {total > 0 ? (
            <span className="mt-2 block h-1 max-w-[10rem] overflow-hidden rounded-full bg-white/20">
              <span
                className="block h-full rounded-full bg-white/90 transition-all"
                style={{ width: `${progress}%` }}
              />
            </span>
          ) : null}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {total > 0 ? (
            <span className="hidden rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white/90 sm:inline">
              {done}/{total}
            </span>
          ) : null}
          {expanded ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
        </span>
      </button>
      {expanded ? (
        <div className="bg-gradient-to-b from-ad-bg-purple/35 to-white/80">
          {visibleFields.length === 0 ? (
            <p className="px-5 py-5 text-sm text-slate-500">
              {category === "other-documents"
                ? "No other documents for this vehicle."
                : "No documents in this category yet."}
            </p>
          ) : (
            visibleFields.map((field) => (
              <DocumentFieldPanel
                key={field.key}
                category={category}
                vehicleId={section.vehicleId}
                fieldKey={field.key}
                uri={field.uri}
                busy={busyField === `${section.vehicleId}:${field.key}`}
                disabled={mutating}
                onUpload={onUpload}
              />
            ))
          )}
        </div>
      ) : null}
    </article>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ad-purple/20 bg-white/60 px-6 py-14 text-center shadow-sm backdrop-blur-sm">
      <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-ad-bg-purple text-ad-purple">
        <FiFileText size={22} aria-hidden />
      </span>
      <p className="max-w-sm text-sm text-slate-600">{children}</p>
    </div>
  );
}

export default function OwnerDocumentsPage() {
  const { vehicleId } = useParams<{ vehicleId?: string }>();
  const { vehicles, loading: vehiclesLoading } = useCarOwnerVehicles();
  const { sections, loading, error, mutating, busyField, refresh, uploadDocumentField } =
    useCarOwnerDocuments();

  const [category, setCategory] = useState<DigiPurseCategoryId>(DIGI_PURSE_CATEGORIES[0].id);
  const [expandedVehicleId, setExpandedVehicleId] = useState<string | null>(null);

  const firstVehicleId = vehicles[0]?.id;

  useEffect(() => {
    if (vehicleId) setExpandedVehicleId(vehicleId);
  }, [vehicleId]);

  const resetSidebar = useCallback(() => {
    setCategory(DIGI_PURSE_CATEGORIES[0].id);
    setExpandedVehicleId(vehicleId ?? null);
  }, [vehicleId]);

  useOwnerNavReset(resetSidebar);

  const visibleSections = useMemo(() => {
    if (!vehicleId) return sections;
    return sections.filter((s) => s.vehicleId === vehicleId);
  }, [sections, vehicleId]);

  const activeVehicle = useMemo(
    () => vehicles.find((v) => v.id === vehicleId) ?? null,
    [vehicles, vehicleId]
  );
  const plateLabel = activeVehicle?.licensePlateNo?.trim() || null;
  const categoryLabel =
    DIGI_PURSE_CATEGORIES.find((c) => c.id === category)?.label ?? "Documents";

  const handleCategoryChange = (next: DigiPurseCategoryId) => {
    setCategory(next);
    setExpandedVehicleId(vehicleId ?? null);
  };

  const handleUpload = async (id: string, field: VehicleDocumentFieldKey, file: File) => {
    const res = await uploadDocumentField(id, field, file);
    if (res.ok) {
      toast.success(res.message ?? "Document saved.");
    } else {
      toast.error(res.message ?? "Could not upload document.");
    }
  };

  if (!vehiclesLoading && !vehicleId && firstVehicleId) {
    return <Navigate to={`/owner/documents/${firstVehicleId}`} replace />;
  }

  return (
    <OwnerPageShell
      pageHeading=""
      metaTitle="Documents | AutoDaddy"
      metaDescription="Car owner documents"
      noPanel
      sidebarItems={DIGI_PURSE_CATEGORIES.map((item) => ({
        id: item.id,
        label: item.label,
        variant: "primary" as const,
      }))}
      activeSidebarId={category}
      onSidebarSelect={(id) => handleCategoryChange(id as DigiPurseCategoryId)}
    >
      <div className="flex flex-col gap-4">
        <header className="space-y-1">
          <p className="text-sm text-slate-500">
            {plateLabel ? (
              <>
                Digi purse for <span className="font-medium text-slate-700">{plateLabel}</span>
              </>
            ) : (
              "Upload and manage vehicle documents"
            )}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            {categoryLabel}
          </h1>
        </header>

        {loading || vehiclesLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        ) : error ? (
          <EmptyState>
            <span className="mb-3 block font-semibold text-slate-800">{error}</span>
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-xl bg-ad-purple px-4 py-2 text-sm font-semibold text-white shadow-sm"
            >
              Try again
            </button>
          </EmptyState>
        ) : visibleSections.length === 0 ? (
          <EmptyState>No vehicles on file. Add a vehicle to upload documents.</EmptyState>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleSections.map((section) => (
              <VehicleDocumentRow
                key={section.vehicleId}
                section={section}
                category={category}
                expanded={expandedVehicleId === section.vehicleId || visibleSections.length === 1}
                onToggle={() =>
                  setExpandedVehicleId((cur) =>
                    cur === section.vehicleId ? null : section.vehicleId
                  )
                }
                busyField={busyField}
                mutating={mutating}
                onUpload={(id, field, file) => void handleUpload(id, field, file)}
              />
            ))}
          </div>
        )}
      </div>
    </OwnerPageShell>
  );
}
