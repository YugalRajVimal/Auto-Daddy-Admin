import {
  fetchBusinessProfile,
  fetchPersonalProfile,
  fetchShopOwnerHome,
} from "@/lib/autoshopowner-api";
import { getJson } from "@/lib/api";
import type { AutoShopOwnerProfileResponse } from "@/types/auto-shop-owner-profile";
import type { DashboardDetailsResponse } from "@/types/dashboard-details";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function unwrapData(payload: unknown): Record<string, unknown> | null {
  const root = asRecord(payload);
  if (!root) return null;
  const nested = asRecord(root.data);
  return nested ?? root;
}

function pickString(...vals: unknown[]): string | undefined {
  for (const v of vals) {
    if (typeof v === "string") {
      const s = v.trim();
      if (s) return s;
    }
  }
  return undefined;
}

function pickNumber(...vals: unknown[]): number | undefined {
  for (const v of vals) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim()) {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

function pickBool(...vals: unknown[]): boolean | undefined {
  for (const v of vals) {
    if (typeof v === "boolean") return v;
  }
  return undefined;
}

function normalizeBusinessProfile(raw: Record<string, unknown> | null): Record<string, unknown> {
  if (!raw) return {};
  const shopTypesRaw = raw.shopTypes ?? raw.shopType;
  let shopTypes: string[] | undefined;
  if (Array.isArray(shopTypesRaw)) {
    shopTypes = shopTypesRaw
      .filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
      .map((item) => item.trim());
  } else if (typeof shopTypesRaw === "string" && shopTypesRaw.trim()) {
    shopTypes = [shopTypesRaw.trim()];
  }
  return {
    ...raw,
    businessAddress: pickString(raw.businessAddress, raw.address) ?? raw.businessAddress,
    address: pickString(raw.address, raw.businessAddress),
    businessEmail: pickString(raw.businessEmail, raw.email) ?? raw.businessEmail,
    email: pickString(raw.email, raw.businessEmail),
    businessHSTNumber: pickString(raw.businessHSTNumber, raw.hstNumber) ?? raw.businessHSTNumber,
    hstNumber: pickString(raw.hstNumber, raw.businessHSTNumber),
    gst: raw.gst ?? raw.gstPercent,
    gstPercent: raw.gstPercent ?? raw.gst,
    shopTypes,
    shopType: shopTypes?.[0],
  };
}

function thoughtOfTheDayToString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  const obj = asRecord(value);
  if (!obj) return "";
  // New home API uses `notes` + `subject`; keep legacy keys too.
  const desc = pickString(obj.notes, obj.description, obj.desc, obj.text, obj.quote);
  const title = pickString(obj.subject, obj.title, obj.heading);
  if (desc && title && desc !== title) return `${title}\n${desc}`;
  return desc || title || "";
}

function contentBlock(value: unknown): { heading: string; desc: string } {
  const obj = asRecord(value);
  return {
    heading: pickString(obj?.heading, obj?.title) ?? "",
    desc: pickString(obj?.desc, obj?.description, obj?.content) ?? "",
  };
}

/**
 * Loads new `/api/autoshopowner/*` home + profile slices (plus legacy profile for
 * fields not yet on the new surface) and maps them into the cache shapes home/profile UI already use.
 */
