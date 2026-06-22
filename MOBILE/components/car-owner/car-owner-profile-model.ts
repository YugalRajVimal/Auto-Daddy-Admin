import { hasCanadianPostalCodeValidationError, POSTAL_CODE_ERROR_MESSAGE } from "@/lib/validation";

export type UserProfile = {
  name?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
  address?: string;
  pincode?: string;
  city?: string;
  cityId?: string;
  role?: string;
  profilePhoto?: string | null;
};

export type UserProfileResponse = {
  success?: boolean;
  data?: {
    role?: string;
    name?: string;
    isProfileComplete?: boolean;
    profilePhoto?: string | null;
    isAutoShopBusinessProfileComplete?: boolean;
    email?: string;
    phone?: string;
    countryCode?: string;
    address?: string;
    pincode?: string;
    city?: string;
    cityId?: string;
    cityName?: string;
  } | null;
  message?: string;
} & Record<string, unknown>;

export type EditProfileResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
} & Record<string, unknown>;

export function parseUserProfilePayload(payload: unknown): UserProfile | null {
  const anyPayload = payload as any;
  const d = anyPayload?.data?.data ?? anyPayload?.data ?? anyPayload;
  if (!d || typeof d !== "object") return null;
  const cityNested = d.city && typeof d.city === "object" ? (d.city as Record<string, unknown>) : null;
  const cityNameFromNested =
    cityNested && typeof cityNested.name === "string" ? cityNested.name : undefined;
  const cityIdFromNested =
    cityNested && (typeof cityNested._id === "string" || typeof cityNested.id === "string")
      ? String(cityNested._id ?? cityNested.id)
      : undefined;

  return {
    role: d.role ?? undefined,
    name: d.name ?? undefined,
    email: d.email ?? undefined,
    phone: d.phone ?? undefined,
    countryCode: d.countryCode ?? undefined,
    address: d.address ?? undefined,
    pincode: d.pincode ?? undefined,
    city:
      typeof d.city === "string"
        ? d.city
        : (d.cityName ?? cityNameFromNested ?? undefined),
    cityId: (typeof d.cityId === "string" ? d.cityId : undefined) ?? cityIdFromNested,
    profilePhoto:
      typeof d.profilePhoto === "string"
        ? d.profilePhoto
        : d.profilePhoto === null
          ? null
          : undefined,
  };
}

export function digitsOnly(s: string) {
  return (s ?? "").replace(/\D/g, "");
}

export function isValidEmail(email: string) {
  return /^\S+@\S+\.\S+$/.test(email);
}

export function formatRole(role: string) {
  const r = (role ?? "").toString().replace(/[-_]/g, " ").trim();
  return r ? r.replace(/\b\w/g, (c) => c.toUpperCase()) : "Car Owner";
}

export const PROFILE_NAME_MAX_LENGTH = 80;
export const PROFILE_ADDRESS_MAX_LENGTH = 50;

export type ProfileFieldKey = "name" | "email" | "phone" | "address" | "pincode";

export type ProfileFieldErrors = Partial<Record<ProfileFieldKey, string>>;

export function validateProfileEdit(raw: {
  name: string;
  email: string;
  phone: string;
  address: string;
  pincode: string;
}): { valid: boolean; errors: ProfileFieldErrors } {
  const errors: ProfileFieldErrors = {};

  const name = raw.name.trim();
  if (!name) {
    errors.name = "Name is required.";
  } else if (name.length > PROFILE_NAME_MAX_LENGTH) {
    errors.name = `Use at most ${PROFILE_NAME_MAX_LENGTH} characters.`;
  }

  const email = raw.email.trim();
  if (email && !isValidEmail(email)) {
    errors.email = "Enter a valid email address.";
  }

  const phoneDigits = digitsOnly(raw.phone);
  if (phoneDigits.length > 0 && phoneDigits.length !== 10) {
    errors.phone = "Phone must be exactly 10 digits.";
  }

  const address = raw.address.trim();
  if (address.length > PROFILE_ADDRESS_MAX_LENGTH) {
    errors.address = `Use at most ${PROFILE_ADDRESS_MAX_LENGTH} characters.`;
  }

  if (hasCanadianPostalCodeValidationError(raw.pincode)) {
    errors.pincode = POSTAL_CODE_ERROR_MESSAGE;
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
