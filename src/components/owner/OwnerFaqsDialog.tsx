import { useEffect, useState } from "react";
import { FiChevronDown, FiHelpCircle } from "react-icons/fi";
import type { DummyFaqItem } from "../../lib/dummyOwnerHomeProfile";

type OwnerFaqsDialogProps = {
  open: boolean;
  onClose: () => void;
  heading?: string;
  description?: string;
  items?: DummyFaqItem[];
  loading?: boolean;
};

export default function OwnerFaqsDialog({
  open,
  onClose,
  heading,
  description,
  items,
  loading = false,
}: OwnerFaqsDialogProps) {
  const [openIndex, setOpenIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    setOpenIndex(0);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const faqItems = items?.filter((item) => item.question?.trim() || item.answer?.trim()) ?? [];
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

        {loading ? (
          <p className="text-sm text-gray-600">Loading FAQs…</p>
        ) : faqItems.length > 0 ? (
          <div className="space-y-2">
            {faqItems.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={`${item.question}-${index}`}
                  className="overflow-hidden rounded-lg border border-gray-200 bg-white"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                    className="flex w-full items-center gap-3 px-3 py-3 text-left"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-sky-50 text-sky-700">
                      <FiHelpCircle size={14} />
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-semibold text-slate-900">
                      {item.question}
                    </span>
                    <FiChevronDown
                      className={`shrink-0 text-slate-400 transition ${isOpen ? "rotate-180 text-sky-600" : ""}`}
                      size={16}
                    />
                  </button>
                  {isOpen && item.answer?.trim() ? (
                    <div className="border-t border-gray-100 px-3 py-2.5 pl-12 text-sm leading-relaxed text-slate-600">
                      {item.answer}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : lines.length > 0 ? (
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
