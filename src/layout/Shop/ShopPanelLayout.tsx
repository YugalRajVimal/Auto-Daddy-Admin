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
import { useEffect, useState } from "react";
import { getPostLoginRedirect, useAuth } from "../../auth";

function ShopLayoutContent() {
  const { displayName, city, daysLeft, business, businessNameLoaded } = useShopOwnerPortal();
  const businessLogoSrc = normalizeMediaUrl(business?.businessLogo ?? null);
  const location = city || business?.city?.trim();
  const { login } = useAuth();

  // State to track back-to-admin-token
  const [backToAdminToken, setBackToAdminToken] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("back-to-admin-token");
    setBackToAdminToken(token);

    // Listen for changes to storage (e.g., another tab clears or adds the token)
    const storageListener = () => {
      const t = localStorage.getItem("back-to-admin-token");
      setBackToAdminToken(t);
    };
    window.addEventListener("storage", storageListener);
    return () => window.removeEventListener("storage", storageListener);
  }, []);

  const handleBackToAdmin = () => {
    const backToken = localStorage.getItem("back-to-admin-token");
    if (backToken) {
      localStorage.setItem("admin-token", backToken);
      localStorage.removeItem("back-to-admin-token");

        // Reload to update session/auth context
        login({ token:backToken, role: 'admin' });

      // Directly reload and redirect
      setTimeout(() => {
        window.location.href = getPostLoginRedirect('admin');
      }, 800);
    }
  };

  return (
    <>
      {backToAdminToken && (
        <div
          className="w-full bg-yellow-100 border-b border-yellow-300 text-yellow-900 flex items-center justify-between px-4 py-2 text-sm z-50"
          style={{ position: "sticky", top: 0 }}
        >
          <span>
            <b>Logged in as Super Admin</b> (impersonating autoshop)
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
