import { SidebarProvider, useSidebar } from "../../context/SidebarContext";
import { Outlet } from "react-router";
import SubAdminAppSidebar from "./AppSidebar";
import SubAdminBackdrop from "./Backdrop";
import SubAdminAppHeader from "./AppHeader";
import { useEffect, useState } from "react";

// SuperAdmin bar like the pattern seen on Admin
const SuperAdminBanner: React.FC<{
  superAdminName: string | null;
  superAdminEmail: string | null;
}> = ({ superAdminName, superAdminEmail }) => {
  return (
    <div className="bg-yellow-100 text-yellow-900 text-xs px-3 py-2 rounded-b shadow  flex items-center gap-2 border-b border-yellow-200">
      <span className="font-semibold mr-2">
        You are logged in as Therapist (Super Admin Mode)
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
    <div
      className="min-h-screen xl:flex"
      style={{
        background:
          "linear-gradient(135deg, #fdf4cc 0%, #ffe3ef 45%, #ced3f3 100%)",
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
          {/* SuperAdmin Banner */}
       
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const TherapistAppLayout: React.FC = () => {
  const [isTherapistAuthenticated, setIsTherapistAuthenticated] = useState<boolean | null>(null);

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
    const checkTherapistAuth = async () => {
      try {
        // Get token from localStorage (therapist-token)
        const token = localStorage.getItem("therapist-token");
        if (!token) {
          setIsTherapistAuthenticated(false);
          if (window.location.pathname.startsWith("/therapist")) {
            window.location.href = "/signin";
          }
          return;
        }

        // Call the check-auth endpoint (as per auth.routes.js /auth/)
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/auth`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: token,
            },
            body: JSON.stringify({ role: "therapist" }),
          }
        );

        // Get name & email from API if present (even on success)
        let apiName = "";
        let apiEmail = "";
        try {
          const d = await res.clone().json();
          apiName = d?.name || "";
          apiEmail = d?.email || "";
        } catch {
          // ignore JSON parse error
        }

        // If we're superadmin-impersonated, prefer API returned name/email for banner (supersede localStorage)
        if (isLoggedInViaSuperAdmin && (apiName || apiEmail)) {
          setSuperAdminName(apiName || "");
          setSuperAdminEmail(apiEmail || "");
        }

        if (res.status === 428) {
          setIsTherapistAuthenticated(false);

          // Try to extract name & email from the response body (again, to pass for URL)
          let name = "", email = "";
          try {
            const data = await res.json();
            name = data?.name || "";
            email = data?.email || "";
          } catch {}
          if (window.location.pathname !== "/therapist/complete-profile") {
            const qp =
              `?${name ? `name=${encodeURIComponent(name)}&` : ""}` +
              `${email ? `email=${encodeURIComponent(email)}` : ""}`;
            window.location.href = `/therapist/complete-profile${qp.length > 1 ? qp : ""}`;
          }
          return;
        }

        if (res.status === 451) {
          setIsTherapistAuthenticated(false);
          // Try to extract name & email from the response body
          let name = '', email = '';
          try {
            const data = await res.json();
            name = data?.name || "";
            email = data?.email || "";
          } catch {}
          if (window.location.pathname !== "/therapist/pending-approval") {
            const qp =
              `?${name ? `name=${encodeURIComponent(name)}&` : ""}` +
              `${email ? `email=${encodeURIComponent(email)}` : ""}`;
            window.location.href = `/therapist/pending-approval${qp.length > 1 ? qp : ""}`;
          }
          return;
        }

        if (res.ok) {
          setIsTherapistAuthenticated(true); // Therapist is authenticated
          if (window.location.pathname === "/signin") {
            window.location.href = "/therapist";
          }
        } else {
          setIsTherapistAuthenticated(false);
          window.location.href = "/signin";
        }
      } catch (err) {
        setIsTherapistAuthenticated(false);
        window.location.href = "/signin";
      }
    };

    checkTherapistAuth();
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedInViaSuperAdmin]);

  if (isTherapistAuthenticated === null || !isTherapistAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="w-40 h-40 border-4 border-t-4 border-gray-200 border-t-brand-500 rounded-full animate-spin"></div>
      </div>
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

export default TherapistAppLayout;
