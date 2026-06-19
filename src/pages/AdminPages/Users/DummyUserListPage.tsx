import React, { useEffect, useRef, useState } from "react";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactFixedFieldWidth,
  compactInputClass,
} from "../../../components/admin/ContentPanel";

export type DummyUserRow = {
  _id: string;
  name: string;
  email: string;
  countryCode: string;
  phone: string;
  pincode: string;
  address: string;
  city: string;
  createdAt: string;
  isDisabled: boolean;
  status?: string;
  primaryLabel: string;
  region: string;
  countA: number;
  countB: number;
};

type ColumnDef = { key: string; label: string };

export type DummyUserListConfig = {
  title: string;
  deletedTitle: string;
  addLabel: string;
  roleLabel: string;
  primaryFieldLabel: string;
  regionFieldLabel: string;
  countALabel: string;
  countBLabel: string;
  columns: ColumnDef[];
  defaultVisible: string[];
  initialData: DummyUserRow[];
  exportFilePrefix: string;
};

const tdClass = "border border-gray-300 px-3 py-2 text-sm text-gray-700";
const thClass = "border border-ad-purple-dark px-3 py-2 text-left font-medium whitespace-nowrap";
const linkClass = "text-blue-700 hover:underline bg-transparent border-0 p-0 text-sm cursor-pointer font-medium";

const GREEN_CARD: React.CSSProperties = {
  background: "#d4f5c4",
  border: "1px solid #b2e0a0",
  borderRadius: 14,
  padding: "18px 22px",
  marginBottom: 18,
  boxShadow: "3px 4px 0 #c0d8b0",
};
const GC_LABEL: React.CSSProperties = { color: "#555", fontWeight: 600, fontSize: 13, minWidth: 120 };
const GC_VAL: React.CSSProperties = { color: "#222", fontSize: 13 };

function GCRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 5 }}>
      <span style={GC_LABEL}>{label}</span>
      <span style={{ color: "#888", marginRight: 4 }}>:</span>
      <span style={GC_VAL}>{value ?? "-"}</span>
    </div>
  );
}

function fmtDate(d?: string): string {
  if (!d) return "-";
  return new Date(d).toISOString().slice(0, 10);
}

function getStatus(row: DummyUserRow): string {
  if (row.status === "deleted") return "Deleted";
  if (row.isDisabled) return "Suspended";
  return "Active";
}

function getStatusColors(s: string): React.CSSProperties {
  if (s === "Active") return { background: "#dff0d8", color: "#3c763d", border: "1px solid #d6e9c6" };
  if (s === "Suspended") return { background: "#fcf8e3", color: "#8a6d3b", border: "1px solid #faebcc" };
  if (s === "Deleted") return { background: "#f2dede", color: "#a94442", border: "1px solid #ebccd1" };
  return { background: "#f2dede", color: "#a94442", border: "1px solid #ebccd1" };
}

const BaseModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}> = ({ isOpen, onClose, title, children, wide }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto bg-black/45 p-[30px_10px]">
      <div
        className="flex flex-col rounded bg-white shadow-[0_5px_24px_rgba(0,0,0,.35)]"
        style={{ width: wide ? "min(860px,96vw)" : "min(720px,95vw)" }}
      >
        <div className="flex shrink-0 items-center justify-between rounded-t bg-[#9b308d] px-[18px] py-[11px] text-white">
          <span className="text-[15px] font-bold">{title}</span>
          <button type="button" onClick={onClose} className="cursor-pointer border-0 bg-transparent text-[22px] leading-none text-white">
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-[20px_22px]">{children}</div>
      </div>
    </div>
  );
};

const ProfileModal: React.FC<{
  row: DummyUserRow;
  config: DummyUserListConfig;
  onClose: () => void;
  onEdit: () => void;
}> = ({ row, config, onClose, onEdit }) => (
  <BaseModal isOpen wide onClose={onClose} title={`Profile — ${row.name}`}>
    <div style={GREEN_CARD}>
      <GCRow label="Name" value={row.name} />
      <GCRow label="E-mail" value={row.email} />
      <GCRow label="Phone" value={row.phone} />
      <GCRow label={config.primaryFieldLabel} value={row.primaryLabel} />
      <GCRow label="City" value={row.city} />
      <GCRow label={config.regionFieldLabel} value={row.region} />
      <GCRow label="Address" value={row.address} />
      <GCRow label="Zip Code" value={row.pincode} />
      <GCRow label={config.countALabel} value={row.countA} />
      <GCRow label={config.countBLabel} value={row.countB} />
      <GCRow label="Status" value={getStatus(row)} />
      <GCRow label="Joining Date" value={fmtDate(row.createdAt)} />
    </div>
    <button
      type="button"
      onClick={onEdit}
      className="mt-2 cursor-pointer rounded border-0 bg-[#1a6e1a] px-7 py-2 text-sm font-bold text-white"
    >
      Update
    </button>
  </BaseModal>
);

