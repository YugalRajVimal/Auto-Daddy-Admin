import { z } from "zod";

export function digitsOnly(value: string): string {
  return (value ?? "").replace(/\D/g, "");
}

export const EMAIL_RE = /^\S+@\S+\.\S+$/;
export const US_ZIP_RE = /^\d{5}(-\d{4})?$/;
export const CA_POSTAL_RE =
  /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i;
export const IN_PIN_RE = /^\d{6}$/;
export const TAX_ID_RE = /^[A-Z0-9]{17}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function isValidUSZip(zip: string): boolean {
  return US_ZIP_RE.test(zip.trim());
}

export function isValidCanadaPostalCode(zip: string): boolean {
  return CA_POSTAL_RE.test(zip.trim());
}

export function isValidIndiaPincode(pin: string): boolean {
  return IN_PIN_RE.test(pin.trim());
}

export function isValidPostalUSCAIN(zip: string): boolean {
  const t = zip.trim();
  return isValidUSZip(t) || isValidCanadaPostalCode(t) || isValidIndiaPincode(t);
}

export function normalizeCanadianPostalCode(input: string): string {
  return input.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6);
}

export function isValidCanadianPostalCodeNormalized(input: string): boolean {
  const normalized = normalizeCanadianPostalCode(input);
  if (normalized.length !== 6) return false;
  return /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(normalized);
}

export const currentYear = new Date().getFullYear();

export function isValidVehicleYear(value: string): boolean {
  const year = Number(value);
  return /^\d{4}$/.test(value) && year >= 1900 && year <= currentYear + 1;
}

/** Non-empty after trim. */
export const requiredTrimmed = (label = "This field") =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .min(1, `${label} is required.`);

export const email = z
  .string({ error: "Enter a valid email address." })
  .trim()
  .min(1, "Enter a valid email address.")
  .regex(EMAIL_RE, "Enter a valid email address.");

export const optionalEmail = z
  .string()
  .trim()
  .refine((v) => !v || EMAIL_RE.test(v), "Enter a valid email address.");

/** Exactly 10 digits (identity forms). Accepts formatted input. */
export const phone10 = z
  .string({ error: "Phone must be exactly 10 digits." })
  .refine((v) => digitsOnly(v).length === 10, "Phone must be exactly 10 digits.");

/** Optional: empty OK, else exactly 10 digits. */
export const optionalPhone10 = z
  .string()
  .refine((v) => !digitsOnly(v).length || digitsOnly(v).length === 10, "Phone must be exactly 10 digits.");

/** Business phone: 10–15 digits. */
export const phone10to15 = z
  .string({ error: "Enter a valid phone number (10-15 digits)." })
  .refine(
    (v) => {
      const d = digitsOnly(v);
      return d.length >= 10 && d.length <= 15;
    },
    "Enter a valid phone number (10-15 digits, digits only).",
  );

export const postalUSCAIN = z
  .string({ error: "Enter a zip/postal/pincode." })
  .trim()
  .min(1, "Enter a zip/postal/pincode.")
  .refine(
    (v) => isValidPostalUSCAIN(v),
    "Enter a valid US zip, Canada postal code, or India PIN code.",
  );

export const optionalPostalUSCAIN = z
  .string()
  .trim()
  .refine(
    (v) => !v || isValidPostalUSCAIN(v),
    "Enter a valid US zip, Canada postal code, or India PIN code.",
  );

export const postalCA = z
  .string()
  .trim()
  .refine(
    (v) => !v || isValidCanadianPostalCodeNormalized(v),
    "Enter a valid Canadian postal code (e.g. A1A 1A1).",
  );

export const vin17 = z
  .string({ error: "VIN must be 17 characters." })
  .trim()
  .length(17, "VIN must be 17 characters.");

export const optionalVin17 = z
  .string()
  .trim()
  .refine((v) => !v || v.length === 17, "VIN must be 17 characters.");

export const vehicleYear = z
  .string({ error: "Enter a valid year." })
  .trim()
  .refine((v) => isValidVehicleYear(v), `Year must be 1900–${currentYear + 1}.`);

/** Money as string input (common in this app). Finite number ≥ 0. */
export const money = z
  .string({ error: "Amount is required." })
  .trim()
  .min(1, "Amount is required.")
  .refine((v) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0;
  }, "Enter a valid amount (0 or greater).");

export const moneyPositive = z
  .string({ error: "Amount is required." })
  .trim()
  .min(1, "Amount is required.")
  .refine((v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0;
  }, "Enter an amount greater than 0.");

export const optionalMoney = z
  .string()
  .trim()
  .refine((v) => {
    if (!v) return true;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0;
  }, "Enter a valid amount (0 or greater).");

export const percent0to50 = z
  .string()
  .trim()
  .refine((v) => {
    if (!v) return true;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 && n <= 50;
  }, "Enter a valid tax percentage (0 - 50).");

export const percent1to100 = z
  .string({ error: "Discount (%) is required." })
  .trim()
  .min(1, "Discount (%) is required.")
  .refine((v) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 1 && n <= 100;
  }, "Enter a discount between 1 and 100%.");

export const taxId17 = z
  .string()
  .trim()
  .refine((v) => {
    if (!v) return true;
    return TAX_ID_RE.test(v.replace(/\s/g, "").toUpperCase());
  }, "Enter a valid TAX ID No (17 uppercase alphanumeric characters).");

export const httpUrl = z
  .string({ error: "Enter a valid URL." })
  .trim()
  .min(1, "Enter a valid URL.")
  .refine((v) => {
    try {
      const withProtocol = /^https?:\/\//i.test(v) ? v : `https://${v}`;
      const u = new URL(withProtocol);
      return Boolean(u.hostname) && u.hostname.includes(".");
    } catch {
      return false;
    }
  }, "Enter a valid URL with a hostname (e.g. example.com).");

export const optionalHttpUrl = z
  .string()
  .trim()
  .refine((v) => {
    if (!v) return true;
    try {
      const withProtocol = /^https?:\/\//i.test(v) ? v : `https://${v}`;
      const u = new URL(withProtocol);
      return Boolean(u.hostname) && u.hostname.includes(".");
    } catch {
      return false;
    }
  }, "Enter a valid URL with a hostname (e.g. example.com).");

export const passwordMin6 = z
  .string({ error: "Password is required." })
  .min(6, "Password must be at least 6 characters.");

function parseDateOnly(value: string): Date | null {
  const t = value.trim();
  if (!t) return null;
  const d = new Date(t.includes("T") ? t : `${t}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export const requiredDate = (label = "Date") =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .min(1, `${label} is required.`)
    .refine((v) => parseDateOnly(v) != null, `Enter a valid ${label.toLowerCase()}.`);

export const futureDate = (label = "Date") =>
  requiredDate(label).refine((v) => {
    const d = parseDateOnly(v);
    if (!d) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d.getTime() > today.getTime();
  }, `${label} must be a future date.`);

export const todayOrFuture = (label = "Date") =>
  requiredDate(label).refine((v) => {
    const d = parseDateOnly(v);
    if (!d) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d.getTime() >= today.getTime();
  }, `${label} must be today or a future date.`);

export const optionalNonNegativeInt = z
  .string()
  .trim()
  .refine((v) => {
    if (!v) return true;
    const n = Number(v);
    return Number.isInteger(n) && n >= 0;
  }, "Enter a valid whole number (0 or greater).");
