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
