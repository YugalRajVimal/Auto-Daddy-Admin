import { useState } from "react";
import { Link } from "react-router";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import {
  CompactAutoGrowTextarea,
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactFixedFieldWidth,
  compactInputClass,
} from "../../../components/admin/ContentPanel";
import {
  DEFAULT_PERMS,
  MODULES,
  PermissionMatrix,
  type Permissions,
} from "../../../components/admin/PermissionMatrix";

type RoleRow = {
  id: number;
  name: string;
  description: string;
  modules: number;
  status: "Active" | "Inactive";
  createdDate: string;
  permissions: Permissions;
};

const DUMMY_ROLES: RoleRow[] = [
  {
    id: 1,
    name: "Super Admin",
    description: "Full access to all modules",
    modules: MODULES.length,
    status: "Active",
    createdDate: "2026-01-15",
    permissions: Object.fromEntries(
      MODULES.map((m) => [m.key, { view: true, add: true, edit: true, delete: true }])
    ),
  },
  {
    id: 2,
    name: "Support Admin",
    description: "Users, messages, and dashboard access",
    modules: 4,
    status: "Active",
    createdDate: "2026-02-20",
    permissions: {
      ...DEFAULT_PERMS(),
      dashboard: { view: true, add: false, edit: false, delete: false },
      users: { view: true, add: true, edit: true, delete: false },
      inviteHelp: { view: true, add: true, edit: false, delete: false },
      tasks: { view: true, add: false, edit: false, delete: false },
    },
  },
  {
    id: 3,
    name: "Content Editor",
    description: "Dashboard data and website templates",
    modules: 3,
    status: "Active",
    createdDate: "2026-03-08",
    permissions: {
      ...DEFAULT_PERMS(),
      dashboardData: { view: true, add: true, edit: true, delete: false },
      websiteTemplates: { view: true, add: true, edit: true, delete: false },
      dashboard: { view: true, add: false, edit: false, delete: false },
    },
  },
  {
    id: 4,
    name: "Read Only",
    description: "View-only access across modules",
    modules: MODULES.length,
    status: "Inactive",
    createdDate: "2026-04-02",
    permissions: Object.fromEntries(
      MODULES.map((m) => [m.key, { view: true, add: false, edit: false, delete: false }])
    ),
  },
];

function countEnabledModules(permissions: Permissions) {
  return MODULES.filter((m) =>
    (["view", "add", "edit", "delete"] as const).some((a) => permissions[m.key]?.[a])
  ).length;
}

export default function RoleManager() {
  const [roles, setRoles] = useState(DUMMY_ROLES);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [permissions, setPermissions] = useState<Permissions>(DEFAULT_PERMS());

  const filtered = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.status.toLowerCase().includes(search.toLowerCase()) ||
      r.createdDate.includes(search)
  );

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
    setName("");
    setDescription("");
    setStatus("Active");
    setPermissions(DEFAULT_PERMS());
    setEditingId(null);
  };

  const openAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (row: RoleRow) => {
    setEditingId(row.id);
    setName(row.name);
    setDescription(row.description);
    setStatus(row.status);
    setPermissions({ ...DEFAULT_PERMS(), ...row.permissions });
    setShowForm(true);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleSave = () => {
    const payload = {
      name,
      description,
      status,
      permissions,
      modules: countEnabledModules(permissions),
      createdDate: new Date().toISOString().slice(0, 10),
    };

    if (editingId != null) {
      setRoles((prev) =>
        prev.map((r) => (r.id === editingId ? { ...r, ...payload } : r))
      );
    } else {
      setRoles((prev) => [...prev, { id: Math.max(0, ...prev.map((r) => r.id)) + 1, ...payload }]);
    }

    resetForm();
    setShowForm(false);
  };

  const handleDeleteSelected = () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} selected role(s)?`)) return;
    setRoles((prev) => prev.filter((r) => !selected.has(r.id)));
    setSelected(new Set());
  };

  const handleUpdateSelected = () => {
    if (selected.size !== 1) return;
    const row = roles.find((r) => r.id === [...selected][0]);
    if (row) openEdit(row);
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
                onSave={handleSave}
                onCancel={handleCancel}
              />
            }
          >
            <CompactFormRow className="w-full items-start">
              <CompactField label="Role Name" required className={compactFixedFieldWidth}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={compactInputClass}
                />
              </CompactField>
              <CompactField label="Status" required className={compactFixedFieldWidth}>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "Active" | "Inactive")}
                  className={compactInputClass}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </CompactField>
              <CompactField label="Description" required className="min-w-0 flex-1">
                <CompactAutoGrowTextarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </CompactField>
            </CompactFormRow>
            <div className="mt-3 border-t border-gray-300 pt-3">
              <p className="mb-2 text-sm font-bold text-ad-green-dark">Permission Matrix</p>
              <PermissionMatrix permissions={permissions} onChange={setPermissions} />
            </div>
          </CompactFormPanel>
        ) : undefined
      }
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={handleUpdateSelected}
            className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700"
          >
            Update
          </button>
          <button type="button" className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700">
            Shoot
          </button>
          <button
            type="button"
            onClick={handleDeleteSelected}
            className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700"
          >
            Delete
          </button>
          <button type="button" className="bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark">
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
              <th className="border border-ad-purple-dark px-2 py-2 text-left">
                <input
                  type="checkbox"
                  checked={paged.length > 0 && selected.size === paged.length}
                  onChange={toggleSelectAll}
                  className="accent-white"
                />
              </th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Role Name</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Description</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Modules</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Status</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Created Date</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={6} className="border border-gray-300 px-3 py-6 text-center text-gray-500">
                  No roles found.
                </td>
              </tr>
            ) : (
              paged.map((row, idx) => (
                <tr key={row.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                  <td className="border border-gray-300 px-2 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggleSelect(row.id)}
                      className="accent-ad-purple"
                    />
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="text-blue-700 hover:underline"
                    >
                      {row.name}
                    </button>
                  </td>
                  <td className="border border-gray-300 px-3 py-2">{row.description}</td>
                  <td className="border border-gray-300 px-3 py-2">{row.modules}</td>
                  <td className="border border-gray-300 px-3 py-2">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                        row.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2">{row.createdDate}</td>
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
        <Link to="#" className="text-sm text-blue-700 hover:underline">
          Deleted
        </Link>
      </div>
    </AdminPage>
  );
}
