import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { AdminDeletedBanner, AdminDeletedToggle } from "../../../components/admin/AdminDeletedView";
import { adminNotify } from "../../../utils/adminNotify";
import { printAdminTable } from "../../../utils/adminPrintTable";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import { TableEntriesSummary } from "../../../components/admin/AdminDataTable";
import AdminSearchCard, {
  emptyAdminSearchValues,
  searchEquals,
  searchIncludes,
  type AdminSearchField,
} from "../../../components/admin/AdminSearchCard";
import { MoreDotIcon } from "../../../icons";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  compactFixedFieldWidth,
  compactInputClass,
} from "../../../components/admin/ContentPanel";
import { useAdminDeletedView } from "../../../hooks/useAdminDeletedView";

import {
  ONBOARDABLE_ROLES,
  roleLabel,
  buildDefaultPermissions,
  permissionsSummary,
  type Permissions,
  type StaffRole,
} from "../../../config/permissionModules";
import { PermissionMatrix } from "../../../components/admin/PermissionMatrix";
import { useNavigate } from "react-router";

const STAFF_SEARCH_FIELDS: AdminSearchField[] = [
  { key: "date", label: "Date", type: "date" },
  {
    key: "role",
    label: "Role",
    type: "select",
    options: ONBOARDABLE_ROLES.map((r) => ({ value: r.value, label: r.label })),
  },
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "permissions", label: "Permissions" },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "Active", label: "Active" },
      { value: "Inactive", label: "Inactive" },
    ],
  },
];

interface StaffUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: StaffRole;
  roleRef?: { _id: string; name: string; permissions: Permissions } | null; // permissions exist only on roleRef
  isActive: boolean;
  lastLogin?: string | null;
  createdAt: string;
  createdBy?: { name?: string; email?: string } | null;
}

const API = import.meta.env.VITE_API_URL;

function formatAdminDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toISOString().slice(0, 10);
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
    const menuWidth = 170;
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
            style={{ position: "fixed", top: menuStyle.top, left: menuStyle.left, zIndex: 9999 }}
            className="min-w-[170px] rounded border border-gray-400 bg-white py-1 shadow-lg"
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

const thStyle: React.CSSProperties = {
  border: "1px solid #d2d6de", background: "#f9fafc", padding: "10px 12px",
  textAlign: "center", fontWeight: 700, fontSize: 13, color: "#333", whiteSpace: "nowrap",
};
const tdStyle: React.CSSProperties = {
  border: "1px solid #d2d6de", padding: "10px 12px", fontSize: 13, color: "#555", verticalAlign: "middle", textAlign: "center",
};

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

// Authorization handling: always pass admin-token from localStorage as header value (without 'Bearer ')
const getTokenHeaders = () => ({
  Authorization: localStorage.getItem("admin-token") || "",
});

const StaffUserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [showSearchCard, setShowSearchCard] = useState(false);
  const [searchDraft, setSearchDraft] = useState(() => emptyAdminSearchValues(STAFF_SEARCH_FIELDS));
  const [searchFilters, setSearchFilters] = useState(() => emptyAdminSearchValues(STAFF_SEARCH_FIELDS));
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  // const [showPermModal, setShowPermModal] = useState<StaffUser | null>(null);
  const [showActivityModal, setShowActivityModal] = useState<StaffUser | null>(null);
  const [showViewModal, setShowViewModal] = useState<StaffUser | null>(null);
  const [showResetModal, setShowResetModal] = useState<StaffUser | null>(null);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  // const [role, setRole] = useState<StaffRole | "">("");
  const [role, setRole] = useState<StaffRole | "">("");
const [roleId, setRoleId] = useState("");
// delete: const [permissions, setPermissions] = useState<Permissions>(buildDefaultPermissions());
  // const [permissions, setPermissions] = useState<Permissions>(buildDefaultPermissions());
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);



  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const [roles, setRoles] = useState<{ _id: string; name: string; type: StaffRole }[]>([]);

const fetchRoles = useCallback(async () => {
  const res = await axios.get(`${API}/api/admin/roles`, { headers: getTokenHeaders() });
  setRoles(res.data.data || []);
}, []);

useEffect(() => { fetchRoles(); }, [fetchRoles]);

