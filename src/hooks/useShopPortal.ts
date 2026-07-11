import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth";
import { extractThoughtOfTheDay, type ThoughtOfTheDayView } from "../lib/extractThought";
import { updateBusinessActiveStatus } from "../lib/shopOwnerApi";
import { useShopOwnerData } from "../context/ShopOwnerDataProvider";
import type { DashboardIncomeOverview } from "../types/shopOwner";

export type ShopContentBlock = {
  heading?: string;
  desc?: string;
};

export type ShopThoughtOfTheDayApi =
  | string
  | {
      subject?: string;
      notes?: string;
      text?: string;
      quote?: string;
      thought?: string;
    };

export type ShopDashboardData = {
  success?: boolean;
  businessName?: string;
  businessContactNo?: string;
  subscriptionDaysLeftCount?: number;
  thoughtOfTheDay?: ShopThoughtOfTheDayApi;
  incomeOverview?: DashboardIncomeOverview;
  idBusinessActive?: boolean;
  FAQs?: ShopContentBlock;
};

const DEFAULT_THOUGHT: ThoughtOfTheDayView = {
  title: "",
  description: "Start each day with a positive thought.",
};

export function useShopOwnerPortal() {
  const { token } = useAuth();
  const { sections, loadSection, refreshSection } = useShopOwnerData();
  const [updatingActive, setUpdatingActive] = useState(false);

  const portal = sections.portal;
  const dashboard = portal.data?.dashboard ?? null;
  const profile = portal.data?.profile ?? null;
  const loading = portal.loading && !portal.loaded;

  useEffect(() => {
    void loadSection("portal");
  }, [loadSection]);

  const refresh = useCallback(async () => {
    await refreshSection("portal");
  }, [refreshSection]);

  const business = profile?.data?.businessProfile;
  const user = profile?.data?.userProfile;
  const teamMembers = profile?.data?.teamMembers ?? [];

  const displayName =
    dashboard?.businessName?.trim() ||
    business?.businessName?.trim() ||
    "";

  const businessNameLoaded = !loading;

  const city = business?.city?.trim() || "";
  const daysLeft = dashboard?.subscriptionDaysLeftCount;
  const thoughtOfTheDay =
    extractThoughtOfTheDay(dashboard?.thoughtOfTheDay) ?? DEFAULT_THOUGHT;
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
    [refresh, token, updatingActive],
  );

  return {
    loading,
    businessNameLoaded,
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
