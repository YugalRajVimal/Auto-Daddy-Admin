const API_BASE = (import.meta.env.VITE_API_URL as string).replace(/\/+$/, "");

function authHeader(token: string | null | undefined): Record<string, string> {
  if (!token) return {};
  const t = token.trim();
  if (!t) return {};
  // Send token as-is (no Bearer prefix).
  return { Authorization: t };
}

export async function getJsonAutoshopowner<T>(path: string, token: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: authHeader(token),
  });
  const data = (await res.json().catch(() => null)) as T | null;
  return { ok: res.ok, status: res.status, data };
}

export async function postJsonAutoshopowner<T>(
  path: string,
  body: Record<string, unknown>,
  token: string,
) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as T | null;
  return { ok: res.ok, status: res.status, data };
}

export async function putJsonAutoshopowner<T>(
  path: string,
  body: Record<string, unknown>,
  token: string,
) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as T | null;
  return { ok: res.ok, status: res.status, data };
}

export async function deleteJsonAutoshopowner<T>(
  path: string,
  token: string,
  body?: Record<string, unknown>,
) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => null)) as T | null;
  return { ok: res.ok, status: res.status, data };
}

export async function putFormAutoshopowner<T>(path: string, body: FormData, token: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: authHeader(token),
    body,
  });
  const data = (await res.json().catch(() => null)) as T | null;
  return { ok: res.ok, status: res.status, data };
}

