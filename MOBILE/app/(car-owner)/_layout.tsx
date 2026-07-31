import { AppSplash } from "@/components/reusables";
import { useAuth } from "@/context/auth-provider";
import { OwnerShopCityFilterProvider } from "@/context/owner-shop-city-filter-context";
import { getPostAuthRoute } from "@/lib/auth";
import { Redirect, Slot, useSegments } from "expo-router";

function isCarOwnerRole(role: string | null | undefined): boolean {
  const r = (role ?? "").toLowerCase().replace(/[-_\s]/g, "");
  return r === "carowner";
}

export default function CarOwnerLayout() {
  const { isBootstrapping, isAuthenticated, meta } = useAuth();
  const segments = useSegments();
  const onOnboarding = segments.includes("onboarding");

  if (isBootstrapping) {
    return <AppSplash />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!meta?.role) {
    return <AppSplash />;
  }

  if (meta?.role && !isCarOwnerRole(meta.role)) {
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

  // Match web OwnerPanelLayout: force first-time profile setup when known incomplete.
  if (meta?.isProfileComplete === false && !onOnboarding) {
    return <Redirect href="/(car-owner)/onboarding" />;
  }

  if (meta?.isProfileComplete === true && onOnboarding) {
    return <Redirect href="/(car-owner)/(tabs)/home" />;
  }

  return (
    <OwnerShopCityFilterProvider>
      <Slot />
    </OwnerShopCityFilterProvider>
  );
}
