import { Outlet, Navigate, useLocation } from "react-router";
import AdminShell from "../../components/admin/AdminShell";
import { useAuth } from "../../auth";
import { getPortalForRole } from "../../auth/roleRegistry";
import AdminStaffSignInPage from "../../pages/AuthPages/AdminStaffSignInPage";
import React from "react";

function AuthSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ad-app-bg">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
    </div>
  );
}

const LayoutContent: React.FC = () => (
  <AdminShell>
    <Outlet />
  </AdminShell>
);

const AdminAppLayout: React.FC = () => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  if (isLoading) return <AuthSpinner />;

  const isAdminUser = !!role && getPortalForRole(role) === "admin";

  if (!isAuthenticated || !isAdminUser) {
    const atAdminRoot = location.pathname === "/admin" || location.pathname === "/admin/";
    if (!atAdminRoot) {
      return <Navigate to="/admin" replace state={{ from: location.pathname }} />;
    }
    return <AdminStaffSignInPage />;
  }

  return <LayoutContent />;
};

export default AdminAppLayout;
