import type { ReactNode } from "react";

/** Soft grey input used on shop settings forms. */
export const shopSoftInputClass =
  "w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-2.5 text-base text-gray-800 placeholder:text-gray-400 transition-colors focus:border-ad-purple focus:bg-white focus:outline-none focus:ring-2 focus:ring-ad-purple/20 disabled:cursor-not-allowed disabled:text-gray-500";

/** Solid green primary button (Save). */
export const shopSaveButtonClass =
  "inline-flex min-w-[8.5rem] items-center justify-center rounded-lg bg-[#0a8a0a] px-6 py-2 text-lg font-bold tracking-wide text-white shadow-[0_6px_14px_rgba(10,138,10,0.28)] transition-all hover:-translate-y-px hover:bg-[#087508] disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none";

type ShopSaveBarProps = {
  onSave: () => void;
  onReset?: () => void;
  saving?: boolean;
  disabled?: boolean;
  saveLabel?: string;
  resetLabel?: string;
  className?: string;
};

/** "Save or Reset" action row from the shop mockups. */
export function ShopSaveBar({
  onSave,
  onReset,
  saving = false,
  disabled = false,
  saveLabel = "Save",
  resetLabel = "Reset",
  className = "",
}: ShopSaveBarProps) {
  return (
    <div className={`flex items-center justify-end gap-4 ${className}`.trim()}>
      <button
        type="button"
        onClick={onSave}
        disabled={saving || disabled}
        className={shopSaveButtonClass}
      >
        {saving ? "Saving…" : saveLabel}
      </button>
      {onReset ? (
        <span className="text-base text-gray-700">
          or{" "}
          <button
            type="button"
            onClick={onReset}
            disabled={saving}
            className="font-medium text-blue-700 underline underline-offset-2 hover:text-ad-purple disabled:opacity-60"
          >
            {resetLabel}
          </button>
        </span>
      ) : null}
    </div>
  );
}

/** Label / control row used on settings forms (right-aligned label on wide screens). */
export function ShopFieldRow({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid items-center gap-2 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6">
      <label htmlFor={htmlFor} className="text-base font-semibold text-gray-800 sm:text-right sm:text-lg">
        {label}
      </label>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Large mint link card (Settings list, subscription plans, What's New). */
export function ShopLinkCard({
  title,
  onClick,
  trailing,
  children,
}: {
  title: string;
  onClick?: () => void;
  trailing?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="group rounded-xl border border-[#bdeebd] bg-gradient-to-r from-[#d6fcd6] to-[#e9fde9] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-4 px-6 py-5 sm:px-10">
        <button
          type="button"
          onClick={onClick}
          className="text-left text-xl font-bold text-[#0a7a0a] underline decoration-2 underline-offset-4 transition-colors hover:text-ad-purple sm:text-2xl"
        >
          {title}
        </button>
        {trailing}
      </div>
      {children}
    </div>
  );
}
