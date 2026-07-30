import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ShopSubscriptionGateContextValue = {
  subscriptionLocked: boolean;
  promptSubscribe: () => void;
  /** Returns true when the action may proceed; otherwise opens the subscribe dialog. */
  requireSubscription: () => boolean;
  subscribePromptOpen: boolean;
  closeSubscribePrompt: () => void;
};

const ShopSubscriptionGateContext =
  createContext<ShopSubscriptionGateContextValue | null>(null);

export function ShopSubscriptionGateProvider({
  subscriptionLocked,
  children,
}: {
  subscriptionLocked: boolean;
  children: ReactNode;
}) {
  const [subscribePromptOpen, setSubscribePromptOpen] = useState(false);

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
      promptSubscribe,
      requireSubscription,
      subscribePromptOpen,
      closeSubscribePrompt,
    }),
    [
      subscriptionLocked,
      promptSubscribe,
      requireSubscription,
      subscribePromptOpen,
      closeSubscribePrompt,
    ],
  );

  return (
    <ShopSubscriptionGateContext.Provider value={value}>
      {children}
    </ShopSubscriptionGateContext.Provider>
  );
}

export function useShopSubscriptionGate() {
  const ctx = useContext(ShopSubscriptionGateContext);
  if (!ctx) {
    throw new Error("useShopSubscriptionGate must be used within ShopSubscriptionGateProvider");
  }
  return ctx;
}
