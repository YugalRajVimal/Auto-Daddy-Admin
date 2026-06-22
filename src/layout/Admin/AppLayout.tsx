import { Outlet } from "react-router";
import AdminShell from "../../components/admin/AdminShell";
import { RequirePortal } from "../../auth/guards/RequirePortal";
import { useAuth } from "../../auth/useAuth";

const LayoutContent: React.FC = () => {
  const { profile, isLogInViaSuperAdmin } = useAuth();

  return (
    <AdminShell>
      {isLogInViaSuperAdmin && (
        <div className="flex shrink-0 items-center gap-2 border-b border-yellow-200 bg-yellow-100 px-4 py-2 text-xs text-yellow-900">
          <span className="font-semibold">You are logged in as Admin</span>
          {profile?.name && (
            <span>
              (<span className="font-medium">{profile.name}</span>
              {profile.email && (
                <span className="ml-1 text-gray-600">| {profile.email}</span>
              )}
              )
            </span>
          )}
        </div>
      )}
      <Outlet />
    </AdminShell>
  );
};

const AdminAppLayout: React.FC = () => (
  <RequirePortal portal="admin">
    <LayoutContent />
  </RequirePortal>
);

export default AdminAppLayout;
