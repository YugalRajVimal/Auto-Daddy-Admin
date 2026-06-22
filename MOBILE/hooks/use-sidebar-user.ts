import { useAuth } from "@/context/auth-provider";
import { getAutoShopOwnerProfile, getCarOwnerDashboardDetails, getDashboardDetails } from "@/lib/auth";
import { formatStoredNationalPhone } from "@/lib/dial-countries";
import { normalizeMediaUrl } from "@/lib/normalize-media-url";
import type { AutoShopOwnerProfileResponse } from "@/types/auto-shop-owner-profile";
import type { CarOwnerDashboardApiResponse } from "@/types/car-owner-dashboard";
import type { DashboardDetailsResponse } from "@/types/dashboard-details";
import { useCallback, useEffect, useMemo, useState } from "react";

type SidebarUser = {
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  countryCode?: string;
  userPhotoUri?: string | null;
  businessLogoUri?: string | null;
};

function isCarOwnerRole(role: string | null | undefined): boolean {
  const r = (role ?? "").toLowerCase().replace(/[-_\s]/g, "");
  return r === "carowner";
}

export function useSidebarUser() {
  const { meta, token, sessionRevision } = useAuth();
  const [profileData, setProfileData] = useState<AutoShopOwnerProfileResponse["data"] | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardDetailsResponse | null>(null);
  const [carOwnerDashboard, setCarOwnerDashboard] = useState<CarOwnerDashboardApiResponse | null>(null);

  useEffect(() => {
    if (meta && token) {
      return;
    }
    // Logout can happen while the drawer stays mounted; clear stale user info.
    setProfileData(null);
    setDashboardData(null);
    setCarOwnerDashboard(null);
  }, [meta, token]);

  const refresh = useCallback(async () => {
    if (!token) {
      return;
    }
    if (isCarOwnerRole(meta?.role)) {
      const savedCarOwner = await getCarOwnerDashboardDetails<CarOwnerDashboardApiResponse>();
      setCarOwnerDashboard(savedCarOwner);
      setProfileData(null);
      setDashboardData(null);
      return;
    }

    const [savedProfile, savedDashboard] = await Promise.all([
      getAutoShopOwnerProfile<AutoShopOwnerProfileResponse>(),
      getDashboardDetails<DashboardDetailsResponse>(),
    ]);
    setProfileData(savedProfile?.data ?? null);
    setDashboardData(savedDashboard);
    setCarOwnerDashboard(null);
  }, [token]);

  // Drawer content is not a focused screen, so load on mount and whenever auth role changes.
  useEffect(() => {
    void refresh();
  }, [refresh, meta?.role, sessionRevision]);

  const user = useMemo<SidebarUser>(() => {
    const formatOrPlaceholder = (raw: string | null | undefined, placeholder: string) => {
      const formatted = formatStoredNationalPhone(raw ?? "");
      return formatted || placeholder;
    };
    if (isCarOwnerRole(meta?.role)) {
      const up = carOwnerDashboard?.userProfile;
      const photo = normalizeMediaUrl(up?.profilePhoto ?? meta?.profilePhoto ?? null);
      return {
        userName: up?.name ?? meta?.name ?? "User Name",
        // Car-owner dashboard doesn't include countryCode in its type; default to +91.
        countryCode: "+91",
        userPhone: formatOrPlaceholder(up?.phone, "XXXXXXXXXX"),
        userEmail: up?.email ?? "abc@gmail.com",
        userPhotoUri: photo,
        businessLogoUri: null,
      };
    }

    const dashboardUser = dashboardData?.businessUserDetails;
    const profileUser = profileData?.userProfile;
    const profileBusiness = profileData?.businessProfile;
    return {
      userName: dashboardUser?.name ?? profileUser?.name ?? meta?.name ?? "User Name",
      userPhone: formatOrPlaceholder(dashboardUser?.phone ?? profileUser?.phone, "XXXXXXXXXX"),
      userEmail: dashboardUser?.email ?? profileUser?.email ?? "abc@gmail.com",
      countryCode: dashboardUser?.countryCode ?? profileUser?.countryCode ?? "+91",
      userPhotoUri: normalizeMediaUrl(meta?.profilePhoto ?? null),
      businessLogoUri: normalizeMediaUrl(profileBusiness?.businessLogo ?? null),
    };
  }, [carOwnerDashboard?.userProfile, dashboardData, meta?.name, meta?.profilePhoto, meta?.role, profileData]);

  return { ...user, refresh };
}
