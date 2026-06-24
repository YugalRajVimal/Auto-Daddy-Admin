import { useEffect } from "react";
import type { PartsDealerCard } from "../../hooks/usePartsDealers";
import { formatSalvagePrice, type SalvageDeal } from "../../lib/dummySalvageDeals";

type ShopAdDetailDialogProps = {
  open: boolean;
  onClose: () => void;
  partsDealer?: PartsDealerCard | null;
  salvageDeal?: SalvageDeal | null;
};

export default function ShopAdDetailDialog({
  open,
  onClose,
  partsDealer,
  salvageDeal,
}: ShopAdDetailDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const phoneHref = partsDealer?.phone ? `tel:${partsDealer.phone.replace(/\s/g, "")}` : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close ad details"
        onClick={onClose}
      />

      <div className="relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-lg border border-gray-200 bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-[#006600]">
            {partsDealer ? "Auto Parts Dealer" : "Salvage Deal"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-300 px-2 py-0.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        {partsDealer ? (
          <div className="space-y-4 text-sm text-gray-700">
            {partsDealer.imageUrl ? (
              <img
                src={partsDealer.imageUrl}
                alt={partsDealer.name}
                className="aspect-square w-full rounded-sm border border-[#006600] object-cover"
              />
            ) : null}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Shop</p>
              <p className="text-base font-bold text-gray-900">{partsDealer.name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Phone</p>
              {phoneHref ? (
                <a href={phoneHref} className="font-semibold text-[#006600] hover:underline">
                  {partsDealer.phone}
                </a>
              ) : (
                <p>—</p>
              )}
            </div>
            <p className="rounded-md bg-[#DFFFD6] px-3 py-2 text-xs text-[#006600]">
              Contact this dealer for availability and pricing on auto parts.
            </p>
          </div>
        ) : salvageDeal ? (
          <div className="space-y-4 text-sm text-gray-700">
            {salvageDeal.imageUrl ? (
              <img
                src={salvageDeal.imageUrl}
                alt={salvageDeal.partName}
                className="aspect-square w-full rounded-sm border border-[#006600] object-cover"
              />
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Part</p>
                <p className="font-bold text-gray-900">{salvageDeal.partName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Company</p>
                <p className="font-bold text-gray-900">{salvageDeal.company}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Price</p>
                <p className="font-bold text-[#006600]">{formatSalvagePrice(salvageDeal.price)}</p>
              </div>
              {salvageDeal.year ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Year</p>
                  <p className="font-semibold text-gray-900">{salvageDeal.year}</p>
                </div>
              ) : null}
              {salvageDeal.condition ? (
                <div className="col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Condition</p>
                  <p className="font-semibold text-gray-900">{salvageDeal.condition}</p>
                </div>
              ) : null}
            </div>
            {salvageDeal.notes ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Details</p>
                <p className="leading-relaxed">{salvageDeal.notes}</p>
              </div>
            ) : null}
            <p className="rounded-md bg-[#DFFFD6] px-3 py-2 text-xs text-[#006600]">
              Salvage inventory — confirm fitment and pickup before purchase.
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-600">No details available.</p>
        )}
      </div>
    </div>
  );
}
