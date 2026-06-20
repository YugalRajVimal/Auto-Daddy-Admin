// pages/AdminPages/SubAdmins/SubAdminManagement.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import axios from "axios";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactFixedFieldWidth,
  compactInputClass,
} from "../../../components/admin/ContentPanel";
import {
  DEFAULT_PERMS,
  PermissionMatrix,
  type Permissions,
} from "../../../components/admin/PermissionMatrix";

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

// ─── Main Component ───────────────────────────────────────────────────────────
const SubAdminManagement: React.FC = () => {
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Inline form
  const [showForm, setShowForm] = useState(false);
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paged.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paged.map((s) => s._id)));
  };

  const actionLink = (label: string, onClick: () => void, className = "text-blue-700 hover:underline") => (
    <button type="button" onClick={onClick} className={`mr-2 ${className}`}>
      {label}
    </button>
  );

  // Create / Edit
  const openCreate = () => {
    setEditingSubAdmin(null);
    setForm({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
    setFormPerms(DEFAULT_PERMS());
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (sa: SubAdmin) => {
    setEditingSubAdmin(sa);
    setForm({ name: sa.name, email: sa.email, phone: sa.phone || "", password: "", confirmPassword: "" });
    setFormPerms({ ...DEFAULT_PERMS(), ...sa.permissions });
    setFormError("");
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setEditingSubAdmin(null);
    setForm({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
    setFormPerms(DEFAULT_PERMS());
    setFormError("");
    setShowForm(false);
  };

  const saveForm = async () => {
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
        await axios.patch(`${API}/api/admin/subadmins/${editingSubAdmin._id}/permissions`,
          { permissions: formPerms }, { headers });
        showMsg("SubAdmin updated successfully.");
      } else {
        await axios.post(`${API}/api/admin/subadmins`,
          { name: form.name, email: form.email, phone: form.phone, password: form.password, permissions: formPerms },
          { headers });
        showMsg("SubAdmin created successfully.");
      }
      setShowForm(false);
      fetchSubAdmins();
    } catch (e: any) {
      setFormError(e?.response?.data?.message || "An error occurred.");
    } finally { setFormLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveForm();
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

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} selected sub-admin(s)?`)) return;
    try {
      await Promise.all(
        [...selectedIds].map((id) => axios.delete(`${API}/api/admin/subadmins/${id}`, { headers }))
      );
      showMsg("Selected sub-admins deleted.");
      setSelectedIds(new Set());
      fetchSubAdmins();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to delete.");
    }
  };

  const handleUpdateSelected = () => {
    if (selectedIds.size !== 1) return;
    const sa = subAdmins.find((s) => s._id === [...selectedIds][0]);
    if (sa) openEdit(sa);
  };

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

      <AdminPage
        title="Manage Admin"
        headerAction={!showForm ? <AddNewButton onClick={openCreate} /> : undefined}
        between={
          showForm ? (
            <CompactFormPanel
              footer={
                <CompactFormFooter
                  message={
                    editingSubAdmin
                      ? `You are editing '${editingSubAdmin.name}'`
                      : "You are creating a 'Sub Admin'"
                  }
                  messageCenter
                  actionLabel={formLoading ? "Saving..." : "Save"}
                  onSave={saveForm}
                  onCancel={handleCancelForm}
                />
              }
            >
              {formError && (
                <div className="mb-2 rounded border border-red-200 bg-red-100 px-3 py-2 text-xs text-red-800">
                  {formError}
                </div>
              )}
              <form onSubmit={handleSubmit} autoComplete="off">
                <CompactFormRow className="w-full items-start">
                  <CompactField label="Full Name" required className={compactFixedFieldWidth}>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="John Doe"
                      className={compactInputClass}
                    />
                  </CompactField>
                  <CompactField label="Email" required className={compactFixedFieldWidth}>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="john@example.com"
                      className={compactInputClass}
                    />
                  </CompactField>
                  <CompactField label="Phone" className={compactFixedFieldWidth}>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+1 800 000 0000"
                      className={compactInputClass}
                    />
                  </CompactField>
                  {!editingSubAdmin && (
                    <>
                      <CompactField label="Password" required className={compactFixedFieldWidth}>
                        <input
                          type="password"
                          required
                          value={form.password}
                          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                          className={compactInputClass}
                        />
                      </CompactField>
                      <CompactField label="Confirm Password" required className={compactFixedFieldWidth}>
                        <input
                          type="password"
                          required
                          value={form.confirmPassword}
                          onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                          className={compactInputClass}
                        />
                      </CompactField>
                    </>
                  )}
                </CompactFormRow>
                <div className="mt-3 border-t border-gray-300 pt-3">
                  <p className="mb-2 text-sm font-bold text-ad-green-dark">Permission Matrix</p>
                  <PermissionMatrix permissions={formPerms} onChange={setFormPerms} />
                </div>
              </form>
            </CompactFormPanel>
          ) : undefined
        }
      >
        {error && (
          <div className="mb-2 rounded border border-red-200 bg-red-100 px-3 py-2 text-xs text-red-800">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-2 rounded border border-green-200 bg-green-100 px-3 py-2 text-xs text-green-800">
            {success}
          </div>
        )}

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
                setCurrentPage(1);
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
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
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
          {loading ? (
            <p className="py-6 text-center text-sm text-gray-500">Loading sub-admins…</p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-ad-purple text-white">
                  <th className="border border-ad-purple-dark px-2 py-2 text-left">
                    <input
                      type="checkbox"
                      checked={paged.length > 0 && selectedIds.size === paged.length}
                      onChange={toggleSelectAll}
                      className="accent-white"
                    />
                  </th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Name</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Email</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Phone</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Status</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Created Date</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Last Login</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="border border-gray-300 px-3 py-6 text-center text-gray-500">
                      No sub admins found.
                    </td>
                  </tr>
                ) : (
                  paged.map((sa, idx) => (
                    <tr key={sa._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                      <td className="border border-gray-300 px-2 py-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(sa._id)}
                          onChange={() => toggleSelect(sa._id)}
                          className="accent-ad-purple"
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <button
                          type="button"
                          onClick={() => openEdit(sa)}
                          className="font-medium text-blue-700 hover:underline"
                        >
                          {sa.name}
                        </button>
                      </td>
                      <td className="border border-gray-300 px-3 py-2">{sa.email}</td>
                      <td className="border border-gray-300 px-3 py-2">{sa.phone || "—"}</td>
                      <td className="border border-gray-300 px-3 py-2">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                            sa.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {sa.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        {new Date(sa.createdAt).toLocaleDateString()}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        {sa.lastLogin ? new Date(sa.lastLogin).toLocaleString() : "Never"}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center whitespace-nowrap">
                        {actionLink("View", () => setShowViewModal(sa))}
                        {actionLink("Edit", () => openEdit(sa))}
                        {actionLink("Perms", () => openPermModal(sa), "text-amber-700 hover:underline")}
                        {actionLink(
                          sa.isActive ? "Disable" : "Enable",
                          () => handleToggleStatus(sa),
                          sa.isActive ? "text-red-700 hover:underline" : "text-green-700 hover:underline"
                        )}
                        {actionLink("Logs", () => openActivityModal(sa), "text-cyan-700 hover:underline")}
                        {actionLink("Reset", () => setShowResetModal(sa), "text-gray-700 hover:underline")}
                        {actionLink("Delete", () => handleDelete(sa), "text-red-700 hover:underline")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                className={`h-7 w-7 border text-xs font-medium ${
                  currentPage === p
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
    </>
  );
};

export default SubAdminManagement;