/** Currency helpers — mirrors src/lib/currency.js */

const CURRENCY_BY_COUNTRY = {
  IN: { code: "INR", locale: "en-IN" },
  US: { code: "USD", locale: "en-US" },
  CA: { code: "CAD", locale: "en-CA" },
  GB: { code: "GBP", locale: "en-GB" },
  AU: { code: "AUD", locale: "en-AU" },
};

function resolveDialCountryIdFromCallingCode(code) {
  if (!code || !String(code).trim()) return "CA";
  let normalized = String(code).trim();
  if (!normalized.startsWith("+")) normalized = `+${normalized.replace(/^\+/, "")}`;
  if (normalized === "+1") return "CA";
  const map = { "+91": "IN", "+44": "GB", "+61": "AU" };
  return map[normalized] ?? "CA";
}

function parseNumericAmount(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseFloat(trimmed.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function getCurrencyConfig(countryCode) {
  const countryId = resolveDialCountryIdFromCallingCode(countryCode);
  return CURRENCY_BY_COUNTRY[countryId] ?? CURRENCY_BY_COUNTRY.CA;
}

export function getCurrencyCode(countryCode) {
  return getCurrencyConfig(countryCode).code;
}

export function formatCurrencyNumber(amount, countryCode, options = {}) {
  const parsed = parseNumericAmount(amount);
  if (parsed == null) return null;
  const minimumFractionDigits =
    options.minimumFractionDigits ?? (Number.isInteger(parsed) ? 0 : 2);
  const maximumFractionDigits =
    options.maximumFractionDigits ??
    Math.max(minimumFractionDigits, Number.isInteger(parsed) ? 0 : 2);
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

export function formatCurrencyAmount(amount, countryCode, options = {}) {
  const formatted = formatCurrencyNumber(amount, countryCode, options);
  if (!formatted) return options.fallback ?? "—";
  const code = getCurrencyCode(countryCode);
  const spacer = options.codeSpacing !== false ? " " : "";
  return `${code}${spacer}${formatted}`;
}

/** GST/HST applies to Online (invoice) payments only — not cash. */
export function isOnlineInvoicePayment(paymentMethod) {
  const method = String(paymentMethod ?? "").trim().toLowerCase();
  return method === "online" || method === "invoice";
}

export function extractMediaPath(value) {
  if (value == null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (typeof value === "object") {
    const o = value;
    const candidate =
      (typeof o.url === "string" && o.url) ||
      (typeof o.path === "string" && o.path) ||
      (typeof o.href === "string" && o.href) ||
      (typeof o.location === "string" && o.location) ||
      null;
    return candidate?.trim() || null;
  }
  return null;
}

export function normalizeMediaUrl(url, apiBaseUrl = "") {
  const raw = extractMediaPath(url);
  if (!raw) return null;
  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("blob:") ||
    raw.startsWith("data:")
  ) {
    return raw;
  }
  const base = String(apiBaseUrl || "").replace(/\/+$/, "");
  if (!base) return raw.startsWith("/") ? raw : `/${raw}`;
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return `${base}${path}`;
}

export function getCallingCodeFromProfileResponse(profileResponse) {
  const cc =
    profileResponse?.data?.userProfile?.countryCode ??
    profileResponse?.userProfile?.countryCode;
  return cc && String(cc).trim() ? String(cc).trim() : null;
}
