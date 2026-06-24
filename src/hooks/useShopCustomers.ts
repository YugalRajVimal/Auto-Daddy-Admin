import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth";
import { buildMyCustomersQuery, fetchMyCustomers, type MyCustomersPeriod } from "../lib/shopOwnerApi";
import { customerKey, parseMyCustomers } from "../lib/shopOwnerParsers";
import type { MyCustomer } from "../types/shopOwner";

const DEFAULT_PERIOD: MyCustomersPeriod = { timeFilter: "All", anchorDate: new Date() };

export function useShopCustomers() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<MyCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) {
      setCustomers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMyCustomers(token, buildMyCustomersQuery(DEFAULT_PERIOD));
      if (!res.ok) {
        setError("Could not load customers.");
        setCustomers([]);
        return;
      }
      setCustomers(parseMyCustomers(res.data));
    } catch {
      setError("Network error.");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { customers, loading, error, refresh, customerKey };
}
