import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth";
import { fetchMyServices } from "../lib/shopOwnerApi";
import { parseMyServices } from "../lib/shopOwnerParsers";
import type { ShopServiceCategory } from "../types/shopOwner";

export function useShopServices() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<ShopServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) {
      setCategories([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMyServices(token);
      if (!res.ok) {
        setError("Could not load services.");
        setCategories([]);
        return;
      }
      setCategories(parseMyServices(res.data));
    } catch {
      setError("Network error.");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { categories, loading, error, refresh };
}
