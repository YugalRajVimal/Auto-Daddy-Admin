import { useEffect } from "react";

type OwnerFaqsDialogProps = {
  open: boolean;
  onClose: () => void;
  heading?: string;
  description?: string;
};

export default function OwnerFaqsDialog({ open, onClose, heading, description }: OwnerFaqsDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const lines = (description ?? "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close FAQs"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg border border-gray-200 bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-ad-purple">{heading || "FAQs"}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-300 px-2 py-0.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
        {lines.length > 0 ? (
          <ul className="space-y-3 text-sm leading-relaxed text-gray-700">
            {lines.map((line, idx) => (
              <li key={idx}>{line}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-600">No FAQs available right now.</p>
        )}
      </div>
    </div>
  );
}
