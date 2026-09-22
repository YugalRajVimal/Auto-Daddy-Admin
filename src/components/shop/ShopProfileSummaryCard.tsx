import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { FiCamera } from "react-icons/fi";

/** Building blocks for Profile › Personal / Business Info, styled after Admin › My Profile. */

export const profileLabelClass =
  "mb-1 block text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500";

export const profileInputClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-ad-purple/60 focus:ring-2 focus:ring-ad-purple/10 disabled:bg-slate-50 disabled:opacity-70";

const profileInputErrorClass = "border-red-400 focus:border-red-500 focus:ring-red-100";

type IconType = ComponentType<{ className?: string; size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>;

export type ProfileSummaryRow = {
  icon: IconType;
  iconClassName: string;
  value: string;
};

export function profileInputClassWithError(hasError: boolean) {
  return hasError ? `${profileInputClass} ${profileInputErrorClass}` : profileInputClass;
}

export function ProfileField({
  label,
  required,
  error,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className={profileLabelClass}>
        {label}
        {required ? " *" : ""}
      </span>
      {children}
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

/** Photo + summary card on the left. The camera button opens the owner's file picker. */
export function ProfileSummaryCard({
  imageUrl,
  imageAlt,
  fallbackIcon: FallbackIcon,
  title,
  badge,
  rows,
  onPhotoClick,
  photoDisabled,
  photoLabel,
  footer,
}: {
  imageUrl: string | null;
  imageAlt: string;
  fallbackIcon: IconType;
  title: string;
  badge: ReactNode;
  rows: ProfileSummaryRow[];
  onPhotoClick?: () => void;
  photoDisabled?: boolean;
  photoLabel?: string;
  footer?: ReactNode;
}) {
  // Saved photo URLs can be stale; fall back to the icon instead of a broken image.
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [imageUrl]);

  return (
    <aside className="self-start overflow-hidden rounded-2xl border border-white/80 bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-purple-100">
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          {imageUrl && !imageFailed ? (
            <img
              src={imageUrl}
              alt={imageAlt}
              onError={() => setImageFailed(true)}
              className="size-24 rounded-2xl bg-white object-cover shadow-md ring-4 ring-white"
            />
          ) : (
            <div className="flex size-24 items-center justify-center rounded-2xl bg-purple-100 text-ad-purple shadow-md ring-4 ring-white">
              <FallbackIcon size={40} strokeWidth={1.5} aria-hidden />
            </div>
          )}
          {onPhotoClick ? (
            <button
              type="button"
              onClick={onPhotoClick}
              disabled={photoDisabled}
              className="absolute -bottom-2 -right-2 flex size-9 items-center justify-center rounded-full bg-ad-purple text-white shadow-md hover:opacity-90 disabled:opacity-50"
              aria-label={photoLabel ?? "Upload photo"}
              title={photoLabel ?? "Upload photo"}
            >
              <FiCamera size={16} />
            </button>
          ) : null}
        </div>
        <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>
        <span className="mt-1 inline-block rounded-full bg-purple-100 px-2.5 py-1 text-[11px] font-semibold text-ad-purple">
          {badge}
        </span>
      </div>

      <ul className="mt-5 space-y-2.5 text-left text-sm text-slate-600">
        {rows.map(({ icon: Icon, iconClassName, value }, index) => (
          <li key={index} className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2">
            <Icon className={`shrink-0 ${iconClassName}`} size={14} />
            <span className="truncate">{value}</span>
          </li>
        ))}
      </ul>

      {footer ? <div className="mt-4 text-center">{footer}</div> : null}
    </aside>
  );
}

/** White "Edit details" card on the right with Reset / Save changes actions. */
export function ProfileDetailsCard({
  icon: Icon,
  title,
  subtitle,
  children,
  saving,
  dirty,
  saveLabel = "Save changes",
  onSave,
  onReset,
}: {
  icon: IconType;
  title: string;
  subtitle: string;
  children: ReactNode;
  saving: boolean;
  dirty: boolean;
  saveLabel?: string;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-white/80 bg-white/95 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-black/5 md:p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-ad-purple">
          <Icon size={16} />
        </span>
        <div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>

      {children}

      <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onReset}
          disabled={saving || !dirty}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !dirty}
          className="rounded-xl bg-ad-purple px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : saveLabel}
        </button>
      </div>
    </section>
  );
}

/** Two-column profile layout: summary card on the left, details card on the right. */
export function ProfileSplitLayout({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">{children}</div>;
}
