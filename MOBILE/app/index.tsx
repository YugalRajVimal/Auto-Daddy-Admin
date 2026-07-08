import { AppSplash } from "@/components/reusables";
import { useAuth } from "@/context/auth-provider";
import { getPostAuthRoute } from "@/lib/auth";
import { Redirect } from "expo-router";

export default function Index() {
  const { isBootstrapping, isAuthenticated, meta } = useAuth();

  if (isBootstrapping) {
    return <AppSplash />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  // On cold start we may have a token but meta is still being enriched (role can be null briefly).
  // Avoid defaulting to the wrong role group during that window.
  if (!meta?.role) {
    return <AppSplash />;
  }

  return (
    <Redirect
      href={
        getPostAuthRoute({
          isProfileComplete: meta?.isProfileComplete ?? null,
          isAutoShopBusinessProfileComplete: meta?.isAutoShopBusinessProfileComplete ?? null,
          role: meta?.role ?? null,
        })
      }
    />
  );
}
