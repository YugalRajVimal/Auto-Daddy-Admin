import OwnerPortalShell from "../../components/owner/OwnerPortalShell";
import { RequirePortal } from "../../auth/guards/RequirePortal";
import useAuth from "../../auth/useAuth";
import { ownerPrimaryNav } from "../../config/ownerNav";
import { OwnerPageChromeProvider } from "../../context/OwnerPageChromeContext";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";
import { Navigate } from "react-router";

function OwnerLayoutContent() {
  const { profile, session } = useAuth();
  const loginAs = session?.meta?.phone || profile?.phone || "";
  const name = profile?.name?.trim();
  const city = profile?.city?.trim();
  const displayName = name || loginAs || "Car Owner";
  const headerAvatarSrc = normalizeMediaUrl(profile?.profilePhoto ?? null);

  if (session?.meta?.isProfileComplete === false) {
    return <Navigate to="/owner/onboarding" replace />;
  }

  return (
    <OwnerPortalShell
      homePath="/owner"
      profilePath="/owner/profile"
      primaryNav={ownerPrimaryNav}
      displayName={displayName}
      city={city}
      loginAs={loginAs}
      headerAvatarSrc={headerAvatarSrc}
      helpPath="/owner/help"
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
