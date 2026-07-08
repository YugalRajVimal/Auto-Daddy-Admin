import { resolveDialCountryIdFromStoredCallingCode, type DialCountryId } from "@/lib/dial-countries";

export type CurrencyCode = "INR" | "USD" | "CAD" | "GBP" | "AUD";

export type CurrencyConfig = {
  countryId: DialCountryId;
  code: CurrencyCode;
  sign: string;
  locale: string;
};

type FormatCurrencyOptions = {
  fallback?: string;
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
  signSpacing?: boolean;
};

const CURRENCY_BY_COUNTRY: Record<DialCountryId, CurrencyConfig> = {
  IN: { countryId: "IN", code: "INR", sign: "₹", locale: "en-IN" },
  US: { countryId: "US", code: "USD", sign: "$", locale: "en-US" },
  CA: { countryId: "CA", code: "CAD", sign: "$", locale: "en-CA" },
  GB: { countryId: "GB", code: "GBP", sign: "£", locale: "en-GB" },
  AU: { countryId: "AU", code: "AUD", sign: "$", locale: "en-AU" },
};

function parseNumericAmount(value: number | string | null | undefined): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number.parseFloat(trimmed.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function getCurrencyConfig(countryCode: string | null | undefined): CurrencyConfig {
  const countryId = resolveDialCountryIdFromStoredCallingCode(countryCode);
  return CURRENCY_BY_COUNTRY[countryId];
}

export function getCurrencyCode(countryCode: string | null | undefined): CurrencyCode {
  return getCurrencyConfig(countryCode).code;
}

export function getCurrencySign(countryCode: string | null | undefined): string {
  return getCurrencyConfig(countryCode).sign;
}

export function formatCurrencyNumber(
  amount: number | string | null | undefined,
  countryCode: string | null | undefined,
  options: Omit<FormatCurrencyOptions, "fallback" | "signSpacing"> = {}
): string | null {
  const parsed = parseNumericAmount(amount);
  if (parsed == null) {
    return null;
  }
  const minimumFractionDigits =
    options.minimumFractionDigits ?? (Number.isInteger(parsed) ? 0 : 2);
  const maximumFractionDigits =
    options.maximumFractionDigits ?? Math.max(minimumFractionDigits, Number.isInteger(parsed) ? 0 : 2);
  try {
    return new Intl.NumberFormat(getCurrencyConfig(countryCode).locale, {
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(parsed);
  } catch {
    return parsed.toLocaleString(undefined, {
      minimumFractionDigits,
      maximumFractionDigits,
    });
  }
}

export function formatCurrencyAmount(
  amount: number | string | null | undefined,
  countryCode: string | null | undefined,
  options: FormatCurrencyOptions = {}
): string {
  const formatted = formatCurrencyNumber(amount, countryCode, options);
  if (!formatted) {
    return options.fallback ?? "—";
  }
  const spacer = options.signSpacing ? " " : "";
  return `${getCurrencySign(countryCode)}${spacer}${formatted}`;
}
