import { useEffect, useRef, useState } from "react";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactInputClass,
} from "../../../components/admin/ContentPanel";
import { adminNotify } from "../../../utils/adminNotify";
import { printAdminTable } from "../../../utils/adminPrintTable";
import { MODULES } from "../../../components/admin/PermissionMatrix";

type RoleRow = {
  id: number;
  role: string;
  city: string;
  permissionKeys: string[];
  createdDate: string;
};

const CITY_OPTIONS = [
  "Toronto",
  "Vancouver",
  "Montreal",
  "Calgary",
  "Ottawa",
  "Edmonton",
  "Winnipeg",
  "Halifax",
];

const DUMMY_ROLES: RoleRow[] = [
  {
    id: 1,
    role: "Super Admin",
    city: "Toronto",
    permissionKeys: MODULES.map((m) => m.key),
    createdDate: "2026-01-15",
  },
  {
    id: 2,
    role: "Admin",
    city: "Vancouver",
    permissionKeys: [
      "dashboard",
      "users",
      "services",
      "categories",
      "provinces",
      "cities",
      "domain",
      "runningDeals",
      "wallet",
      "inviteHelp",
      "tasks",
    ],
    createdDate: "2026-02-20",
  },
  {
    id: 3,
    role: "Sub Admin",
    city: "Montreal",
    permissionKeys: ["dashboard", "users", "services", "categories", "inviteHelp", "tasks"],
    createdDate: "2026-03-08",
  },
  {
    id: 4,
    role: "Business Associate",
    city: "Calgary",
    permissionKeys: ["dashboard", "users", "runningDeals", "inviteHelp"],
    createdDate: "2026-04-02",
  },
];

function permissionLabels(keys: string[]) {
  return keys
    .map((key) => MODULES.find((m) => m.key === key)?.label ?? key)
    .join(", ");
}

