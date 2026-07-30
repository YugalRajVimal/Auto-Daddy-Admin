import type { FieldError, FieldErrors, FieldValues } from "react-hook-form";
import type { ZodError } from "zod";

export const FIELD_ERROR_TEXT_CLASS = "mt-0.5 text-[11px] font-semibold text-red-700";
export const FIELD_ERROR_BORDER_CLASS = " border-red-500";

export function fieldErrorClass(hasError: boolean, base = ""): string {
  return `${base}${hasError ? FIELD_ERROR_BORDER_CLASS : ""}`.trim();
}

export function FormFieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className={FIELD_ERROR_TEXT_CLASS}>{message}</p>;
}

/** First nested FieldError message from RHF errors object. */
export function firstFieldErrorMessage(errors: FieldErrors<FieldValues>): string | undefined {
  for (const value of Object.values(errors)) {
    if (!value) continue;
    if (typeof value === "object" && "message" in value && typeof (value as FieldError).message === "string") {
      return (value as FieldError).message;
    }
    if (typeof value === "object") {
      const nested = firstFieldErrorMessage(value as FieldErrors<FieldValues>);
      if (nested) return nested;
    }
  }
  return undefined;
}

export const VALIDATION_SUMMARY = "Please fix the highlighted fields.";

export function toastValidationSummary(notify: (msg: string) => void, errors?: FieldErrors<FieldValues>) {
  const first = errors ? firstFieldErrorMessage(errors) : undefined;
  notify(first || VALIDATION_SUMMARY);
}

/**
 * Converts Zod issues (from a manual `schema.safeParse()` call) into a flat
 * `{ field: message }` map, for forms that keep their own `useState` per
 * field instead of full RHF `register`/`control` wiring.
 */
export function zodIssuesToFieldErrorMap(error: ZodError): Record<string, string> {
  const map: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in map)) map[key] = issue.message;
  }
  return map;
}
