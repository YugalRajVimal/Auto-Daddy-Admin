import type { SessionMeta, UserRole } from "../auth/types";

const API_BASE = (import.meta.env.VITE_API_URL as string).replace(/\/+$/, "");

function shouldDebugApi(): boolean {
  if (!import.meta.env.DEV) return false;
  try {
    return window.localStorage.getItem("debug:api") === "1";
  } catch {
    return false;
  }
}

function debugApi(method: string, url: string, request: unknown, response: unknown) {
  if (!shouldDebugApi()) return;
  // eslint-disable-next-line no-console
  console.groupCollapsed(`[api] ${method} ${url}`);
  // eslint-disable-next-line no-console
  console.log("request:", request ?? null);
  // eslint-disable-next-line no-console
  console.log("response:", response ?? null);
  // eslint-disable-next-line no-console
  console.groupEnd();
}

export type OtpRequestResponse = { message?: string };

export type VerifyOtpResponse = {
  message?: string;
  token?: string;
  role?: string;
  name?: string;
  profilePhoto?: string | null;
  isProfileComplete?: boolean;
  isAutoShopBusinessProfileComplete?: boolean;
};

export type AuthSessionVerifyResponse = {
  message?: string;
  error?: string;
};

export async function postJson<T>(path: string, body: Record<string, unknown>, token?: string) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as T | null;
  const out = { ok: res.ok, status: res.status, data };
  debugApi("POST", url, body, out);
  return out;
}

export async function getJson<T>(path: string, token: string) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { Authorization: token },
  });
  const data = (await res.json().catch(() => null)) as T | null;
  const out = { ok: res.ok, status: res.status, data };
  debugApi("GET", url, null, out);
  return out;
}

export async function postFormData<T>(path: string, body: FormData, token: string) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: token },
    body,
  });
  const data = (await res.json().catch(() => null)) as T | null;
  const out = { ok: res.ok, status: res.status, data };
  debugApi("POST", url, "[form-data]", out);
  return out;
}

export async function putFormData<T>(path: string, body: FormData, token: string) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { Authorization: token },
    body,
  });
  const data = (await res.json().catch(() => null)) as T | null;
  const out = { ok: res.ok, status: res.status, data };
  debugApi("PUT", url, "[form-data]", out);
  return out;
}

export async function putJson<T>(
  path: string,
  body: Record<string, unknown>,
  token: string
) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as T | null;
  const out = { ok: res.ok, status: res.status, data };
  debugApi("PUT", url, body, out);
  return out;
}

export async function patchJson<T>(
  path: string,
  body: Record<string, unknown>,
  token: string
) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as T | null;
  const out = { ok: res.ok, status: res.status, data };
  debugApi("PATCH", url, body, out);
  return out;
}

export async function deleteJson<T>(
  path: string,
  token: string,
  body?: Record<string, unknown>
) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => null)) as T | null;
  const out = { ok: res.ok, status: res.status, data };
  debugApi("DELETE", url, body ?? null, out);
  return out;
}

export function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function isCarOwnerBackendRole(role: string | null | undefined): boolean {
  const r = (role ?? "").toLowerCase().replace(/[-_\s]/g, "");
  return r === "carowner";
}

export function isShopOwnerBackendRole(role: string | null | undefined): boolean {
  return (role ?? "").toLowerCase() === "autoshopowner";
}

export function mapBackendRoleToUserRole(role: string | null | undefined): UserRole | null {
  if (isCarOwnerBackendRole(role)) return "car_owner";
  if (isShopOwnerBackendRole(role)) return "auto_shop_owner";
  return null;
}

export function buildSessionMeta(
  verify: VerifyOtpResponse,
  phone: string,
  countryCode: string
): SessionMeta {
  return {
    phone: normalizePhoneDigits(phone),
    countryCode,
    backendRole: verify.role,
    isProfileComplete: verify.isProfileComplete ?? null,
    isAutoShopBusinessProfileComplete: verify.isAutoShopBusinessProfileComplete ?? null,
  };
}

/** MOBILE: POST /api/auth/sign-up-log-in */
export async function sendMobileOtp(phone: string, countryCode: string) {
  return postJson<OtpRequestResponse>("/api/auth/sign-up-log-in", {
    countryCode,
    phone: normalizePhoneDigits(phone),
    deviceId: "web-browser",
    fcmToken: "",
  });
}

/** MOBILE: POST /api/auth/verify-otp */
export async function verifyMobileOtp(
  phone: string,
  countryCode: string,
  otp: string
) {
  return postJson<VerifyOtpResponse>("/api/auth/verify-otp", {
    countryCode,
    phone: normalizePhoneDigits(phone),
    otp,
    deviceId: "web-browser",
    fcmToken: "",
  });
}

/** MOBILE: POST /api/auth/ — validate stored session */
export async function verifyMobileSession(
  token: string,
  countryCode: string,
  phone: string
) {
  return postJson<AuthSessionVerifyResponse>("/api/auth/", {
    countryCode,
    phone: normalizePhoneDigits(phone),
  }, token);
}

export function isSessionVerified(response: AuthSessionVerifyResponse | null): boolean {
  const msg = (response?.message ?? "").toLowerCase();
  return msg === "verified";
}

export function isSessionUnauthorized(status: number, response: AuthSessionVerifyResponse | null): boolean {
  if (status === 401 || status === 403) return true;
  const err = (response?.error ?? response?.message ?? "").toLowerCase();
  return err.includes("unauthorized");
}
