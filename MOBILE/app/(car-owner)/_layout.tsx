import { AppSplash } from "@/components/reusables";
import { useAuth } from "@/context/auth-provider";
import { getPostAuthRoute } from "@/lib/auth";
import { Redirect, Slot } from "expo-router";

function isCarOwnerRole(role: string | null | undefined): boolean {
  const r = (role ?? "").toLowerCase().replace(/[-_\s]/g, "");
  return r === "carowner";
}

export default function CarOwnerLayout() {
  const { isBootstrapping, isAuthenticated, meta } = useAuth();

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

  return <Slot />;
}

