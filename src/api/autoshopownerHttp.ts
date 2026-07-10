const API_BASE = (import.meta.env.VITE_API_URL as string).replace(/\/+$/, "");

function authHeader(token: string | null | undefined): Record<string, string> {
  if (!token) return {};
  const t = token.trim();
  if (!t) return {};
  // Backend jwtAuth reads req.headers["authorization"] and verifies it directly.
  // In this codebase the token is stored/sent as the raw JWT (no "Bearer " prefix).
  return { Authorization: t };
}

function shouldDebug(): boolean {
  if (!import.meta.env.DEV) return false;
  try {
    // Off only when explicitly disabled: localStorage.setItem("debug:api", "0")
    return window.localStorage.getItem("debug:api") !== "0";
  } catch {
    return true;
  }
}

function debugLog(
  method: string,
  url: string,
  reqBody: unknown,
  res: { ok: boolean; status: number; data: unknown },
) {
  if (!shouldDebug()) return;
  // eslint-disable-next-line no-console
  console.groupCollapsed(`[autoshopowner-api] ${method} ${url} → ${res.status} ${res.ok ? "OK" : "ERR"}`);
  // eslint-disable-next-line no-console
  console.log("request:", reqBody ?? null);
  // eslint-disable-next-line no-console
  console.log("response:", res.data ?? null);
  // eslint-disable-next-line no-console
  console.groupEnd();
}

export async function getJsonAutoshopowner<T>(path: string, token: string) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: authHeader(token),
  });
  const data = (await res.json().catch(() => null)) as T | null;
  const out = { ok: res.ok, status: res.status, data };
  debugLog("GET", url, null, out);
  return out;
}

export async function postJsonAutoshopowner<T>(
  path: string,
  body: Record<string, unknown>,
  token: string,
) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as T | null;
  const out = { ok: res.ok, status: res.status, data };
  debugLog("POST", url, body, out);
  return out;
}

export async function putJsonAutoshopowner<T>(
  path: string,
  body: Record<string, unknown>,
  token: string,
) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as T | null;
  const out = { ok: res.ok, status: res.status, data };
  debugLog("PUT", url, body, out);
  return out;
}

export async function deleteJsonAutoshopowner<T>(
  path: string,
  token: string,
  body?: Record<string, unknown>,
) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => null)) as T | null;
  const out = { ok: res.ok, status: res.status, data };
  debugLog("DELETE", url, body ?? null, out);
  return out;
}

export async function postFormAutoshopowner<T>(path: string, body: FormData, token: string) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: authHeader(token),
    body,
  });
  const data = (await res.json().catch(() => null)) as T | null;
  const out = { ok: res.ok, status: res.status, data };
  debugLog("POST", url, "[form-data]", out);
  return out;
}

export async function putFormAutoshopowner<T>(path: string, body: FormData, token: string) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: authHeader(token),
    body,
  });
  const data = (await res.json().catch(() => null)) as T | null;
  const out = { ok: res.ok, status: res.status, data };
  debugLog("PUT", url, "[form-data]", out);
  return out;
}

