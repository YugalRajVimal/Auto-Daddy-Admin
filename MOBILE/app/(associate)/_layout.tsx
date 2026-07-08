import { AppSplash } from "@/components/reusables";
import { useAuth } from "@/context/auth-provider";
import { isAssociateRole } from "@/lib/associate-roles";
import { Redirect, Slot } from "expo-router";

export default function AssociateLayout() {
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

  // Only the dev "associate" session should land in this group.
  if (meta?.role && !isAssociateRole(meta.role)) {
    return <Redirect href="/" />;
  }

  return <Slot />;
}

