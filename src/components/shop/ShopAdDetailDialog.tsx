import { useEffect } from "react";
import type { PartsDealerCard } from "../../hooks/usePartsDealers";
import type { SalvageDeal } from "../../lib/dummySalvageDeals";
import ShopAdDetailContent from "./ShopAdDetailContent";

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close ad details"
        onClick={onClose}
      />

      <div className="relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-lg border border-gray-200 bg-white p-5 shadow-xl">
        <ShopAdDetailContent partsDealer={partsDealer} salvageDeal={salvageDeal} onClose={onClose} />
      </div>
    </div>
  );
}
