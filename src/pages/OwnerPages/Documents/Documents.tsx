import { useMemo, useRef, type ReactNode } from "react";
import { FiFileText, FiImage, FiTruck, FiUpload } from "react-icons/fi";
import { Navigate, useParams } from "react-router";
import { toast } from "react-toastify";
import OwnerPageShell, { ownerPageIntroClass } from "../../../components/owner/OwnerPageShell";
import { Skeleton } from "../../../components/common/Skeleton";
import { useCarOwnerDocuments } from "../../../hooks/useCarOwnerDocuments";
import { useCarOwnerVehicles } from "../../../hooks/useCarOwnerVehicles";
import {
  type VehicleDocumentFieldKey,
  type VehicleDocumentsSection,
} from "../../../lib/carOwnerDocuments";

function DocumentFieldPanel({
  vehicleId,
  fieldKey,
  label,
  uri,
  busy,
  disabled,
  onUpload,
}: {
  vehicleId: string;
  fieldKey: VehicleDocumentFieldKey;
  label: string;
  uri: string | null;
  busy: boolean;
  disabled: boolean;
  onUpload: (vehicleId: string, field: VehicleDocumentFieldKey, file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
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

function DocumentsCard({
  section,
  busyField,
  mutating,
  onUpload,
}: {
  section: VehicleDocumentsSection;
  busyField: string | null;
  mutating: boolean;
  onUpload: (vehicleId: string, field: VehicleDocumentFieldKey, file: File) => void;
}) {
  const done = section.fields.filter((f) => Boolean(f.uri)).length;
  const total = section.fields.length;

  return (
    <article className="overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-black/5">
      <div className="flex items-center gap-3 bg-gradient-to-r from-ad-purple/95 to-ad-purple-dark px-4 py-3.5 text-white sm:px-5">
        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/15 ring-1 ring-white/25">
          {section.thumbUri ? (
            <img src={section.thumbUri} alt="" className="h-full w-full object-cover" />
          ) : (
            <FiTruck size={18} aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold tracking-wide">
            {section.title || section.subtitle || "Vehicle"}
          </p>
          {section.subtitle ? (
            <p className="mt-0.5 truncate text-xs text-white/70">{section.subtitle}</p>
          ) : null}
        </div>
        {total > 0 ? (
          <span className="hidden shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white/90 sm:inline">
            {done}/{total}
          </span>
        ) : null}
      </div>

      <div className="bg-gradient-to-b from-ad-bg-purple/35 to-white/80">
        {section.fields.length === 0 ? (
          <p className="px-5 py-5 text-sm text-slate-500">No documents for this vehicle yet.</p>
        ) : (
          section.fields.map((field) => (
            <DocumentFieldPanel
              key={field.key}
              vehicleId={section.vehicleId}
              fieldKey={field.key}
              label={field.label}
              uri={field.uri}
              busy={busyField === `${section.vehicleId}:${field.key}`}
              disabled={mutating}
              onUpload={onUpload}
            />
          ))
        )}
      </div>
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

  const firstVehicleId = vehicles[0]?.id;

  const visibleSections = useMemo(() => {
    if (!vehicleId) return sections;
    return sections.filter((s) => s.vehicleId === vehicleId);
  }, [sections, vehicleId]);

  const activeVehicle = useMemo(
    () => vehicles.find((v) => v.id === vehicleId) ?? null,
    [vehicles, vehicleId]
  );
  const plateLabel = activeVehicle?.licensePlateNo?.trim() || null;

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
    >
      <div className="flex flex-col gap-4">
        <header className={`${ownerPageIntroClass} space-y-1`}>
          <p className="text-sm text-slate-500">
            {plateLabel ? (
              <>
                Digi purse for <span className="font-medium text-slate-700">{plateLabel}</span>
              </>
            ) : (
              "Upload and manage vehicle documents"
            )}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Documents</h1>
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
              <DocumentsCard
                key={section.vehicleId}
                section={section}
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
