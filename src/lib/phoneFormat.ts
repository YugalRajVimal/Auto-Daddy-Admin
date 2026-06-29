export function phoneDigits(phone?: string): string {
  return (phone ?? "").replace(/\D/g, "").slice(0, 10);
}

/** Display-only grouping: 999 999 9999 (stored value has no spaces). */
export function formatPhoneDisplay(phone?: string): string {
  const digits = phoneDigits(phone);
  if (!digits) return "";
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

/** Like formatPhoneDisplay but shows an em dash when empty (read-only labels). */
export function formatPhoneLabel(phone?: string): string {
  return formatPhoneDisplay(phone) || "—";
}

/** National digits with calling code prefix, e.g. +1 705 991 3785. */
export function formatPhoneWithCountryCode(
  phone?: string,
  countryCode?: string | null,
  options: { fallback?: string } = {},
): string {
  const fallback = options.fallback ?? "—";
  const raw = (phone ?? "").trim();
  if (!raw) return fallback;

  if (raw.startsWith("+")) {
    const ccMatch = /^(\+\d{1,4})\s*/.exec(raw);
    if (ccMatch) {
      const cc = ccMatch[1];
      const national = phoneDigits(raw.slice(cc.length));
      if (national) return `${cc} ${formatPhoneDisplay(national)}`;
      return raw;
    }
  }

  const digits = phoneDigits(raw);
  if (!digits) return fallback;
  const cc = (countryCode ?? "+1").trim() || "+1";
  return `${cc} ${formatPhoneDisplay(digits)}`;
}

/** Strip a leading calling code before parsing national digits for inputs. */
export function phoneDigitsWithoutCountryCode(
  raw: string,
  countryCode?: string | null,
): string {
  let value = raw.trim();
  const cc = (countryCode ?? "").trim();
  if (value.startsWith("+")) {
    if (cc && value.startsWith(cc)) {
      value = value.slice(cc.length).trim();
    } else {
      value = value.replace(/^\+\d{1,4}\s*/, "");
    }
  }
  return phoneDigits(value);
}
