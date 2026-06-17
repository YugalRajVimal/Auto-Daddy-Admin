// pages/AdminPages/SubAdmins/SubAdminManagement.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { AdminDataTable, tableCell } from "../../../components/admin/AdminDataTable";

// ─── Types ────────────────────────────────────────────────────────────────────
const MODULES = [
  { key: "dashboard",        label: "Dashboard" },
  { key: "users",            label: "Users" },
  { key: "services",         label: "Services" },
  { key: "categories",       label: "Categories" },
  { key: "websiteTemplates", label: "Website Templates" },
  { key: "dashboardData",    label: "Dashboard Data" },
  { key: "carCompanies",     label: "Car Companies" },
  { key: "provinces",        label: "Provinces" },
  { key: "cities",           label: "Cities" },
  { key: "ads",              label: "Ads" },
  { key: "runningDeals",     label: "Running Deals" },
  { key: "wallet",           label: "Wallet" },
  { key: "inviteHelp",       label: "Invite Help" },
  { key: "tasks",            label: "Tasks" },
];

const ACTIONS = ["view", "add", "edit", "delete"] as const;
type Action = typeof ACTIONS[number];

type ModulePermissions = Record<Action, boolean>;
type Permissions = Record<string, ModulePermissions>;

const DEFAULT_PERMS = (): Permissions =>
  Object.fromEntries(MODULES.map((m) => [m.key, { view: false, add: false, edit: false, delete: false }]));

interface SubAdmin {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  permissions: Permissions;
  createdBy?: { name?: string; email?: string };
}

interface ActivityLog {
  _id: string;
  action: string;
  module?: string;
  description?: string;
  performedByName?: string;
  ipAddress?: string;
  createdAt: string;
}

const API = import.meta.env.VITE_API_URL;

// ─── Shared helpers ───────────────────────────────────────────────────────────
const thStyle: React.CSSProperties = {
  border: "1px solid #d2d6de", background: "#f9fafc", padding: "10px 12px",
  textAlign: "left", fontWeight: 700, fontSize: 13, color: "#333", whiteSpace: "nowrap",
};
const tdStyle: React.CSSProperties = {
  border: "1px solid #d2d6de", padding: "10px 12px", fontSize: 13, color: "#555", verticalAlign: "middle",
};
// ─── Modal wrapper ────────────────────────────────────────────────────────────
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }> =
  ({ isOpen, onClose, title, children, wide }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}>
        <div style={{ background: "#fff", borderRadius: 4, width: wide ? "min(960px,96vw)" : "min(600px,94vw)", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 5px 15px rgba(0,0,0,.5)" }}>
          <div style={{ background: "#9b308d", color: "#fff", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: "4px 4px 0 0", flexShrink: 0 }}>
            <span style={{ fontWeight: 600, fontSize: 16 }}>{title}</span>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer" }} type="button">×</button>
          </div>
          <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>{children}</div>
        </div>
      </div>
    );
  };

