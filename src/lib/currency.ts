type CurrencyConfig = {
  sign: string;
  locale: string;
};

const CURRENCY_BY_CODE: Record<string, CurrencyConfig> = {
  "+91": { sign: "₹", locale: "en-IN" },
  "+1": { sign: "$", locale: "en-US" },
  "+44": { sign: "£", locale: "en-GB" },
  "+61": { sign: "$", locale: "en-AU" },
};

function parseNumericAmount(value: number | string | null | undefined): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseFloat(trimmed.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function getCurrencyConfig(countryCode: string | null | undefined): CurrencyConfig {
  const code = (countryCode ?? "+1").trim();
  return CURRENCY_BY_CODE[code] ?? CURRENCY_BY_CODE["+1"];
}

export function formatCurrencyAmount(
  amount: number | string | null | undefined,
  countryCode: string | null | undefined,
  options: { fallback?: string; includeSign?: boolean } = {}
): string {
  const parsed = parseNumericAmount(amount);
  if (parsed == null) return options.fallback ?? "—";
  const { sign, locale } = getCurrencyConfig(countryCode);
  const minimumFractionDigits = Number.isInteger(parsed) ? 0 : 2;
  const maximumFractionDigits = Number.isInteger(parsed) ? 0 : 2;
  const includeSign = options.includeSign !== false;
  try {
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(parsed);
    return includeSign ? `${sign}${formatted}` : formatted;
  } catch {
    return includeSign ? `${sign}${parsed.toLocaleString()}` : parsed.toLocaleString();
  }
}
