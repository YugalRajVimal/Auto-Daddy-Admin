import type { SessionMeta } from "../auth/types";
import type { ShopProfileBusiness, ShopProfileUser } from "../types/shopOwner";
import { phoneDigits } from "./phoneFormat";

export function hasEstablishedPersonalProfile(
  user?: ShopProfileUser | null,
  city?: string | null
): boolean {
  const phone = phoneDigits(user?.phone ?? "");
  return Boolean(
    user?.name?.trim() &&
      user?.email?.trim() &&
      phone.length >= 10 &&
      (city?.trim() || user?.city?.trim())
  );
}

export function hasEstablishedBusinessProfile(
  business?: ShopProfileBusiness | null,
  zipCode?: string | null
): boolean {
  const phone = phoneDigits(business?.businessPhone ?? "");
  return Boolean(
    business?.businessName?.trim() &&
      business?.address?.trim() &&
      business?.city?.trim() &&
      phone.length >= 10 &&
      (zipCode?.trim() || business?.pincode?.trim() || business?.email?.trim())
  );
}

/** `true` incomplete, `false` complete, `null` unknown (still loading). */
export function resolvePersonalProfileIncomplete(
  meta: SessionMeta | null | undefined,
  user: ShopProfileUser | null | undefined,
  city: string | null | undefined,
  portalLoaded: boolean
): boolean | null {
  if (meta?.isProfileComplete === true) return false;
  if (meta?.isProfileComplete === false) return true;
  if (!portalLoaded) return null;
  return !hasEstablishedPersonalProfile(user, city);
}

/** `true` incomplete, `false` complete, `null` unknown (still loading). */
export function resolveBusinessProfileIncomplete(
  meta: SessionMeta | null | undefined,
  business: ShopProfileBusiness | null | undefined,
  zipCode: string | null | undefined,
  portalLoaded: boolean
): boolean | null {
  if (meta?.isAutoShopBusinessProfileComplete === true) return false;
  if (meta?.isAutoShopBusinessProfileComplete === false) return true;
  if (!portalLoaded) return null;
  return !hasEstablishedBusinessProfile(business, zipCode);
}

export type ShopProfileIncompleteKind = "personal" | "business" | "both";

export function resolveShopProfileIncompleteKind(
  personalIncomplete: boolean | null,
  businessIncomplete: boolean | null
): ShopProfileIncompleteKind | null {
  if (personalIncomplete === null || businessIncomplete === null) return null;
  if (personalIncomplete && businessIncomplete) return "both";
  if (personalIncomplete) return "personal";
  if (businessIncomplete) return "business";
  return null;
}
