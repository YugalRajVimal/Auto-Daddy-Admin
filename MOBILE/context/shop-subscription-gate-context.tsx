import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getDashboardDetails } from "@/lib/auth";
import {
  resolveHasActiveSubscription,
  resolveSubscriptionDaysLeft,
} from "@/lib/shop-subscription-access";
import type { DashboardDetailsResponse } from "@/types/dashboard-details";

type ShopSubscriptionGateContextValue = {
  subscriptionLocked: boolean;
  subscriptionGateReady: boolean;
  daysLeft: number | undefined;
  promptSubscribe: () => void;
  /** Returns true when the action may proceed; otherwise opens the subscribe dialog. */
  requireSubscription: () => boolean;
  subscribePromptOpen: boolean;
  closeSubscribePrompt: () => void;
  /** Refresh days-left from dashboard cache (call after home/subscription loads). */
  setDaysLeftFromApi: (daysLeft: number | null | undefined) => void;
  refreshDaysLeftFromCache: () => Promise<void>;
};

const ShopSubscriptionGateContext = createContext<ShopSubscriptionGateContextValue | null>(null);

export function ShopSubscriptionGateProvider({ children }: { children: ReactNode }) {
  const [apiDaysLeft, setApiDaysLeft] = useState<number | null | undefined>(undefined);
  const [gateReady, setGateReady] = useState(false);
  const [subscribePromptOpen, setSubscribePromptOpen] = useState(false);

  const refreshDaysLeftFromCache = useCallback(async () => {
    const cached = await getDashboardDetails<DashboardDetailsResponse>();
    const n = cached?.subscriptionDaysLeftCount;
    setApiDaysLeft(typeof n === "number" ? n : 0);
    setGateReady(true);
  }, []);

  useEffect(() => {
    void refreshDaysLeftFromCache();
  }, [refreshDaysLeftFromCache]);

  const setDaysLeftFromApi = useCallback((daysLeft: number | null | undefined) => {
    setApiDaysLeft(daysLeft);
    setGateReady(true);
  }, []);

  const hasActive = resolveHasActiveSubscription(apiDaysLeft);
  const subscriptionLocked = gateReady && !hasActive;
  const daysLeft = resolveSubscriptionDaysLeft(apiDaysLeft);

  const promptSubscribe = useCallback(() => {
    setSubscribePromptOpen(true);
  }, []);

  const closeSubscribePrompt = useCallback(() => {
    setSubscribePromptOpen(false);
  }, []);

  const requireSubscription = useCallback(() => {
    if (!subscriptionLocked) return true;
    setSubscribePromptOpen(true);
    return false;
  }, [subscriptionLocked]);

  const value = useMemo(
    () => ({
      subscriptionLocked,
      subscriptionGateReady: gateReady,
      daysLeft,
      promptSubscribe,
      requireSubscription,
      subscribePromptOpen,
      closeSubscribePrompt,
      setDaysLeftFromApi,
      refreshDaysLeftFromCache,
    }),
    [
      subscriptionLocked,
      gateReady,
      daysLeft,
      promptSubscribe,
      requireSubscription,
      subscribePromptOpen,
      closeSubscribePrompt,
      setDaysLeftFromApi,
      refreshDaysLeftFromCache,
    ]
  );

  return (
    <ShopSubscriptionGateContext.Provider value={value}>{children}</ShopSubscriptionGateContext.Provider>
  );
}

export function useShopSubscriptionGate() {
  const ctx = useContext(ShopSubscriptionGateContext);
  if (!ctx) {
    throw new Error("useShopSubscriptionGate must be used within ShopSubscriptionGateProvider");
  }
  return ctx;
}

/** Safe for screens that may render outside the shop-owner tree. */
export function useShopSubscriptionGateOptional() {
  return useContext(ShopSubscriptionGateContext);
}
