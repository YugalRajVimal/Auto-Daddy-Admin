// pages/AdminPages/SubAdmins/SubAdminManagement.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import AttachImageCheckbox from "../../../components/admin/AttachImageCheckbox";
import ClipImageHover from "../../../components/admin/ClipImageHover";
import { adminNotify } from "../../../utils/adminNotify";
import { printAdminTable } from "../../../utils/adminPrintTable";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import { MoreDotIcon } from "../../../icons";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  compactFixedFieldWidth,
  compactInputClass,
} from "../../../components/admin/ContentPanel";
import {
  ACTIONS,
  DEFAULT_PERMS,
  MODULES,
  PermissionMatrix,
  type Permissions,
} from "../../../components/admin/PermissionMatrix";

interface SubAdmin {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  city?: string;
  profilePhoto?: string;
  profileImage?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  permissions: Permissions;
  createdBy?: { name?: string; email?: string };
}

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

const ROLE_OPTIONS = [
  "Super Admin",
  "Admin",
  "Sub Admin",
  "Business Associate",
];

const subAdminFormGridClass =
  "grid w-full grid-cols-[140px_140px_minmax(0,1fr)_140px_minmax(0,1fr)] items-start gap-x-4 gap-y-4 sm:grid-cols-[180px_180px_minmax(0,1fr)_180px_minmax(0,1fr)]";
const subAdminFormGridField = "min-w-0 w-full !flex-none";

const API = import.meta.env.VITE_API_URL;

function adminImageUrl(sa: SubAdmin) {
  const path = sa.profilePhoto || sa.profileImage;
  if (!path) return "";
  return path.startsWith("http") ? path : `${API}/${path.replace(/^\.?\/?/, "")}`;
}

function formatAdminDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function permissionLabels(keys: string[]) {
  return keys
    .map((key) => MODULES.find((m) => m.key === key)?.label ?? key)
    .join(", ");
}

function permissionKeysFromPerms(perms: Permissions) {
  return MODULES.filter((m) => ACTIONS.some((a) => perms[m.key]?.[a])).map((m) => m.key);
}

