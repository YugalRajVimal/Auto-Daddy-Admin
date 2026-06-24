import { useCallback, useEffect, useState } from "react";
import { getJson } from "../api/mobileAuth";
import { useAuth } from "../auth";
import { extractThought } from "../lib/extractThought";
import { updateBusinessActiveStatus } from "../lib/shopOwnerApi";
import type { DashboardIncomeOverview, ShopProfileResponse } from "../types/shopOwner";

export type ShopContentBlock = {
  heading?: string;
  desc?: string;
};

export type ShopDashboardData = {
  success?: boolean;
  businessName?: string;
  businessContactNo?: string;
  subscriptionDaysLeftCount?: number;
  thoughtOfTheDay?: string | { text?: string; quote?: string; thought?: string };
  incomeOverview?: DashboardIncomeOverview;
  idBusinessActive?: boolean;
  FAQs?: ShopContentBlock;
};

export function useShopOwnerPortal() {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState<ShopDashboardData | null>(null);
  const [profile, setProfile] = useState<ShopProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingActive, setUpdatingActive] = useState(false);

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
        getJson<ShopProfileResponse>("/api/auto-shop-owner/profile", token),
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
  const teamMembers = profile?.data?.teamMembers ?? [];

  const displayName =
    dashboard?.businessName?.trim() ||
    business?.businessName?.trim() ||
    user?.name?.trim() ||
    "";

  const city = business?.city?.trim() || "";
  const daysLeft = dashboard?.subscriptionDaysLeftCount;
  const thoughtOfTheDay =
    extractThought(dashboard?.thoughtOfTheDay) ||
    "Start each day with a positive thought.";
  const faqsHeading = dashboard?.FAQs?.heading?.trim() || "FAQs";
  const faqsDescription = dashboard?.FAQs?.desc?.trim() || "";
  const incomeOverview = dashboard?.incomeOverview ?? null;

  const isBusinessActive =
    typeof business?.isBusinessActive === "boolean"
      ? business.isBusinessActive
      : typeof dashboard?.idBusinessActive === "boolean"
        ? dashboard.idBusinessActive
        : null;

  const setBusinessActive = useCallback(
    async (next: boolean) => {
      if (!token || updatingActive) return false;
      setUpdatingActive(true);
      try {
        const res = await updateBusinessActiveStatus(token, next);
        if (!res.ok) return false;
        await refresh();
        return true;
      } catch {
        return false;
      } finally {
        setUpdatingActive(false);
      }
    },
    [refresh, token, updatingActive]
  );

  return {
    loading,
    refresh,
    displayName,
    city,
    daysLeft,
    thoughtOfTheDay,
    businessPhone: business?.businessPhone || dashboard?.businessContactNo || "",
    faqsHeading,
    faqsDescription,
    incomeOverview,
    isBusinessActive,
    updatingActive,
    setBusinessActive,
    business,
    user,
    teamMembers,
    subscriptions: profile?.data?.subscriptions ?? [],
  };
}