// const rolesForType = (t: StaffRole | "") => roles.filter((r) => r.type === t);


  const resetTableControls = () => {
    setCurrentPage(1);
    setSelectedIds(new Set());
    setSearch("");
    const empty = emptyAdminSearchValues(STAFF_SEARCH_FIELDS);
    setSearchDraft(empty);
    setSearchFilters(empty);
    setShowSearchCard(false);
  };

  const { viewMode, isDeletedView, toggleViewMode, deletedStash, stashDeleted } =
    useAdminDeletedView<StaffUser>({
      onToggle: resetTableControls,
      storageKey: "admin_deleted_view:staff-users",
    });

  // Remove old token/headers usage; always dynamically produce headers for axios
  // const token = localStorage.getItem("admin-token");
  // const headers = { Authorization: token || "" };

  const fetchStaffUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API}/api/admin/staff-users`, { headers: getTokenHeaders() });
      setStaffUsers(res.data.data || []);
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Failed to load staff users";
      setError(msg);
      adminNotify.error(msg);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchStaffUsers();
  }, [fetchStaffUsers]);

  const showMsg = (msg: string) => {
    setSuccess(msg);
    adminNotify.success(msg);
    setTimeout(() => setSuccess(""), 3500);
  };

  const resetFormFields = () => {
    setForm({ name: "", email: "", phone: "", password: "" });
    setRole("");
    // setPermissions(buildDefaultPermissions());
    setIsActive(true);
  };

  const displayStaffUsers = isDeletedView ? deletedStash : staffUsers;

  const filtered = displayStaffUsers.filter((s) => {
    const permsLabel = permissionsSummary((s as any).permissions);
    const q = search.toLowerCase();
    const live =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.phone || "").includes(q) ||
      roleLabel(s.role).toLowerCase().includes(q) ||
      formatAdminDate(s.createdAt).includes(search) ||
      permsLabel.toLowerCase().includes(q);
    if (!live) return false;
    return (
      searchIncludes(formatAdminDate(s.createdAt), searchFilters.date) &&
      searchEquals(s.role, searchFilters.role) &&
      searchIncludes(s.name, searchFilters.name) &&
      searchIncludes(s.phone || "", searchFilters.phone) &&
      searchIncludes(s.email, searchFilters.email) &&
      searchIncludes(permsLabel, searchFilters.permissions) &&
      searchEquals(s.isActive ? "Active" : "Inactive", searchFilters.status)
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

  const openCreate = () => {
    setEditingStaff(null);
    resetFormFields();
    setFormError("");
    setShowSearchCard(false);
    setShowForm(true);
  };

  const openEdit = (s: StaffUser) => {
    setEditingStaff(s);
    setForm({ name: s.name, email: s.email, phone: s.phone || "", password: "" });
    setRole(s.role);
    setRoleId((s as any).roleRef?._id || "");
    setIsActive(s.isActive);
    setFormError("");
    setShowForm(true);
  };

  const openSearchCard = () => {
    setShowForm(false);
    setEditingStaff(null);
    setSearchDraft({ ...searchFilters });
    setShowSearchCard((open) => !open);
  };

  const handleSearchCardSearch = () => {
    setSearchFilters({ ...searchDraft });
    setCurrentPage(1);
    setSelectedIds(new Set());
  };

  const handleSearchCardReset = () => {
    const empty = emptyAdminSearchValues(STAFF_SEARCH_FIELDS);
    setSearchDraft(empty);
    setSearchFilters(empty);
    setCurrentPage(1);
    setSelectedIds(new Set());
  };

  const handleCancelForm = () => {
    setEditingStaff(null);
    resetFormFields();
    setFormError("");
    setShowForm(false);
  };

  // Pre-fill the matrix with that role's default preset the first time a
  // role is picked while creating (does not override an in-progress edit).
  const handleRoleChange = (value: StaffRole) => {
    setRole(value);
    // if (!editingStaff) {
    //   setPermissions({ ...DEFAULT_ROLE_PERMISSIONS[value] });
    // }
  };

  const saveForm = async () => {
    setFormError("");
    if (!form.name.trim()) return fail("Name is required.");
    if (!form.email.trim()) return fail("Email is required.");
    if (!editingStaff && !form.password.trim()) return fail("Password is required.");
    if (!editingStaff && form.password.trim().length < 6)
      return fail("Password must be at least 6 characters.");
    if (!role) return fail("Role is required.");

    function fail(msg: string) {
      setFormError(msg);
      adminNotify.error(msg);
    }
    if (formError) return;

    setFormLoading(true);
    try {
      if (editingStaff) {
        await axios.put(
          `${API}/api/admin/staff-users/${editingStaff._id}`,
          { name: form.name.trim(), email: form.email.trim(), phone: form.phone, roleId },
          { headers: getTokenHeaders() }
        );
        if (editingStaff.isActive !== isActive) {
          await axios.patch(`${API}/api/admin/staff-users/${editingStaff._id}/status`, { isActive }, { headers: getTokenHeaders() });
        }
        showMsg("Staff user updated successfully.");
      } else {
        if (!roleId) return fail("Please select a role.");
        await axios.post(
          `${API}/api/admin/staff-users`,
          { name: form.name.trim(), email: form.email.trim(), phone: form.phone, password: form.password, roleId },
          { headers: getTokenHeaders() }
        );
        showMsg("Staff user created successfully.");
      }
      setShowForm(false);
      resetFormFields();
      fetchStaffUsers();
    } catch (e: any) {
      const msg = e?.response?.data?.message || "An error occurred.";
      setFormError(msg);
      adminNotify.error(msg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveForm();
  };

  const handleToggleStatus = async (s: StaffUser) => {
    try {
      await axios.patch(
        `${API}/api/admin/staff-users/${s._id}/status`,
        { isActive: !s.isActive },
        { headers: getTokenHeaders() }
      );
      showMsg(`Staff user ${s.isActive ? "deactivated" : "activated"}.`);
      fetchStaffUsers();
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Failed to update status.";
      setError(msg);
      adminNotify.error(msg);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} selected staff user(s)?`)) return;
    const toDelete = staffUsers.filter((s) => selectedIds.has(s._id));
    try {
      await Promise.all(
        [...selectedIds].map((id) =>
          axios.delete(`${API}/api/admin/staff-users/${id}`, { headers: getTokenHeaders() })
        )
      );
      stashDeleted(toDelete);
      showMsg("Selected staff users deleted.");
      setSelectedIds(new Set());
      fetchStaffUsers();
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Failed to delete.";
      setError(msg);
      adminNotify.error(msg);
    }
  };
  // Note: deleted staff users are soft-deleted server-side (isActive=false,
  // email mangled) — there is no "recreate" restore path like the old
  // SubAdmin flow, since re-POSTing would create a duplicate with a
  // different email. Restore is intentionally omitted here; if you need
  // it, add a dedicated `PATCH /:id/restore` endpoint on the backend.

  const handleToolbarPrint = () => {
    printAdminTable({
      title: isDeletedView ? "Deleted Staff Users" : "Staff Users",
      headers: ["Date", "Role", "Name", "Phone", "Email", "Permissions", "Status"],
      rows: filtered.map((s) => [
        formatAdminDate(s.createdAt),
        roleLabel(s.role),
        s.name,
        s.phone || "—",
        s.email,
        roleLabel(s.role),
   
        s.isActive ? "Active" : "Inactive",
      ]),
    });
  };

  // const openPermModal = (s: StaffUser) => {
  //   setEditPerms({ ...buildDefaultPermissions(), ...s.permissions });
  //   setShowPermModal(s);
  // };

  // const handleSavePerms = async () => {
  //   if (!showPermModal) return;
  //   setPermLoading(true);
  //   try {
  //     await axios.patch(
  //       `${API}/api/admin/staff-users/${showPermModal._id}/permissions`,
  //       { permissions: editPerms },
  //       { headers: getTokenHeaders() }
  //     );
  //     showMsg("Permissions updated.");
  //     setShowPermModal(null);
  //     fetchStaffUsers();
  //   } catch (e: any) {
  //     const msg = e?.response?.data?.message || "Failed to update permissions.";
  //     setError(msg);
  //     adminNotify.error(msg);
  //   } finally {
  //     setPermLoading(false);
  //   }
  // };

  const openActivityModal = async (s: StaffUser) => {
    setShowActivityModal(s);
    setActivityLoading(true);
    try {
      const res = await axios.get(`${API}/api/admin/staff-users/${s._id}/activity`, { headers: getTokenHeaders() });
      setActivityLogs(res.data.data || []);
    } catch {
      setActivityLogs([]);
    } finally {
      setActivityLoading(false);
    }
  };

  const openResetModal = (s: StaffUser) => {
    setNewPassword("");
    setShowResetModal(s);
  };

  const handleResetPassword = async () => {
    if (!showResetModal) return;
    if (newPassword.length < 6) {
      adminNotify.error("Password must be at least 6 characters.");
      return;
    }
    setResetLoading(true);
    try {
      await axios.patch(
        `${API}/api/admin/staff-users/${showResetModal._id}/reset-password`,
        { newPassword },
        { headers: getTokenHeaders() }
      );
      showMsg("Password reset successfully.");
      setShowResetModal(null);
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Failed to reset password.";
      adminNotify.error(msg);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <>
    

      <Modal isOpen={!!showActivityModal} onClose={() => setShowActivityModal(null)} title={`Activity Log — ${showActivityModal?.name}`} wide>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, whiteSpace: "nowrap" }}>
            <thead>
              <tr>
                {["Action", "Module", "Description", "Performed By", "IP Address", "Timestamp"].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activityLoading ? (
                <tr><td colSpan={6} style={{ ...tdStyle, padding: "30px 0", color: "#888" }}>Loading logs...</td></tr>
              ) : activityLogs.length === 0 ? (
                <tr><td colSpan={6} style={{ ...tdStyle, padding: "30px 0", color: "#aaa" }}>No activity logs found.</td></tr>
              ) : (
                activityLogs.map((log) => (
                  <tr key={log._id}>
                    <td style={tdStyle}>
                      <span style={{ padding: "2px 8px", borderRadius: 3, fontSize: 11, fontWeight: 700, background: log.action === "LOGIN" ? "#dff0d8" : log.action === "DELETE" ? "#f2dede" : log.action === "PERMISSION_CHANGE" ? "#d9edf7" : "#fcf8e3", color: log.action === "LOGIN" ? "#3c763d" : log.action === "DELETE" ? "#a94442" : log.action === "PERMISSION_CHANGE" ? "#31708f" : "#8a6d3b" }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={tdStyle}>{log.module || "—"}</td>
                    <td style={{ ...tdStyle, whiteSpace: "normal", wordBreak: "break-word", textAlign: "left", verticalAlign: "top", minWidth: 240 }}>{log.description || "—"}</td>
                    <td style={tdStyle}>{log.performedByName || "—"}</td>
                    <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 11 }}>{log.ipAddress || "—"}</td>
                    <td style={tdStyle}>{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Modal>

      <Modal isOpen={!!showViewModal} onClose={() => setShowViewModal(null)} title={`Staff User Details — ${showViewModal?.name}`} wide>
        {showViewModal && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px 20px", fontSize: 13, marginBottom: 18, padding: "12px 16px", background: "#f8f9fa", border: "1px solid #d2d6de", borderRadius: 3 }}>
              {[
                ["Date", formatAdminDate(showViewModal.createdAt)],
                ["Role", roleLabel(showViewModal.role)],
                ["Name", showViewModal.name],
                ["Phone", showViewModal.phone || "—"],
                ["Email", showViewModal.email],
                ["Status", showViewModal.isActive ? "Active" : "Inactive"],
                ["Last Login", showViewModal.lastLogin ? new Date(showViewModal.lastLogin).toLocaleString() : "Never"],
                ["Created By", showViewModal.createdBy?.name || "SuperAdmin"],
              ].map(([label, value]) => (
                <div key={label as string}><span style={{ fontWeight: 600 }}>{label}:</span> {value as string}</div>
              ))}
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, borderBottom: "2px solid #9b308d", paddingBottom: 6, color: "#9b308d" }}>Permissions</div>
            <PermissionMatrix
              permissions={{
                ...buildDefaultPermissions(),
                ...(showViewModal && (showViewModal as any).permissions ? (showViewModal as any).permissions : {}),
              }}
              onChange={() => {}}
              readOnly
            />
      
          </>
        )}
      </Modal>

      <Modal isOpen={!!showResetModal} onClose={() => setShowResetModal(null)} title={`Reset Password — ${showResetModal?.name}`}>
        <CompactField label="New Password" required>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 characters"
            className={compactInputClass}
          />
        </CompactField>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }}>
          <button type="button" onClick={() => setShowResetModal(null)}
            style={{ padding: "7px 18px", borderRadius: 3, border: "1px solid #d2d6de", background: "#fff", color: "#444", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          <button type="button" onClick={handleResetPassword} disabled={resetLoading}
            style={{ padding: "7px 22px", borderRadius: 3, border: "none", background: resetLoading ? "#aaa" : "#00a65a", color: "#fff", fontSize: 13, fontWeight: 600, cursor: resetLoading ? "not-allowed" : "pointer" }}>
            {resetLoading ? "Resetting..." : "Reset Password"}
          </button>
        </div>
      </Modal>

      <AdminPage
        title={isDeletedView ? "Deleted Staff Users" : "Staff Users"}
        headerAction={!showForm && !showSearchCard && !isDeletedView ? <AddNewButton onClick={openCreate} /> : undefined}
        between={
          showSearchCard ? (
            <AdminSearchCard
              fields={STAFF_SEARCH_FIELDS}
              values={searchDraft}
              onChange={setSearchDraft}
              onSearch={handleSearchCardSearch}
              onReset={handleSearchCardReset}
              onClose={() => setShowSearchCard(false)}
            />
          ) : showForm ? (
            <CompactFormPanel
              footer={
                <CompactFormFooter
                  message={editingStaff ? `You are editing '${editingStaff.name}'` : "You are creating a Staff User"}
                  messageCenter
                  actionLabel={formLoading ? (editingStaff ? "Updating..." : "Saving...") : (editingStaff ? "Update" : "Save")}
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
                <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <CompactField label="Role" required className={compactFixedFieldWidth}>
                    <select
                      value={role}
                      onChange={(e) => handleRoleChange(e.target.value as StaffRole)}
                      className={compactInputClass}
                      disabled={!!editingStaff}
                    >
                      <option value="">Select role</option>
                      {ONBOARDABLE_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    {editingStaff && (
                      <p className="mt-1 text-[11px] text-gray-500">Role cannot be changed after creation.</p>
                    )}
                  </CompactField>
                  <CompactField label="Name" required>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="John Doe"
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
                  <CompactField label="Email" required>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="john@example.com"
                      className={compactInputClass}
                    />
                  </CompactField>
                  {!editingStaff && (
                    <CompactField label="Password" required>
                      <input
                        type="password"
                        required
                        value={form.password}
                        onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                        placeholder="At least 6 characters"
                        className={compactInputClass}
                      />
                    </CompactField>
                  )}
                  <CompactField label="Status" className={compactFixedFieldWidth}>
                    <div className="flex h-[30px] items-center gap-4">
                      <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-gray-800">
                        <input type="radio" name="staffStatus" checked={isActive} onChange={() => setIsActive(true)} className="h-3.5 w-3.5 accent-ad-green" />
                        Active
                      </label>
                      <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-gray-800">
                        <input type="radio" name="staffStatus" checked={!isActive} onChange={() => setIsActive(false)} className="h-3.5 w-3.5 accent-ad-green" />
                        Inactive
                      </label>
                    </div>
                  </CompactField>
                  <CompactField label="Assigned Role" required>
  <select
    value={roleId}
    onChange={(e) => {
      setRoleId(e.target.value);
      setRole(
        roles.find((r) => r._id === e.target.value)?.type || ""
      );
    }}
    className={compactInputClass}
    disabled={!!editingStaff}
  >
    <option value="">Select role</option>
    {roles.map((r) => (
      <option key={r._id} value={r._id}>
        {r.name} 
      </option>
    ))}
  </select>
  {roles.length === 0 && (
    <p className="mt-1 text-[11px] text-red-600">
      No roles exist yet — create one in Role Management first.
    </p>
  )}
</CompactField>
                </div>

                <div>
                  <div className="mb-1.5 text-xs font-semibold text-gray-700">
                    Permissions {role ? `(pre-filled with ${roleLabel(role)} defaults — adjust as needed)` : ""}
                  </div>
                  {/* <PermissionMatrix
                    permissions={permissions}
                    onChange={(perms) => setPermissions(perms as any)}
                  /> */}

                  
            
                </div>
              </form>
            </CompactFormPanel>
          ) : undefined
        }
      >
        {isDeletedView && <AdminDeletedBanner count={deletedStash.length} entityLabel="staff users" />}
        {error && <div className="mb-2 rounded border border-red-200 bg-red-100 px-3 py-2 text-xs text-red-800">{error}</div>}
        {success && <div className="mb-2 rounded border border-green-200 bg-green-100 px-3 py-2 text-xs text-green-800">{success}</div>}

        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
          <div className="flex flex-wrap gap-1">
            {!isDeletedView && (
              <button type="button" onClick={handleDeleteSelected} disabled={selectedIds.size === 0}
                className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
                Delete
              </button>
            )}
            <button type="button" onClick={handleToolbarPrint} className="bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark">
              Print
            </button>
          </div>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Live Search here"
              className="border border-gray-400 bg-white px-2 py-1 text-xs"
            />
            <button type="button" onClick={openSearchCard}
              className={`px-3 py-1 text-xs font-medium text-white hover:bg-gray-600 ${showSearchCard ? "bg-gray-700" : "bg-gray-500"}`}>
              Filters
            </button>
          </div>
        </div>

        <div className="mb-2 flex items-center gap-2 text-xs text-gray-700">
          <span>Show</span>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="border border-gray-400 px-1 py-0.5">
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>entries</span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <p className="py-6 text-center text-sm text-gray-500">Loading staff users…</p>
          ) : (
            <table className="w-full border-collapse text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-ad-purple text-white">
                  <th className="border border-ad-purple-dark px-2 py-2 text-center">
                    <input type="checkbox" checked={paged.length > 0 && selectedIds.size === paged.length} onChange={toggleSelectAll} className="accent-white" />
                  </th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Date</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Role</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Name</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Phone</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Email</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Permissions</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Status</th>
                  <th className="border border-ad-purple-dark px-2 py-2 text-center font-medium w-12" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="border border-gray-300 px-3 py-6 text-center text-gray-500">
                      {isDeletedView ? "No deleted staff users found." : "No staff users found."}
                    </td>
                  </tr>
                ) : (
                  paged.map((s, idx) => (
                    <tr key={s._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                      <td className="border border-gray-300 px-2 py-2 text-center">
                        <input type="checkbox" checked={selectedIds.has(s._id)} onChange={() => toggleSelect(s._id)} className="accent-ad-purple" />
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{formatAdminDate(s.createdAt)}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{roleLabel(s.role)}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        {!isDeletedView ? (
                          <button type="button" onClick={() => openEdit(s)} className="font-medium text-blue-700 hover:underline">
                            {s.name}
                          </button>
                        ) : s.name}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{s.phone || "—"}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{s.email}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center max-w-[280px] truncate" title={s.roleRef?.permissions ? permissionsSummary(s.roleRef.permissions) : "—"}>
                        {s.roleRef?.permissions 
                          ? permissionsSummary(s.roleRef.permissions)
                          : "—"}
                      </td>
                 
                      <td className="border border-gray-300 px-3 py-2 text-center">{s.isActive ? "Active" : "Inactive"}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        {!isDeletedView ? (
                          <TableRowMenu
                            open={openMenuId === s._id}
                            onToggle={() => setOpenMenuId((current) => (current === s._id ? null : s._id))}
                            onClose={() => setOpenMenuId(null)}
                            items={[
                              { label: "View", onClick: () => setShowViewModal(s) },
                              { label: "Edit", onClick: () => openEdit(s) },
                              { label: "View Role", onClick: () => navigate(`/admin/roles?highlight=${(s as any).roleRef?._id}`), className: "text-amber-800" },
                              { label: "Reset Password", onClick: () => openResetModal(s), className: "text-purple-800" },
                              { label: s.isActive ? "Disable" : "Enable", onClick: () => handleToggleStatus(s), className: s.isActive ? "text-red-700" : "text-green-700" },
                              { label: "Activity Logs", onClick: () => openActivityModal(s), className: "text-cyan-800" },
                            ]}
                          />
                        ) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <TableEntriesSummary total={filtered.length} page={currentPage} pageSize={pageSize} />
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} type="button" onClick={() => setCurrentPage(p)}
                className={`h-7 w-7 border text-xs font-medium ${currentPage === p ? "border-ad-green bg-ad-green text-white" : "border-gray-400 bg-white text-gray-700 hover:bg-gray-100"}`}>
                {p}
              </button>
            ))}
          </div>
          <AdminDeletedToggle viewMode={viewMode} onToggle={toggleViewMode} activeLabel="Active Staff" />
        </div>
      </AdminPage>
    </>
  );
};

export default StaffUserManagement;