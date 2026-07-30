import ShopCompleteProfileDialog from "../../components/shop/ShopCompleteProfileDialog";
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
  resolveBusinessProfileIncomplete,
  resolvePersonalProfileIncomplete,
  resolveShopProfileIncompleteKind,
} from "../../lib/shopProfileCompleteness";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { getPostLoginRedirect, useAuth } from "../../auth";

const PROFILE_DISMISS_KEY = "autodaddy.shop.complete-profile-dismissed";

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
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // State to track back-to-admin-token
  const [backToAdminToken, setBackToAdminToken] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(PROFILE_DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

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

  const incompleteKind = useMemo(() => {
    const personalIncomplete = resolvePersonalProfileIncomplete(
      session?.meta,
      user,
      user?.city ?? business?.city,
      businessNameLoaded
    );
    const businessIncomplete = resolveBusinessProfileIncomplete(
      session?.meta,
      business,
      user?.pincode ?? business?.pincode,
      businessNameLoaded
    );
    return resolveShopProfileIncompleteKind(personalIncomplete, businessIncomplete);
  }, [
    session?.meta,
    user,
    business,
    businessNameLoaded,
  ]);

  const profileCompletenessKnown = businessNameLoaded || (
    session?.meta?.isProfileComplete != null &&
    session?.meta?.isAutoShopBusinessProfileComplete != null
  );

  const onProfilePage = pathname.startsWith("/shop/profile");
  const showCompleteProfileDialog =
    Boolean(incompleteKind) && !onProfilePage && !dismissed;

  const subscriptionLocked =
    subscriptionGateReady && !hasActiveSubscription;

  const handleCompleteProfile = () => {
    const section =
      incompleteKind === "business" ? "business" : "personal";
    navigate(`/shop/profile?section=${section}`);
  };

  const handleLater = () => {
    try {
      sessionStorage.setItem(PROFILE_DISMISS_KEY, "1");
    } catch {
      // ignore quota / private mode
    }
    setDismissed(true);
  };

  // Clear dismiss once we know the profile is complete so a future incomplete state can prompt again.
  useEffect(() => {
    if (!profileCompletenessKnown || incompleteKind) return;
    try {
      sessionStorage.removeItem(PROFILE_DISMISS_KEY);
    } catch {
      // ignore
    }
    setDismissed(false);
  }, [incompleteKind, profileCompletenessKnown]);

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

      {incompleteKind ? (
        <ShopCompleteProfileDialog
          open={showCompleteProfileDialog}
          kind={incompleteKind}
          onComplete={handleCompleteProfile}
          onLater={handleLater}
        />
      ) : null}

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
