import type { ReactNode } from "react";
import { useFormRevealFocus } from "../shop/ShopAnimated";
import { useRef } from "react";
import { PanelBottomBorder, compactInputClass } from "./ContentPanel";

export type AdminSearchFieldOption = { value: string; label: string };

export type AdminSearchField =
  | {
      key: string;
      label: string;
      type?: "text" | "select" | "date" | "number";
      placeholder?: string;
      options?: AdminSearchFieldOption[];
    }
  | {
      key: string;
      label: string;
      type: "range";
      fromKey: string;
      toKey: string;
      inputType?: "text" | "date" | "number";
      fromPlaceholder?: string;
      toPlaceholder?: string;
    };

export type AdminSearchValues = Record<string, string>;

type AdminSearchCardProps = {
  fields: AdminSearchField[];
  values: AdminSearchValues;
  onChange: (next: AdminSearchValues) => void;
  onSearch: () => void;
  onReset: () => void;
  onClose?: () => void;
  className?: string;
  /** Optional extra content below the field grid (e.g. notes). */
  children?: ReactNode;
};

function splitColumns<T>(items: T[]): [T[], T[]] {
  const mid = Math.ceil(items.length / 2);
  return [items.slice(0, mid), items.slice(mid)];
}

function SearchFieldControl({
  field,
  values,
  onChange,
}: {
  field: AdminSearchField;
  values: AdminSearchValues;
  onChange: (next: AdminSearchValues) => void;
}) {
  const setValue = (key: string, value: string) => onChange({ ...values, [key]: value });

  if (field.type === "range") {
    const inputType = field.inputType ?? "text";
    return (
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <input
          type={inputType}
          value={values[field.fromKey] ?? ""}
          onChange={(e) => setValue(field.fromKey, e.target.value)}
          placeholder={field.fromPlaceholder}
          className={compactInputClass}
        />
        <span className="shrink-0 text-xs text-gray-600">to</span>
        <input
          type={inputType}
          value={values[field.toKey] ?? ""}
          onChange={(e) => setValue(field.toKey, e.target.value)}
          placeholder={field.toPlaceholder}
          className={compactInputClass}
        />
      </div>
    );
  }

  const type = field.type ?? "text";

  if (type === "select") {
    return (
      <select
        value={values[field.key] ?? ""}
        onChange={(e) => setValue(field.key, e.target.value)}
        className={compactInputClass}
      >
        <option value="">{field.placeholder ?? "All"}</option>
        {(field.options ?? []).map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type={type}
      value={values[field.key] ?? ""}
      onChange={(e) => setValue(field.key, e.target.value)}
      placeholder={field.placeholder}
      className={compactInputClass}
    />
  );
}

function SearchFieldRow({
  field,
  values,
  onChange,
}: {
  field: AdminSearchField;
  values: AdminSearchValues;
  onChange: (next: AdminSearchValues) => void;
}) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-x-3 gap-y-1 sm:grid-cols-[130px_minmax(0,1fr)]">
      <label className="text-right text-xs font-bold text-gray-700">{field.label}</label>
      <SearchFieldControl field={field} values={values} onChange={onChange} />
    </div>
  );
}

/**
 * Collapsible advanced-filter panel (FreshKhata-style), opened from the toolbar Filters button.
 * Place in AdminPage `between` like CompactFormPanel.
 */
export default function AdminSearchCard({
  fields,
  values,
  onChange,
  onSearch,
  onReset,
  onClose,
  className = "",
  children,
}: AdminSearchCardProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFormRevealFocus(true, panelRef);
  const [leftFields, rightFields] = splitColumns(fields);

  return (
    <div
      ref={panelRef}
      className={`relative mb-10 rounded border border-gray-300 bg-gray-100 shadow-sm ${className}`}
    >
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          title="Close filters"
          aria-label="Close filters"
          className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded border border-gray-400 bg-white text-gray-600 hover:bg-gray-50"
        >
          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden className="fill-current">
            <path d="M3.2 2.3 8 7.1l4.8-4.8.9.9L8.9 8l4.8 4.8-.9.9L8 8.9l-4.8 4.8-.9-.9L7.1 8 2.3 3.2l.9-.9z" />
          </svg>
        </button>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
        className="space-y-4 px-4 py-4 pr-10"
      >
        <div className="grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2">
          <div className="space-y-3">
            {leftFields.map((field) => (
              <SearchFieldRow key={field.key} field={field} values={values} onChange={onChange} />
            ))}
          </div>
          <div className="space-y-3">
            {rightFields.map((field) => (
              <SearchFieldRow key={field.key} field={field} values={values} onChange={onChange} />
            ))}
          </div>
        </div>

        {children}

        <div className="flex items-center justify-center gap-2 pt-1">
          <button
            type="submit"
            className="rounded bg-gray-600 px-5 py-1.5 text-sm font-bold text-white hover:bg-gray-700"
          >
            Search
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded border border-gray-400 bg-gray-200 px-5 py-1.5 text-sm font-bold text-gray-800 hover:bg-gray-300"
          >
            Reset
          </button>
        </div>
      </form>

      <PanelBottomBorder fill="#d1d5db" />
    </div>
  );
}

/** Empty string map for the given search fields (including range from/to keys). */
export function emptyAdminSearchValues(fields: AdminSearchField[]): AdminSearchValues {
  const next: AdminSearchValues = {};
  for (const field of fields) {
    if (field.type === "range") {
      next[field.fromKey] = "";
      next[field.toKey] = "";
    } else {
      next[field.key] = "";
    }
  }
  return next;
}

/** Case-insensitive includes check; empty needle always matches. */
export function searchIncludes(haystack: string | number | null | undefined, needle: string): boolean {
  if (!needle.trim()) return true;
  return String(haystack ?? "")
    .toLowerCase()
    .includes(needle.trim().toLowerCase());
}

/** Exact (case-insensitive) match when needle is set; empty needle always matches. */
export function searchEquals(haystack: string | number | null | undefined, needle: string): boolean {
  if (!needle.trim()) return true;
  return String(haystack ?? "").toLowerCase() === needle.trim().toLowerCase();
}
