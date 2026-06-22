import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth";
import { fetchPayments } from "../lib/shopOwnerApi";
import { parsePayments } from "../lib/shopOwnerParsers";

export function useShopPayments() {
  const { token } = useAuth();
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPayments(token);
      if (!res.ok) {
        setError("Could not load reports.");
        setRows([]);
        return;
      }
      setRows(parsePayments(res.data));
    } catch {
      setError("Network error.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { rows, loading, error, refresh };
}
