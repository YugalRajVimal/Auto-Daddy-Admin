
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AdminPage  from "../../../components/admin/AdminPage";
import { PermissionMatrix } from "../../../components/admin/PermissionMatrix";
import { adminNotify } from "../../../utils/adminNotify";
import { CompactField, CompactFormFooter, CompactFormPanel, compactInputClass } from "../../../components/admin/ContentPanel";
import { ONBOARDABLE_ROLES,roleLabel, type Permissions, type StaffRole } from "../../../config/permissionModules";
import { roleManagerSchema, type RoleManagerValues } from "../../../lib/validation/schemas/catalog";
import { FormFieldError, fieldErrorClass, toastValidationSummary } from "../../../lib/validation/formUi";

interface RoleDoc {
  _id: string;
  name: string;
  type: StaffRole;
  permissions: Permissions;
  createdAt: string;
}

const API = import.meta.env.VITE_API_URL;
const getTokenHeaders = () => ({ Authorization: localStorage.getItem("admin-token") || "" });

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<RoleDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<RoleDoc | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [permissions, setPermissions] = useState<Permissions>({} as Permissions);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: formErrors },
  } = useForm<RoleManagerValues>({
    resolver: zodResolver(roleManagerSchema),
    defaultValues: { name: "", type: "" },
  });

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/admin/roles`, { headers: getTokenHeaders() });
      setRoles(res.data.data || []);
    } catch (e: any) {
      adminNotify.error(e?.response?.data?.message || "Failed to load roles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  // const openCreate = () => {
  //   setEditingRole(null);
  //   reset({ name: "", type: "" });
  //   setPermissions({} as Permissions);
  //   setShowForm(true);
  // };

  const openEdit = (r: RoleDoc) => {
    setEditingRole(r);
    reset({ name: r.name, type: r.type });
    setPermissions(r.permissions);
    setShowForm(true);
  };

  const save = handleSubmit(
    async (values) => {
      setSaving(true);
      try {
        if (editingRole) {
          await axios.put(`${API}/api/admin/roles/${editingRole._id}`, { name: values.name }, { headers: getTokenHeaders() });
          await axios.patch(`${API}/api/admin/roles/${editingRole._id}/permissions`, { permissions }, { headers: getTokenHeaders() });
          adminNotify.success("Role updated. Every staff user with this role is updated immediately.");
        } else {
          await axios.post(`${API}/api/admin/roles`, { name: values.name, type: values.type, permissions }, { headers: getTokenHeaders() });
          adminNotify.success("Role created.");
        }
        setShowForm(false);
        fetchRoles();
      } catch (e: any) {
        adminNotify.error(e?.response?.data?.message || "Failed to save role");
      } finally {
        setSaving(false);
      }
    },
    (errs) => toastValidationSummary(adminNotify.error, errs as never)
  );

  const remove = async (r: RoleDoc) => {
    if (!window.confirm(`Delete role "${r.name}"? Staff still assigned to it must be reassigned first.`)) return;
    try {
      await axios.delete(`${API}/api/admin/roles/${r._id}`, { headers: getTokenHeaders() });
      adminNotify.success("Role deleted.");
      fetchRoles();
    } catch (e: any) {
      adminNotify.error(e?.response?.data?.message || "Failed to delete role");
    }
  };

  return (
    <AdminPage
      title="Roles"
      // headerAction={!showForm ? <AddNewButton onClick={openCreate} /> : undefined}
      between={
        showForm ? (
          <CompactFormPanel
            footer={
              <CompactFormFooter
                message={editingRole ? `Editing '${editingRole.name}'` : "Creating a new Role"}
                messageCenter
                actionLabel={saving ? "Saving..." : editingRole ? "Update" : "Save"}
                onSave={save}
                onCancel={() => setShowForm(false)}
              />
            }
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
              <CompactField label="Role Name" required>
                <input
                  {...register("name")}
                  className={fieldErrorClass(Boolean(formErrors.name), compactInputClass)}
                  placeholder="e.g. Regional Sub Admin"
                />
                <FormFieldError message={formErrors.name?.message} />
              </CompactField>
              <CompactField label="Type" required>
                <select
                  {...register("type")}
                  className={fieldErrorClass(Boolean(formErrors.type), compactInputClass)}
                  disabled={!!editingRole}
                >
                  <option value="">Select type</option>
                  {ONBOARDABLE_ROLES.map((r: { value: string; label: string }) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
             
                </select>
                <FormFieldError message={formErrors.type?.message} />
                {editingRole && <p className="mt-1 text-[11px] text-gray-500">Type cannot change after creation — staff are assigned by type.</p>}
              </CompactField>
            </div>
            <PermissionMatrix permissions={permissions} onChange={setPermissions} />
          </CompactFormPanel>
        ) : undefined
      }
    >
      {loading ? (
        <p className="py-6 text-center text-sm text-gray-500">Loading roles…</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-ad-purple text-white">
              <th className="border px-3 py-2">Name</th>
              <th className="border px-3 py-2">Type</th>
              <th className="border px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r._id}>
                <td className="border px-3 py-2 text-center">{r.name}</td>
                <td className="border px-3 py-2 text-center">{roleLabel(r.type)}</td>
                <td className="border px-3 py-2 text-center">
                  <button onClick={() => openEdit(r)} className="text-blue-700 hover:underline mr-3">Edit</button>
                  <button onClick={() => remove(r)} className="text-red-700 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AdminPage>
  );
};

export default RoleManagement;