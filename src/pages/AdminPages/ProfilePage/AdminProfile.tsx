import React, { useEffect, useState } from "react";
import AdminPage from "../../../components/admin/AdminPage";
import {
  DEFAULT_PERMS,
  PermissionMatrix,
  type Permissions,
} from "../../../components/admin/PermissionMatrix";

// Get API base from env (VITE_API_BASE_URL) or fallback
const API_BASE = import.meta.env.VITE_API_URL || "";

interface AdminProfileApiResult {
  name: string;
  email: string;
  phone: string;
  permissions?: Permissions | any[];
  permissionAll?: boolean; // Add support for permissionAll from backend
}

// Helper to get admin token from localStorage (or other storage if used)
function getAdminToken() {
  // Try common locations (adjust if you use a different key or storage)
  // e.g. "admin_token", "token", etc.
  return (
    localStorage.getItem("admin-token")
  );
}

const AdminProfile: React.FC = () => {
  const [profile, setProfile] = useState<AdminProfileApiResult | null>(null);
  const [permissions, setPermissions] = useState<Permissions>(DEFAULT_PERMS());
  const [permissionAll, setPermissionAll] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the admin profile info from backend
    let ignore = false;
    setLoading(true);
    setError(null);

    const token = getAdminToken();

    console.log("[AdminProfile] Fetching profile from:", `${API_BASE}/api/admin/profile`, "Token:", !!token);

    fetch(`${API_BASE}/api/admin/profile`, {
      credentials: "include", // must send cookies for auth context
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
          // Forward error message if available
          console.log("[AdminProfile] Response not ok:", res.status, json);
          throw new Error(json.message || `Failed to fetch profile (HTTP ${res.status})`);
        }
        console.log("[AdminProfile] Profile fetch response:", json);
        return json;
      })
      .then((json) => {
        if (ignore) return;
        if (!json || !json.success || !json.data) {
          console.log("[AdminProfile] Invalid or missing JSON structure:", json);
          setError(json?.message ?? "Failed to load profile.");
          return;
        }
        setProfile(json.data);

        // If permissionAll: true, treat as superadmin with all perms
        if (json.data.permissionAll === true) {
          setPermissionAll(true);
          setPermissions(DEFAULT_PERMS());
     
        } else {
          setPermissionAll(false);
          // Controller: returns permissions as object or possibly empty array.
          let perms = json.data.permissions;
          // Validate it's a proper object, else replace with DEFAULT_PERMS.
          if (!perms || typeof perms !== "object" || Array.isArray(perms)) {
            console.log("[AdminProfile] Permissions invalid or missing. Setting DEFAULT_PERMS.");
            perms = DEFAULT_PERMS();
          } else {
            console.log("[AdminProfile] Permissions loaded:", perms);
          }
          setPermissions(perms);
        }
      })
      .catch((err) => {
        if (ignore) return;
        // If error message matches notifications policy, display user-friendly info.
        const errorMsg =
          typeof err === "string"
            ? err
            : (err?.message?.includes("unload is not allowed in this document")
                ? "Some browser features are restricted by permissions policy."
                : err?.message) || "Unknown error";
        console.log("[AdminProfile] Fetch caught error:", errorMsg, err);
        setError(errorMsg);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <AdminPage title="Admin Profile">
      {loading && (
        <div className="mb-4 text-center text-sm text-gray-500">Loading profile...</div>
      )}
      {error && (
        <div className="mb-4 text-center text-sm text-red-600">{error}</div>
      )}
      {!loading && !error && profile && (
        <>
          <div
            className="mb-4 grid gap-x-5 gap-y-2 rounded border border-gray-300 bg-gray-50 px-4 py-3 text-sm"
            style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
          >
            {[
              ["Name", profile.name],
              ["Email", profile.email],
              ["Phone", profile.phone],
            ].map(([label, value]) => (
              <div key={label}>
                <span className="font-semibold text-gray-800">{label}:</span>{" "}
                <span className="text-gray-600">{value}</span>
              </div>
            ))}
            {permissionAll && (
              <div style={{ gridColumn: "1 / span 3" }}>
                <span className="inline-block rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                  Super Admin: All Permissions
                </span>
              </div>
            )}
          </div>
          <div className="mb-2.5 border-b-2 border-ad-purple pb-1.5 text-sm font-bold text-ad-purple">
            Permissions
          </div>
          <PermissionMatrix
            permissions={permissions}
            onChange={() => {}}
            readOnly
            permissionAll={permissionAll}
          />
        </>
      )}
    </AdminPage>
  );
};

export default AdminProfile;
