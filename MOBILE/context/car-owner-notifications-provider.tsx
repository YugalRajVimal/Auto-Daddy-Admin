import { useAuth } from "@/context/auth-provider";
import {
  isCarOwnerRole,
  loadCarOwnerHasUnread,
  markCarOwnerNotificationReceived,
  markCarOwnerNotificationsRead,
  subscribeCarOwnerNotificationBadge,
  syncCarOwnerUnreadFromApi,
} from "@/lib/car-owner-notification-read-state";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type CarOwnerNotificationsContextType = {
  hasUnread: boolean;
  markReceived: () => Promise<void>;
  markRead: (latestNotificationTime: string) => Promise<void>;
  syncUnreadFromApi: () => Promise<void>;
  refreshBadge: () => Promise<void>;
};

const CarOwnerNotificationsContext = createContext<CarOwnerNotificationsContextType | null>(null);

export function CarOwnerNotificationsProvider({ children }: { children: React.ReactNode }) {
  const { token, meta } = useAuth();
  const isCarOwner = isCarOwnerRole(meta?.role ?? null);
  const [hasUnread, setHasUnread] = useState(false);

  const refreshBadge = useCallback(async () => {
    if (!isCarOwner) {
      setHasUnread(false);
      return;
    }
    setHasUnread(await loadCarOwnerHasUnread());
  }, [isCarOwner]);

  useEffect(() => {
    void refreshBadge();
    return subscribeCarOwnerNotificationBadge(() => {
      void refreshBadge();
    });
  }, [refreshBadge]);

  const markReceived = useCallback(async () => {
    await markCarOwnerNotificationReceived();
    await refreshBadge();
  }, [refreshBadge]);

  const markRead = useCallback(
    async (latestNotificationTime: string) => {
      await markCarOwnerNotificationsRead(latestNotificationTime);
      await refreshBadge();
    },
    [refreshBadge]
  );

  const syncUnreadFromApi = useCallback(async () => {
    if (!isCarOwner || !token) return;
    try {
      await syncCarOwnerUnreadFromApi(token);
      await refreshBadge();
    } catch {
      // Network / storage blips should not surface as uncaught rejections.
    }
  }, [isCarOwner, refreshBadge, token]);

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
    <CarOwnerNotificationsContext.Provider value={value}>
      {children}
    </CarOwnerNotificationsContext.Provider>
  );
}

export function useCarOwnerNotifications() {
  const ctx = useContext(CarOwnerNotificationsContext);
  if (!ctx) {
    throw new Error("useCarOwnerNotifications must be used within CarOwnerNotificationsProvider");
  }
  return ctx;
}
