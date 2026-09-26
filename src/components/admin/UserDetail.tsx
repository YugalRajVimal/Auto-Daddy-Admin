import type { ReactNode } from "react";
import { FaCamera } from "react-icons/fa";
import { FiEdit } from "react-icons/fi";

/**
 * Building blocks for the read-only user detail screens (car owner, shop owner, dealer):
 * a grey "who + which section" panel on the left and a white detail panel on the right.
 */

export function UserDetailLayout({
  name,
  views,
  view,
  onViewChange,
  leftExtra,
  children,
  bottom,
}: {
  name: string;
  views: string[];
  view: string;
  onViewChange: (next: string) => void;
  /** Rendered under the section dropdown (vehicle list, shop logo, …). */
  leftExtra?: ReactNode;
  children: ReactNode;
  /** Full-width strip under both panels (e.g. the "Overview" bar). */
  bottom?: ReactNode;
}) {
  return (
    <div>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <aside className="min-h-[360px] rounded-xl border border-gray-600 bg-[#f4f4f4] px-5 py-5">
          <h2 className="mb-5 text-center font-serif text-xl font-bold text-[#0a7a0a]">{name || "—"}</h2>
          <label className="mb-1 block text-base text-gray-900" htmlFor="user-detail-view">
            Title
          </label>
          <select
            id="user-detail-view"
            value={view}
            onChange={(e) => onViewChange(e.target.value)}
            className="h-10 w-full rounded-md border border-gray-400 bg-white px-3 text-base text-gray-800"
          >
            {views.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          {leftExtra ? <div className="mt-6">{leftExtra}</div> : null}
        </aside>
        <section className="min-h-[360px] rounded-xl border border-gray-600 bg-white px-6 py-6 sm:px-10">
          {children}
        </section>
      </div>
      {bottom ? <div className="mt-6">{bottom}</div> : null}
    </div>
  );
}

export function DetailEditLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="mb-5 text-base text-[#0000ee] underline hover:text-blue-900">
      {children}
    </button>
  );
}

export function DetailGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-x-16 gap-y-4 md:grid-cols-2">{children}</div>;
}

/** Read-only value shown in an input-like box. */
export function DetailField({ label, value }: { label: string; value?: ReactNode }) {
  const empty = value === undefined || value === null || value === "";
  return (
    <div>
      <p className="mb-1 text-base text-gray-900">{label}</p>
      <div className="flex min-h-[40px] items-center rounded-md border border-gray-400 bg-white px-4 text-base text-gray-900">
        {empty ? <span className="text-gray-400">—</span> : value}
      </div>
    </div>
  );
}

/** Rounded picture box with the blue camera badge; opens the file when one exists. */
export function PhotoTile({
  label,
  src,
  className = "",
}: {
  label?: string;
  src?: string | null;
  className?: string;
}) {
  return (
    <figure className={`flex flex-col items-start ${className}`}>
      <div className="relative h-[110px] w-[110px] rounded-xl border border-gray-400 bg-white">
        {src ? (
          <img src={src} alt={label ?? ""} className="h-full w-full rounded-xl object-cover" />
        ) : null}
        {src ? (
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            aria-label={label ? `Open ${label}` : "Open image"}
            className="absolute -bottom-2 -right-3 rounded bg-white p-0.5 text-[#0000ff] hover:text-blue-900"
          >
            <FaCamera size={24} />
          </a>
        ) : (
          <span className="absolute -bottom-2 -right-3 rounded bg-white p-0.5 text-[#0000ff] opacity-40" aria-hidden>
            <FaCamera size={24} />
          </span>
        )}
      </div>
      {label ? <figcaption className="mt-3 text-base text-gray-900">{label}</figcaption> : null}
    </figure>
  );
}

/** Lavender vehicle pill with the edit-pen icon, as in the Vehicles / Job Cards screens. */
export function VehiclePill({
  label,
  active,
  onSelect,
  onEdit,
}: {
  label: string;
  active?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-md px-4 py-3 ${
        active ? "bg-[#b9b9fa]" : "bg-[#cfcffc]"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex-1 text-left text-base font-bold tracking-wide text-gray-900"
      >
        {label}
      </button>
      {onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${label}`}
          className="text-[#1a1aff] hover:text-blue-900"
        >
          <FiEdit size={26} />
        </button>
      ) : null}
    </div>
  );
}

/** Collapsible full-width strip (the "Overview" bar). */
export function OverviewBar({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group rounded-xl border border-gray-500 bg-white">
      <summary className="cursor-pointer list-none px-8 py-4 font-serif text-2xl font-bold text-gray-700">
        {title}
      </summary>
      <div className="border-t border-gray-200 px-8 py-5">{children}</div>
    </details>
  );
}
