import { getJson } from "@/lib/api";
import { parseCitiesApiResponse, type UserCity } from "@/types/user-cities";
import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_PER_PAGE = 100;

function userCitiesQueryPath(page: number, search: string) {
  const q = new URLSearchParams();
  q.set("page", String(page));
  const s = search.trim();
  if (s) q.set("search", s);
  return `/api/user/cities?${q.toString()}`;
}

function autoShopOwnerCitiesQueryPath(page: number, search: string) {
  const q = new URLSearchParams();
  q.set("page", String(page));
  const s = search.trim();
  if (s) q.set("search", s);
  return `/api/auto-shop-owner/cities?${q.toString()}`;
}

type State = {
  items: UserCity[];
  page: number;
  totalPages: number | null;
  perPage: number;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
};

function usePaginatedCities(
  authToken: string | null,
  enabled: boolean,
  debouncedSearch: string,
  pathFor: (page: number, search: string) => string
) {
  const [state, setState] = useState<State>({
    items: [],
    page: 1,
    totalPages: null,
    perPage: DEFAULT_PER_PAGE,
    loading: false,
    loadingMore: false,
    hasMore: true,
  });

  const requestEpochRef = useRef(0);

  const runFetch = useCallback(
    async (pageNum: number, mode: "replace" | "append") => {
      if (!authToken || !enabled) return;

      const epoch = ++requestEpochRef.current;
      const path = pathFor(pageNum, debouncedSearch);

      setState((prev) => ({
        ...prev,
        loading: mode === "replace",
        loadingMore: mode === "append",
      }));

      try {
        const res = await getJson<unknown>(path, { authToken: authToken });
        if (epoch !== requestEpochRef.current) return;

        const parsed = parseCitiesApiResponse(res.data);
        const batch = parsed.items;

        if (mode === "append" && batch.length === 0) {
          setState((prev) => ({ ...prev, loading: false, loadingMore: false, hasMore: false }));
          return;
        }

        let hasMore: boolean;
        if (parsed.totalPages != null) {
          hasMore = pageNum < parsed.totalPages;
        } else {
          hasMore = batch.length >= parsed.perPage;
        }

        setState((prev) => {
          const nextItems = mode === "append" ? [...prev.items, ...batch] : batch;
          const dedup = new Map<string, UserCity>();
          for (const c of nextItems) {
            dedup.set(c.id, c);
          }
          return {
            items: [...dedup.values()],
            page: pageNum,
            totalPages: parsed.totalPages,
            perPage: parsed.perPage,
            loading: false,
            loadingMore: false,
            hasMore,
          };
        });
      } catch {
        if (epoch !== requestEpochRef.current) return;
        setState((prev) => ({ ...prev, loading: false, loadingMore: false }));
      }
    },
    [authToken, debouncedSearch, enabled, pathFor]
  );

  useEffect(() => {
    if (!enabled || !authToken) {
      requestEpochRef.current += 1;
      setState({
        items: [],
        page: 1,
        totalPages: null,
        perPage: DEFAULT_PER_PAGE,
        loading: false,
        loadingMore: false,
        hasMore: true,
      });
      return;
    }

    void runFetch(1, "replace");
  }, [authToken, debouncedSearch, enabled, runFetch]);

  const loadMore = useCallback(() => {
    if (!enabled || !authToken || state.loading || state.loadingMore || !state.hasMore) return;
    void runFetch(state.page + 1, "append");
  }, [authToken, enabled, runFetch, state.hasMore, state.loading, state.loadingMore, state.page]);

  return {
    items: state.items,
    loading: state.loading,
    loadingMore: state.loadingMore,
    hasMore: state.hasMore,
    loadMore,
  };
}

export function usePaginatedUserCities(authToken: string | null, enabled: boolean, debouncedSearch: string) {
  return usePaginatedCities(authToken, enabled, debouncedSearch, userCitiesQueryPath);
}

export function usePaginatedAutoShopOwnerCities(authToken: string | null, enabled: boolean, debouncedSearch: string) {
  return usePaginatedCities(authToken, enabled, debouncedSearch, autoShopOwnerCitiesQueryPath);
}
