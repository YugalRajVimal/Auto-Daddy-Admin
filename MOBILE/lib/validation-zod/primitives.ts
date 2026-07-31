import { z } from "zod";

export function digitsOnly(value: string): string {
  return (value ?? "").replace(/\D/g, "");
}

export const EMAIL_RE = /^\S+@\S+\.\S+$/;
export const US_ZIP_RE = /^\d{5}(-\d{4})?$/;
export const CA_POSTAL_RE =
  /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i;
export const IN_PIN_RE = /^\d{6}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function isValidPostalUSCAIN(zip: string): boolean {
  const t = zip.trim();
  return US_ZIP_RE.test(t) || CA_POSTAL_RE.test(t) || IN_PIN_RE.test(t);
}

export const currentYear = new Date().getFullYear();

export function isValidVehicleYear(value: string): boolean {
  const year = Number(value);
  return /^\d{4}$/.test(value) && year >= 1900 && year <= currentYear + 1;
}

export const requiredTrimmed = (label = "This field") =>
  z.string().trim().min(1, `${label} is required.`);

export const email = z
  .string()
  .trim()
  .min(1, "Enter a valid email address.")
  .regex(EMAIL_RE, "Enter a valid email address.");

export const money = z
  .string()
  .trim()
  .min(1, "Amount is required.")
  .refine((v) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0;
  }, "Enter a valid amount (0 or greater).");

export const moneyPositive = z
  .string()
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

export const percent1to100 = z
  .string()
  .trim()
  .min(1, "Discount (%) is required.")
  .refine((v) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 1 && n <= 100;
  }, "Enter a discount between 1 and 100%.");

export const requiredDate = (label = "Date") =>
  z.string().trim().min(1, `${label} is required.`);

export const futureDate = (label = "Date") =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .refine((v) => {
      const selected = new Date(`${v.slice(0, 10)}T00:00:00`);
      const tomorrow = new Date();
      tomorrow.setHours(0, 0, 0, 0);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return !Number.isNaN(selected.getTime()) && selected >= tomorrow;
    }, `${label} must be a future date.`);

export const optionalNonNegativeInt = z
  .string()
  .trim()
  .refine((v) => {
    if (!v) return true;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 && Number.isInteger(n);
  }, "Enter a whole number (0 or greater).");

export const vehicleYear = z
  .string()
  .trim()
  .refine((v) => isValidVehicleYear(v), `Year must be 1900–${currentYear + 1}.`);

/** First zod issue message, or fallback. */
export function firstZodError(error: z.ZodError, fallback = "Invalid input."): string {
  return error.issues[0]?.message?.trim() || fallback;
}
