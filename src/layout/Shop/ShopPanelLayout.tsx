import { Link, Outlet } from "react-router";
import PortalShell from "../../components/admin/PortalShell";
import { RequirePortal } from "../../auth/guards/RequirePortal";
import useAuth from "../../auth/useAuth";
import { shopPrimaryNav } from "../../config/shopNav";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";

function ShopLayoutContent() {
  const { profile, session } = useAuth();
  const { displayName, city, daysLeft, business } = useShopOwnerPortal();
  const businessLogoSrc = normalizeMediaUrl(business?.businessLogo ?? null);
  const loginAs = session?.meta?.phone || profile?.phone || "";

  const name = displayName || profile?.name?.trim() || "Auto Shop";
  const location = city || profile?.city?.trim();

  const headerCenter = (
    <p className="text-center font-serif text-base text-gray-700 md:text-lg lg:text-xl">
      {name}
      {location ? (
        <>
          {" - "}
          <Link to="/shop/profile" className="font-bold text-blue-600 underline">
            {location}
          </Link>
        </>
      ) : null}
    </p>
  );

  return (
    <PortalShell
      homePath="/shop"
      profilePath="/shop/profile"
      primaryNav={shopPrimaryNav}
      loginAs={loginAs}
      brandLogo={{ src: businessLogoSrc, placeholderLabel: "Business logo" }}
      headerCenter={headerCenter}
      subscriptionDaysLeft={daysLeft ?? null}
      helpPath="/shop/help"
    >
      <Outlet />
    </PortalShell>
  );
}

export default function ShopPanelLayout() {
  return (
    <RequirePortal portal="shop" signInPath="/" unauthorizedPath="/">
      <ShopLayoutContent />
    </RequirePortal>
  );
}