function permsFromPermissionKeys(keys: string[]): Permissions {
  const perms = DEFAULT_PERMS();
  for (const key of keys) {
    if (perms[key]) {
      perms[key] = { view: true, add: true, edit: true, delete: true };
    }
  }
  return perms;
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

function TableRowMenu({
  open,
  onToggle,
  onClose,
  items,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  items: { label: string; onClick: () => void; className?: string }[];
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number } | null>(null);

  const updatePosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const menuWidth = 160;
    const menuHeight = menuRef.current?.offsetHeight ?? items.length * 30 + 8;
    const gap = 4;

    let top = rect.bottom + gap;
    let left = rect.right - menuWidth;

    if (top + menuHeight > window.innerHeight - gap) {
      top = Math.max(gap, rect.top - menuHeight - gap);
    }
    left = Math.max(gap, Math.min(left, window.innerWidth - menuWidth - gap));

    setMenuStyle({ top, left });
  }, [items.length]);

  useEffect(() => {
    if (!open) {
      setMenuStyle(null);
      return;
    }
    updatePosition();
    const raf = requestAnimationFrame(() => updatePosition());
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  const menu =
    open && menuStyle
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: "fixed",
              top: menuStyle.top,
              left: menuStyle.left,
              zIndex: 9999,
            }}
            className="min-w-[160px] rounded border border-gray-400 bg-white py-1 shadow-lg"
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  item.onClick();
                  onClose();
                }}
                className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 ${item.className ?? "text-gray-800"}`}
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={onToggle}
        className="dropdown-toggle inline-flex h-8 w-8 items-center justify-center rounded hover:bg-gray-200"
        aria-label="Row actions"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreDotIcon className="size-5 text-gray-600" />
      </button>
      {menu}
    </>
  );
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

// ─── Shared helpers ───────────────────────────────────────────────────────────
const thStyle: React.CSSProperties = {
  border: "1px solid #d2d6de", background: "#f9fafc", padding: "10px 12px",
  textAlign: "center", fontWeight: 700, fontSize: 13, color: "#333", whiteSpace: "nowrap",
};
const tdStyle: React.CSSProperties = {
  border: "1px solid #d2d6de", padding: "10px 12px", fontSize: 13, color: "#555", verticalAlign: "middle", textAlign: "center",
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Inline form
  const [showForm, setShowForm] = useState(false);
  const [showPermModal, setShowPermModal] = useState<SubAdmin | null>(null);
  const [showActivityModal, setShowActivityModal] = useState<SubAdmin | null>(null);
  const [showViewModal, setShowViewModal] = useState<SubAdmin | null>(null);
  const [editingSubAdmin, setEditingSubAdmin] = useState<SubAdmin | null>(null);

  // Form state
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [role, setRole] = useState("");
  const [city, setCity] = useState("");
  const [permissionKeys, setPermissionKeys] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [attachImage, setAttachImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Activity logs
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Permission edit
  const [editPerms, setEditPerms] = useState<Permissions>(DEFAULT_PERMS());
  const [permLoading, setPermLoading] = useState(false);

  const token = localStorage.getItem("admin-token");
  const headers = { Authorization: token || "" };

  const fetchSubAdmins = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await axios.get(`${API}/api/admin/subadmins`, { headers });
      setSubAdmins(res.data.data || []);
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Failed to load SubAdmins";
      setError(msg);
      adminNotify.error(msg);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSubAdmins(); }, [fetchSubAdmins]);

  const showMsg = (msg: string) => { setSuccess(msg); adminNotify.success(msg); setTimeout(() => setSuccess(""), 3500); };

  const resetFormFields = () => {
    setForm({ name: "", email: "", phone: "" });
    setDate(new Date().toISOString().slice(0, 10));
    setRole("");
    setCity("");
    setPermissionKeys([]);
    setIsActive(true);
    setAttachImage(false);
    if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview("");
  };

  // Filter + paginate
  const filtered = subAdmins.filter((s) => {
    const q = search.toLowerCase();
    const keys = permissionKeysFromPerms(s.permissions);
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.phone || "").includes(q) ||
      (s.role || "").toLowerCase().includes(q) ||
      (s.city || "").toLowerCase().includes(q) ||
      formatAdminDate(s.createdAt).includes(search) ||
      permissionLabels(keys).toLowerCase().includes(q)
    );
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

  // Create / Edit
  const openCreate = () => {
    setEditingSubAdmin(null);
    resetFormFields();
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (sa: SubAdmin) => {
    setEditingSubAdmin(sa);
    setForm({ name: sa.name, email: sa.email, phone: sa.phone || "" });
    setDate(formatAdminDate(sa.createdAt));
    setRole(sa.role || "");
    setCity(sa.city || "");
    setPermissionKeys(permissionKeysFromPerms(sa.permissions));
    setIsActive(sa.isActive);
    const existingImage = adminImageUrl(sa);
    setAttachImage(!!existingImage);
    setImageFile(null);
    setImagePreview(existingImage);
    setFormError("");
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setEditingSubAdmin(null);
    resetFormFields();
    setFormError("");
    setShowForm(false);
  };

  const saveForm = async () => {
    setFormError("");
    if (!form.name.trim()) {
      const msg = "Name is required.";
      setFormError(msg);
      adminNotify.error(msg);
      return;
    }
    if (!form.email.trim()) {
      const msg = "Email is required.";
      setFormError(msg);
      adminNotify.error(msg);
      return;
    }
    if (!role) {
      const msg = "Role is required.";
      setFormError(msg);
      adminNotify.error(msg);
      return;
    }
    if (!city) {
      const msg = "City is required.";
      setFormError(msg);
      adminNotify.error(msg);
      return;
    }
    if (permissionKeys.length === 0) {
      const msg = "Select at least one permission.";
      setFormError(msg);
      adminNotify.error(msg);
      return;
    }

    const formPerms = permsFromPermissionKeys(permissionKeys);
    const basePayload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone,
      role,
      city,
      isActive,
    };

    setFormLoading(true);
    try {
      if (editingSubAdmin) {
        if (imageFile) {
          const fd = new FormData();
          Object.entries(basePayload).forEach(([key, value]) => fd.append(key, String(value)));
          fd.append("profilePhoto", imageFile, imageFile.name);
          await axios.put(`${API}/api/admin/subadmins/${editingSubAdmin._id}`, fd, {
            headers: { ...headers, "Content-Type": "multipart/form-data" },
          });
        } else {
          await axios.put(`${API}/api/admin/subadmins/${editingSubAdmin._id}`, basePayload, { headers });
        }
        await axios.patch(`${API}/api/admin/subadmins/${editingSubAdmin._id}/permissions`,
          { permissions: formPerms }, { headers });
        showMsg("SubAdmin updated successfully.");
      } else {
        if (imageFile) {
          const fd = new FormData();
          Object.entries(basePayload).forEach(([key, value]) => fd.append(key, String(value)));
          fd.append("permissions", JSON.stringify(formPerms));
          fd.append("profilePhoto", imageFile, imageFile.name);
          await axios.post(`${API}/api/admin/subadmins`, fd, {
            headers: { ...headers, "Content-Type": "multipart/form-data" },
          });
        } else {
          await axios.post(`${API}/api/admin/subadmins`,
            { ...basePayload, permissions: formPerms },
            { headers });
        }
        showMsg("SubAdmin created successfully.");
      }
      setShowForm(false);
      resetFormFields();
      fetchSubAdmins();
    } catch (e: any) {
      const msg = e?.response?.data?.message || "An error occurred.";
      setFormError(msg);
      adminNotify.error(msg);
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
      const msg = e?.response?.data?.message || "Failed to update status.";
      setError(msg);
      adminNotify.error(msg);
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
      const msg = e?.response?.data?.message || "Failed to delete.";
      setError(msg);
      adminNotify.error(msg);
    }
  };

  const handleToolbarPrint = () => {
    printAdminTable({
      title: "Sub Admin Management",
      headers: ["Date", "Role", "Name", "Phone", "Email", "Photo", "City", "Permissions", "Status"],
      rows: filtered.map((subAdmin) => [
          formatAdminDate(subAdmin.createdAt),
          subAdmin.role || "—",
          subAdmin.name,
          subAdmin.phone || "—",
          subAdmin.email,
          adminImageUrl(subAdmin) ? "Yes" : "—",
          subAdmin.city || "—",
          permissionLabels(permissionKeysFromPerms(subAdmin.permissions)) || "—",
          subAdmin.isActive ? "Active" : "Inactive",
        ]),
    });
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
      const msg = e?.response?.data?.message || "Failed to update permissions.";
      setError(msg);
      adminNotify.error(msg);
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
                ["Date", formatAdminDate(showViewModal.createdAt)],
                ["Role", showViewModal.role || "—"],
                ["Name", showViewModal.name],
                ["Phone", showViewModal.phone || "—"],
                ["Email", showViewModal.email],
                ["City", showViewModal.city || "—"],
                ["Status", showViewModal.isActive ? "Active" : "Inactive"],
                ["Last Login", showViewModal.lastLogin ? new Date(showViewModal.lastLogin).toLocaleString() : "Never"],
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
                  actionLabel={
                    formLoading
                      ? (editingSubAdmin ? "Updating..." : "Saving...")
                      : (editingSubAdmin ? "Update" : "Save")
                  }
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
              <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-4">
                <div className={subAdminFormGridClass}>
                  <CompactField label="Date" required className={`${compactFixedFieldWidth} ${subAdminFormGridField}`}>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className={compactInputClass}
                    />
                  </CompactField>
                  <CompactField label="Role" required className={`${compactFixedFieldWidth} ${subAdminFormGridField}`}>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className={compactInputClass}
                    >
                      <option value="">Select role</option>
                      {ROLE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </CompactField>
                  <CompactField label="Name" required className={subAdminFormGridField}>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="John Doe"
                      className={compactInputClass}
                    />
                  </CompactField>
                  <CompactField label="Phone" className={`${compactFixedFieldWidth} ${subAdminFormGridField}`}>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+1 800 000 0000"
                      className={compactInputClass}
                    />
                  </CompactField>
                  <CompactField label="Email" required className={subAdminFormGridField}>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="john@example.com"
                      className={compactInputClass}
                    />
                  </CompactField>
                </div>
                <div className={subAdminFormGridClass}>
                <div className={`${compactFixedFieldWidth} ${subAdminFormGridField}`}>
                  <AttachImageCheckbox
                    label="Attach Image"
                    checked={attachImage}
                    onCheckedChange={(checked) => {
                      setAttachImage(checked);
                      if (!checked) {
                        if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
                        setImageFile(null);
                        setImagePreview(editingSubAdmin ? adminImageUrl(editingSubAdmin) : "");
                      }
                    }}
                    file={imageFile}
                    onFileChange={(file) => {
                      if (!file) return;
                      if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
                      setImageFile(file);
                      setImagePreview(URL.createObjectURL(file));
                    }}
                  />
                </div>
                  <CompactField label="City" required className={`${compactFixedFieldWidth} ${subAdminFormGridField}`}>
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
                  <CompactField label="Permissions" required className={subAdminFormGridField}>
                    <PermissionsDropdown selected={permissionKeys} onChange={setPermissionKeys} />
                  </CompactField>
                  <CompactField label="Status" className={`${compactFixedFieldWidth} ${subAdminFormGridField}`}>
                    <div className="flex h-[30px] items-center gap-4">
                      <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-gray-800">
                        <input
                          type="radio"
                          name="subAdminStatus"
                          checked={isActive}
                          onChange={() => setIsActive(true)}
                          className="h-3.5 w-3.5 accent-ad-green"
                        />
                        Active
                      </label>
                      <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-gray-800">
                        <input
                          type="radio"
                          name="subAdminStatus"
                          checked={!isActive}
                          onChange={() => setIsActive(false)}
                          className="h-3.5 w-3.5 accent-ad-green"
                        />
                        Inactive
                      </label>
                    </div>
                  </CompactField>
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
              onClick={handleDeleteSelected}
              disabled={selectedIds.size === 0}
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
                  <th className="border border-ad-purple-dark px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={paged.length > 0 && selectedIds.size === paged.length}
                      onChange={toggleSelectAll}
                      className="accent-white"
                    />
                  </th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Date</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Role</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Name</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Phone</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Email</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Photo</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">City</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Permissions</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Status</th>
                  <th className="border border-ad-purple-dark px-2 py-2 text-center font-medium w-12" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="border border-gray-300 px-3 py-6 text-center text-gray-500">
                      No sub admins found.
                    </td>
                  </tr>
                ) : (
                  paged.map((sa, idx) => {
                    const permKeys = permissionKeysFromPerms(sa.permissions);
                    return (
                    <tr key={sa._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                      <td className="border border-gray-300 px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(sa._id)}
                          onChange={() => toggleSelect(sa._id)}
                          className="accent-ad-purple"
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        {formatAdminDate(sa.createdAt)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{sa.role || "—"}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => openEdit(sa)}
                          className="font-medium text-blue-700 hover:underline"
                        >
                          {sa.name}
                        </button>
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{sa.phone || "—"}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{sa.email}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        {adminImageUrl(sa) ? (
                          <ClipImageHover
                            imageUrl={adminImageUrl(sa)}
                            alt={`Photo for ${sa.name}`}
                            size={20}
                            iconClassName="text-ad-purple"
                          />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{sa.city || "—"}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        {permissionLabels(permKeys) || "—"}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        {sa.isActive ? "Active" : "Inactive"}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        <TableRowMenu
                          open={openMenuId === sa._id}
                          onToggle={() =>
                            setOpenMenuId((current) => (current === sa._id ? null : sa._id))
                          }
                          onClose={() => setOpenMenuId(null)}
                          items={[
                            { label: "View", onClick: () => setShowViewModal(sa) },
                            { label: "Edit", onClick: () => openEdit(sa) },
                            {
                              label: "Permissions",
                              onClick: () => openPermModal(sa),
                              className: "text-amber-800",
                            },
                            {
                              label: sa.isActive ? "Disable" : "Enable",
                              onClick: () => handleToggleStatus(sa),
                              className: sa.isActive ? "text-red-700" : "text-green-700",
                            },
                            {
                              label: "Activity Logs",
                              onClick: () => openActivityModal(sa),
                              className: "text-cyan-800",
                            },
                          ]}
                        />
                      </td>
                    </tr>
                    );
                  })
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
        </div>
      </AdminPage>
    </>
  );
};

export default SubAdminManagement;