
import { useEffect, useState } from "react";
import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";
import Backdrop from "./Backdrop";
import { Outlet } from "react-router";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div
      className="min-h-screen max-w-screen xl:flex overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #fdf4cc 0%, #ffe3ef 45%, #ced3f3 100%)",
      }}
    >
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all md:w-[80%] duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader />
        <div className="p-4 mx-auto w-full max-w-(--breakpoint-2xl) md:p-6 overflow-x-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  const [isSuperAdminAuthenticated, setIsSuperAdminAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSuperAdminAuth = async () => {
      const token = localStorage.getItem("super-admin-token");
      if (!token) {
        setIsSuperAdminAuthenticated(false);
        if (window.location.pathname.startsWith("/super-admin")) {
          window.location.href = "/signin";
        }
        return;
      }

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/auth/super-admin/check-auth`,
          {
            method: "POST",
            headers: { Authorization: `${token}` },
          }
        );
        if (res.status === 200) {
          setIsSuperAdminAuthenticated(true);
          // If super admin is already authenticated but on /signin, redirect to /super-admin
          if (window.location.pathname === "/signin") {
            window.location.href = "/super-admin";
          }
        } else {
          setIsSuperAdminAuthenticated(false);
          window.location.href = "/signin";
        }
      } catch (err) {
        setIsSuperAdminAuthenticated(false);
        window.location.href = "/signin";
      }
    };

    checkSuperAdminAuth();
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isSuperAdminAuthenticated === null || !isSuperAdminAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="w-40 h-40 border-4 border-t-4 border-gray-200 border-t-brand-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
