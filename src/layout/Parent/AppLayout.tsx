import { SidebarProvider, useSidebar } from "../../context/SidebarContext";
import { Outlet } from "react-router";
import SubAdminAppSidebar from "./AppSidebar";
import SubAdminBackdrop from "./Backdrop";
import SubAdminAppHeader from "./AppHeader";
import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";

// SuperAdmin bar like the pattern seen on Admin/Therapist
const SuperAdminBanner: React.FC<{
  superAdminName: string | null;
  superAdminEmail: string | null;
}> = ({ superAdminName, superAdminEmail }) => {
  return (
    <div className="bg-yellow-100 text-yellow-900 text-xs px-3 py-2 rounded-b shadow  flex items-center gap-2 border-b border-yellow-200">
      <span className="font-semibold mr-2">
        You are logged in as Parent (Super Admin Mode)
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
  );
};

const LayoutContent: React.FC<{
  isLoggedInViaSuperAdmin: boolean;
  superAdminName: string | null;
  superAdminEmail: string | null;
}> = ({ isLoggedInViaSuperAdmin, superAdminName, superAdminEmail }) => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <>
      <PageMeta
        title="Auto Daddy"
        description=""
      />
      <div
        className="min-h-screen xl:flex"
        style={{
          background: "linear-gradient(135deg, #fdf4cc 0%, #ffe3ef 45%, #ced3f3 100%)",
        }}
      >
        <div>
          <SubAdminAppSidebar />
          <SubAdminBackdrop />
        </div>
        <div
          className={`flex-1 transition-all duration-300 ease-in-out ${
            isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
          } ${isMobileOpen ? "ml-0" : ""}`}
        >
          {isLoggedInViaSuperAdmin && (
            <SuperAdminBanner
              superAdminName={superAdminName}
              superAdminEmail={superAdminEmail}
            />
          )}
          <SubAdminAppHeader />
          <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
};

