import { useCallback, useEffect, useState } from "react";
import { getJson } from "../api/mobileAuth";
import { useAuth } from "../auth";
import {
  parseCarOwnerNotificationsResponse,
  type CarOwnerNotification,
} from "../types/carOwnerNotifications";

const DEFAULT_LIMIT = 20;

function notificationsPath(page: number, limit: number): string {
  const q = new URLSearchParams();
  q.set("page", String(page));
  q.set("limit", String(limit));
  return `/api/user/get-notifications?${q.toString()}`;
}

export function useCarOwnerNotifications() {
  const { token } = useAuth();
  const [items, setItems] = useState<CarOwnerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalNotifications, setTotalNotifications] = useState<number | null>(null);

  const applyPage = useCallback((parsed: ReturnType<typeof parseCarOwnerNotificationsResponse>, pageNum: number) => {
    setItems((prev) => {
      const merged = pageNum === 1 ? parsed.items : [...prev, ...parsed.items];
      const dedup = new Map<string, CarOwnerNotification>();
      for (const n of merged) dedup.set(n.id, n);
      return [...dedup.values()];
    });
    setPage(pageNum);
    setTotalNotifications(parsed.totalNotifications);

    if (parsed.totalPages != null) {
      setHasMore(pageNum < parsed.totalPages);
    } else {
      setHasMore(parsed.items.length >= parsed.perPage);
    }
  }, []);

  const load = useCallback(
    async (pageNum = 1, mode: "replace" | "append" = "replace") => {
      if (!token) {
        setItems([]);
        setLoading(false);
        setLoadingMore(false);
        setError(null);
        setHasMore(false);
        return;
      }

      if (mode === "replace") {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const res = await getJson<unknown>(notificationsPath(pageNum, DEFAULT_LIMIT), token);
      if (!res.ok) {
        if (mode === "replace") {
          setItems([]);
          setError("Could not load notifications.");
        }
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      const parsed = parseCarOwnerNotificationsResponse(res.data, DEFAULT_LIMIT);
      applyPage(parsed, pageNum);
      setLoading(false);
      setLoadingMore(false);
      setError(null);
    },
    [applyPage, token]
  );

  useEffect(() => {
    void load(1, "replace");
  }, [load]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    void load(page + 1, "append");
  }, [hasMore, load, loading, loadingMore, page]);

  const refresh = useCallback(() => load(1, "replace"), [load]);

  return {
    items,
    loading,
    loadingMore,
    error,
    hasMore,
    totalNotifications,
    loadMore,
    refresh,
  };
}
