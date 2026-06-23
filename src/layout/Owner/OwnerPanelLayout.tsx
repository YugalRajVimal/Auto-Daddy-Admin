import { Link, Outlet } from "react-router";
import PortalShell from "../../components/admin/PortalShell";
import { RequirePortal } from "../../auth/guards/RequirePortal";
import useAuth from "../../auth/useAuth";
import { ownerPrimaryNav } from "../../config/ownerNav";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";

function OwnerLayoutContent() {
  const { profile, session } = useAuth();
  const loginAs = session?.meta?.phone || profile?.phone || "";
  const name = profile?.name?.trim();
  const city = profile?.city?.trim();

  const headerCenter = name ? (
    <p className="text-center font-serif text-base text-gray-700 md:text-lg lg:text-xl">
      {name}
      {city ? (
        <>
          {" - "}
          <Link to="/owner/profile" className="font-bold text-blue-600 underline">
            {city}
          </Link>
        </>
      ) : null}
    </p>
  ) : null;

  const headerAvatarSrc = normalizeMediaUrl(profile?.profilePhoto ?? null);

  return (
    <PortalShell
      homePath="/owner"
      profilePath="/owner/profile"
      primaryNav={ownerPrimaryNav}
      loginAs={loginAs}
      headerCenter={headerCenter}
      headerAvatarSrc={headerAvatarSrc}
      helpPath="/owner/help"
    >
      <Outlet />
    </PortalShell>
  );
}

export default function OwnerPanelLayout() {
  return (
    <RequirePortal portal="owner" signInPath="/" unauthorizedPath="/">
      <OwnerLayoutContent />
    </RequirePortal>
  );
}
