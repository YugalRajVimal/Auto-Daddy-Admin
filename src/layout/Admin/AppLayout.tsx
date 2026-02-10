import { SidebarProvider, useSidebar } from "../../context/SidebarContext";
import { Outlet } from "react-router";
import SubAdminAppSidebar from "./AppSidebar";
import SubAdminBackdrop from "./Backdrop";
import { useEffect, useState } from "react";
import SubAdminAppHeader from "./AppHeader";



const LayoutContent: React.FC<{
  superAdminName?: string;
  superAdminEmail?: string;
  isLoggedInViaSuperAdmin?: boolean;
}> = ({ superAdminName, superAdminEmail, isLoggedInViaSuperAdmin }) => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div
      className="h-screen overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #dbeafe 0%, #93c5fd 45%, #60a5fa 100%)",
      }}

    >
      <div>
        <SubAdminAppSidebar />
        <SubAdminBackdrop />
      </div>
      <div
        className={`transition-all duration-300 ease-in-out h-full ${
          isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
        // style={{ width: "100%" }}
      >
        {isLoggedInViaSuperAdmin && (
          <div className="bg-yellow-100 text-yellow-900 text-xs px-3 py-2 rounded-b shadow mb-2 flex items-center gap-2 border-b border-yellow-200">
            <span className="font-semibold mr-2">
              You are logged in as Admin
            </span>
            {superAdminName && (
              <span>
                (<span className="font-medium">{superAdminName}</span>
                {superAdminEmail && (
                  <span className="text-gray-600 ml-1">| {superAdminEmail}</span>
                )}
                )
              </span>
            )}
          </div>
        )}
        <SubAdminAppHeader />
        <div className="p-4 mx-auto w-full h-full md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const SubAdminAppLayout: React.FC = () => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean | null>(null);
  const [superAdminName, setSuperAdminName] = useState<string | undefined>();
  const [superAdminEmail, setSuperAdminEmail] = useState<string | undefined>();
  const [isLoggedInViaSuperAdmin, setIsLoggedInViaSuperAdmin] = useState<boolean>(false);

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const token = localStorage.getItem("admin-token");
        if (!token) {
          setIsAdminAuthenticated(false);
          if (window.location.pathname.startsWith("/admin")) {
            window.location.href = "/admin/signin";
          }
          return;
        }

        // Check if login is via super admin
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
          // API returns { message, name, email } according to backend
          if (isViaSuperAdmin && data && data.name && data.email) {
            setSuperAdminName(data.name);
            setSuperAdminEmail(data.email);
          }
          if (window.location.pathname === "/admin/signin") {
            window.location.href = "/admin";
          }
        } else {
          setIsAdminAuthenticated(false);
          window.location.href = "/admin/signin";
        }
      } catch (err) {
        setIsAdminAuthenticated(false);
        window.location.href = "/admin/signin";
      }
    };

    checkAdminAuth();
  }, []);

  if (isAdminAuthenticated === null || !isAdminAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="w-40 h-40 border-4 border-t-4 border-gray-200 border-t-brand-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <LayoutContent
        superAdminName={superAdminName}
        superAdminEmail={superAdminEmail}
        isLoggedInViaSuperAdmin={isLoggedInViaSuperAdmin}
      />
    </SidebarProvider>
  );
};

export default SubAdminAppLayout;
