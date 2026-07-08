import isPostalCode from "validator/lib/isPostalCode";

export function clampText(input: string, max: number) {
  return input.length > max ? input.slice(0, max) : input;
}

export function digitsOnly(input: string) {
  return input.replace(/\D/g, "");
}

export function clampDigits(input: string, max: number) {
  return digitsOnly(input).slice(0, max);
}

export const POSTAL_CODE_CANADA_LOCALE = "CA" as const;

export const POSTAL_CODE_ERROR_MESSAGE =
  "Enter a valid Canadian postal code (e.g. A1A 1A1).";

/** Max characters in a TextInput when showing `A1A 1A1`. */
export const PINCODE_DISPLAY_MAX_LENGTH = 7;

/** Strips separators and uppercases; keeps up to six alphanumeric characters. */
export function normalizeCanadianPostalCode(input: string): string {
  return input.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6);
}

/** Formats up to six characters as `A1A 1A1` (empty input → empty string). */
export function formatPincodeDisplay(input: string): string {
  const normalized = normalizeCanadianPostalCode(input);
  if (normalized.length === 0) return "";
  if (normalized.length <= 3) return normalized;
  return `${normalized.slice(0, 3)} ${normalized.slice(3)}`;
}

/** Compact uppercase form for API payloads (e.g. `A1A1A1`). */
export function normalizePostalCodeForStorage(input: string): string {
  return normalizeCanadianPostalCode(input);
}

export function isValidCanadianPostalCode(input: string): boolean {
  const normalized = normalizeCanadianPostalCode(input);
  if (normalized.length !== 6) return false;
  return isPostalCode(normalized, POSTAL_CODE_CANADA_LOCALE);
}

/** True when the field has input that is not a valid Canadian postal code. */
export function hasCanadianPostalCodeValidationError(input: string): boolean {
  const normalized = normalizeCanadianPostalCode(input);
  if (normalized.length === 0) return false;
  return !isValidCanadianPostalCode(input);
}

export function isValidEmail(input: string) {
  const s = input.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export function isValidYear(input: string) {
  const s = input.trim();
  if (!/^\d{4}$/.test(s)) return false;
  const y = Number(s);
  const current = new Date().getFullYear();
  return y >= 1900 && y <= current + 1;
}
