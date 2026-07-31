import ShopSubscriptionRequiredDialog from "../../components/shop/ShopSubscriptionRequiredDialog";
import ShopPortalShell from "../../components/shop/ShopPortalShell";
import { RequirePortal } from "../../auth/guards/RequirePortal";
import { shopPrimaryNav } from "../../config/shopNav";
import { ShopPageChromeProvider } from "../../context/ShopPageChromeContext";
import {
  ShopOwnerDataProvider,
  ShopOwnerPrefetcher,
} from "../../context/ShopOwnerDataProvider";
import {
  ShopSubscriptionGateProvider,
  useShopSubscriptionGate,
} from "../../context/ShopSubscriptionGateContext";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";
import {
  resolveShopNeedsBusinessOnboarding,
  shopProfileCompletionPath,
} from "../../lib/shopProfileCompleteness";
import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { getPostLoginRedirect, useAuth } from "../../auth";

function ShopSubscriptionPrompt() {
  const navigate = useNavigate();
  const { subscribePromptOpen, closeSubscribePrompt } = useShopSubscriptionGate();

  return (
    <ShopSubscriptionRequiredDialog
      open={subscribePromptOpen}
      onSubscribe={() => {
        closeSubscribePrompt();
        navigate("/shop/my-website");
      }}
      onLater={closeSubscribePrompt}
    />
  );
}

function ShopLayoutContent() {
  const {
    displayName,
    city,
    daysLeft,
    business,
    businessNameLoaded,
    profileIcon,
    user,
    hasActiveSubscription,
    subscriptionGateReady,
  } = useShopOwnerPortal();
  const profilePhotoSrc = normalizeMediaUrl(profileIcon ?? null);
  const locationLabel = city || business?.city?.trim();
  const { login, session } = useAuth();

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

  // Only business profile completion gates the shop portal (personal is optional).
  const needsBusinessOnboarding = useMemo(
    () =>
      resolveShopNeedsBusinessOnboarding(
        session?.meta,
        business,
        user?.pincode ?? business?.pincode,
        businessNameLoaded
      ),
    [session?.meta, business, user?.pincode, businessNameLoaded]
  );

  if (needsBusinessOnboarding) {
    return <Navigate to={shopProfileCompletionPath("business")} replace />;
  }

  const subscriptionLocked =
    subscriptionGateReady && !hasActiveSubscription;

  return (
    <ShopSubscriptionGateProvider subscriptionLocked={subscriptionLocked}>
      {backToAdminToken && (
        <div
          className="flex items-center justify-between px-4 py-2 text-sm z-50 border border-yellow-300 text-yellow-900 bg-yellow-100 whitespace-nowrap"
          style={{
            position: "sticky",
            top: 0,
            left: 0,
            right: 0,
            width: "fit-content",
            maxWidth: "360px",
            minWidth: "225px",
            margin: "12px auto 0 auto",
            borderBottomLeftRadius: "22px",
            borderBottomRightRadius: "22px",
            borderTopLeftRadius: "8px",
            borderTopRightRadius: "8px",
            boxShadow: "0 6px 16px #0001",
          }}
        >
          <span>
            <b>Logged in as Super Admin</b>
          </span>
          <button
            className="ml-4 px-3 py-1 rounded bg-yellow-400 hover:bg-yellow-500 font-semibold text-yellow-900 border border-yellow-600 whitespace-nowrap"
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
        brandLogo={{ src: profilePhotoSrc, placeholderLabel: "Profile photo" }}
        businessName={displayName}
        businessNameLoading={!businessNameLoaded}
        city={locationLabel}
        subscriptionDaysLeft={hasActiveSubscription ? (daysLeft ?? null) : null}
        helpPath="/shop/help"
      />

      <ShopSubscriptionPrompt />
    </ShopSubscriptionGateProvider>
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
