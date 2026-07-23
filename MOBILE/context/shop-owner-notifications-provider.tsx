import { useAuth } from "@/context/auth-provider";
import {
  isAutoShopOwnerRole,
  loadShopOwnerHasUnread,
  markShopOwnerNotificationReceived,
  markShopOwnerNotificationsRead,
  subscribeShopOwnerNotificationBadge,
  syncShopOwnerUnreadFromApi,
} from "@/lib/shop-owner-notification-read-state";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type ShopOwnerNotificationsContextType = {
  hasUnread: boolean;
  markReceived: () => Promise<void>;
  markRead: (latestNotificationTime: string) => Promise<void>;
  syncUnreadFromApi: () => Promise<void>;
  refreshBadge: () => Promise<void>;
};

const ShopOwnerNotificationsContext = createContext<ShopOwnerNotificationsContextType | null>(null);

export function ShopOwnerNotificationsProvider({ children }: { children: React.ReactNode }) {
  const { token, meta } = useAuth();
  const isShopOwner = isAutoShopOwnerRole(meta?.role ?? null);
  const [hasUnread, setHasUnread] = useState(false);

  const refreshBadge = useCallback(async () => {
    if (!isShopOwner) {
      setHasUnread(false);
      return;
    }
    setHasUnread(await loadShopOwnerHasUnread());
  }, [isShopOwner]);

  useEffect(() => {
    void refreshBadge();
    return subscribeShopOwnerNotificationBadge(() => {
      void refreshBadge();
    });
  }, [refreshBadge]);

  const markReceived = useCallback(async () => {
    await markShopOwnerNotificationReceived();
    await refreshBadge();
  }, [refreshBadge]);

  const markRead = useCallback(
    async (latestNotificationTime: string) => {
      await markShopOwnerNotificationsRead(latestNotificationTime);
      await refreshBadge();
    },
    [refreshBadge]
  );

  const syncUnreadFromApi = useCallback(async () => {
    if (!isShopOwner || !token) return;
    try {
      await syncShopOwnerUnreadFromApi(token);
      await refreshBadge();
    } catch {
      // Network / storage blips should not surface as uncaught rejections.
    }
  }, [isShopOwner, refreshBadge, token]);

  const value = useMemo(
    () => ({
      hasUnread,
      markReceived,
      markRead,
      syncUnreadFromApi,
      refreshBadge,
    }),
    [hasUnread, markRead, markReceived, refreshBadge, syncUnreadFromApi]
  );

  return (
    <ShopOwnerNotificationsContext.Provider value={value}>
      {children}
    </ShopOwnerNotificationsContext.Provider>
  );
}

export function useShopOwnerNotifications() {
  const ctx = useContext(ShopOwnerNotificationsContext);
  if (!ctx) {
    throw new Error("useShopOwnerNotifications must be used within ShopOwnerNotificationsProvider");
  }
  return ctx;
}
