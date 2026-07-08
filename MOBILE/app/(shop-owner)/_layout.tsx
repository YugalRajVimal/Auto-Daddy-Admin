import { AppSplash } from "@/components/reusables";
import { useAuth } from "@/context/auth-provider";
import { getPostAuthRoute } from "@/lib/auth";
import { Redirect, Slot } from "expo-router";

export default function ShopOwnerLayout() {
  const { isBootstrapping, isAuthenticated, meta } = useAuth();

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
  if (normalizedRole && normalizedRole !== "autoshopowner") {
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

  // Allow nested screens (tabs + stacks) to render.
  return <Slot />;
}