const ParentAppLayout: React.FC = () => {
  const [isParentAuthenticated, setIsParentAuthenticated] = useState<boolean | null>(null);

  // Super Admin context, retrievable if "isLogInViaSuperAdmin" in localStorage
  const [isLoggedInViaSuperAdmin, setIsLoggedInViaSuperAdmin] = useState(false);
  const [superAdminName, setSuperAdminName] = useState<string | null>(null);
  const [superAdminEmail, setSuperAdminEmail] = useState<string | null>(null);

  useEffect(() => {
    // Check for super-admin login marker
    const isSuperAdmin = localStorage.getItem("isLogInViaSuperAdmin") === "true";
    setIsLoggedInViaSuperAdmin(isSuperAdmin);
    if (isSuperAdmin) {
      try {
        const userData = localStorage.getItem("userData");
        if (userData) {
          const data = JSON.parse(userData);
          setSuperAdminName(data?.superAdminName || data?.name || "");
          setSuperAdminEmail(data?.superAdminEmail || data?.email || "");
        } else {
          setSuperAdminName("");
          setSuperAdminEmail("");
        }
      } catch {
        setSuperAdminName("");
        setSuperAdminEmail("");
      }
    }
  }, []);

  useEffect(() => {
    const checkParentAuth = async () => {
      try {
        // Get token from localStorage (user-token)
        const token = localStorage.getItem("user-token");
        if (!token) {
          setIsParentAuthenticated(false);
          if (window.location.pathname.startsWith("/user")) {
            window.location.href = "/signin";
          }
          return;
        }

        // Call the check-auth endpoint (as per auth.routes.js /auth/)
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/auth/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: token,
            },
            body: JSON.stringify({ role: "user" }),
          }
        );

        // KYC not completed (status 425): redirect to /user/complete-kyc
        if (res.status === 425) {
          setIsParentAuthenticated(false);
          let data = {};
          try {
            data = await res.json();
          } catch (e) {
            data = {};
          }
          let name = "";
          let email = "";
          if (data && typeof data === "object") {
            name = (data as any).name || "";
            email = (data as any).email || "";
          }
          let redirectUrl = "/complete-kyc";
          if (name || email) {
            const params = new URLSearchParams({});
            if (name) params.set("name", name);
            if (email) params.set("email", email);
            redirectUrl += "?" + params.toString();
          }
          window.location.href = redirectUrl;
          return;
        }

        // If KYC is pending (status 429): redirect to /user/kyc-pending
        if (res.status === 429) {
          setIsParentAuthenticated(false);
          let data = {};
          try {
            data = await res.json();
          } catch (e) {
            data = {};
          }
          let name = "";
          let email = "";
          let kycStatus = "";
          let message = "";
          if (data && typeof data === "object") {
            message = (data as any).message || "";
            name = (data as any).name || "";
            email = (data as any).email || "";
            kycStatus = (data as any).kycStatus || "";
          }
          let redirectUrl = "/kyc-pending";
          if (message || name || email || kycStatus) {
            const params = new URLSearchParams({});
            if (message) params.set("message", message);
            if (kycStatus) params.set("kycStatus", kycStatus);
            if (name) params.set("name", name);
            if (email) params.set("email", email);
            redirectUrl += "?" + params.toString();
          }
          window.location.href = redirectUrl;
          return;
        }

        // Package not purchased or expired (status 426): redirect to /user/packages
        if (res.status === 426) {
          setIsParentAuthenticated(false);
          let data = {};
          try {
            data = await res.json();
          } catch (e) {
            data = {};
          }
          let name = "";
          let email = "";
          let message = "";
          if (data && typeof data === "object") {
            message = (data as any).message || "";
            name = (data as any).name || "";
            email = (data as any).email || "";
          }
          let redirectUrl = "/purchase-package";
          if (message || name || email) {
            const params = new URLSearchParams({});
            if (message) params.set("message", message);
            if (name) params.set("name", name);
            if (email) params.set("email", email);
            redirectUrl += "?" + params.toString();
          }
          window.location.href = redirectUrl;
          return;
        }

        // Incomplete parent profile (status 428): redirect to /complete-parent-profile
        if (res.status === 428) {
          setIsParentAuthenticated(false);
          let data = {};
          try {
            data = await res.json();
          } catch (e) {
            data = {};
          }
          let name = "";
          let email = "";
          if (data && typeof data === "object") {
            name = (data as any).name || "";
            email = (data as any).email || "";
          }
          let redirectUrl = "/complete-parent-profile";
          if (name || email) {
            const params = new URLSearchParams({});
            if (name) params.set("name", name);
            if (email) params.set("email", email);
            redirectUrl += "?" + params.toString();
          }
          window.location.href = redirectUrl;
          return;
        }

        if (res.ok) {
          setIsParentAuthenticated(true);
          // Redirect to /user if already logged in but on /signin
          if (window.location.pathname === "/signin") {
            window.location.href = "/user";
          }
        } else {
          setIsParentAuthenticated(false);
          window.location.href = "/signin";
        }
      } catch (err) {
        setIsParentAuthenticated(false);
        window.location.href = "/signin";
      }
    };

    checkParentAuth();
  }, []);

  if (isParentAuthenticated === null || !isParentAuthenticated) {
    return (
      <>
        <PageMeta
          title="Auto Daddy"
          description=""
        />
        <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
          <div className="w-40 h-40 border-4 border-t-4 border-gray-200 border-t-brand-500 rounded-full animate-spin"></div>
        </div>
      </>
    );
  }

  return (
    <SidebarProvider>
      <LayoutContent
        isLoggedInViaSuperAdmin={isLoggedInViaSuperAdmin}
        superAdminName={superAdminName}
        superAdminEmail={superAdminEmail}
      />
    </SidebarProvider>
  );
};

export default ParentAppLayout;
