import React, { useEffect, useRef, useState } from "react";
import { FiCamera, FiChevronDown, FiMail, FiMapPin, FiPhone, FiUser } from "react-icons/fi";
import AdminPage from "../../../components/admin/AdminPage";
import {
  DEFAULT_PERMS,
  PermissionMatrix,
  type Permissions,
} from "../../../components/admin/PermissionMatrix";
import { normalizeMediaUrl } from "../../../lib/normalizeMediaUrl";

// Get API base from env (VITE_API_BASE_URL) or fallback
const API_BASE = import.meta.env.VITE_API_URL || "";

interface AdminProfileApiResult {
  name: string;
  email: string;
  phone: string;
  role?: string;
  profilePhoto?: string | null;
  city?: string;
  address?: string;
  pincode?: string;
  permissions?: Permissions | any[];
  permissionAll?: boolean; // Add support for permissionAll from backend
}

// Helper to get admin token from localStorage (or other storage if used)
function getAdminToken() {
  return localStorage.getItem("admin-token");
}

const labelClass = "mb-1 block text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500";
const inputClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-ad-purple/60 focus:ring-2 focus:ring-ad-purple/10 disabled:bg-slate-50 disabled:opacity-70";

function roleLabel(role?: string) {
  switch (role) {
    case "admin":
      return "Super Admin";
    case "role_admin":
      return "Admin";
    case "sub_admin":
      return "Sub Admin";
    case "associates":
      return "Business Associate";
    default:
      return role || "Staff";
  }
}

