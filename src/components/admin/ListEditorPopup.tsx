import { compactInputClass } from "./ContentPanel";

type ListEditorPopupProps = {
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
  onSave: () => void;
  onCancel: () => void;
  placeholder?: string;
  inputMode?: "text" | "numeric";
};

export default function ListEditorPopup({
  title,
  items,
  onChange,
  onSave,
  onCancel,
  placeholder = "",
  inputMode = "text",
}: ListEditorPopupProps) {
  const addItem = () => onChange([...items, ""]);
  const updateItem = (idx: number, value: string) =>
    onChange(items.map((item, i) => (i === idx ? value : item)));
  const removeItem = (idx: number) =>
    onChange(items.length <= 1 ? [""] : items.filter((_, i) => i !== idx));

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="flex w-full max-w-sm flex-col overflow-hidden rounded border border-gray-300 bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-ad-green-light px-4 py-2.5 text-center text-sm font-bold text-ad-green-dark">
          {title}
        </div>
        <div className="max-h-[50vh] overflow-y-auto px-4 py-3">
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode={inputMode === "numeric" ? "numeric" : "text"}
                  value={item}
                  onChange={(e) =>
                    updateItem(
                      idx,
                      inputMode === "numeric" ? e.target.value.replace(/\D/g, "") : e.target.value
                    )
                  }
                  placeholder={placeholder}
                  className={`${compactInputClass} min-w-0 flex-1`}
                  autoFocus={idx === items.length - 1 && item === ""}
                />
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="shrink-0 text-base font-bold leading-none text-red-600 hover:text-red-800"
                  aria-label="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addItem}
            className="mt-3 text-xs font-semibold text-blue-700 hover:underline"
          >
            + More
          </button>
        </div>
        <div className="flex items-center justify-center gap-4 border-t border-gray-200 px-4 py-3">
          <button
            type="button"
            onClick={onSave}
            className="rounded bg-ad-green px-6 py-1.5 text-xs font-semibold text-white hover:bg-ad-green-dark"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
