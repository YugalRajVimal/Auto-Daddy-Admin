import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth";
import {
  fetchAutoshopJobCards,
  fetchAutoshopPendingApprovalJobCards,
  type AutoshopJobCardStatus,
} from "../lib/autoshopownerJobCardsApi";
import { parseJobCardsFromPagePayload, type JobCardListRow } from "../lib/shopOwnerJobCards";

export type AutoshopJobCardSection = "my-list" | "approvals" | "convert-invoice" | "paid";

function statusForSection(section: AutoshopJobCardSection): AutoshopJobCardStatus | undefined {
  if (section === "convert-invoice") return "convertedToInvoice";
  if (section === "paid") return "CashPaid";
  return undefined;
}

export function useAutoshopJobCards(section: AutoshopJobCardSection, search = "") {
  const { token } = useAuth();
  const q = search.trim();
  const [cards, setCards] = useState<JobCardListRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setCards([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let res;
      if (section === "approvals") {
        res = await fetchAutoshopPendingApprovalJobCards(token);
      } else {
        const status = statusForSection(section);
        res = await fetchAutoshopJobCards(token, {
          search: section === "my-list" && q ? q : undefined,
          status,
        });
      }

      if (!res.ok) {
        setError("Could not load job cards.");
        setCards([]);
        return;
      }

      setCards(parseJobCardsFromPagePayload(res.data));
    } catch {
      setError("Network error.");
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [section, q, token]);

  useEffect(() => {
    if (section === "my-list" && q) {
      const timer = setTimeout(() => void load(), 300);
      return () => clearTimeout(timer);
    }
    void load();
  }, [load, q, section]);

  return {
    cards,
    loading,
    error,
    refresh: load,
  };
}

export type { JobCardListRow };
