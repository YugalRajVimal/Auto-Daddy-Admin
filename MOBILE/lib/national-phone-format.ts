/** Max visible length for `xxx xxx xxxx` national display. */
export const NATIONAL_PHONE_DISPLAY_MAX_LENGTH = 12;

export function digitsFromNationalPhoneDisplay(value: string): string {
  return (value ?? "").replace(/\D/g, "").slice(0, 10);
}

/** Formats up to 10 digits as `781 708 9765`. */
export function formatNationalPhoneDisplay(digitsOrRaw: string): string {
  const d = digitsFromNationalPhoneDisplay(digitsOrRaw);
  if (d.length <= 3) {
    return d;
  }
  if (d.length <= 6) {
    return `${d.slice(0, 3)} ${d.slice(3)}`;
  }
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

/** Use as `onChangeText` handler for a controlled national phone field. */
export function nationalPhoneDisplayFromKeystrokes(raw: string): string {
  return formatNationalPhoneDisplay(raw);
}
