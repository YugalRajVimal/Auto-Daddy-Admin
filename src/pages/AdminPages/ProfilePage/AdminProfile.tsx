import React, { useMemo } from "react";
import AdminPage from "../../../components/admin/AdminPage";
import {
  DEFAULT_PERMS,
  PermissionMatrix,
  type Permissions,
} from "../../../components/admin/PermissionMatrix";

const DUMMY_ADMIN = {
  name: "John Admin",
  email: "admin@autodaddy.com",
  phone: "+1 416 555 0199",
};

/** Sample module set until /api/admin/profile is available. */
function dummyPermissions(): Permissions {
  const perms = DEFAULT_PERMS();
  const enabled = [
    "dashboard",
    "users",
    "services",
    "categories",
    "websiteTemplates",
    "carCompanies",
    "provinces",
    "cities",
  ];
  for (const key of enabled) {
    if (perms[key]) {
      perms[key] = { view: true, add: true, edit: true, delete: key !== "dashboard" };
    }
  }
  return perms;
}

const AdminProfile: React.FC = () => {
  const displayPerms = useMemo(() => dummyPermissions(), []);

  return (
    <AdminPage title="Admin Profile">
      <div
        className="mb-4 grid gap-x-5 gap-y-2 rounded border border-gray-300 bg-gray-50 px-4 py-3 text-sm"
        style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
      >
        {[
          ["Name", DUMMY_ADMIN.name],
          ["Email", DUMMY_ADMIN.email],
          ["Phone", DUMMY_ADMIN.phone],
        ].map(([label, value]) => (
          <div key={label}>
            <span className="font-semibold text-gray-800">{label}:</span>{" "}
            <span className="text-gray-600">{value}</span>
          </div>
        ))}
      </div>

      <div className="mb-2.5 border-b-2 border-ad-purple pb-1.5 text-sm font-bold text-ad-purple">
        Permissions
      </div>
      <PermissionMatrix
        permissions={displayPerms}
        onChange={() => {}}
        readOnly
      />
    </AdminPage>
  );
};

export default AdminProfile;
