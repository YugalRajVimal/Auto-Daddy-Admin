import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth";
import { buildMyCustomersQuery, fetchMyCustomers } from "../lib/shopOwnerApi";
import { parseMyCustomers } from "../lib/shopOwnerParsers";
import type { MyCustomer } from "../types/shopOwner";

export { customerKey } from "../context/ShopOwnerDataProvider";

const DEFAULT_PERIOD = { timeFilter: "All" as const, anchorDate: new Date() };

export function useShopCustomers() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<MyCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    if (!token) {
      setCustomers([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetchMyCustomers(token, buildMyCustomersQuery(DEFAULT_PERIOD));
      if (!res.ok) {
        setCustomers([]);
        setError("Could not load customers.");
        return;
      }
      setCustomers(parseMyCustomers(res.data));
    } catch {
      setCustomers([]);
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  const refresh = useCallback(async () => {
    await loadCustomers();
  }, [loadCustomers]);

  return {
    customers,
    loaded: !loading,
    loading,
    error,
    refresh,
  };
}
