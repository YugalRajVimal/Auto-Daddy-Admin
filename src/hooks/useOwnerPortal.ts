import { useCallback, useEffect, useState } from "react";
import { getJson, postJson } from "../api/mobileAuth";
import { useAuth } from "../auth";
import {
  fetchCarOwnerFaqs,
  fetchCarOwnerHome,
  fetchCarOwnerPrivacy,
  fetchCarOwnerProductFeatures,
  parseCarOwnerFaqItems,
  parseCarOwnerPrivacy,
  parseCarOwnerProductFeatures,
} from "../lib/carOwnerHomeApi";
import type { DummyFaqItem } from "../lib/dummyOwnerHomeProfile";
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
  /** Nested home payload from GET /api/carowner/home */
  data?: {
    thoughtOfTheDay?: CarOwnerThoughtOfTheDayApi;
    thoughtOfTheDayLike?: number;
    carOwnerName?: string;
    name?: string | null;
    city?: string | null;
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

function coalesceHomePayload(raw: CarOwnerDashboardData | null): CarOwnerDashboardData | null {
  if (!raw || typeof raw !== "object") return null;
  const root = raw as CarOwnerDashboardData & { data?: Record<string, unknown> };
  const nested = root.data && typeof root.data === "object" ? root.data : null;

  const nestedThought = nested?.thoughtOfTheDay;
  const likesFromThought =
    nestedThought &&
    typeof nestedThought === "object" &&
    typeof (nestedThought as { likes?: unknown }).likes === "number"
      ? (nestedThought as { likes: number }).likes
      : null;
  const nestedLike =
    typeof nested?.thoughtOfTheDayLike === "number"
      ? nested.thoughtOfTheDayLike
      : likesFromThought;

  const pickName = (...vals: unknown[]) => {
    for (const v of vals) {
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return "";
  };
  const pickCity = (...vals: unknown[]) => {
    for (const v of vals) {
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return "";
  };

  const carOwnerName = pickName(nested?.name, nested?.carOwnerName, root.userProfile?.name);
  const carOwnerCity = pickCity(nested?.city, root.userProfile?.city);

  const dashboardFromNested =
    nestedThought != null || nestedLike != null
      ? {
          ...(typeof root.dashboard === "object" && root.dashboard ? root.dashboard : {}),
          thoughtOfTheDay:
            (nestedThought as CarOwnerThoughtOfTheDayApi | undefined) ??
            root.dashboard?.thoughtOfTheDay,
          thoughtOfTheDayLike:
            typeof nestedLike === "number"
              ? nestedLike
              : root.dashboard?.thoughtOfTheDayLike,
        }
      : root.dashboard;

  const profile = root.userProfile
    ? {
        ...root.userProfile,
        name: pickName(root.userProfile.name, carOwnerName) || root.userProfile.name,
        city: pickCity(root.userProfile.city, carOwnerCity) || root.userProfile.city,
      }
    : carOwnerName || carOwnerCity
      ? { name: carOwnerName || undefined, city: carOwnerCity || undefined }
      : root.userProfile;

  return {
    ...root,
    dashboard: dashboardFromNested,
    userProfile: profile,
  };
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
      const res = await fetchCarOwnerHome(token);
      if (res.ok && res.data) {
        const next = coalesceHomePayload(res.data);
        setData(next);
        const nextLiked =
          res.data.thoughtOfTheDayLiked === true ||
          res.data.userProfile?.thoughtOfTheDayLiked === true ||
          next?.thoughtOfTheDayLiked === true ||
          next?.userProfile?.thoughtOfTheDayLiked === true;
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
  };
}

export function useCarOwnerFaqs(role = "carowner") {
  const { token } = useAuth();
  const [items, setItems] = useState<DummyFaqItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setItems([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchCarOwnerFaqs(token, role);
        if (cancelled) return;
        setItems(res.ok ? parseCarOwnerFaqItems(res.data) : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [role, token]);

  return { items, loading, faqsHeading: "FAQs" };
}

export function useCarOwnerPrivacy(query?: { country?: string; type?: string }) {
  const { token } = useAuth();
  const country = query?.country ?? "canada";
  const type = query?.type ?? "privacy";
  const [heading, setHeading] = useState("Privacy Policy");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setHeading("Privacy Policy");
      setDescription("");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchCarOwnerPrivacy(token, { country, type });
        if (cancelled) return;
        if (res.ok) {
          const parsed = parseCarOwnerPrivacy(res.data);
          setHeading(parsed.heading);
          setDescription(parsed.description);
        } else {
          setHeading("Privacy Policy");
          setDescription("");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [country, token, type]);

  return { loading, privacyHeading: heading, privacyDescription: description };
}

export function useCarOwnerProductFeatures(query?: { country?: string; role?: string }) {
  const { token } = useAuth();
  const country = query?.country ?? "canada";
  const role = query?.role ?? "carowner";
  const [sections, setSections] = useState<CarOwnerContentBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setSections([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchCarOwnerProductFeatures(token, { country, role });
        if (cancelled) return;
        setSections(res.ok ? parseCarOwnerProductFeatures(res.data) : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [country, role, token]);

  return { loading, sections };
}

export function useCarOwnerServiceSidebar() {
  const { token } = useAuth();
  const [indoor, setIndoor] = useState<ServiceCategory[]>([]);
  const [outdoor, setOutdoor] = useState<ServiceCategory[]>([]);
  const [all, setAll] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setIndoor([]);
      setOutdoor([]);
      setAll([]);
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
        setAll(categories);
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

  return { indoor, outdoor, all, loading };
}
