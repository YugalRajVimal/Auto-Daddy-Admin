import { useEffect, useState, type ReactNode } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

function PreviewBar({ value, widthClass }: { value: string; widthClass: string }) {
  const filled = Boolean(value.trim());

  return (
    <div className={widthClass}>
      <div className="flex h-[18px] items-center rounded-full bg-[#c8efc8] px-2.5">
        {filled ? (
          <span className="truncate text-[10px] font-bold leading-none text-[#1a6b1a]">{value}</span>
        ) : null}
      </div>
    </div>
  );
}

function DetailPill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex min-h-[22px] items-center rounded-full bg-[#c8efc8] px-2.5 py-1 ${className}`}>
      <span className="truncate text-[10px] font-bold leading-tight text-[#1a6b1a]">{children}</span>
    </div>
  );
}

type OwnerVehicleDetailCardProps = {
  plate: string;
  make: string;
  model: string;
  year: string;
  vin: string;
  odometer: string;
  dueOdometer?: string;
  makeLogo?: string | null;
  imageUri?: string | null;
  title?: string;
  variant?: "preview" | "detail";
  fullHeight?: boolean;
  className?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
  emptyImageLabel?: string;
};

export default function OwnerVehicleDetailCard({
  plate,
  make,
  model,
  year,
  vin,
  odometer,
  dueOdometer = "",
  makeLogo = null,
  imageUri = null,
  title = "Preview",
  variant = "preview",
  fullHeight = false,
  className = "",
  onEdit,
  onDelete,
  deleting = false,
  emptyImageLabel,
}: OwnerVehicleDetailCardProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const plateDisplay = plate.trim() ? plate.trim().toUpperCase() : "----------";
  const odoRaw = odometer.trim().replace(/\s*km$/i, "");
  const dueRaw = dueOdometer.trim().replace(/\s*km$/i, "");

  useEffect(() => {
    if (!imageUri) setViewerOpen(false);
  }, [imageUri]);

  useEffect(() => {
    if (!viewerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setViewerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [viewerOpen]);

  return (
    <>
      <div className={`flex w-full flex-col ${fullHeight ? "h-full min-h-[320px]" : ""} ${className}`.trim()}>
        {title ? <p className="mb-2 shrink-0 text-center text-sm font-semibold text-gray-900">{title}</p> : null}

        <div className="mx-auto flex min-h-0 w-full max-w-[280px] flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_3px_12px_rgba(0,0,0,0.1)]">
          <div className="relative min-h-[120px] flex-1 overflow-hidden bg-[#f3f3f3]">
            {imageUri ? (
              <img src={imageUri} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
            ) : emptyImageLabel ? (
              <div className="flex h-full min-h-[120px] items-center justify-center px-3">
                <p className="text-center text-[11px] font-medium text-gray-500">{emptyImageLabel}</p>
              </div>
            ) : null}
          </div>

          {variant === "detail" ? (
            <div className="shrink-0 bg-[#1a6e1a] px-3 py-2.5">
              <p className="truncate text-center text-[12px] font-bold tracking-wide text-white">{plateDisplay}</p>
            </div>
          ) : (
            <div className="shrink-0 bg-[#1a6e1a] px-2 py-2">
              <div className="rounded border border-dashed border-white px-3 py-1.5">
                <p className="truncate text-center text-[11px] font-bold tracking-[0.2em] text-white">{plateDisplay}</p>
              </div>
            </div>
          )}

          <div className="shrink-0 space-y-2 bg-white px-3 py-2.5">
            {variant === "detail" ? (
              <>
                <div className="flex items-center gap-1.5">
                  <DetailPill className="max-w-[38%] shrink-0">{model.trim() || "Model"}</DetailPill>
                  {makeLogo ? (
                    <img src={makeLogo} alt="" className="h-5 w-9 shrink-0 object-contain" />
                  ) : (
                    <span className="h-5 w-9 shrink-0" />
                  )}
                  <DetailPill className="ml-auto max-w-[42%] shrink-0">
                    {year.trim() ? `Year ${year.trim()}` : "Year"}
                  </DetailPill>
                </div>
                <DetailPill className="w-full">VIN No : {vin.trim() || "—"}</DetailPill>
                <div className="grid grid-cols-2 gap-2">
                  <DetailPill>Odo IN : {odoRaw || "—"}</DetailPill>
                  <DetailPill>Due On : {dueRaw || "—"}</DetailPill>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                  <PreviewBar value={make.trim()} widthClass="w-[88%]" />
                  <PreviewBar value={model.trim()} widthClass="ml-auto w-[76%]" />
                  <PreviewBar value={year.trim()} widthClass="w-[80%]" />
                  <PreviewBar
                    value={odometer.trim() ? (odometer.includes("km") ? odometer.trim() : `${odometer.trim()} km`) : ""}
                    widthClass="ml-auto w-[70%]"
                  />
                </div>
                <PreviewBar value={vin.trim()} widthClass="w-[94%]" />
              </>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-between gap-2 border border-gray-200 bg-white px-2.5 py-1.5">
            <span className="text-[11px] font-semibold text-gray-700">
              {!imageUri && emptyImageLabel ? emptyImageLabel : "Car image"}
            </span>
            <button
              type="button"
              disabled={!imageUri}
              onClick={() => setViewerOpen(true)}
              className="inline-flex min-w-[50px] items-center justify-between rounded border border-gray-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45"
            >
              View
              <span className="ml-1 text-[8px] leading-none" aria-hidden>
                ▾
              </span>
            </button>
          </div>
        </div>

        {onEdit || onDelete ? (
          <div className="mt-3 flex justify-center gap-8">
            {onEdit ? (
              <button
                type="button"
                onClick={onEdit}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#1a6b1a] transition-colors hover:bg-white/60"
                aria-label="Edit vehicle"
              >
                <FiEdit2 size={22} aria-hidden />
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                className="flex h-9 w-9 items-center justify-center rounded-full text-red-600 transition-colors hover:bg-white/60 disabled:opacity-50"
                aria-label="Delete vehicle"
              >
                <FiTrash2 size={22} aria-hidden />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {viewerOpen && imageUri ? (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/55 p-4"
          onClick={() => setViewerOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Vehicle image preview"
        >
          <div
            className="relative max-h-[90vh] max-w-[min(92vw,560px)] rounded-lg border border-gray-300 bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setViewerOpen(false)}
              className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gray-700 text-sm text-white hover:bg-gray-900"
              aria-label="Close"
            >
              ×
            </button>
            <p className="mb-3 text-center text-sm font-semibold text-ad-green-dark">Car image</p>
            <img src={imageUri} alt="Vehicle" className="mx-auto max-h-[75vh] max-w-full object-contain" />
          </div>
        </div>
      ) : null}
    </>
  );
}
