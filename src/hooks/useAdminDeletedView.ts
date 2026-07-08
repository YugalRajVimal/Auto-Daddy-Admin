import { useCallback, useEffect, useMemo, useState } from "react";

export type AdminViewMode = "active" | "deleted";

type UseAdminDeletedViewOptions = {
  onToggle?: () => void;
  /**
   * Optional localStorage key to persist view mode + stashed deleted items.
   * Helps make "Deleted" view useful across refreshes on pages without a backend deleted-list endpoint.
   */
  storageKey?: string;
  /**
   * When true, persists the current viewMode (active/deleted) in localStorage.
   * Defaults to false so pages reset back to Active on navigation/refresh.
   */
  persistViewMode?: boolean;
};

/**
 * Simple helper for Admin pages that have a "Deleted" link below the table.
 *
 * Many pages in this repo do not have a backend deleted-list endpoint. For those,
 * `deletedStash` lets the UI show recently deleted rows (client-side) after delete.
 */
export function useAdminDeletedView<T>(options?: UseAdminDeletedViewOptions) {
  const storageKey = options?.storageKey;
  const persistViewMode = options?.persistViewMode === true;

  const initial = useMemo<{ viewMode: AdminViewMode; deletedStash: T[] }>(() => {
    if (!storageKey) return { viewMode: "active", deletedStash: [] };
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return { viewMode: "active", deletedStash: [] };
      const parsed = JSON.parse(raw) as { viewMode?: AdminViewMode; deletedStash?: T[] };
      return {
        viewMode: persistViewMode && parsed.viewMode === "deleted" ? "deleted" : "active",
        deletedStash: Array.isArray(parsed.deletedStash) ? parsed.deletedStash : [],
      };
    } catch {
      return { viewMode: "active", deletedStash: [] };
    }
  }, [persistViewMode, storageKey]);

  const [viewMode, setViewMode] = useState<AdminViewMode>(initial.viewMode);
  const [deletedStash, setDeletedStash] = useState<T[]>(initial.deletedStash);

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(persistViewMode ? { viewMode, deletedStash } : { deletedStash }),
      );
    } catch {
      // ignore storage quota / private mode
    }
  }, [deletedStash, persistViewMode, storageKey, viewMode]);

  const toggleViewMode = useCallback(() => {
    setViewMode((mode) => (mode === "active" ? "deleted" : "active"));
    options?.onToggle?.();
  }, [options?.onToggle]);

  const stashDeleted = useCallback((items: T | T[]) => {
    const list = Array.isArray(items) ? items : [items];
    if (list.length === 0) return;
    setDeletedStash((prev) => [...list, ...prev]);
  }, []);

  const restoreStashed = useCallback((predicate: (item: T) => boolean) => {
    setDeletedStash((prev) => prev.filter((item) => !predicate(item)));
  }, []);

  const removeStashed = useCallback((predicate: (item: T) => boolean) => {
    setDeletedStash((prev) => prev.filter((item) => !predicate(item)));
  }, []);

  return {
    viewMode,
    isDeletedView: viewMode === "deleted",
    toggleViewMode,
    deletedStash,
    stashDeleted,
    restoreStashed,
    removeStashed,
  };
}

export function splitSoftDeleted<T extends { deleted?: boolean }>(items: T[]) {
  const active = items.filter((item) => !item.deleted);
  const deleted = items.filter((item) => item.deleted);
  return { active, deleted };
}

export function resolveDisplayItems<T>({
  viewMode,
  activeItems,
  softDeletedItems = [],
  stashedItems = [],
}: {
  viewMode: AdminViewMode;
  activeItems: T[];
  softDeletedItems?: T[];
  stashedItems?: T[];
}): T[] {
  if (viewMode === "deleted") return [...softDeletedItems, ...stashedItems];
  return activeItems;
}
