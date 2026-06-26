import ShopPortalShell from "../../components/shop/ShopPortalShell";
import { RequirePortal } from "../../auth/guards/RequirePortal";
import useAuth from "../../auth/useAuth";
import { shopPrimaryNav } from "../../config/shopNav";
import { ShopPageChromeProvider } from "../../context/ShopPageChromeContext";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";

function ShopLayoutContent() {
  const { profile, session } = useAuth();
  const { displayName, city, daysLeft, business } = useShopOwnerPortal();
  const businessLogoSrc = normalizeMediaUrl(business?.businessLogo ?? null);
  const loginAs = session?.meta?.phone || profile?.phone || "";

  const name = displayName || profile?.name?.trim() || loginAs || "Auto Shop";
  const location = city || profile?.city?.trim() || business?.city?.trim();

  return (
    <ShopPortalShell
      homePath="/shop"
      profilePath="/shop/profile"
      primaryNav={shopPrimaryNav}
      brandLogo={{ src: businessLogoSrc, placeholderLabel: "Business logo" }}
      businessName={name}
      city={location}
      subscriptionDaysLeft={daysLeft ?? null}
      helpPath="/shop/help"
    />
  );
}

export default function ShopPanelLayout() {
  return (
    <RequirePortal portal="shop" signInPath="/" unauthorizedPath="/">
      <ShopPageChromeProvider>
        <ShopLayoutContent />
      </ShopPageChromeProvider>
    </RequirePortal>
  );
}
