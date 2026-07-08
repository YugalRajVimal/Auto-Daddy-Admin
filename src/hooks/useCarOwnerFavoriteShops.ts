import { useCallback, useEffect, useRef, useState } from "react";
import { getJson, postJson } from "../api/mobileAuth";
import { extractFavoriteAutoShopIds } from "../lib/carOwnerAutoShops";
import { useAuth } from "../auth";

type ToggleFavoriteResponse = {
  success?: boolean;
  message?: string;
  isFavorite?: boolean;
  isFavourite?: boolean;
  favorited?: boolean;
};

type ToggleResult = { ok: boolean; isFavorite: boolean; error?: string };

export function useCarOwnerFavoriteShops() {
  const { token } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef<Set<string>>(new Set());
  const refreshSeqRef = useRef(0);

  const fetchFavoriteIdsFromServer = useCallback(async (): Promise<Set<string> | null> => {
    if (!token) return new Set();
    const res = await getJson<unknown>("/api/user/favorite-auto-shops", token);
    if (!res.ok) return null;
    const payload = res.data;
    if (payload && typeof payload === "object" && "success" in payload) {
      const success = (payload as { success?: boolean }).success;
      if (success === false) return null;
    }
    return extractFavoriteAutoShopIds(payload);
  }, [token]);

  const refresh = useCallback(async () => {
    if (!token) {
      setFavoriteIds(new Set());
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const seq = ++refreshSeqRef.current;
    const ids = await fetchFavoriteIdsFromServer();
    if (seq !== refreshSeqRef.current) return;
    if (ids == null) {
      setError("Could not load favorites.");
      setLoading(false);
      return;
    }
    setFavoriteIds(ids);
    setLoading(false);
  }, [fetchFavoriteIdsFromServer, token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isFavorite = useCallback((shopId: string) => favoriteIds.has(shopId), [favoriteIds]);

  const toggleFavorite = useCallback(
    async (shopId: string): Promise<ToggleResult> => {
      const id = shopId.trim();
      if (!id) return { ok: false, isFavorite: false, error: "Missing shop id." };
      if (!token) return { ok: false, isFavorite: favoriteIds.has(id), error: "Not authenticated." };
      if (inFlightRef.current.has(id)) {
        return { ok: false, isFavorite: favoriteIds.has(id), error: "Already updating." };
      }
      inFlightRef.current.add(id);

      const wasFavorite = favoriteIds.has(id);
      const optimistic = !wasFavorite;
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (optimistic) next.add(id);
        else next.delete(id);
        return next;
      });

      const res = await postJson<ToggleFavoriteResponse>("/api/user/toggle-auto-shop-fav", { autoShopId: id }, token);
      inFlightRef.current.delete(id);

      const succeededHttp = res.ok;
      const envelopeOk = res.data == null || res.data.success !== false;
      if (!succeededHttp || !envelopeOk) {
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (wasFavorite) next.add(id);
          else next.delete(id);
          return next;
        });
        return {
          ok: false,
          isFavorite: wasFavorite,
          error: res.data?.message ?? "Could not update favorite.",
        };
      }

      const seq = ++refreshSeqRef.current;
      const refreshed = await fetchFavoriteIdsFromServer();
      const isStale = seq !== refreshSeqRef.current;
      if (!isStale && refreshed != null) {
        setFavoriteIds(refreshed);
        return { ok: true, isFavorite: refreshed.has(id) };
      }

      const serverFlag =
        typeof res.data?.isFavorite === "boolean"
          ? res.data.isFavorite
          : typeof res.data?.isFavourite === "boolean"
            ? res.data.isFavourite
            : typeof res.data?.favorited === "boolean"
              ? res.data.favorited
              : optimistic;
      if (!isStale && serverFlag !== optimistic) {
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (serverFlag) next.add(id);
          else next.delete(id);
          return next;
        });
      }
      return { ok: true, isFavorite: serverFlag };
    },
    [favoriteIds, fetchFavoriteIdsFromServer, token]
  );

  return { favoriteIds, isFavorite, loading, error, refresh, toggleFavorite };
}
