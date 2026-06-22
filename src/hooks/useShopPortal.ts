import { useCallback, useEffect, useState } from "react";
import { getJson } from "../api/mobileAuth";
import { useAuth } from "../auth";

export type ShopDashboardData = {
  success?: boolean;
  businessName?: string;
  businessContactNo?: string;
  subscriptionDaysLeftCount?: number;
  thoughtOfTheDay?: string;
};

export type ShopProfileData = {
  success?: boolean;
  data?: {
    businessProfile?: {
      businessName?: string;
      businessPhone?: string;
      city?: string;
    };
    userProfile?: {
      name?: string;
      phone?: string;
    };
  };
};

export type PartsDealerCard = {
  name: string;
  phone: string;
};

export function useShopOwnerPortal() {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState<ShopDashboardData | null>(null);
  const [profile, setProfile] = useState<ShopProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!token) {
      setDashboard(null);
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [dashRes, profileRes] = await Promise.all([
        getJson<ShopDashboardData>("/api/auto-shop-owner/dashboard-details-new", token),
        getJson<ShopProfileData>("/api/auto-shop-owner/profile", token),
      ]);
      if (dashRes.ok && dashRes.data) setDashboard(dashRes.data);
      if (profileRes.ok && profileRes.data) setProfile(profileRes.data);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const business = profile?.data?.businessProfile;
  const user = profile?.data?.userProfile;

  const displayName =
    dashboard?.businessName?.trim() ||
    business?.businessName?.trim() ||
    user?.name?.trim() ||
    "";

  const city = business?.city?.trim() || "";
  const daysLeft = dashboard?.subscriptionDaysLeftCount;
  const thoughtOfTheDay =
    dashboard?.thoughtOfTheDay?.trim() || "Start each day with a positive thought.";

  return {
    loading,
    refresh,
    displayName,
    city,
    daysLeft,
    thoughtOfTheDay,
    businessPhone: business?.businessPhone || dashboard?.businessContactNo || "",
  };
}

/** Placeholder until a parts-dealer API is available in MOBILE. */
export function usePartsDealers(): { dealers: PartsDealerCard[]; loading: boolean } {
  return {
    loading: false,
    dealers: [],
  };
}