// ─── Permission Matrix ────────────────────────────────────────────────────────
const PermissionMatrix: React.FC<{
  permissions: Permissions;
  onChange: (perms: Permissions) => void;
  readOnly?: boolean;
}> = ({ permissions, onChange, readOnly }) => {
  const toggle = (mod: string, action: Action) => {
    onChange({ ...permissions, [mod]: { ...permissions[mod], [action]: !permissions[mod][action] } });
  };
  const toggleModule = (mod: string) => {
    const allOn = ACTIONS.every((a) => permissions[mod][a]);
    onChange({ ...permissions, [mod]: Object.fromEntries(ACTIONS.map((a) => [a, !allOn])) as ModulePermissions });
  };
  const toggleAll = () => {
    const totalOn = MODULES.every((m) => ACTIONS.every((a) => permissions[m.key]?.[a]));
    onChange(Object.fromEntries(MODULES.map((m) => [m.key, Object.fromEntries(ACTIONS.map((a) => [a, !totalOn]))])) as Permissions);
  };
  const allOn = MODULES.every((m) => ACTIONS.every((a) => permissions[m.key]?.[a]));

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        {!readOnly && (
          <button type="button" onClick={toggleAll}
            style={{ fontSize: 12, color: "#0073b7", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
            {allOn ? "Deselect All" : "Select All"}
          </button>
        )}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#f4f4f4" }}>
            <th style={{ ...thStyle, width: 160 }}>Module</th>
            {ACTIONS.map((a) => (
              <th key={a} style={{ ...thStyle, textAlign: "center", textTransform: "capitalize" }}>{a}</th>
            ))}
            {!readOnly && <th style={{ ...thStyle, textAlign: "center" }}>All</th>}
          </tr>
        </thead>
        <tbody>
          {MODULES.map((mod, idx) => {
            const p = permissions[mod.key] || { view: false, add: false, edit: false, delete: false };
            const modAllOn = ACTIONS.every((a) => p[a]);
            return (
              <tr key={mod.key} style={{ background: idx % 2 === 0 ? "#fafafa" : "#fff" }}>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{mod.label}</td>
                {ACTIONS.map((a) => (
                  <td key={a} style={{ ...tdStyle, textAlign: "center" }}>
                    {readOnly ? (
                      <span style={{ color: p[a] ? "#27ae60" : "#e74c3c", fontWeight: 700 }}>{p[a] ? "✓" : "✗"}</span>
                    ) : (
                      <input type="checkbox" checked={!!p[a]} onChange={() => toggle(mod.key, a)}
                        style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#0073b7" }} />
                    )}
                  </td>
                ))}
                {!readOnly && (
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <button type="button" onClick={() => toggleModule(mod.key)}
                      style={{ fontSize: 11, padding: "2px 8px", border: "1px solid #0073b7", borderRadius: 3, background: modAllOn ? "#0073b7" : "#fff", color: modAllOn ? "#fff" : "#0073b7", cursor: "pointer" }}>
                      {modAllOn ? "Clear" : "All"}
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const SubAdminManagement: React.FC = () => {
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleCols, setVisibleCols] = useState(["name", "email", "phone", "status", "createdDate", "lastLogin"]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPermModal, setShowPermModal] = useState<SubAdmin | null>(null);
  const [showActivityModal, setShowActivityModal] = useState<SubAdmin | null>(null);
  const [showViewModal, setShowViewModal] = useState<SubAdmin | null>(null);
  const [showResetModal, setShowResetModal] = useState<SubAdmin | null>(null);
  const [editingSubAdmin, setEditingSubAdmin] = useState<SubAdmin | null>(null);

  // Form state
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [formPerms, setFormPerms] = useState<Permissions>(DEFAULT_PERMS());
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Activity logs
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Permission edit
  const [editPerms, setEditPerms] = useState<Permissions>(DEFAULT_PERMS());
  const [permLoading, setPermLoading] = useState(false);

  // Reset password
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const token = localStorage.getItem("admin-token");
  const headers = { Authorization: token || "" };

  const fetchSubAdmins = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await axios.get(`${API}/api/admin/subadmins`, { headers });
      setSubAdmins(res.data.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load SubAdmins");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSubAdmins(); }, [fetchSubAdmins]);

  const showMsg = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3500); };

  // Filter + paginate
  const filtered = subAdmins.filter((s) => {
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || (s.phone || "").includes(q);
  });

  const tableColumns = useMemo(
    () => [
      {
        key: "name",
        label: "Name",
        render: (sa: SubAdmin) => tableCell(<span style={{ fontWeight: 500 }}>{sa.name}</span>),
        exportValue: (sa: SubAdmin) => sa.name,
      },
      {
        key: "email",
        label: "Email",
        render: (sa: SubAdmin) => tableCell(sa.email),
        exportValue: (sa: SubAdmin) => sa.email,
      },
      {
        key: "phone",
        label: "Phone",
        render: (sa: SubAdmin) => tableCell(sa.phone || "—"),
        exportValue: (sa: SubAdmin) => sa.phone || "—",
      },
      {
        key: "status",
        label: "Status",
        render: (sa: SubAdmin) =>
          tableCell(
            <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 3, fontSize: 12, fontWeight: 600, background: sa.isActive ? "#dff0d8" : "#f2dede", color: sa.isActive ? "#3c763d" : "#a94442", border: `1px solid ${sa.isActive ? "#d6e9c6" : "#ebccd1"}` }}>
              {sa.isActive ? "Active" : "Inactive"}
            </span>
          ),
        exportValue: (sa: SubAdmin) => (sa.isActive ? "Active" : "Inactive"),
      },
      {
        key: "createdDate",
        label: "Created Date",
        render: (sa: SubAdmin) => tableCell(new Date(sa.createdAt).toLocaleDateString()),
        exportValue: (sa: SubAdmin) => new Date(sa.createdAt).toLocaleDateString(),
      },
      {
        key: "lastLogin",
        label: "Last Login",
        render: (sa: SubAdmin) => tableCell(sa.lastLogin ? new Date(sa.lastLogin).toLocaleString() : "Never"),
        exportValue: (sa: SubAdmin) => (sa.lastLogin ? new Date(sa.lastLogin).toLocaleString() : "Never"),
      },
    ],
    []
  );

  const actionBtn = (label: string, onClick: () => void, style: React.CSSProperties) => (
    <button onClick={onClick} type="button" style={{ padding: "3px 10px", borderRadius: 3, fontSize: 12, cursor: "pointer", ...style }}>
      {label}
    </button>
  );

  // Create / Edit
  const openCreate = () => {
    setEditingSubAdmin(null);
    setForm({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
    setFormPerms(DEFAULT_PERMS());
    setFormError("");
    setShowCreateModal(true);
  };

  const openEdit = (sa: SubAdmin) => {
    setEditingSubAdmin(sa);
    setForm({ name: sa.name, email: sa.email, phone: sa.phone || "", password: "", confirmPassword: "" });
    setFormPerms({ ...DEFAULT_PERMS(), ...sa.permissions });
    setFormError("");
    setShowCreateModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!editingSubAdmin && form.password !== form.confirmPassword)
      return setFormError("Passwords do not match.");
    if (!editingSubAdmin && form.password.length < 6)
      return setFormError("Password must be at least 6 characters.");

    setFormLoading(true);
    try {
      if (editingSubAdmin) {
        await axios.put(`${API}/api/admin/subadmins/${editingSubAdmin._id}`,
          { name: form.name, email: form.email, phone: form.phone }, { headers });
        // Also update permissions
        await axios.patch(`${API}/api/admin/subadmins/${editingSubAdmin._id}/permissions`,
          { permissions: formPerms }, { headers });
        showMsg("SubAdmin updated successfully.");
      } else {
        await axios.post(`${API}/api/admin/subadmins`,
          { name: form.name, email: form.email, phone: form.phone, password: form.password, permissions: formPerms },
          { headers });
        showMsg("SubAdmin created successfully.");
      }
      setShowCreateModal(false);
      fetchSubAdmins();
    } catch (e: any) {
      setFormError(e?.response?.data?.message || "An error occurred.");
    } finally { setFormLoading(false); }
  };

  // Toggle Status
  const handleToggleStatus = async (sa: SubAdmin) => {
    try {
      await axios.patch(`${API}/api/admin/subadmins/${sa._id}/status`,
        { isActive: !sa.isActive }, { headers });
      showMsg(`SubAdmin ${sa.isActive ? "deactivated" : "activated"}.`);
      fetchSubAdmins();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to update status.");
    }
  };

  // Delete
  const handleDelete = async (sa: SubAdmin) => {
    if (!window.confirm(`Delete SubAdmin "${sa.name}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/api/admin/subadmins/${sa._id}`, { headers });
      showMsg("SubAdmin deleted.");
      fetchSubAdmins();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to delete.");
    }
  };

  // Permission modal
  const openPermModal = (sa: SubAdmin) => {
    setEditPerms({ ...DEFAULT_PERMS(), ...sa.permissions });
    setShowPermModal(sa);
  };
  const handleSavePerms = async () => {
    if (!showPermModal) return;
    setPermLoading(true);
    try {
      await axios.patch(`${API}/api/admin/subadmins/${showPermModal._id}/permissions`,
        { permissions: editPerms }, { headers });
      showMsg("Permissions updated.");
      setShowPermModal(null);
      fetchSubAdmins();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to update permissions.");
    } finally { setPermLoading(false); }
  };

  // Activity logs
  const openActivityModal = async (sa: SubAdmin) => {
    setShowActivityModal(sa);
    setActivityLoading(true);
    try {
      const res = await axios.get(`${API}/api/admin/subadmins/${sa._id}/activity`, { headers });
      setActivityLogs(res.data.data || []);
    } catch { setActivityLogs([]); }
    finally { setActivityLoading(false); }
  };

  // Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showResetModal) return;
    if (newPassword.length < 6) return setError("Password must be at least 6 characters.");
    setResetLoading(true);
    try {
      await axios.patch(`${API}/api/admin/subadmins/${showResetModal._id}/reset-password`,
        { newPassword }, { headers });
      showMsg("Password reset successfully.");
      setShowResetModal(null);
      setNewPassword("");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to reset password.");
    } finally { setResetLoading(false); }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Create / Edit Modal ─────────────────────────────────────────────── */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}
        title={editingSubAdmin ? `Edit SubAdmin — ${editingSubAdmin.name}` : "Create Sub Admin"} wide>
        <form onSubmit={handleSubmit} autoComplete="off">
          {formError && (
            <div style={{ marginBottom: 12, padding: "8px 12px", background: "#fdf3f2", border: "1px solid #f5c6cb", borderRadius: 3, color: "#c0392b", fontSize: 13 }}>{formError}</div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            {[
              { label: "Full Name", name: "name", type: "text", required: true, placeholder: "John Doe" },
              { label: "Email Address", name: "email", type: "email", required: true, placeholder: "john@example.com" },
              { label: "Phone", name: "phone", type: "tel", placeholder: "+1 800 000 0000" },
            ].map((field) => (
              <div key={field.name}>
                <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                  {field.label} {field.required && <span style={{ color: "#e73d3d" }}>*</span>}
                </label>
                <input type={field.type} required={field.required} placeholder={field.placeholder}
                  value={(form as any)[field.name]}
                  onChange={(e) => setForm((p) => ({ ...p, [field.name]: e.target.value }))}
                  style={{ width: "100%", border: "1px solid #d2d6de", borderRadius: 3, padding: "7px 10px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
            {!editingSubAdmin && (
              <>
                <div>
                  <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Password <span style={{ color: "#e73d3d" }}>*</span></label>
                  <input type="password" required value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    style={{ width: "100%", border: "1px solid #d2d6de", borderRadius: 3, padding: "7px 10px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Confirm Password <span style={{ color: "#e73d3d" }}>*</span></label>
                  <input type="password" required value={form.confirmPassword}
                    onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    style={{ width: "100%", border: "1px solid #d2d6de", borderRadius: 3, padding: "7px 10px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                </div>
              </>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, borderBottom: "2px solid #9b308d", paddingBottom: 6, color: "#9b308d" }}>
              Permission Matrix
            </div>
            <PermissionMatrix permissions={formPerms} onChange={setFormPerms} />
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
            <button type="button" onClick={() => setShowCreateModal(false)}
              style={{ padding: "7px 18px", borderRadius: 3, border: "1px solid #d2d6de", background: "#fff", color: "#444", fontSize: 13, cursor: "pointer" }}>
              Cancel
            </button>
            <button type="submit" disabled={formLoading}
              style={{ padding: "7px 22px", borderRadius: 3, border: "none", background: formLoading ? "#aaa" : "#0073b7", color: "#fff", fontSize: 13, fontWeight: 600, cursor: formLoading ? "not-allowed" : "pointer" }}>
              {formLoading ? "Saving..." : editingSubAdmin ? "Save Changes" : "Create SubAdmin"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Permission Edit Modal ────────────────────────────────────────────── */}
      <Modal isOpen={!!showPermModal} onClose={() => setShowPermModal(null)}
        title={`Permissions — ${showPermModal?.name}`} wide>
        <PermissionMatrix permissions={editPerms} onChange={setEditPerms} />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
          <button type="button" onClick={() => setShowPermModal(null)}
            style={{ padding: "7px 18px", borderRadius: 3, border: "1px solid #d2d6de", background: "#fff", color: "#444", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          <button type="button" onClick={handleSavePerms} disabled={permLoading}
            style={{ padding: "7px 22px", borderRadius: 3, border: "none", background: permLoading ? "#aaa" : "#00a65a", color: "#fff", fontSize: 13, fontWeight: 600, cursor: permLoading ? "not-allowed" : "pointer" }}>
            {permLoading ? "Saving..." : "Save Permissions"}
          </button>
        </div>
      </Modal>

      {/* ── Activity Log Modal ───────────────────────────────────────────────── */}
      <Modal isOpen={!!showActivityModal} onClose={() => setShowActivityModal(null)}
        title={`Activity Log — ${showActivityModal?.name}`} wide>
        {activityLoading ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "#888" }}>Loading logs...</div>
        ) : activityLogs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "#aaa" }}>No activity logs found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Action", "Module", "Description", "Performed By", "IP Address", "Timestamp"].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activityLogs.map((log) => (
                  <tr key={log._id}>
                    <td style={tdStyle}>
                      <span style={{ padding: "2px 8px", borderRadius: 3, fontSize: 11, fontWeight: 700, background: log.action === "LOGIN" ? "#dff0d8" : log.action === "DELETE" ? "#f2dede" : log.action === "PERMISSION_CHANGE" ? "#d9edf7" : "#fcf8e3", color: log.action === "LOGIN" ? "#3c763d" : log.action === "DELETE" ? "#a94442" : log.action === "PERMISSION_CHANGE" ? "#31708f" : "#8a6d3b" }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={tdStyle}>{log.module || "—"}</td>
                    <td style={{ ...tdStyle, maxWidth: 240 }}>{log.description || "—"}</td>
                    <td style={tdStyle}>{log.performedByName || "—"}</td>
                    <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 11 }}>{log.ipAddress || "—"}</td>
                    <td style={tdStyle}>{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* ── View Modal ───────────────────────────────────────────────────────── */}
      <Modal isOpen={!!showViewModal} onClose={() => setShowViewModal(null)}
        title={`SubAdmin Details — ${showViewModal?.name}`} wide>
        {showViewModal && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px 20px", fontSize: 13, marginBottom: 18, padding: "12px 16px", background: "#f8f9fa", border: "1px solid #d2d6de", borderRadius: 3 }}>
              {[
                ["Name", showViewModal.name],
                ["Email", showViewModal.email],
                ["Phone", showViewModal.phone || "—"],
                ["Status", showViewModal.isActive ? "Active" : "Inactive"],
                ["Last Login", showViewModal.lastLogin ? new Date(showViewModal.lastLogin).toLocaleString() : "Never"],
                ["Created At", new Date(showViewModal.createdAt).toLocaleString()],
                ["Created By", showViewModal.createdBy?.name || "Admin"],
              ].map(([label, value]) => (
                <div key={label as string}><span style={{ fontWeight: 600 }}>{label}:</span> {value as string}</div>
              ))}
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, borderBottom: "2px solid #9b308d", paddingBottom: 6, color: "#9b308d" }}>Permissions</div>
            <PermissionMatrix permissions={{ ...DEFAULT_PERMS(), ...showViewModal.permissions }} onChange={() => {}} readOnly />
          </>
        )}
      </Modal>

      {/* ── Reset Password Modal ─────────────────────────────────────────────── */}
      <Modal isOpen={!!showResetModal} onClose={() => { setShowResetModal(null); setNewPassword(""); }}
        title={`Reset Password — ${showResetModal?.name}`}>
        <form onSubmit={handleResetPassword}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 4 }}>New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              required minLength={6} placeholder="Min. 6 characters"
              style={{ width: "100%", border: "1px solid #d2d6de", borderRadius: 3, padding: "7px 10px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" onClick={() => { setShowResetModal(null); setNewPassword(""); }}
              style={{ padding: "7px 18px", borderRadius: 3, border: "1px solid #d2d6de", background: "#fff", color: "#444", fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={resetLoading}
              style={{ padding: "7px 22px", borderRadius: 3, border: "none", background: resetLoading ? "#aaa" : "#f39c12", color: "#fff", fontSize: 13, fontWeight: 600, cursor: resetLoading ? "not-allowed" : "pointer" }}>
              {resetLoading ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Page ─────────────────────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-4 md:px-6 md:py-5 font-sans">
        <h1 className="mb-4 text-xl font-bold text-ad-green md:text-2xl">Sub Admin Management</h1>

        {error && (
          <div style={{ marginBottom: 12, padding: "10px 14px", background: "#fdf3f2", border: "1px solid #f5c6cb", borderRadius: 3, color: "#c0392b", fontSize: 13 }}>{error}</div>
        )}
        {success && (
          <div style={{ marginBottom: 12, padding: "10px 14px", background: "#f0fff4", border: "1px solid #c3e6cb", borderRadius: 3, color: "#27ae60", fontSize: 13 }}>{success}</div>
        )}

        <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 400, color: "#444" }}>Sub Admin List</h3>
          <button onClick={openCreate} type="button"
            style={{ padding: "6px 16px", borderRadius: 3, border: "none", background: "#0073b7", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            + Add Sub Admin
          </button>
        </div>

        <div className="mb-10">
          <AdminDataTable
            items={filtered}
            columns={tableColumns}
            getRowId={(sa) => sa._id}
            loading={loading}
            error={error || null}
            emptyMessage="No sub admins found."
            search={search}
            onSearchChange={setSearch}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            currentPage={currentPage}
            onCurrentPageChange={setCurrentPage}
            visibleColumnKeys={visibleCols}
            onVisibleColumnKeysChange={setVisibleCols}
            selectedIds={selectedIds}
            onSelectedIdsChange={setSelectedIds}
            exportFilename="sub-admins"
            totalBeforeFilter={subAdmins.length}
            extraToolbarActions={[
              {
                label: "✏️ Update",
                color: "#0073b7",
                minSelected: 1,
                maxSelected: 1,
                onClick: (ids) => {
                  const sa = subAdmins.find((s) => s._id === ids[0]);
                  if (sa) openEdit(sa);
                },
              },
            ]}
            renderActions={(sa) => (
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {actionBtn("View", () => setShowViewModal(sa), { border: "1px solid #0073b7", background: "#fff", color: "#0073b7" })}
                {actionBtn("Edit", () => openEdit(sa), { border: "1px solid #0073b7", background: "#0073b7", color: "#fff" })}
                {actionBtn("Perms", () => openPermModal(sa), { border: "1px solid #f39c12", background: "#f39c12", color: "#fff" })}
                {actionBtn(sa.isActive ? "Disable" : "Enable", () => handleToggleStatus(sa), { border: "1px solid #d2d6de", background: sa.isActive ? "#f2dede" : "#dff0d8", color: sa.isActive ? "#a94442" : "#3c763d" })}
                {actionBtn("Logs", () => openActivityModal(sa), { border: "1px solid #17a2b8", background: "#17a2b8", color: "#fff" })}
                {actionBtn("Reset PW", () => setShowResetModal(sa), { border: "1px solid #777", background: "#777", color: "#fff" })}
                {actionBtn("Delete", () => handleDelete(sa), { border: "1px solid #d2d6de", background: "#f2dede", color: "#a94442" })}
              </div>
            )}
          />
        </div>
      </div>
    </>
  );
};

export default SubAdminManagement;