export async function fetchAndMergeShopOwnerPortal(authToken: string): Promise<{
  profile: AutoShopOwnerProfileResponse | null;
  dashboard: DashboardDetailsResponse | null;
  userProfileMeta: {
    role?: string;
    name?: string;
    isProfileComplete?: boolean;
    isAutoShopBusinessProfileComplete?: boolean;
    phone?: string;
    countryCode?: string;
  } | null;
}> {
  const [homeRes, personalRes, businessRes, legacyProfileRes] = await Promise.all([
    fetchShopOwnerHome(authToken),
    fetchPersonalProfile(authToken),
    fetchBusinessProfile(authToken),
    getJson<AutoShopOwnerProfileResponse>("/api/auto-shop-owner/profile", { authToken }),
  ]);

  const homeData = homeRes.ok ? unwrapData(homeRes.data) : null;
  const personalData = personalRes.ok ? unwrapData(personalRes.data) : null;
  const businessData = businessRes.ok ? normalizeBusinessProfile(unwrapData(businessRes.data)) : null;
  const legacy = legacyProfileRes.ok ? legacyProfileRes.data : null;

  const mergedUser = {
    ...(legacy?.data?.userProfile ?? {}),
    ...(personalData ?? {}),
  } as Record<string, unknown>;

  const mergedBusiness = {
    ...(legacy?.data?.businessProfile ?? {}),
    ...(businessData ?? {}),
  } as Record<string, unknown>;

  const profile: AutoShopOwnerProfileResponse | null =
    personalData || businessData || legacy
      ? {
          success: true,
          data: {
            userProfile: mergedUser as unknown as AutoShopOwnerProfileResponse["data"]["userProfile"],
            businessProfile: mergedBusiness as unknown as AutoShopOwnerProfileResponse["data"]["businessProfile"],
          },
        }
      : null;

  const emptyBlock = { heading: "", desc: "" };
  const dashboard: DashboardDetailsResponse | null = homeData
    ? {
        success: true,
        businessName:
          pickString(homeData.businessName, mergedBusiness.businessName) ?? "",
        businessContactNo:
          pickString(homeData.businessContactNo, mergedBusiness.businessPhone) ?? "",
        idBusinessActive:
          pickBool(homeData.idBusinessActive, homeData.isBusinessActive, mergedBusiness.isBusinessActive) ??
          false,
        incomeOverview: (asRecord(homeData.incomeOverview) as DashboardDetailsResponse["incomeOverview"]) ?? {
          daily: {
            date: "",
            totalSale: 0,
            received: 0,
            pending: 0,
          },
        },
        subscriptionDaysLeftCount:
          pickNumber(
            homeData.daysLeftInSubscription,
            homeData.subscriptionDaysLeftCount,
            homeData.daysLeft
          ) ?? 0,
        thoughtOfTheDay: thoughtOfTheDayToString(homeData.thoughtOfTheDay),
        aboutUs: contentBlock(homeData.aboutUs) || emptyBlock,
        privacyPolicy: contentBlock(homeData.privacyPolicy) || emptyBlock,
        FAQs: contentBlock(homeData.FAQs ?? homeData.faqs) || emptyBlock,
        Documents: contentBlock(homeData.Documents ?? homeData.documents) || emptyBlock,
        Disclaimer: contentBlock(homeData.Disclaimer ?? homeData.disclaimer) || emptyBlock,
        businessUserDetails: {
          name: pickString(mergedUser.name) ?? "",
          email: pickString(mergedUser.email) ?? "",
          countryCode: pickString(mergedUser.countryCode) ?? "",
          phone: pickString(mergedUser.phone) ?? "",
          pincode: pickString(mergedUser.pincode, mergedBusiness.pincode) ?? "",
          address: pickString(mergedUser.address, mergedBusiness.businessAddress) ?? "",
          profilePhoto:
            typeof mergedUser.profilePhoto === "string" ? mergedUser.profilePhoto : null,
          isDisabled: pickBool(mergedUser.isDisabled) ?? false,
          isProfileComplete: pickBool(mergedUser.isProfileComplete) ?? false,
        },
      }
    : null;

  return {
    profile,
    dashboard,
    userProfileMeta: {
      role: pickString(mergedUser.role),
      name: pickString(mergedUser.name),
      isProfileComplete: pickBool(mergedUser.isProfileComplete),
      isAutoShopBusinessProfileComplete: pickBool(mergedUser.isAutoShopBusinessProfileComplete),
      phone: pickString(mergedUser.phone),
      countryCode: pickString(mergedUser.countryCode),
    },
  };
}
