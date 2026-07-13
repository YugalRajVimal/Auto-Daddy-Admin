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

export type CarOwnerContentBlock = {
  _id?: string;
  heading: string;
  desc: string;
};

export type CarOwnerThoughtOfTheDayApi =
  | string
  | {
      subject?: string;
      notes?: string;
      text?: string;
      quote?: string;
      thought?: string;
      message?: string;
      content?: string;
    };

export type CarOwnerDashboardVehicle = {
  _id: string;
  licensePlateNo: string;
  make: { name: string; model: string };
  year: number;
};

export type CarOwnerDashboardUserProfile = {
  _id?: string;
  role?: string;
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  profilePhoto?: string | null;
  isProfileComplete?: boolean;
  myVehicles?: CarOwnerDashboardVehicle[];
  thoughtOfTheDayLiked?: boolean;
  createdAt?: string;
};

export type CarOwnerNextServiceSubService = {
  name: string;
  desc: string;
  price: number;
};

export type CarOwnerNextServiceItem = {
  service: string;
  subServices: CarOwnerNextServiceSubService[];
};

export type CarOwnerNextService = {
  jobCardId: string;
  vehicle: CarOwnerDashboardVehicle;
  customer?: {
    _id: string;
    phone: string;
    email?: string;
    name: string;
    profilePhoto?: string | null;
  };
  dueOdometerReading: number;
  createdAt: string;
  issueDescription: string;
  serviceType: string;
  priorityLevel: string;
  status: string;
  services: CarOwnerNextServiceItem[];
};

export type CarOwnerDashboardPayload = {
  _id?: string;
  thoughtOfTheDay?: CarOwnerThoughtOfTheDayApi;
  thoughtOfTheDayLike?: number;
  sections?: CarOwnerContentBlock[];
  FAQs?: CarOwnerContentBlock;
  aboutUs?: CarOwnerContentBlock;
  privacyPolicy?: CarOwnerContentBlock;
  documents?: CarOwnerContentBlock;
  disclaimer?: CarOwnerContentBlock;
  createdAt?: string;
  __v?: number;
};

export type CarOwnerDashboardData = {
  success?: boolean;
  thoughtOfTheDayLiked?: boolean;
  dashboard?: CarOwnerDashboardPayload;
  userProfile?: CarOwnerDashboardUserProfile;
  nextService?: CarOwnerNextService | null;
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

function normalizeSections(raw: unknown): CarOwnerContentBlock[] {
  if (!Array.isArray(raw)) return [];
  const out: CarOwnerContentBlock[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const heading = typeof o.heading === "string" ? o.heading.trim() : "";
    const desc = typeof o.desc === "string" ? o.desc.trim() : "";
    if (!heading && !desc) continue;
    const block: CarOwnerContentBlock = { heading, desc };
    if (typeof o._id === "string") block._id = o._id;
    out.push(block);
  }
  return out;
}

function normalizeLikeCount(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) return Math.floor(raw);
  return 0;
}

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
  const privacy = data?.dashboard?.privacyPolicy;
  const sections = normalizeSections(data?.dashboard?.sections);
  const thoughtLikeCount = normalizeLikeCount(data?.dashboard?.thoughtOfTheDayLike);
  const profile = data?.userProfile;
  const nextService = data?.nextService ?? null;

  return {
    data,
    loading,
    refresh,
    displayName: profile?.name?.trim() || "",
    city: profile?.city?.trim() || "",
    profilePhoto: profile?.profilePhoto ?? null,
    myVehicles: Array.isArray(profile?.myVehicles) ? profile.myVehicles : [],
    thoughtOfTheDay: thought,
    thoughtOfTheDayLiked: liked,
    thoughtLikeCount,
    thoughtLikeBusy: likeBusy,
    toggleThoughtLike,
    sections,
    nextService,
    faqsHeading: typeof faqs?.heading === "string" ? faqs.heading.trim() : "FAQs",
    faqsDescription: typeof faqs?.desc === "string" ? faqs.desc.trim() : "",
    privacyHeading: typeof privacy?.heading === "string" ? privacy.heading.trim() : "Privacy Policy",
    privacyDescription: typeof privacy?.desc === "string" ? privacy.desc.trim() : "",
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
