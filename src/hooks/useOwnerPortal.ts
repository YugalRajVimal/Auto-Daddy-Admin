import { useCallback, useEffect, useState } from "react";
import { getJson } from "../api/mobileAuth";
import { useAuth } from "../auth";

export type CarOwnerDashboardData = {
  success?: boolean;
  dashboard?: {
    thoughtOfTheDay?: string | { text?: string; quote?: string; thought?: string };
    FAQs?: { heading?: string; desc?: string };
  };
  userProfile?: {
    name?: string;
    phone?: string;
    city?: string;
    profilePhoto?: string | null;
  };
};

function extractThought(raw: unknown): string {
  if (typeof raw === "string") return raw.trim();
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    for (const key of ["text", "quote", "thought", "message", "content"]) {
      const v = o[key];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
  }
  return "";
}

export function useCarOwnerDashboard() {
  const { token } = useAuth();
  const [data, setData] = useState<CarOwnerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!token) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getJson<CarOwnerDashboardData>("/api/user/dashboard", token);
      if (res.ok && res.data) setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const thought =
    extractThought(data?.dashboard?.thoughtOfTheDay) ||
    "Start each day with a positive thought.";

  const faqs = data?.dashboard?.FAQs;

  return {
    data,
    loading,
    refresh,
    displayName: data?.userProfile?.name?.trim() || "",
    city: data?.userProfile?.city?.trim() || "",
    thoughtOfTheDay: thought,
    faqsHeading: typeof faqs?.heading === "string" ? faqs.heading.trim() : "FAQs",
    faqsDescription: typeof faqs?.desc === "string" ? faqs.desc.trim() : "",
  };
}

export type ServiceCategory = { id?: string; name: string };

function parseServiceCatalog(data: unknown): ServiceCategory[] {
  if (!data || typeof data !== "object") return [];
  const root = data as Record<string, unknown>;
  const list = Array.isArray(root.data)
    ? root.data
    : Array.isArray(root.services)
      ? root.services
      : Array.isArray(data)
        ? data
        : [];
  const out: ServiceCategory[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const name = typeof o.name === "string" ? o.name.trim() : typeof o.title === "string" ? o.title.trim() : "";
    if (!name) continue;
    const id = typeof o._id === "string" ? o._id : typeof o.id === "string" ? o.id : undefined;
    out.push({ id, name });
  }
  return out;
}

function isOutdoorService(name: string): boolean {
  const n = name.toLowerCase();
  return n.includes("wash") || n.includes("tow") || n.includes("detailing");
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
        const categories = parseServiceCatalog(res.data);
        setIndoor(categories.filter((c) => !isOutdoorService(c.name)));
        setOutdoor(categories.filter((c) => isOutdoorService(c.name)));
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
