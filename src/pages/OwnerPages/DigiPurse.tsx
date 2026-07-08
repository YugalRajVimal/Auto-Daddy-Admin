import { useCallback, useRef, useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { toast } from "react-toastify";
import OwnerPageShell from "../../components/owner/OwnerPageShell";
import { useOwnerNavReset } from "../../hooks/useOwnerNavReset";
import { useCarOwnerDocuments } from "../../hooks/useCarOwnerDocuments";
import {
  DIGI_PURSE_CATEGORIES,
  fieldLabelForCategory,
  fieldsForCategory,
  type DigiPurseCategoryId,
  type VehicleDocumentFieldKey,
  type VehicleDocumentsSection,
} from "../../lib/carOwnerDocuments";

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
        <p className="text-xs text-gray-600">{hasImage ? "Tap image to view full size" : "Not uploaded yet"}</p>
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

  return (
    <article className="overflow-hidden rounded-r-md shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between bg-[#CCFFCC] px-4 py-3 text-left transition-colors hover:bg-[#b8f0b8]"
      >
        <span className="text-sm font-bold text-[#006600]">{section.title}</span>
        {expanded ? (
          <FiChevronUp className="shrink-0 text-[#006600]" aria-hidden />
        ) : (
          <FiChevronDown className="shrink-0 text-[#006600]" aria-hidden />
        )}
      </button>

      {expanded ? (
        <div className="border-t border-[#b2e0a0] bg-[#e8ffe8]">
          {category === "other-documents" ? (
            <p className="px-4 py-4 text-sm text-gray-600">No other documents for this vehicle.</p>
          ) : (
            visibleFields.map((field) => {
              const fieldBusy = busyField === `${section.vehicleId}:${field.key}`;
              return (
                <DocumentFieldPanel
                  key={field.key}
                  category={category}
                  vehicleId={section.vehicleId}
                  fieldKey={field.key}
                  uri={field.uri}
                  busy={fieldBusy}
                  disabled={mutating && !fieldBusy}
                  onUpload={onUpload}
                />
              );
            })
          )}
        </div>
      ) : null}
    </article>
  );
}

export default function OwnerDigiPursePage() {
  const { sections, loading, error, mutating, busyField, refresh, uploadDocumentField } =
    useCarOwnerDocuments();

  const [category, setCategory] = useState<DigiPurseCategoryId>(DIGI_PURSE_CATEGORIES[0].id);
  const [expandedVehicleId, setExpandedVehicleId] = useState<string | null>(null);

  const resetSidebar = useCallback(() => {
    setCategory(DIGI_PURSE_CATEGORIES[0].id);
    setExpandedVehicleId(null);
  }, []);

  useOwnerNavReset(resetSidebar);

  const handleCategoryChange = (next: DigiPurseCategoryId) => {
    setCategory(next);
    setExpandedVehicleId(null);
  };

  const handleUpload = async (vehicleId: string, field: VehicleDocumentFieldKey, file: File) => {
    const res = await uploadDocumentField(vehicleId, field, file);
    if (res.ok) {
      toast.success(res.message ?? "Document saved.");
    } else {
      toast.error(res.message ?? "Could not upload document.");
    }
  };

  return (
    <OwnerPageShell
      pageHeading="Digi Purse"
      metaTitle="Digi Purse | AutoDaddy"
      metaDescription="Car owner documents"
      sidebarItems={DIGI_PURSE_CATEGORIES.map((item) => ({
        id: item.id,
        label: item.label,
        variant: "primary" as const,
      }))}
      activeSidebarId={category}
      onSidebarSelect={(id) => handleCategoryChange(id as DigiPurseCategoryId)}
      heroCardFlush
      contentTopOffset
    >
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm font-semibold text-gray-800">{error}</p>
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-md bg-ad-purple px-4 py-2 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </div>
        ) : sections.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-gray-600">
            No vehicles on file. Add a vehicle to upload documents.
          </div>
        ) : (
          sections.map((section) => (
            <VehicleDocumentRow
              key={section.vehicleId}
              section={section}
              category={category}
              expanded={expandedVehicleId === section.vehicleId}
              onToggle={() =>
                setExpandedVehicleId((cur) => (cur === section.vehicleId ? null : section.vehicleId))
              }
              busyField={busyField}
              mutating={mutating}
              onUpload={(vehicleId, field, file) => void handleUpload(vehicleId, field, file)}
            />
          ))
        )}
      </div>
    </OwnerPageShell>
  );
}
