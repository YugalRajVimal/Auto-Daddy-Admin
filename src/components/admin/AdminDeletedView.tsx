import type { AdminViewMode } from "../../hooks/useAdminDeletedView";

export function AdminDeletedToggle({
  viewMode,
  onToggle,
  activeLabel = "Active",
}: {
  viewMode: AdminViewMode;
  onToggle: () => void;
  activeLabel?: string;
}) {
  return (
    <button type="button" onClick={onToggle} className="text-sm text-blue-700 hover:underline">
      {viewMode === "active" ? "Deleted" : activeLabel}
    </button>
  );
}

export function AdminDeletedBanner({
  count,
  entityLabel,
}: {
  count: number;
  entityLabel: string;
}) {
  if (count <= 0) return null;
  return (
    <div className="mb-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
      Showing deleted {entityLabel} ({count}) — select one and use Restore
    </div>
  );
}
