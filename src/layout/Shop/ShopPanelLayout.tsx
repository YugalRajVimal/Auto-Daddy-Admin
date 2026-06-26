import ShopPortalShell from "../../components/shop/ShopPortalShell";
import { RequirePortal } from "../../auth/guards/RequirePortal";
import { shopPrimaryNav } from "../../config/shopNav";
import { ShopPageChromeProvider } from "../../context/ShopPageChromeContext";
import {
  ShopOwnerDataProvider,
  ShopOwnerPrefetcher,
} from "../../context/ShopOwnerDataProvider";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";

function ShopLayoutContent() {
  const { displayName, city, daysLeft, business, businessNameLoaded } = useShopOwnerPortal();
  const businessLogoSrc = normalizeMediaUrl(business?.businessLogo ?? null);
  const location = city || business?.city?.trim();

  return (
    <>
      <ShopOwnerPrefetcher />
      <ShopPortalShell
        homePath="/shop"
        profilePath="/shop/profile"
        primaryNav={shopPrimaryNav}
        brandLogo={{ src: businessLogoSrc, placeholderLabel: "Business logo" }}
        businessName={displayName}
        businessNameLoading={!businessNameLoaded}
        city={location}
        subscriptionDaysLeft={daysLeft ?? null}
        helpPath="/shop/help"
      />
    </>
  );
}

export default function ShopPanelLayout() {
  return (
    <RequirePortal portal="shop" signInPath="/" unauthorizedPath="/">
      <ShopOwnerDataProvider>
        <ShopPageChromeProvider>
          <ShopLayoutContent />
        </ShopPageChromeProvider>
      </ShopOwnerDataProvider>
    </RequirePortal>
  );
}
