import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ADMIN_PANEL_TD_CLASS,
  ADMIN_PANEL_TD_COMPACT_CLASS,
  ADMIN_PANEL_THEAD_ROW_CLASS,
  adminPanelRowClass,
  adminPanelTableClasses,
} from "./adminPanelTableStyles";
import { adminNotify } from "../../utils/adminNotify";

export const adminPageBtn = (active: boolean, disabled: boolean): React.CSSProperties => ({
  border: "1px solid",
  borderColor: active ? "#0073b7" : "#ddd",
  background: active ? "#0073b7" : "#fff",
  color: active ? "#fff" : disabled ? "#bbb" : "#777",
  padding: "6px 13px",
  fontSize: 13,
  cursor: disabled ? "not-allowed" : "pointer",
  marginLeft: -1,
});

export function ToolbarButton({
  label,
  bg = "#555",
  onClick,
  disabled = false,
}: {
  label: string;
  bg?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "6px 14px",
        borderRadius: 2,
        border: "1px solid rgba(0,0,0,0.2)",
        fontSize: 13,
        background: disabled ? "#bbb" : bg,
        color: "#fff",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

export function ColSelector({
  columns,
  visible,
  onChange,
}: {
  columns: { key: string; label: string }[];
  visible: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const toggle = (key: string) =>
    onChange(visible.includes(key) ? visible.filter((k) => k !== key) : [...visible, key]);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          padding: "6px 14px",
          background: "#555",
          color: "#fff",
          border: "none",
          borderRadius: 3,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        Select Heading <span style={{ fontSize: 10 }}>▼</span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "110%",
            background: "#fff",
            border: "1px solid #d2d6de",
            borderRadius: 3,
            boxShadow: "0 3px 10px rgba(0,0,0,.15)",
            zIndex: 200,
            minWidth: 170,
            padding: "6px 0",
          }}
        >
          {columns.map((col) => (
            <label
              key={col.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                cursor: "pointer",
                fontSize: 13,
                color: "#333",
                userSelect: "none",
              }}
            >
              <input
                type="checkbox"
                checked={visible.includes(col.key)}
                onChange={() => toggle(col.key)}
                style={{ accentColor: "#0073b7", width: 14, height: 14, cursor: "pointer" }}
              />
              {col.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export function exportTableCsv<T>({
  rows,
  columns,
  visibleKeys,
  filename,
}: {
  rows: T[];
  columns: { key: string; label: string; exportValue?: (row: T) => string }[];
  visibleKeys: string[];
  filename: string;
}) {
  const cols = columns.filter((c) => visibleKeys.includes(c.key));
  const esc = (v: string) => (/[,"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const header = cols.map((c) => esc(c.label)).join(",");
  const body = rows
    .map((row) =>
      cols.map((c) => esc(c.exportValue?.(row) ?? "-")).join(",")
    )
    .join("\n");
  const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ─── AdminDataTable ───────────────────────────────────────────────────────────
export type TableColumn<T> = {
  key: string;
  label: string;
  render: (row: T, index: number) => React.ReactNode;
  exportValue?: (row: T) => string;
};

export type ToolbarAction = {
  label: string;
  color?: string;
  onClick: (selectedIds: string[]) => void;
  minSelected?: number;
  maxSelected?: number;
  hidden?: boolean;
};

export type AdminDataTableProps<T> = {
  items: T[];
  columns: TableColumn<T>[];
  getRowId: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  currentPage?: number;
  onCurrentPageChange?: (page: number) => void;
  pageSizeOptions?: number[];
  visibleColumnKeys?: string[];
  onVisibleColumnKeysChange?: (keys: string[]) => void;
  showColSelector?: boolean;
  showStandardToolbar?: boolean;
  onSendNotification?: (ids: string[]) => void;
  onWhatsApp?: (ids: string[]) => void;
  onExport?: (selectedRows: T[]) => void;
  exportFilename?: string;
  extraToolbarActions?: ToolbarAction[];
  toolbarLeft?: React.ReactNode;
  toolbarRight?: React.ReactNode;
  banner?: React.ReactNode;
  renderActions?: (row: T) => React.ReactNode;
  actionsColumnLabel?: string;
  totalBeforeFilter?: number;
  selectedIds?: Set<string>;
  onSelectedIdsChange?: (ids: Set<string>) => void;
  rowHighlightColor?: string;
  /** When true, `items` is already the current page; use `totalItemCount` for footer/pagination */
  serverPaginated?: boolean;
  totalItemCount?: number;
  showSearch?: boolean;
  /** Tighter row padding for portal/shop tables */
  compact?: boolean;
};

export function AdminDataTable<T>({
  items,
  columns,
  getRowId,
  loading = false,
  error = null,
  emptyMessage = "No records found.",
  search: controlledSearch,
  onSearchChange,
  searchPlaceholder = "Live Search here",
  pageSize: controlledPageSize,
  onPageSizeChange,
  currentPage: controlledPage,
  onCurrentPageChange,
  pageSizeOptions = [10, 25, 50, 100],
  visibleColumnKeys: controlledVisible,
  onVisibleColumnKeysChange,
  showColSelector = true,
  showStandardToolbar = true,
  onSendNotification,
  onWhatsApp,
  onExport,
  exportFilename = "export",
  extraToolbarActions = [],
  toolbarLeft,
  toolbarRight,
  banner,
  renderActions,
  actionsColumnLabel = "Action",
  totalBeforeFilter,
  selectedIds: controlledSelected,
  onSelectedIdsChange,
  rowHighlightColor = "#f0f7ff",
  serverPaginated = false,
  totalItemCount,
  showSearch = true,
  compact = false,
}: AdminDataTableProps<T>) {
  const panelTable = adminPanelTableClasses(compact);
  const [internalSearch, setInternalSearch] = useState("");
  const [internalPageSize, setInternalPageSize] = useState(10);
  const [internalPage, setInternalPage] = useState(1);
  const [internalSelected, setInternalSelected] = useState<Set<string>>(new Set());
  const defaultVisible = useMemo(() => columns.map((c) => c.key), [columns]);
  const [internalVisible, setInternalVisible] = useState<string[]>(defaultVisible);

  const search = controlledSearch ?? internalSearch;
  const setSearch = onSearchChange ?? setInternalSearch;
  const pageSize = controlledPageSize ?? internalPageSize;
  const setPageSize = onPageSizeChange ?? setInternalPageSize;
  const currentPage = controlledPage ?? internalPage;
  const itemTotal = serverPaginated ? (totalItemCount ?? items.length) : items.length;
  const totalPages = Math.max(1, Math.ceil(itemTotal / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const setCurrentPage = (value: number | ((prev: number) => number)) => {
    const next = typeof value === "function" ? value(safePage) : value;
    if (onCurrentPageChange) onCurrentPageChange(next);
    else setInternalPage(next);
  };
  const selectedRows = controlledSelected ?? internalSelected;
  const setSelectedRows = (value: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    const next = typeof value === "function" ? value(selectedRows) : value;
    if (onSelectedIdsChange) onSelectedIdsChange(next);
    else setInternalSelected(next);
  };
  const visibleCols = controlledVisible ?? internalVisible;
  const setVisibleCols = onVisibleColumnKeysChange ?? setInternalVisible;


  useEffect(() => {
    if (currentPage > totalPages) {
      if (onCurrentPageChange) onCurrentPageChange(totalPages);
      else setInternalPage(totalPages);
    }
  }, [currentPage, totalPages, onCurrentPageChange]);
  const paginated = serverPaginated
    ? items
    : items.slice((safePage - 1) * pageSize, safePage * pageSize);
  const selected = Array.from(selectedRows);
  const selCount = selected.length;
  const allPageSel = paginated.length > 0 && paginated.every((row) => selectedRows.has(getRowId(row)));
  const activeColumns = columns.filter((c) => visibleCols.includes(c.key));
  const colSpan = activeColumns.length + 1 + (renderActions ? 1 : 0);

  function toggleRow(id: string) {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function requireSelection(min = 1): boolean {
    if (selCount < min) {
      adminNotify.info(min === 1 ? "Select at least one." : `Select exactly ${min}.`);
      return false;
    }
    return true;
  }

  function handleExport() {
    if (!requireSelection()) return;
    const selectedItems = items.filter((row) => selectedRows.has(getRowId(row)));
    if (onExport) {
      onExport(selectedItems);
      return;
    }
    exportTableCsv({
      rows: selectedItems,
      columns,
      visibleKeys: visibleCols,
      filename: exportFilename,
    });
  }

  const standardButtons = showStandardToolbar ? (
    <>
      <ToolbarButton
        label="✉ Send Notification"
        onClick={() => {
          if (!requireSelection()) return;
          if (onSendNotification) onSendNotification(selected);
          else adminNotify.info("Send notification is not configured for this table.");
        }}
      />
      <ToolbarButton
        label="WhatsApp"
        bg="#25d366"
        onClick={() => {
          if (!requireSelection()) return;
          if (onWhatsApp) onWhatsApp(selected);
        }}
      />
      <ToolbarButton label="↓ Export XL" onClick={handleExport} />
    </>
  ) : null;

  const extraButtons = extraToolbarActions
    .filter((a) => !a.hidden)
    .map((action) => {
      const min = action.minSelected ?? 0;
      const max = action.maxSelected;
      const disabled =
        selCount < min || (max !== undefined && selCount > max);
      return (
        <ToolbarButton
          key={action.label}
          label={action.label}
          bg={action.color}
          disabled={disabled}
          onClick={() => {
            if (min > 0 && !requireSelection(min)) return;
            if (max !== undefined && selCount > max) {
              adminNotify.info(`Select at most ${max}.`);
              return;
            }
            action.onClick(selected);
          }}
        />
      );
    });

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #d2d6de",
        borderRadius: 3,
        boxShadow: "0 1px 1px rgba(0,0,0,.1)",
      }}
    >
      <div
        style={{
          padding: "8px 14px",
          background: "#d2d6de",
          borderBottom: "1px solid #bbb",
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        {toolbarLeft}
        {standardButtons}
        {extraButtons}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          {toolbarRight}
          {showSearch && (
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                height: 30,
                width: 170,
                border: "1px solid #bbb",
                borderRadius: 2,
                padding: "0 10px",
                fontSize: 13,
                outline: "none",
                backgroundColor: "#fff",
              }}
              placeholder={searchPlaceholder}
            />
          )}
          {selCount > 0 && (
            <span style={{ fontSize: 12, color: "#555", fontWeight: 600, whiteSpace: "nowrap" }}>
              {selCount} selected
            </span>
          )}
          {showColSelector && (
            <ColSelector
              columns={columns.map((c) => ({ key: c.key, label: c.label }))}
              visible={visibleCols}
              onChange={setVisibleCols}
            />
          )}
        </div>
      </div>

      {banner}

      <div style={{ padding: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 14,
            color: "#333",
            marginBottom: 14,
          }}
        >
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            style={{
              height: 32,
              border: "1px solid #d2d6de",
              borderRadius: 3,
              padding: "0 8px",
              fontSize: 14,
              outline: "none",
            }}
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span>entries</span>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#888" }}>Loading…</div>
        )}
        {error && (
          <div style={{ textAlign: "center", padding: "30px 0", color: "#c0392b" }}>
            Error: {error}
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className={panelTable.table}>
              <thead>
                <tr className={ADMIN_PANEL_THEAD_ROW_CLASS}>
                  <th className={panelTable.thCheckbox}>
                    <input
                      type="checkbox"
                      checked={allPageSel}
                      onChange={(e) => {
                        setSelectedRows((prev) => {
                          const next = new Set(prev);
                          paginated.forEach((row) => {
                            const id = getRowId(row);
                            if (e.target.checked) next.add(id);
                            else next.delete(id);
                          });
                          return next;
                        });
                      }}
                      className="accent-white"
                    />
                  </th>
                  {activeColumns.map((col) => (
                    <th key={col.key} className={panelTable.th}>
                      {col.label}
                    </th>
                  ))}
                  {renderActions && (
                    <th className={panelTable.th}>{actionsColumnLabel}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 && (
                  <tr>
                    <td
                      colSpan={colSpan}
                      className={`${panelTable.td} ${compact ? "py-5" : "py-9"} text-center text-gray-400`}
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                )}
                {paginated.map((row, idx) => {
                  const id = getRowId(row);
                  const selected = selectedRows.has(id);
                  return (
                    <tr
                      key={id}
                      className={selected ? undefined : adminPanelRowClass(idx)}
                      style={selected ? { background: rowHighlightColor } : undefined}
                    >
                      <td className={panelTable.tdCheckbox}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleRow(id)}
                          className="accent-ad-purple"
                        />
                      </td>
                      {activeColumns.map((col) => (
                        <React.Fragment key={col.key}>{col.render(row, idx)}</React.Fragment>
                      ))}
                      {renderActions && (
                        <td className={panelTable.td}>{renderActions(row)}</td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && (
          <div
            style={{
              marginTop: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <p style={{ margin: 0, fontSize: 14, color: "#333" }}>
              {itemTotal === 0
                ? "No entries"
                : `Showing ${(safePage - 1) * pageSize + 1} to ${Math.min(safePage * pageSize, itemTotal)} of ${itemTotal} entries${search && totalBeforeFilter !== undefined
                  ? ` (filtered from ${totalBeforeFilter} total)`
                  : ""
                }`}
            </p>
            <div style={{ display: "flex" }}>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                style={adminPageBtn(false, safePage === 1)}
              >
                Previous
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  type="button"
                  onClick={() => setCurrentPage(pg)}
                  style={adminPageBtn(pg === safePage, false)}
                >
                  {pg}
                </button>
              ))}
              {totalPages > 7 && (
                <span style={{ padding: "6px 8px", fontSize: 13 }}>…</span>
              )}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                style={adminPageBtn(false, safePage === totalPages)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Helper for simple text cells */
export function tableCell(
  content: React.ReactNode,
  style?: React.CSSProperties,
  compact = false,
) {
  return (
    <td className={compact ? ADMIN_PANEL_TD_COMPACT_CLASS : ADMIN_PANEL_TD_CLASS} style={style}>
      {content}
    </td>
  );
}
