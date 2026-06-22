import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth";
import {
  buildMyCustomersQuery,
  fetchMyCustomers,
  searchCarOwners,
  type MyCustomersPeriod,
} from "../lib/shopOwnerApi";
import { customerKey, parseMyCustomers } from "../lib/shopOwnerParsers";
import type { MyCustomer } from "../types/shopOwner";

const DEFAULT_PERIOD: MyCustomersPeriod = { timeFilter: "All", anchorDate: new Date() };

export function useShopCustomers(search?: string) {
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
    const q = (search ?? "").trim();
    setLoading(true);
    setError(null);
    try {
      if (q) {
        const res = await searchCarOwners(token, q);
        if (!res.ok) {
          setError("Could not search customers.");
          setCustomers([]);
          return;
        }
        setCustomers(parseMyCustomers(res.data));
        return;
      }
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
  }, [token, search]);

  useEffect(() => {
    const t = setTimeout(() => void refresh(), search?.trim() ? 300 : 0);
    return () => clearTimeout(t);
  }, [refresh, search]);

  return { customers, loading, error, refresh, customerKey };
}
