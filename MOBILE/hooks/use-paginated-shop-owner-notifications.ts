import { getJson } from "@/lib/api";
import {
  parseShopOwnerNotificationsResponse,
  type ShopOwnerNotification,
} from "@/types/shop-owner-notifications";
import { useCallback, useEffect, useRef, useState } from "react";

export const SHOP_OWNER_NOTIFICATIONS_DEFAULT_LIMIT = 20;

function notificationsQueryPath(page: number, limit: number) {
  const q = new URLSearchParams();
  q.set("page", String(page));
  q.set("limit", String(limit));
  return `/api/auto-shop-owner/get-notifications?${q.toString()}`;
}

type State = {
  items: ShopOwnerNotification[];
  page: number;
  totalPages: number | null;
  totalNotifications: number | null;
  perPage: number;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
};

export function usePaginatedShopOwnerNotifications(
  authToken: string | null,
  enabled: boolean,
  limit = SHOP_OWNER_NOTIFICATIONS_DEFAULT_LIMIT
) {
  const [state, setState] = useState<State>({
    items: [],
    page: 1,
    totalPages: null,
    totalNotifications: null,
    perPage: limit,
    loading: false,
    loadingMore: false,
    hasMore: true,
  });

  const requestEpochRef = useRef(0);

  const runFetch = useCallback(
    async (pageNum: number, mode: "replace" | "append"): Promise<ShopOwnerNotification[] | undefined> => {
      if (!authToken || !enabled) return undefined;

      const epoch = ++requestEpochRef.current;
      const path = notificationsQueryPath(pageNum, limit);

      setState((prev) => ({
        ...prev,
        loading: mode === "replace",
        loadingMore: mode === "append",
      }));

      try {
        const res = await getJson<unknown>(path, { authToken });
        if (epoch !== requestEpochRef.current) return undefined;

        const parsed = parseShopOwnerNotificationsResponse(res.data, limit);
        const batch = parsed.items;

        if (mode === "append" && batch.length === 0) {
          setState((prev) => ({ ...prev, loading: false, loadingMore: false, hasMore: false }));
          return [];
        }

        let hasMore: boolean;
        if (parsed.totalPages != null) {
          hasMore = pageNum < parsed.totalPages;
        } else {
          hasMore = batch.length >= parsed.perPage;
        }

        setState((prev) => {
          const nextItems = mode === "append" ? [...prev.items, ...batch] : batch;
          const dedup = new Map<string, ShopOwnerNotification>();
          for (const n of nextItems) {
            dedup.set(n.id, n);
          }
          return {
            items: [...dedup.values()],
            page: pageNum,
            totalPages: parsed.totalPages,
            totalNotifications: parsed.totalNotifications,
            perPage: parsed.perPage,
            loading: false,
            loadingMore: false,
            hasMore,
          };
        });
        return batch;
      } catch {
        if (epoch !== requestEpochRef.current) return undefined;
        setState((prev) => ({ ...prev, loading: false, loadingMore: false }));
        return undefined;
      }
    },
    [authToken, enabled, limit]
  );

  useEffect(() => {
    if (enabled && authToken) return;

    requestEpochRef.current += 1;
    setState({
      items: [],
      page: 1,
      totalPages: null,
      totalNotifications: null,
      perPage: limit,
      loading: false,
      loadingMore: false,
      hasMore: true,
    });
  }, [authToken, enabled, limit]);

  const loadMore = useCallback(() => {
    if (!enabled || !authToken || state.loading || state.loadingMore || !state.hasMore) return;
    void runFetch(state.page + 1, "append");
  }, [authToken, enabled, runFetch, state.hasMore, state.loading, state.loadingMore, state.page]);

  const refresh = useCallback(async () => {
    if (!enabled || !authToken) return [];
    return (await runFetch(1, "replace")) ?? [];
  }, [authToken, enabled, runFetch]);

  return {
    items: state.items,
    totalNotifications: state.totalNotifications,
    loading: state.loading,
    loadingMore: state.loadingMore,
    hasMore: state.hasMore,
    loadMore,
    refresh,
  };
}
