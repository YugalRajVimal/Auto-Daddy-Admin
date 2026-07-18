import OwnerPortalShell from "../../components/owner/OwnerPortalShell";
import { RequirePortal } from "../../auth/guards/RequirePortal";
import useAuth from "../../auth/useAuth";
import { buildOwnerPrimaryNav, ownerHelpNav } from "../../config/ownerNav";
import { OwnerPageChromeProvider } from "../../context/OwnerPageChromeContext";
import { useCarOwnerVehicles } from "../../hooks/useCarOwnerVehicles";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";
import { useMemo, useState, useEffect } from "react";
import { Navigate } from "react-router";
import { getPostLoginRedirect } from "../../auth";

function OwnerLayoutContent() {
  const { login, profile, session } = useAuth();
  const { vehicles } = useCarOwnerVehicles();
  const loginAs = session?.meta?.phone || profile?.phone || "";
  const name = profile?.name?.trim();
  const city = profile?.city?.trim();
  const displayName = name || loginAs || "Car Owner";
  const headerAvatarSrc = normalizeMediaUrl(profile?.profilePhoto ?? null);


  // Track if in admin impersonate mode (super-admin logged in as owner)
  const [backToAdminToken, setBackToAdminToken] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("back-to-admin-token");
    setBackToAdminToken(token);
    // Listen for changes to storage (other tabs etc)
    const storageListener = () => {
      const t = localStorage.getItem("back-to-admin-token");
      setBackToAdminToken(t);
    };
    window.addEventListener('storage', storageListener);
    return () => window.removeEventListener('storage', storageListener);
  }, []);

  const handleBackToAdmin = () => {
    const backToken = localStorage.getItem("back-to-admin-token");
    const currentAdminToken = localStorage.getItem("admin-token");
    console.log("[OwnerLayoutContent] handleBackToAdmin: back-to-admin-token =", backToken, "; admin-token =", currentAdminToken);

    if (backToken) {
      localStorage.setItem("admin-token", backToken);
      console.log("[OwnerLayoutContent] Setting admin-token to:", backToken);
      localStorage.removeItem("back-to-admin-token");
      console.log("[OwnerLayoutContent] Removed back-to-admin-token from storage");
      // Reload to update session/auth context
      login({ token:backToken, role: 'admin' });

      setTimeout(() => {
   window.location.href = getPostLoginRedirect('admin');

   }, 800);
      // window.location.href = "/admin";
    } else {
      console.log("[OwnerLayoutContent] No back-to-admin-token found. No action taken.");
    }
  };

  const primaryNav = useMemo(
    () =>
      buildOwnerPrimaryNav(
        vehicles.map((v, index) => ({
          id: v.id,
          label: v.licensePlateNo?.trim() || `Vehicle ${index + 1}`,
        }))
      ),
    [vehicles]
  );

  if (session?.meta?.isProfileComplete === false) {
    console.log("[OwnerLayoutContent] Profile not complete, redirecting to onboarding.");
    return <Navigate to="/owner/onboarding" replace />;
  }

  return (
    <>
      {backToAdminToken && (
        <div className="w-full bg-yellow-100 border-b border-yellow-300 text-yellow-900 flex items-center justify-between px-4 py-2 text-sm z-50" style={{ position: "sticky", top: 0 }}>
          <span>
            <b>Logged in as Super Admin</b> (impersonating car owner)
          </span>
          <button
            className="ml-4 px-3 py-1 rounded bg-yellow-400 hover:bg-yellow-500 font-semibold text-yellow-900 border border-yellow-600"
            type="button"
            onClick={handleBackToAdmin}
          >
            Back to Super Admin
          </button>
        </div>
      )}
      <OwnerPortalShell
        homePath="/owner"
        profilePath="/owner/profile"
        primaryNav={primaryNav}
        displayName={displayName}
        city={city}
        loginAs={loginAs}
        headerAvatarSrc={headerAvatarSrc}
        helpPath="/owner/help"
        helpNav={ownerHelpNav}
      />
    </>
  );
}

export default function OwnerPanelLayout() {
  console.log("[OwnerPanelLayout] Mounting OwnerPanelLayout; admin-token =", localStorage.getItem("admin-token"), "; back-to-admin-token =", localStorage.getItem("back-to-admin-token"));
  return (
    <RequirePortal portal="owner" signInPath="/" unauthorizedPath="/">
      <OwnerPageChromeProvider>
        <OwnerLayoutContent />
      </OwnerPageChromeProvider>
    </RequirePortal>
  );
}
