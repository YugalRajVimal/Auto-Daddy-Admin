import { useCallback, useEffect, useState } from "react";
import { getJson, postJson } from "../api/mobileAuth";
import { useAuth } from "../auth";
import { extractThoughtOfTheDay, type ThoughtOfTheDayView } from "../lib/extractThought";
import {
  parseServiceCatalogResponse,
  partitionOwnerHomeSidebarServices,
  type ServiceCategory,
  type ServiceSubItem,
} from "../lib/serviceCatalog";

export type { ServiceCategory, ServiceSubItem };

export type CarOwnerThoughtOfTheDayApi =
  | string
  | {
      subject?: string;
      notes?: string;
      text?: string;
      quote?: string;
      thought?: string;
    };

export type CarOwnerDashboardData = {
  success?: boolean;
  thoughtOfTheDayLiked?: boolean;
  dashboard?: {
    thoughtOfTheDay?: CarOwnerThoughtOfTheDayApi;
    FAQs?: { heading?: string; desc?: string };
  };
  userProfile?: {
    name?: string;
    phone?: string;
    city?: string;
    profilePhoto?: string | null;
    thoughtOfTheDayLiked?: boolean;
  };
};

const DEFAULT_THOUGHT: ThoughtOfTheDayView = {
  title: "",
  description: "Start each day with a positive thought.",
};

type ToggleThoughtLikeResponse = {
  success?: boolean;
  message?: string;
  thoughtOfTheDayLiked?: boolean;
};

export function useCarOwnerDashboard() {
  const { token } = useAuth();
  const [data, setData] = useState<CarOwnerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) {
      setData(null);
      setLiked(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getJson<CarOwnerDashboardData>("/api/user/dashboard", token);
      if (res.ok && res.data) {
        setData(res.data);
        const nextLiked =
          res.data.thoughtOfTheDayLiked === true ||
          res.data.userProfile?.thoughtOfTheDayLiked === true;
        setLiked(nextLiked);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleThoughtLike = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    if (!token) return { ok: false, error: "Not authenticated." };
    if (likeBusy) return { ok: false, error: "Already updating." };

    const previous = liked;
    setLiked(!previous);
    setLikeBusy(true);
    try {
      const res = await postJson<ToggleThoughtLikeResponse>(
        "/api/user/thought-of-the-day/toggle-like",
        {},
        token
      );
      if (!res.ok || res.data?.success === false) {
        setLiked(previous);
        return { ok: false, error: res.data?.message ?? "Could not update like." };
      }
      if (typeof res.data?.thoughtOfTheDayLiked === "boolean") {
        setLiked(res.data.thoughtOfTheDayLiked);
      }
      return { ok: true };
    } catch {
      setLiked(previous);
      return { ok: false, error: "Network error while updating like." };
    } finally {
      setLikeBusy(false);
    }
  }, [likeBusy, liked, token]);

  const thought =
    extractThoughtOfTheDay(data?.dashboard?.thoughtOfTheDay) ?? DEFAULT_THOUGHT;

  const faqs = data?.dashboard?.FAQs;

  return {
    data,
    loading,
    refresh,
    displayName: data?.userProfile?.name?.trim() || "",
    city: data?.userProfile?.city?.trim() || "",
    thoughtOfTheDay: thought,
    thoughtOfTheDayLiked: liked,
    thoughtLikeBusy: likeBusy,
    toggleThoughtLike,
    faqsHeading: typeof faqs?.heading === "string" ? faqs.heading.trim() : "FAQs",
    faqsDescription: typeof faqs?.desc === "string" ? faqs.desc.trim() : "",
  };
}

export function useCarOwnerServiceSidebar() {
  const { token } = useAuth();
  const [indoor, setIndoor] = useState<ServiceCategory[]>([]);
  const [outdoor, setOutdoor] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setIndoor([]);
      setOutdoor([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await getJson<unknown>("/api/auto-shop-owner/services", token);
        if (cancelled) return;
        const categories = parseServiceCatalogResponse(res.data);
        const partitioned = partitionOwnerHomeSidebarServices(categories);
        setIndoor(partitioned.indoor);
        setOutdoor(partitioned.outdoor);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return { indoor, outdoor, loading };
}
