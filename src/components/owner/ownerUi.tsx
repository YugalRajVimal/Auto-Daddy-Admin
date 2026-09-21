import type { MouseEvent, ReactNode } from "react";
import { Link } from "react-router";
import { FiChevronsLeft, FiChevronsRight, FiList } from "react-icons/fi";

/** Mockup palette: purple tabs / side buttons, peach idle buttons, light-green rows and forms. */
export const ownerPeachClass = "bg-[#fde6d2]";
export const ownerGreenRowClass = "bg-[#d4fcd4]";

type SideButtonTone = "purple" | "grey";

/** Left-panel button list: a scrollable row on phones, a vertical stack from lg up. */
export const ownerSideListClass =
  "no-scrollbar flex gap-2.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0";

function sideButtonClass(active: boolean, tone: SideButtonTone) {
  const base =
    "group flex w-auto shrink-0 items-center gap-3 whitespace-nowrap rounded-xl border px-4 py-2.5 lg:w-full lg:shrink lg:whitespace-normal text-left text-[15px] font-medium leading-snug shadow-sm transition-all duration-150 hover:-translate-y-px hover:shadow-md 2xl:text-base";
  if (tone === "grey") {
    return `${base} ${
      active
        ? "border-gray-500 bg-gradient-to-r from-gray-500 to-gray-400 text-white"
        : "border-gray-400/70 bg-gray-100 text-gray-800 hover:bg-gray-50"
    }`;
  }
  return `${base} ${
    active
      ? "border-ad-purple bg-gradient-to-r from-ad-purple to-[#b04aa4] text-white shadow-[0_6px_16px_rgba(155,48,141,0.3)]"
      : `border-ad-purple/45 ${ownerPeachClass} text-ad-purple hover:bg-[#fff0e3]`
  }`;
}

export function OwnerSideButton({
  label,
  active = false,
  tone = "purple",
  to,
  onClick,
  title,
}: {
  label: ReactNode;
  active?: boolean;
  tone?: SideButtonTone;
  to?: string;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  title?: string;
}) {
  const content = (
    <>
      <FiList aria-hidden className={`size-[18px] shrink-0 ${active ? "text-white/90" : "opacity-70"}`} strokeWidth={2.25} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </>
  );
  if (to) {
    return (
      <Link to={to} onClick={onClick} title={title} aria-current={active ? "page" : undefined} className={sideButtonClass(active, tone)}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} title={title} aria-pressed={active} className={sideButtonClass(active, tone)}>
      {content}
    </button>
  );
}

/** Grey page title bar with optional « / » arrows (mockup main-card header). */
export function OwnerTitleBar({
  title,
  onPrev,
  onNext,
  right,
}: {
  title: ReactNode;
  onPrev?: () => void;
  onNext?: () => void;
  right?: ReactNode;
}) {
  const arrowClass =
    "flex size-9 shrink-0 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-white/60 hover:text-ad-purple";
  return (
    <div className="flex min-h-[3.25rem] items-center gap-2 border-b border-gray-300/70 bg-gradient-to-b from-[#dcdcdc] to-[#cdcdcd] px-3 py-1.5">
      <div className="flex w-10 shrink-0 justify-start">
        {onPrev ? (
          <button type="button" onClick={onPrev} className={arrowClass} aria-label="Back">
            <FiChevronsLeft className="size-7" strokeWidth={2.25} />
          </button>
        ) : null}
      </div>
      <h1 className="min-w-0 flex-1 truncate text-center text-lg font-medium tracking-wide text-gray-700 md:text-xl 2xl:text-[1.375rem]">
        {title}
      </h1>
      <div className="flex min-w-10 shrink-0 items-center justify-end gap-2">
        {right}
        {onNext ? (
          <button type="button" onClick={onNext} className={arrowClass} aria-label="Next">
            <FiChevronsRight className="size-7" strokeWidth={2.25} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** Light-green form panel (mockup profile / vehicle / payment forms). */
export const ownerFormPanelClass = `rounded-xl ${ownerGreenRowClass} px-5 py-5 ring-1 ring-green-200/70 sm:px-8`;

/** White input used inside green form panels. */
export const ownerFormInputClass =
  "h-10 w-full rounded-md border border-white bg-white px-3 text-sm text-gray-800 shadow-sm outline-none transition focus:border-ad-purple/50 focus:ring-2 focus:ring-ad-purple/15 disabled:bg-gray-50 disabled:text-gray-500";

export const ownerFormLabelClass = "mb-1.5 block text-sm font-medium text-gray-700";

/** Peach footer under forms: italic hint on the left, green Save + "or Cancel" on the right. */
export function OwnerFormFooter({
  note,
  onSave,
  onCancel,
  saving = false,
  saveLabel = "Save",
  cancelLabel = "Cancel",
  disabled = false,
  children,
}: {
  note?: ReactNode;
  onSave?: () => void;
  onCancel?: () => void;
  saving?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
  disabled?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={`mt-0.5 flex flex-wrap items-center gap-3 rounded-xl ${ownerPeachClass} px-5 py-3 sm:px-8`}>
      <p className="min-w-0 flex-1 text-sm italic text-gray-600">{note}</p>
      {children}
      {onSave ? (
        <button
          type="button"
          onClick={onSave}
          disabled={saving || disabled}
          className="min-w-[8rem] rounded-md bg-gradient-to-b from-[#0d8a0d] to-[#007000] px-6 py-2 text-base font-bold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving…" : saveLabel}
        </button>
      ) : null}
      {onCancel ? (
        <span className="text-sm text-gray-700">
          or{" "}
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="font-medium text-blue-700 underline underline-offset-2 hover:text-ad-purple disabled:opacity-60"
          >
            {cancelLabel}
          </button>
        </span>
      ) : null}
    </div>
  );
}

/** Small "Upload Image" chip with a checkbox, as drawn in the mockup forms. */
export function OwnerUploadChip({
  checked,
  onToggle,
  onPick,
  label = "Upload Image",
  disabled,
}: {
  checked: boolean;
  onToggle: (next: boolean) => void;
  onPick: () => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onToggle(e.target.checked)}
        disabled={disabled}
        className="size-4 accent-ad-purple"
        aria-label={label}
      />
      <button
        type="button"
        onClick={onPick}
        disabled={disabled}
        className="rounded bg-gray-200/90 px-4 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-300 disabled:opacity-60"
      >
        {label}
      </button>
    </div>
  );
}
