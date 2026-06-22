export type CarOwnerUserProfile = {
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
  data?: Record<string, unknown> | null;
  message?: string;
} & Record<string, unknown>;

export type EditProfileResponse = {
  success?: boolean;
  message?: string;
  data?: unknown;
} & Record<string, unknown>;

export function parseUserProfilePayload(payload: unknown): CarOwnerUserProfile | null {
  const anyPayload = payload as Record<string, unknown> | null;
  const nested = anyPayload?.data as Record<string, unknown> | undefined;
  const d = (nested?.data ?? nested ?? anyPayload) as Record<string, unknown> | null;
  if (!d || typeof d !== "object") return null;

  const cityNested = d.city && typeof d.city === "object" ? (d.city as Record<string, unknown>) : null;
  const cityNameFromNested =
    cityNested && typeof cityNested.name === "string" ? cityNested.name : undefined;
  const cityIdFromNested =
    cityNested && (typeof cityNested._id === "string" || typeof cityNested.id === "string")
      ? String(cityNested._id ?? cityNested.id)
      : undefined;

  return {
    role: typeof d.role === "string" ? d.role : undefined,
    name: typeof d.name === "string" ? d.name : undefined,
    email: typeof d.email === "string" ? d.email : undefined,
    phone: typeof d.phone === "string" ? d.phone : undefined,
    countryCode: typeof d.countryCode === "string" ? d.countryCode : undefined,
    address: typeof d.address === "string" ? d.address : undefined,
    pincode: typeof d.pincode === "string" ? d.pincode : undefined,
    city:
      typeof d.city === "string" ? d.city : typeof d.cityName === "string" ? d.cityName : cityNameFromNested,
    cityId: (typeof d.cityId === "string" ? d.cityId : undefined) ?? cityIdFromNested,
    profilePhoto:
      typeof d.profilePhoto === "string" ? d.profilePhoto : d.profilePhoto === null ? null : undefined,
  };
}

export function digitsOnly(s: string) {
  return (s ?? "").replace(/\D/g, "");
}

export function isValidEmail(email: string) {
  return /^\S+@\S+\.\S+$/.test(email);
}

export const PROFILE_NAME_MAX_LENGTH = 80;
export const PROFILE_ADDRESS_MAX_LENGTH = 50;
export const PINCODE_DISPLAY_MAX_LENGTH = 7;

export type ProfileFieldKey = "name" | "email" | "phone" | "address" | "pincode";
export type ProfileFieldErrors = Partial<Record<ProfileFieldKey, string>>;

export function normalizeCanadianPostalCode(input: string): string {
  return input.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6);
}

export function formatPincodeDisplay(input: string): string {
  const normalized = normalizeCanadianPostalCode(input);
  if (!normalized) return "";
  if (normalized.length <= 3) return normalized;
  return `${normalized.slice(0, 3)} ${normalized.slice(3)}`;
}

export function normalizePostalCodeForStorage(input: string): string {
  return normalizeCanadianPostalCode(input);
}

export function isValidCanadianPostalCode(input: string): boolean {
  const normalized = normalizeCanadianPostalCode(input);
  if (normalized.length !== 6) return false;
  return /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(normalized);
}

export function hasCanadianPostalCodeValidationError(input: string): boolean {
  const normalized = normalizeCanadianPostalCode(input);
  if (!normalized) return false;
  return !isValidCanadianPostalCode(input);
}

export function formatNationalPhoneDisplay(digits: string): string {
  const d = digitsOnly(digits).slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

export function nationalPhoneDisplayFromKeystrokes(input: string): string {
  return formatNationalPhoneDisplay(digitsOnly(input));
}

export function validateProfileEdit(raw: {
  name: string;
  email: string;
  phone: string;
  address: string;
  pincode: string;
}): { valid: boolean; errors: ProfileFieldErrors } {
  const errors: ProfileFieldErrors = {};
  const name = raw.name.trim();

  if (!name) errors.name = "Name is required.";
  else if (name.length > PROFILE_NAME_MAX_LENGTH) {
    errors.name = `Use at most ${PROFILE_NAME_MAX_LENGTH} characters.`;
  }

  const email = raw.email.trim();
  if (email && !isValidEmail(email)) errors.email = "Enter a valid email address.";

  const phoneDigits = digitsOnly(raw.phone);
  if (phoneDigits.length > 0 && phoneDigits.length !== 10) {
    errors.phone = "Phone must be exactly 10 digits.";
  }

  const address = raw.address.trim();
  if (address.length > PROFILE_ADDRESS_MAX_LENGTH) {
    errors.address = `Use at most ${PROFILE_ADDRESS_MAX_LENGTH} characters.`;
  }

  if (hasCanadianPostalCodeValidationError(raw.pincode)) {
    errors.pincode = "Enter a valid Canadian postal code (e.g. A1A 1A1).";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
