import { AppSplash } from "@/components/reusables";
import { ShopSubscriptionRequiredDialog } from "@/components/shop-owner/shop-subscription-required-dialog";
import { useAuth } from "@/context/auth-provider";
import {
  ShopSubscriptionGateProvider,
  useShopSubscriptionGate,
} from "@/context/shop-subscription-gate-context";
import { getPostAuthRoute } from "@/lib/auth";
import { Redirect, Slot, useSegments, router } from "expo-router";

function isShopOwnerRole(role: string | null | undefined): boolean {
  const r = (role ?? "").toLowerCase().replace(/[-_\s]/g, "");
  return r === "autoshopowner";
}

function ShopSubscriptionPrompt() {
  const { subscribePromptOpen, closeSubscribePrompt } = useShopSubscriptionGate();

  return (
    <ShopSubscriptionRequiredDialog
      open={subscribePromptOpen}
      onSubscribe={() => {
        closeSubscribePrompt();
        router.push("/(shop-owner)/website" as never);
      }}
      onLater={closeSubscribePrompt}
    />
  );
}

function ShopOwnerLayoutInner() {
  const { isBootstrapping, isAuthenticated, meta } = useAuth();
  const segments = useSegments();
  const onBusinessSetup = segments.includes("businessprofile");

  if (isBootstrapping) {
    return <AppSplash />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  // On cold start, token can be restored before role/meta is hydrated.
  // Don't render protected screens until we know which role group to use.
  if (!meta?.role) {
    return <AppSplash />;
  }

  // If the user's role doesn't match this route group, bounce them to the right home.
  const normalizedRole = (meta?.role ?? "").toLowerCase().replace(/[-_\s]/g, "");
  if (normalizedRole && !isShopOwnerRole(meta.role)) {
    return (
      <Redirect
        href={getPostAuthRoute({
          isProfileComplete: meta?.isProfileComplete ?? null,
          isAutoShopBusinessProfileComplete: meta?.isAutoShopBusinessProfileComplete ?? null,
          role: meta?.role ?? null,
        })}
      />
    );
  }

  // Only business profile completion gates shop owners (personal is optional).
  if (meta?.isAutoShopBusinessProfileComplete === false && !onBusinessSetup) {
    return <Redirect href="/(shop-owner)/businessprofile" />;
  }

  return (
    <>
      <Slot />
      <ShopSubscriptionPrompt />
    </>
  );
}

export default function ShopOwnerLayout() {
  return (
    <ShopSubscriptionGateProvider>
      <ShopOwnerLayoutInner />
    </ShopSubscriptionGateProvider>
  );
}
