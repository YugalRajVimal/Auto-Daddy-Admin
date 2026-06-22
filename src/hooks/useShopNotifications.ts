import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth";
import { fetchShopNotifications } from "../lib/shopOwnerApi";
import { parseShopOwnerNotifications } from "../lib/shopOwnerParsers";
import type { ShopOwnerNotification } from "../types/shopOwner";

const PAGE_LIMIT = 20;

export function useShopNotifications() {
  const { token } = useAuth();
  const [items, setItems] = useState<ShopOwnerNotification[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (pageNum: number, mode: "replace" | "append") => {
      if (!token) {
        setItems([]);
        setLoading(false);
        return;
      }
      if (mode === "replace") setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const res = await fetchShopNotifications(token, pageNum, PAGE_LIMIT);
        if (!res.ok) {
          setError("Could not load notifications.");
          if (mode === "replace") setItems([]);
          return;
        }
        const parsed = parseShopOwnerNotifications(res.data, PAGE_LIMIT);
        setPage(pageNum);
        setHasMore(parsed.hasMore);
        setItems((prev) => {
          if (mode === "append") {
            const map = new Map<string, ShopOwnerNotification>();
            for (const n of [...prev, ...parsed.items]) map.set(n.id, n);
            return [...map.values()];
          }
          return parsed.items;
        });
      } catch {
        setError("Network error.");
        if (mode === "replace") setItems([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [token]
  );

  useEffect(() => {
    void fetchPage(1, "replace");
  }, [fetchPage]);

  const refresh = useCallback(() => fetchPage(1, "replace"), [fetchPage]);
  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) void fetchPage(page + 1, "append");
  }, [fetchPage, hasMore, loading, loadingMore, page]);

  return { items, loading, loadingMore, hasMore, error, refresh, loadMore };
}
