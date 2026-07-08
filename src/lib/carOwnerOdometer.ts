export function odometerToNumber(value: string | number | null | undefined): number | null {
  if (value == null) return null;
  const n = Number(String(value).trim());
  return Number.isFinite(n) ? n : null;
}

export function remainingKmNumber(due: number | null, reading: number | null): number | null {
  if (due == null || reading == null) return null;
  return due - reading;
}

export function formatOdometerStatus(remaining: number | null): string {
  if (remaining == null) return "—";
  if (remaining > 0) return `${remaining.toLocaleString()} Kms left`;
  if (remaining === 0) return "Service due now";
  return `${Math.abs(remaining).toLocaleString()} Kms overdue`;
}
