import { digitsFromNationalPhoneDisplay, formatNationalPhoneDisplay } from "@/lib/national-phone-format";

export type DialCountryId = "IN" | "US" | "CA" | "GB" | "AU";

export type DialCountryOption = {
  id: DialCountryId;
  flag: string;
  label: string;
  /** Value sent to APIs as `countryCode` (includes `+`). */
  callingCode: string;
  /** ISO region for `libphonenumber-js` validation on login. */
  iso2: "IN" | "US" | "CA" | "GB" | "AU";
};

export const DIAL_COUNTRY_OPTIONS: readonly DialCountryOption[] = [
  { id: "IN", flag: "🇮🇳", label: "India", callingCode: "+91", iso2: "IN" },
  { id: "US", flag: "🇺🇸", label: "US", callingCode: "+1", iso2: "US" },
  { id: "CA", flag: "🇨🇦", label: "Canada", callingCode: "+1", iso2: "CA" },
  { id: "GB", flag: "🇬🇧", label: "UK", callingCode: "+44", iso2: "GB" },
  { id: "AU", flag: "🇦🇺", label: "Australia", callingCode: "+61", iso2: "AU" },
] as const;

export function defaultDialCountryId(): DialCountryId {
  return "CA";
}

export function defaultDialCallingCode(): string {
  return getDialCountryOption(defaultDialCountryId()).callingCode;
}

export function getDialCountryOption(id: DialCountryId): DialCountryOption {
  const found = DIAL_COUNTRY_OPTIONS.find((o) => o.id === id);
  return found ?? DIAL_COUNTRY_OPTIONS[0];
}

/** Digits after `+` for legacy UI that kept calling code without `+`. */
export function dialCallingCodeDigits(callingCode: string): string {
  return (callingCode ?? "").replace(/\D/g, "");
}

/**
 * Maps stored `countryCode` (e.g. "+91", "91") to a dial option.
 * `+1` defaults to Canada when ambiguous (US shares the same calling code).
 */
export function resolveDialCountryIdFromStoredCallingCode(code: string | null | undefined): DialCountryId {
  if (!code || !String(code).trim()) {
    return defaultDialCountryId();
  }
  let normalized = String(code).trim();
  if (!normalized.startsWith("+")) {
    normalized = `+${normalized.replace(/^\+/, "")}`;
  }
  if (normalized === "+1") {
    return "CA";
  }
  const match = DIAL_COUNTRY_OPTIONS.find((o) => o.callingCode === normalized);
  if (match) {
    return match.id;
  }
  return defaultDialCountryId();
}

/** Pretty national segment for read-only UI; pass raw digits or spaced. */
export function formatStoredNationalPhone(phone: string | null | undefined): string {
  if (!phone?.trim()) {
    return "";
  }
  return formatNationalPhoneDisplay(digitsFromNationalPhoneDisplay(phone));
}
