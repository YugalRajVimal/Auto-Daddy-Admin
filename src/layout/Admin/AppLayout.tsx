import { Outlet } from "react-router";
import { useEffect, useState } from "react";
import AdminShell from "../../components/admin/AdminShell";

const LayoutContent: React.FC<{
  superAdminName?: string;
  superAdminEmail?: string;
  isLoggedInViaSuperAdmin?: boolean;
}> = ({ superAdminName, superAdminEmail, isLoggedInViaSuperAdmin }) => {
  return (
    <AdminShell>
      {isLoggedInViaSuperAdmin && (
        <div className="flex items-center gap-2 border-b border-yellow-200 bg-yellow-100 px-4 py-2 text-xs text-yellow-900">
          <span className="font-semibold">You are logged in as Admin</span>
          {superAdminName && (
            <span>
              (<span className="font-medium">{superAdminName}</span>
              {superAdminEmail && (
                <span className="ml-1 text-gray-600">| {superAdminEmail}</span>
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

const BYPASS_AUTH = import.meta.env.DEV;

const SubAdminAppLayout: React.FC = () => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean | null>(
    BYPASS_AUTH ? true : null
  );
  const [superAdminName, setSuperAdminName] = useState<string | undefined>();
  const [superAdminEmail, setSuperAdminEmail] = useState<string | undefined>();
  const [isLoggedInViaSuperAdmin, setIsLoggedInViaSuperAdmin] = useState<boolean>(false);

  useEffect(() => {
    if (BYPASS_AUTH) return;

    const checkAdminAuth = async () => {
      try {
        const token = localStorage.getItem("admin-token");
        if (!token) {
          setIsAdminAuthenticated(false);
          if (window.location.pathname.startsWith("/admin")) {
            window.location.href = "/";
          }
          return;
        }

        const isViaSuperAdmin = localStorage.getItem("isLogInViaSuperAdmin") === "true";
        setIsLoggedInViaSuperAdmin(isViaSuperAdmin);

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/auth/admin/check-auth/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: token,
            },
            body: JSON.stringify({ role: "admin" }),
          }
        );

        if (res.ok) {
          setIsAdminAuthenticated(true);
          const data = await res.json();
          if (isViaSuperAdmin && data?.name && data?.email) {
            setSuperAdminName(data.name);
            setSuperAdminEmail(data.email);
          }
          if (window.location.pathname === "/admin/signin" || window.location.pathname === "/") {
            window.location.href = "/admin";
          }
        } else {
          setIsAdminAuthenticated(false);
          window.location.href = "/";
        }
      } catch {
        setIsAdminAuthenticated(false);
        window.location.href = "/";
      }
    };

    checkAdminAuth();
  }, []);

  if (isAdminAuthenticated === null || !isAdminAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ad-app-bg">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
      </div>
    );
  }

  return (
    <LayoutContent
      superAdminName={superAdminName}
      superAdminEmail={superAdminEmail}
      isLoggedInViaSuperAdmin={isLoggedInViaSuperAdmin}
    />
  );
};

export default SubAdminAppLayout;
