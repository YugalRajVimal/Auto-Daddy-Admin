import OwnerPortalShell from "../../components/owner/OwnerPortalShell";
import { RequirePortal } from "../../auth/guards/RequirePortal";
import useAuth from "../../auth/useAuth";
import { buildOwnerPrimaryNav, ownerHelpNav } from "../../config/ownerNav";
import { OwnerPageChromeProvider } from "../../context/OwnerPageChromeContext";
import { useCarOwnerVehicles } from "../../hooks/useCarOwnerVehicles";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";
import { useMemo } from "react";
import { Navigate } from "react-router";

function OwnerLayoutContent() {
  const { profile, session } = useAuth();
  const { vehicles } = useCarOwnerVehicles();
  const loginAs = session?.meta?.phone || profile?.phone || "";
  const name = profile?.name?.trim();
  const city = profile?.city?.trim();
  const displayName = name || loginAs || "Car Owner";
  const headerAvatarSrc = normalizeMediaUrl(profile?.profilePhoto ?? null);

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
    return <Navigate to="/owner/onboarding" replace />;
  }

  return (
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
  );
}

export default function OwnerPanelLayout() {
  return (
    <RequirePortal portal="owner" signInPath="/" unauthorizedPath="/">
      <OwnerPageChromeProvider>
        <OwnerLayoutContent />
      </OwnerPageChromeProvider>
    </RequirePortal>
  );
}