const AdminProfile: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<AdminProfileApiResult | null>(null);
  const [permissions, setPermissions] = useState<Permissions>(DEFAULT_PERMS());
  const [permissionAll, setPermissionAll] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [editName, setEditName] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPincode, setEditPincode] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Permissions section is collapsed by default.
  const [permissionsOpen, setPermissionsOpen] = useState(false);

  const applyProfile = (data: AdminProfileApiResult) => {
    setProfile(data);
    setEditName(data.name || "");
    setEditCity(data.city || "");
    setEditAddress(data.address || "");
    setEditPincode(data.pincode || "");
    setPhotoPreview(null);
    setPhotoFile(null);

    if (data.permissionAll === true) {
      setPermissionAll(true);
      setPermissions(DEFAULT_PERMS());
    } else {
      setPermissionAll(false);
      let perms = data.permissions;
      if (!perms || typeof perms !== "object" || Array.isArray(perms)) {
        perms = DEFAULT_PERMS();
      }
      setPermissions(perms as Permissions);
    }
  };

  const loadProfile = () => {
    let ignore = false;
    setLoading(true);
    setError(null);

    const token = getAdminToken();

    fetch(`${API_BASE}/api/admin/profile`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `${token}` } : {}),
      },
    })
      .then(async (res) => {
        let json: any;
        try {
          json = await res.json();
        } catch {
          json = {};
        }
        if (!res.ok) {
          throw new Error(json.message || `Failed to fetch profile (HTTP ${res.status})`);
        }
        return json;
      })
      .then((json) => {
        if (ignore) return;
        if (!json || !json.success || !json.data) {
          setError(json?.message ?? "Failed to load profile.");
          return;
        }
        applyProfile(json.data);
      })
      .catch((err) => {
        if (ignore) return;
        const errorMsg =
          typeof err === "string"
            ? err
            : (err?.message?.includes("unload is not allowed in this document")
                ? "Some browser features are restricted by permissions policy."
                : err?.message) || "Unknown error";
        setError(errorMsg);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  };

  useEffect(() => {
    const cancel = loadProfile();
    return cancel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openPhotoPicker = () => {
    if (!saving) fileInputRef.current?.click();
  };

  const onPhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const resetEdits = () => {
    if (!profile) return;
    setEditName(profile.name || "");
    setEditCity(profile.city || "");
    setEditAddress(profile.address || "");
    setEditPincode(profile.pincode || "");
    setPhotoFile(null);
    setPhotoPreview(null);
    setSaveError(null);
    setSaveSuccess(null);
  };

  const saveProfile = async () => {
    if (!editName.trim()) {
      setSaveError("Name cannot be empty.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    const token = getAdminToken();

    try {
      const formData = new FormData();
      formData.append("name", editName.trim());
      formData.append("city", editCity.trim());
      formData.append("address", editAddress.trim());
      formData.append("pincode", editPincode.trim());
      if (photoFile) formData.append("profilePhoto", photoFile);

      const res = await fetch(`${API_BASE}/api/admin/profile`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          ...(token ? { Authorization: `${token}` } : {}),
        },
        body: formData,
      });

      let json: any;
      try {
        json = await res.json();
      } catch {
        json = {};
      }

      if (!res.ok || !json.success) {
        throw new Error(json.message || `Failed to update profile (HTTP ${res.status})`);
      }

      applyProfile(json.data);
      setSaveSuccess("Profile updated successfully.");
    } catch (err: any) {
      setSaveError(err?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const displayPhoto = photoPreview || normalizeMediaUrl(profile?.profilePhoto || null);

  return (
    <AdminPage title="My Profile">
      {loading && (
        <div className="mb-4 text-center text-sm text-gray-500">Loading profile...</div>
      )}
      {error && (
        <div className="mb-4 text-center text-sm text-red-600">{error}</div>
      )}
      {!loading && !error && profile && (
        <>
          <div className="grid gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">
            {/* ── Photo + summary card ─────────────────────────────────── */}
            <aside className="overflow-hidden rounded-2xl border border-white/80 bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-purple-100">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  {displayPhoto ? (
                    <img
                      src={displayPhoto}
                      alt=""
                      className="size-24 rounded-2xl object-cover ring-4 ring-white shadow-md"
                    />
                  ) : (
                    <div className="flex size-24 items-center justify-center rounded-2xl bg-purple-100 text-ad-purple ring-4 ring-white shadow-md">
                      <FiUser size={40} strokeWidth={1.5} aria-hidden />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={openPhotoPicker}
                    disabled={saving}
                    className="absolute -bottom-2 -right-2 flex size-9 items-center justify-center rounded-full bg-ad-purple text-white shadow-md hover:opacity-90 disabled:opacity-50"
                    aria-label="Upload profile photo"
                  >
                    <FiCamera size={16} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onPhotoSelected}
                  />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  {editName.trim() || profile.name}
                </h3>
                <span className="mt-1 inline-block rounded-full bg-purple-100 px-2.5 py-1 text-[11px] font-semibold text-ad-purple">
                  {roleLabel(profile.role)}
                </span>
              </div>

              <ul className="mt-5 space-y-2.5 text-left text-sm text-slate-600">
                <li className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2">
                  <FiPhone className="shrink-0 text-ad-purple" size={14} />
                  <span className="truncate">{profile.phone || "No phone"}</span>
                </li>
                <li className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2">
                  <FiMail className="shrink-0 text-indigo-600" size={14} />
                  <span className="truncate">{profile.email || "No email"}</span>
                </li>
                <li className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2">
                  <FiMapPin className="shrink-0 text-emerald-600" size={14} />
                  <span className="truncate">
                    {editAddress.trim() || editCity.trim() || "No address"}
                  </span>
                </li>
              </ul>

              {permissionAll && (
                <div className="mt-4 text-center">
                  <span className="inline-block rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                    Super Admin: All Permissions
                  </span>
                </div>
              )}
            </aside>

            {/* ── Editable details ─────────────────────────────────────── */}
            <section className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-black/5 md:p-5">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-xl bg-purple-50 text-ad-purple">
                  <FiUser size={16} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit details</h3>
                  <p className="text-xs text-slate-500">
                    Email and phone are locked and cannot be changed here.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className={labelClass}>Name *</span>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Your name"
                    disabled={saving}
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className={labelClass}>Phone</span>
                  <input
                    type="tel"
                    value={profile.phone || ""}
                    disabled
                    title="Phone cannot be changed from here"
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className={labelClass}>Email</span>
                  <input
                    type="email"
                    value={profile.email || ""}
                    disabled
                    title="Email cannot be changed from here"
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className={labelClass}>City</span>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    placeholder="City"
                    disabled={saving}
                    className={inputClass}
                  />
                </label>

                <label className="block">
                  <span className={labelClass}>Zip</span>
                  <input
                    type="text"
                    value={editPincode}
                    onChange={(e) => setEditPincode(e.target.value)}
                    placeholder="A1A 1A1"
                    maxLength={12}
                    disabled={saving}
                    className={inputClass}
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className={labelClass}>Address</span>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Street address"
                    disabled={saving}
                    className={inputClass}
                  />
                </label>
              </div>

              {saveError && (
                <div className="mt-3 text-sm text-red-600">{saveError}</div>
              )}
              {saveSuccess && (
                <div className="mt-3 text-sm text-green-700">{saveSuccess}</div>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={resetEdits}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => void saveProfile()}
                  disabled={saving}
                  className="rounded-xl bg-ad-purple px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </section>
          </div>

          <div className="mt-4 rounded-2xl border border-white/80 bg-white/95 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-black/5">
            <button
              type="button"
              onClick={() => setPermissionsOpen((open) => !open)}
              aria-expanded={permissionsOpen}
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
            >
              <span className="text-sm font-bold text-ad-purple">Permissions</span>
              <FiChevronDown
                size={18}
                className={`shrink-0 text-ad-purple transition-transform ${
                  permissionsOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {permissionsOpen && (
              <div className="border-t border-slate-100 p-4 pt-3">
                <PermissionMatrix
                  permissions={permissions}
                  onChange={() => {}}
                  readOnly
                  permissionAll={permissionAll}
                />
              </div>
            )}
          </div>
        </>
      )}
    </AdminPage>
  );
};

export default AdminProfile;