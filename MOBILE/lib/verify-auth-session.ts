import { postJson, type ApiResponse } from "@/lib/api";

export type AuthSessionVerifyResponse = {
  message?: string;
  error?: string;
};

/** National digits only, matching OTP login payloads. */
export function normalizeAuthSessionPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function isAuthSessionUnauthorized(
  response: ApiResponse<AuthSessionVerifyResponse>
): boolean {
  if (response.status === 401 || response.status === 403) {
    return true;
  }
  const error = response.data?.error;
  return typeof error === "string" && error.toLowerCase().includes("unauthorized");
}

export function isAuthSessionVerified(
  response: ApiResponse<AuthSessionVerifyResponse>
): boolean {
  if (isAuthSessionUnauthorized(response)) {
    return false;
  }
  const message = response.data?.message;
  return (
    response.ok &&
    typeof message === "string" &&
    message.trim().toLowerCase() === "verified"
  );
}

/**
 * POST /api/auth/ — confirms the stored token still matches the account phone.
 * Wrong phone or expired token returns `{ error: "Unauthorized Access" }` (or 401).
 */
export async function verifyAuthSessionWithServer(
  authToken: string,
  countryCode: string,
  phone: string
): Promise<ApiResponse<AuthSessionVerifyResponse>> {
  return postJson<AuthSessionVerifyResponse>(
    "/api/auth/",
    {
      countryCode,
      phone: normalizeAuthSessionPhone(phone),
    },
    { authToken }
  );
}