function PermissionsDropdown({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (keys: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggle = (key: string) => {
    onChange(
      selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]
    );
  };

  const summary =
    selected.length === 0
      ? "Select permissions"
      : selected.length === MODULES.length
        ? "All permissions"
        : `${selected.length} selected`;

  return (
    <div ref={ref} className="relative w-full min-w-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`${compactInputClass} flex w-full items-center justify-between gap-2 text-left`}
      >
        <span className={`truncate ${selected.length === 0 ? "text-gray-500" : ""}`}>{summary}</span>
        <span className="shrink-0 text-[10px] text-gray-600">▼</span>
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-50 mt-0.5 max-h-52 w-full min-w-[240px] overflow-y-auto border border-gray-400 bg-white shadow-md">
          {MODULES.map((mod) => (
            <label
              key={mod.key}
              className="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-sm text-gray-800 hover:bg-gray-100"
            >
              <input
                type="checkbox"
                checked={selected.includes(mod.key)}
                onChange={() => toggle(mod.key)}
                className="h-3.5 w-3.5 accent-ad-purple"
              />
              {mod.label}
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function RoleManager() {
  const [roles, setRoles] = useState(DUMMY_ROLES);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [role, setRole] = useState("");
  const [city, setCity] = useState("");
  const [permissionKeys, setPermissionKeys] = useState<string[]>([]);

  const filtered = roles.filter((row) => {
    const q = search.toLowerCase();
    return (
      row.role.toLowerCase().includes(q) ||
      row.city.toLowerCase().includes(q) ||
      permissionLabels(row.permissionKeys).toLowerCase().includes(q) ||
      row.createdDate.includes(search)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / entriesPerPage));
  const paged = filtered.slice((page - 1) * entriesPerPage, page * entriesPerPage);

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === paged.length) setSelected(new Set());
    else setSelected(new Set(paged.map((r) => r.id)));
  };

  const resetForm = () => {
    setRole("");
    setCity("");
    setPermissionKeys([]);
    setEditingId(null);
  };

  const openAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (row: RoleRow) => {
    setEditingId(row.id);
    setRole(row.role);
    setCity(row.city);
    setPermissionKeys([...row.permissionKeys]);
    setShowForm(true);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleSave = () => {
    if (!role.trim()) {
      adminNotify.error("Role is required.");
      return;
    }
    if (!city) {
      adminNotify.error("City is required.");
      return;
    }
    if (permissionKeys.length === 0) {
      adminNotify.error("Select at least one permission.");
      return;
    }

    const payload = {
      role: role.trim(),
      city,
      permissionKeys: [...permissionKeys],
      createdDate: new Date().toISOString().slice(0, 10),
    };

    if (editingId != null) {
      setRoles((prev) =>
        prev.map((r) => (r.id === editingId ? { ...r, ...payload } : r))
      );
    } else {
      setRoles((prev) => [
        ...prev,
        { id: Math.max(0, ...prev.map((r) => r.id)) + 1, ...payload },
      ]);
    }

    adminNotify.success(editingId != null ? "Role updated." : "Role created.");
    resetForm();
    setShowForm(false);
  };

  const handleDeleteSelected = () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} selected role(s)?`)) return;
    setRoles((prev) => prev.filter((r) => !selected.has(r.id)));
    setSelected(new Set());
    adminNotify.success("Selected role(s) deleted.");
  };

  const handleToolbarPrint = () => {
    printAdminTable({
      title: "Role Manager",
      headers: ["Role", "City", "Permissions", "Created Date"],
      rows: filtered.map((role) => [
          role.role,
          role.city,
          permissionLabels(role.permissionKeys),
          role.createdDate,
        ]),
    });
  };

  return (
    <AdminPage
      title="Role Manager"
      headerAction={!showForm ? <AddNewButton onClick={openAdd} /> : undefined}
      between={
        showForm ? (
          <CompactFormPanel
            footer={
              <CompactFormFooter
                message={
                  editingId != null ? "You are editing a 'Role'" : "You are creating a 'Role'"
                }
                messageCenter
                actionLabel={editingId != null ? "Update" : "Save"}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            }
          >
            <CompactFormRow className="grid w-full grid-cols-3 items-start gap-4">
              <CompactField label="Role" required className="min-w-0">
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={compactInputClass}
                />
              </CompactField>
              <CompactField label="City" required className="min-w-0">
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={compactInputClass}
                >
                  <option value="">Select city</option>
                  {CITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </CompactField>
              <CompactField label="Permissions" required className="min-w-0">
                <PermissionsDropdown selected={permissionKeys} onChange={setPermissionKeys} />
              </CompactField>
            </CompactFormRow>
          </CompactFormPanel>
        ) : undefined
      }
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={handleDeleteSelected}
            disabled={selected.size === 0}
            className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={handleToolbarPrint}
            className="bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark"
          >
            Print
          </button>
        </div>
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Live Search here"
            className="border border-gray-400 bg-white px-2 py-1 text-xs"
          />
          <button type="button" className="bg-gray-500 px-3 py-1 text-xs font-medium text-white hover:bg-gray-600">
            Search
          </button>
        </div>
      </div>

      <div className="mb-2 flex items-center gap-2 text-xs text-gray-700">
        <span>Show</span>
        <select
          value={entriesPerPage}
          onChange={(e) => {
            setEntriesPerPage(Number(e.target.value));
            setPage(1);
          }}
          className="border border-gray-400 px-1 py-0.5"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
        <span>entries</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-ad-purple text-white">
              <th className="border border-ad-purple-dark px-2 py-2 text-center">
                <input
                  type="checkbox"
                  checked={paged.length > 0 && selected.size === paged.length}
                  onChange={toggleSelectAll}
                  className="accent-white"
                />
              </th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Role</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">City</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Permissions</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Created Date</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={5} className="border border-gray-300 px-3 py-6 text-center text-gray-500">
                  No roles found.
                </td>
              </tr>
            ) : (
              paged.map((row, idx) => (
                <tr key={row.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                  <td className="border border-gray-300 px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggleSelect(row.id)}
                      className="accent-ad-purple"
                    />
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="text-blue-700 hover:underline"
                    >
                      {row.role}
                    </button>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{row.city}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    {permissionLabels(row.permissionKeys)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{row.createdDate}</td>
                </tr>
              ))
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
              onClick={() => setPage(p)}
              className={`h-7 w-7 border text-xs font-medium ${
                page === p
                  ? "border-ad-green bg-ad-green text-white"
                  : "border-gray-400 bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </AdminPage>
  );
}