const CountModal: React.FC<{
  row: DummyUserRow;
  label: string;
  count: number;
  onClose: () => void;
}> = ({ row, label, count, onClose }) => (
  <BaseModal isOpen onClose={onClose} title={`${label} — ${row.name}`} wide>
    {count === 0 ? (
      <p className="text-center text-gray-400">No records found.</p>
    ) : (
      Array.from({ length: count }, (_, i) => (
        <div key={i} style={GREEN_CARD}>
          <GCRow label={`${label} #`} value={i + 1} />
          <GCRow label="Status" value="Active" />
        </div>
      ))
    )}
  </BaseModal>
);

function isEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}

const ColSelector: React.FC<{ columns: ColumnDef[]; visible: string[]; onChange: (v: string[]) => void }> = ({
  columns,
  visible,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const toggle = (key: string) => onChange(visible.includes(key) ? visible.filter((k) => k !== key) : [...visible, key]);
  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex cursor-pointer items-center gap-1 border-0 bg-gray-600 px-3.5 py-1.5 text-[13px] font-semibold text-white"
      >
        Select Heading <span className="text-[10px]">▼</span>
      </button>
      {open && (
        <div className="absolute right-0 top-[110%] z-[200] min-w-[170px] rounded border border-gray-300 bg-white py-1.5 shadow-md">
          {columns.map((col) => (
            <label key={col.key} className="flex cursor-pointer items-center gap-2 px-3.5 py-1.5 text-[13px] text-gray-800 select-none">
              <input
                type="checkbox"
                checked={visible.includes(col.key)}
                onChange={() => toggle(col.key)}
                className="h-3.5 w-3.5 cursor-pointer accent-[#0073b7]"
              />
              {col.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

function exportCsv(rows: DummyUserRow[], config: DummyUserListConfig, visibleCols: string[]) {
  const colMap: Record<string, (r: DummyUserRow) => string> = {
    name: (r) => r.name,
    phone: (r) => r.phone,
    primary: (r) => r.primaryLabel,
    city: (r) => r.city,
    region: (r) => r.region,
    date: (r) => fmtDate(r.createdAt),
    countA: (r) => String(r.countA),
    countB: (r) => String(r.countB),
    status: (r) => getStatus(r),
  };
  const cols = config.columns.filter((c) => visibleCols.includes(c.key));
  const esc = (v: string) => (/[,"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const header = cols.map((c) => esc(c.label)).join(",");
  const body = rows.map((r) => cols.map((c) => esc(colMap[c.key]?.(r) ?? "-")).join(",")).join("\n");
  const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${config.exportFilePrefix}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

type DummyUserListPageProps = {
  config: DummyUserListConfig;
};

export default function DummyUserListPage({ config }: DummyUserListPageProps) {
  const [allRows, setAllRows] = useState<DummyUserRow[]>(config.initialData);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [visibleCols, setVisibleCols] = useState<string[]>(config.defaultVisible);
  const [viewMode, setViewMode] = useState<"active" | "deleted">("active");

  const [profileFor, setProfileFor] = useState<DummyUserRow | null>(null);
  const [countAFor, setCountAFor] = useState<DummyUserRow | null>(null);
  const [countBFor, setCountBFor] = useState<DummyUserRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRow, setEditingRow] = useState<DummyUserRow | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPincode, setFormPincode] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formPrimaryLabel, setFormPrimaryLabel] = useState("");
  const [formRegion, setFormRegion] = useState("");
  const [formAttempted, setFormAttempted] = useState(false);

  const activeRows = allRows.filter((r) => r.status !== "deleted");
  const deletedRows = allRows.filter((r) => r.status === "deleted");
  const displayRows = viewMode === "deleted" ? deletedRows : activeRows;

  const filtered = displayRows.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.phone.includes(q) ||
      r.primaryLabel.toLowerCase().includes(q) ||
      r.city.toLowerCase().includes(q) ||
      r.region.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selected = Array.from(selectedRows);
  const selCount = selected.length;
  const allPageSel = paginated.length > 0 && paginated.every((r) => selectedRows.has(r._id));

  function toggleRow(id: string) {
    setSelectedRows((prev) => {
      const c = new Set(prev);
      if (c.has(id)) c.delete(id);
      else c.add(id);
      return c;
    });
  }

  function handleSaved(row: DummyUserRow) {
    setAllRows((prev) => {
      const exists = prev.some((r) => r._id === row._id);
      return exists ? prev.map((r) => (r._id === row._id ? row : r)) : [row, ...prev];
    });
  }

  function toggleSuspend(id: string, disable: boolean) {
    setAllRows((prev) => prev.map((r) => (r._id === id ? { ...r, isDisabled: disable } : r)));
  }

  function deleteRow(id: string) {
    if (!window.confirm(`Delete this ${config.title.toLowerCase()}? They can be restored later.`)) return;
    setAllRows((prev) => prev.map((r) => (r._id === id ? { ...r, status: "deleted", isDisabled: true } : r)));
    setSelectedRows((prev) => {
      const c = new Set(prev);
      c.delete(id);
      return c;
    });
  }

  function reviveRow(id: string) {
    setAllRows((prev) => prev.map((r) => (r._id === id ? { ...r, status: undefined, isDisabled: false } : r)));
  }

  const resetForm = () => {
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormPincode("");
    setFormAddress("");
    setFormCity("");
    setFormPrimaryLabel("");
    setFormRegion("");
    setFormAttempted(false);
    setEditingRow(null);
  };

  const openAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (row: DummyUserRow) => {
    setFormName(row.name);
    setFormEmail(row.email);
    setFormPhone(row.phone);
    setFormPincode(row.pincode);
    setFormAddress(row.address);
    setFormCity(row.city);
    setFormPrimaryLabel(row.primaryLabel);
    setFormRegion(row.region);
    setFormAttempted(false);
    setEditingRow(row);
    setShowForm(true);
  };

  const handleFormCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const isFormValid =
    formName.trim() &&
    isEmail(formEmail) &&
    formPhone.replace(/\D/g, "").length === 10 &&
    formPincode.trim() &&
    formPrimaryLabel.trim() &&
    formRegion.trim();

  const handleFormSave = () => {
    setFormAttempted(true);
    if (!isFormValid) return;
    const saved: DummyUserRow = {
      _id: editingRow ? editingRow._id : `dummy-${Date.now()}`,
      name: formName.trim(),
      email: formEmail.trim(),
      countryCode: "",
      phone: formPhone.replace(/\D/g, ""),
      pincode: formPincode.trim(),
      address: formAddress.trim(),
      city: formCity.trim() || "Toronto",
      createdAt: editingRow ? editingRow.createdAt : new Date().toISOString(),
      isDisabled: editingRow ? editingRow.isDisabled : false,
      status: editingRow ? editingRow.status : undefined,
      primaryLabel: formPrimaryLabel.trim(),
      region: formRegion.trim(),
      countA: editingRow ? editingRow.countA : 0,
      countB: editingRow ? editingRow.countB : 0,
    };
    handleSaved(saved);
    resetForm();
    setShowForm(false);
  };

  const formMessage = editingRow
    ? `You are updating a '${config.title}'`
    : `You are creating a '${config.title}'`;

  function renderCell(row: DummyUserRow, key: string) {
    switch (key) {
      case "name":
        return (
          <td key={key} className={`${tdClass} font-medium`}>
            <button type="button" onClick={() => setProfileFor(row)} className="cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold text-ad-purple hover:underline">
              {row.name}
            </button>
          </td>
        );
      case "phone":
        return (
          <td key={key} className={tdClass}>
            {row.phone}
          </td>
        );
      case "primary":
        return <td key={key} className={tdClass}>{row.primaryLabel}</td>;
      case "city":
        return <td key={key} className={tdClass}>{row.city}</td>;
      case "region":
        return <td key={key} className={tdClass}>{row.region}</td>;
      case "date":
        return <td key={key} className={tdClass}>{fmtDate(row.createdAt)}</td>;
      case "countA":
        return (
          <td key={key} className={tdClass}>
            <button type="button" onClick={() => setCountAFor(row)} className={linkClass}>
              {row.countA}
            </button>
          </td>
        );
      case "countB":
        return (
          <td key={key} className={tdClass}>
            <button type="button" onClick={() => setCountBFor(row)} className={linkClass}>
              {row.countB}
            </button>
          </td>
        );
      case "status":
        return (
          <td key={key} className={tdClass}>
            <span
              style={{
                ...getStatusColors(getStatus(row)),
                display: "inline-block",
                padding: "2px 10px",
                borderRadius: 3,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {getStatus(row)}
            </span>
          </td>
        );
      default:
        return (
          <td key={key} className={tdClass}>
            -
          </td>
        );
    }
  }

  const toolbarBtnClass = (disabled = false) =>
    `px-3 py-1 text-xs font-medium text-white whitespace-nowrap ${disabled ? "bg-gray-400 cursor-not-allowed" : "bg-gray-600 hover:bg-gray-700"}`;

  const visibleColumns = config.columns.filter((c) =>
    viewMode === "active" ? visibleCols.includes(c.key) : config.defaultVisible.includes(c.key)
  );

  return (
    <>
      {profileFor && (
        <ProfileModal
          row={profileFor}
          config={config}
          onClose={() => setProfileFor(null)}
          onEdit={() => {
            openEdit(profileFor);
            setProfileFor(null);
          }}
        />
      )}
      {countAFor && (
        <CountModal row={countAFor} label={config.countALabel} count={countAFor.countA} onClose={() => setCountAFor(null)} />
      )}
      {countBFor && (
        <CountModal row={countBFor} label={config.countBLabel} count={countBFor.countB} onClose={() => setCountBFor(null)} />
      )}
      <AdminPage
        title={viewMode === "deleted" ? config.deletedTitle : config.title}
        headerAction={
          viewMode === "active" && !showForm ? (
            <AddNewButton onClick={openAdd} />
          ) : undefined
        }
        between={
          showForm ? (
            <CompactFormPanel
              footer={
                <CompactFormFooter
                  message={formMessage}
                  messageCenter
                  onSave={handleFormSave}
                  onCancel={handleFormCancel}
                />
              }
            >
              <CompactFormRow className="items-start">
                <CompactField label="Full Name" required className={compactFixedFieldWidth}>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value.slice(0, 40))}
                    className={compactInputClass}
                  />
                </CompactField>
                <CompactField label="Email" required className={compactFixedFieldWidth}>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className={compactInputClass}
                  />
                </CompactField>
                <CompactField label="Phone" required className={compactFixedFieldWidth}>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className={compactInputClass}
                  />
                </CompactField>
                <CompactField label="City" className={compactFixedFieldWidth}>
                  <input
                    type="text"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className={compactInputClass}
                  />
                </CompactField>
                <CompactField label="Zip / Postal Code" required className={compactFixedFieldWidth}>
                  <input
                    type="text"
                    value={formPincode}
                    onChange={(e) => setFormPincode(e.target.value.slice(0, 10))}
                    className={compactInputClass}
                  />
                </CompactField>
                <CompactField label={config.primaryFieldLabel} required className={compactFixedFieldWidth}>
                  <input
                    type="text"
                    value={formPrimaryLabel}
                    onChange={(e) => setFormPrimaryLabel(e.target.value)}
                    className={compactInputClass}
                  />
                </CompactField>
                <CompactField label={config.regionFieldLabel} required className={compactFixedFieldWidth}>
                  <input
                    type="text"
                    value={formRegion}
                    onChange={(e) => setFormRegion(e.target.value)}
                    className={compactInputClass}
                  />
                </CompactField>
                <CompactField label="Address" className="min-w-[200px] flex-1">
                  <textarea
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value.slice(0, 100))}
                    rows={2}
                    className={`${compactInputClass} resize-y`}
                  />
                </CompactField>
              </CompactFormRow>
              {formAttempted && !isFormValid && (
                <p className="text-xs font-semibold text-red-700">Please fill all required fields correctly.</p>
              )}
            </CompactFormPanel>
          ) : undefined
        }
      >
        {viewMode === "deleted" && (
          <div className="mb-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
            Showing deleted {config.title.toLowerCase()} ({deletedRows.length}) — select one and use Restore
          </div>
        )}

        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
          <div className="flex flex-wrap gap-1">
            {viewMode === "active" && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (!selCount) {
                      alert("Select at least one.");
                      return;
                    }
                    alert("Notification sent (demo).");
                  }}
                  className={toolbarBtnClass()}
                >
                  Send Notification
                </button>
                <button type="button" className="bg-[#25d366] px-3 py-1 text-xs font-medium text-white hover:opacity-90">
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!selCount) {
                      alert("Select at least one.");
                      return;
                    }
                    exportCsv(
                      allRows.filter((r) => selectedRows.has(r._id)),
                      config,
                      visibleCols
                    );
                  }}
                  className={toolbarBtnClass()}
                >
                  Export
                </button>
                <button
                  type="button"
                  disabled={selCount !== 1}
                  onClick={() => {
                    const r = allRows.find((x) => x._id === selected[0]);
                    if (r) openEdit(r);
                  }}
                  className={toolbarBtnClass(selCount !== 1)}
                >
                  Update
                </button>
                <button type="button" className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700">
                  Shoot
                </button>
                {selCount === 1 && (
                  <button type="button" onClick={() => deleteRow(selected[0])} className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700">
                    Delete
                  </button>
                )}
              </>
            )}
            {viewMode === "deleted" && selCount === 1 && (
              <button type="button" onClick={() => reviveRow(selected[0])} className={toolbarBtnClass()}>
                Restore
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Live Search here"
              className="border border-gray-400 bg-white px-2 py-1 text-xs"
            />
            {selCount > 0 && <span className="text-xs font-semibold text-gray-600">{selCount} selected</span>}
            {viewMode === "active" && <ColSelector columns={config.columns} visible={visibleCols} onChange={setVisibleCols} />}
            <button type="button" className="bg-gray-500 px-3 py-1 text-xs font-medium text-white hover:bg-gray-600">
              Search
            </button>
          </div>
        </div>

        <div className="mb-2 flex items-center gap-2 text-xs text-gray-700">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-gray-400 px-1 py-0.5"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span>entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-ad-purple text-white">
                <th className="border border-ad-purple-dark px-2 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={allPageSel}
                    onChange={(e) => {
                      setSelectedRows((prev) => {
                        const c = new Set(prev);
                        paginated.forEach((r) => (e.target.checked ? c.add(r._id) : c.delete(r._id)));
                        return c;
                      });
                    }}
                    className="accent-white"
                  />
                </th>
                {visibleColumns.map((c) => (
                  <th key={c.key} className={thClass}>
                    {c.label}
                  </th>
                ))}
                {viewMode === "active" && <th className={thClass}>Action</th>}
                {viewMode === "deleted" && <th className={thClass}>Restore</th>}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + 2} className="border border-gray-300 px-3 py-8 text-center text-gray-500">
                    {viewMode === "deleted" ? `No deleted ${config.title.toLowerCase()}.` : `No ${config.title.toLowerCase()} found.`}
                  </td>
                </tr>
              ) : (
                paginated.map((row, idx) => {
                  const isSuspended = !!row.isDisabled;
                  return (
                    <tr key={row._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                      <td className="border border-gray-300 px-2 py-2">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(row._id)}
                          onChange={() => toggleRow(row._id)}
                          className="accent-ad-purple"
                        />
                      </td>
                      {visibleColumns.map((c) => renderCell(row, c.key))}
                      {viewMode === "active" && (
                        <td className={`${tdClass} whitespace-nowrap`}>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => toggleSuspend(row._id, !isSuspended)}
                              className="rounded px-2 py-0.5 text-xs font-semibold"
                              style={{
                                background: isSuspended ? "#dff0d8" : "#fcf8e3",
                                color: isSuspended ? "#3c763d" : "#8a6d3b",
                              }}
                            >
                              {isSuspended ? "Enable" : "Suspend"}
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteRow(row._id)}
                              className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                      {viewMode === "deleted" && (
                        <td className={tdClass}>
                          <button
                            type="button"
                            onClick={() => reviveRow(row._id)}
                            className="rounded bg-ad-green px-2 py-0.5 text-xs font-semibold text-white"
                          >
                            Restore
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                className={`h-7 w-7 border text-xs font-medium ${
                  currentPage === p ? "border-ad-green bg-ad-green text-white" : "border-gray-400 bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setViewMode((v) => (v === "active" ? "deleted" : "active"));
              setSelectedRows(new Set());
              setSearch("");
              setCurrentPage(1);
            }}
            className="text-sm text-blue-700 hover:underline"
          >
            {viewMode === "active" ? "Deleted" : `Active ${config.title}`}
          </button>
        </div>
      </AdminPage>
    </>
  );
}
