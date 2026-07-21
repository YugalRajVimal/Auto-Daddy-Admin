import { useEffect, useState } from "react";
import { toast } from "react-toastify";

type ShopBusinessOpenToggleProps = {
  isBusinessActive: boolean | null;
  updating?: boolean;
  onChange: (next: boolean) => Promise<boolean> | boolean;
};

export default function ShopBusinessOpenToggle({
  isBusinessActive,
  updating = false,
  onChange,
}: ShopBusinessOpenToggleProps) {
  const [open, setOpen] = useState(isBusinessActive ?? true);

  useEffect(() => {
    if (updating) return;
    if (typeof isBusinessActive !== "boolean") return;
    setOpen(isBusinessActive);
  }, [isBusinessActive, updating]);

  const disabled = updating || typeof isBusinessActive !== "boolean";

  const handleToggle = async (next: boolean) => {
    const prev = open;
    setOpen(next);
    try {
      const okRaw = await onChange(next);
      const ok = okRaw == null ? true : Boolean(okRaw);
      if (!ok) {
        setOpen(prev);
        toast.error("Could not update shop status.");
        return;
      }
      toast.success(next ? "Shop marked as open." : "Shop marked as closed.");
    } catch {
      setOpen(prev);
      toast.error("Network error while updating shop status.");
    }
  };

  return (
    <label
      className={`inline-flex shrink-0 items-center gap-2 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
    >
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${
          open
            ? "border-emerald-200 bg-emerald-50 text-ad-green"
            : "border-red-200 bg-red-50 text-red-600"
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${open ? "bg-ad-green" : "bg-red-500"}`}
          aria-hidden
        />
        {open ? "Shop is Open Today" : "Shop is Closed Today"}
      </span>
      <span className="relative inline-flex h-6 w-11 shrink-0">
        <input
          type="checkbox"
          role="switch"
          aria-label={open ? "Close shop" : "Open shop"}
          className="peer sr-only"
          checked={open}
          disabled={disabled}
          onChange={(event) => void handleToggle(event.target.checked)}
        />
        <span className="absolute inset-0 rounded-full bg-gray-300 transition peer-checked:bg-ad-green peer-disabled:cursor-not-allowed" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
