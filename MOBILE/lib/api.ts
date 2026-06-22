export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? process.env.API_URL ?? "https://app.autodaddy.ca";

export type ApiResponse<T> = {
  ok: boolean;
  status: number;
  data: T | null;
};

const DEFAULT_API_TIMEOUT_MS = 45_000;

type FormDataWithParts = FormData & {
  _parts?: Array<[string, unknown]>;
};

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return "(unserializable)";
  }
}

function summarizeFormValue(value: unknown): unknown {
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.uri === "string") {
      return {
        file: true,
        uri: obj.uri,
        name: typeof obj.name === "string" ? obj.name : undefined,
        type: typeof obj.type === "string" ? obj.type : undefined,
      };
    }
  }
  return value;
}

type FormDataPart = { key: string; value: unknown };

function iterateFormDataParts(body: FormData, onPart: (part: FormDataPart) => void): void {
  const parts = (body as FormDataWithParts)._parts;
  if (Array.isArray(parts)) {
    parts.forEach(([key, value]) => onPart({ key, value }));
    return;
  }

  const entries = (body as unknown as { entries?: () => Iterable<[string, unknown]> }).entries;
  if (typeof entries === "function") {
    for (const [key, value] of entries.call(body)) {
      onPart({ key, value });
    }
  }
}

function formDataToLogObject(body: FormData): Record<string, unknown> | string {
  const out: Record<string, unknown> = {};
  const append = (key: string, value: unknown) => {
    const next = summarizeFormValue(value);
    if (out[key] == null) {
      out[key] = next;
      return;
    }
    out[key] = Array.isArray(out[key]) ? [...out[key], next] : [out[key], next];
  };

  let hasParts = false;
  iterateFormDataParts(body, ({ key, value }) => {
    hasParts = true;
    append(key, value);
  });
  if (hasParts) {
    return out;
  }

  return "(multipart/form-data)";
}

function shellEscapeSingleQuoted(value: string): string {
  return value.replace(/'/g, `'\\''`);
}

type CurlFormField =
  | { key: string; kind: "text"; value: string }
  | { key: string; kind: "file"; path: string; mimeType?: string };

function formDataToCurlFields(body: FormData): CurlFormField[] {
  const fields: CurlFormField[] = [];
  iterateFormDataParts(body, ({ key, value }) => {
    if (value && typeof value === "object") {
      const obj = value as Record<string, unknown>;
      if (typeof obj.uri === "string") {
        fields.push({
          key,
          kind: "file",
          path: obj.uri.replace(/^file:\/\//, ""),
          mimeType: typeof obj.type === "string" ? obj.type : undefined,
        });
        return;
      }
    }
    fields.push({ key, kind: "text", value: String(value ?? "") });
  });
  return fields;
}

/** Multipart request as a copy-pastable curl command (dev only). */
export function formatMultipartRequestAsCurl(
  method: string,
  url: string,
  body: FormData,
  authToken?: string
): string {
  const lines = [`curl -X ${method} '${shellEscapeSingleQuoted(url)}'`];
  if (authToken) {
    lines.push(`  -H 'Authorization: ${shellEscapeSingleQuoted(authToken)}'`);
  }
  for (const field of formDataToCurlFields(body)) {
    if (field.kind === "file") {
      const typeSuffix = field.mimeType ? `;type=${field.mimeType}` : "";
      lines.push(
        `  -F '${shellEscapeSingleQuoted(field.key)}=@${shellEscapeSingleQuoted(field.path)}${typeSuffix}'`
      );
    } else {
      lines.push(`  -F '${shellEscapeSingleQuoted(field.key)}=${shellEscapeSingleQuoted(field.value)}'`);
    }
  }
  return lines.join(" \\\n");
}

/** Logs curl for multipart POST/PUT (e.g. create deal). Dev only. */
export function logMultipartCurl(method: string, url: string, body: FormData, authToken?: string): void {
  if (!__DEV__) {
    return;
  }
  console.log(`[api curl] ${method} ${url}\n${formatMultipartRequestAsCurl(method, url, body, authToken)}`);
}

/** JSON request as a copy-pastable curl command (dev only). */
export function formatJsonRequestAsCurl(
  method: string,
  url: string,
  body: Record<string, unknown>,
  authToken?: string
): string {
  const lines = [`curl --location '${shellEscapeSingleQuoted(url)}'`];
  if (authToken) {
    lines.push(`--header 'Authorization: ${shellEscapeSingleQuoted(authToken)}'`);
  }
  lines.push(`--header 'Content-Type: application/json'`);
  lines.push(`--data '${shellEscapeSingleQuoted(JSON.stringify(body))}'`);
  return lines.join(" \\\n");
}

/** Logs JSON request + curl (dev only). */
export function logJsonCurl(
  method: string,
  url: string,
  body: Record<string, unknown>,
  authToken?: string
): void {
  if (!__DEV__) {
    return;
  }
  console.log(`[api curl] ${method} ${url}\n${formatJsonRequestAsCurl(method, url, body, authToken)}`);
}

/** Logs every outgoing API request (method + full URL; JSON body or multipart fields). Does not log auth tokens. */
export function logApiRequest(method: string, url: string, body?: Record<string, unknown> | FormData): void {
  if (body instanceof FormData) {
    console.log(`[api] ${method} ${url}`, safeStringify(formDataToLogObject(body)));
    return;
  }
  if (body != null && typeof body === "object") {
    console.log(`[api] ${method} ${url}`, safeStringify(body));
    return;
  }
  console.log(`[api] ${method} ${url}`);
}

/** Logs API response status + JSON body (dev only). */
export function logApiResponse(
  method: string,
  url: string,
  status: number,
  ok: boolean,
  data: unknown
): void {
  if (!__DEV__) {
    return;
  }
  console.log(`[api response] ${method} ${url} ${status} ${ok ? "ok" : "error"}`, safeStringify(data));
}

async function requestJson<TData>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  options?: { body?: Record<string, unknown>; authToken?: string; timeoutMs?: number }
): Promise<ApiResponse<TData>> {
  const normalizedBase = API_BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const fullUrl = `${normalizedBase}${normalizedPath}`;
  if (options?.body != null) {
    logApiRequest(method, fullUrl, options.body);
    logJsonCurl(method, fullUrl, options.body, options.authToken);
  } else {
    logApiRequest(method, fullUrl);
  }
  const needsJsonContentType =
    method === "POST" ||
    method === "PUT" ||
    method === "PATCH" ||
    (method === "DELETE" && options?.body != null);

  const controller = new AbortController();
  const timeoutMs = options?.timeoutMs ?? DEFAULT_API_TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const response = await fetch(fullUrl, {
    method,
    headers: {
      ...(needsJsonContentType ? { "Content-Type": "application/json" } : {}),
      ...(options?.authToken ? { Authorization: options.authToken } : {}),
    },
    ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));

  const data = (await response.json().catch(() => null)) as TData | null;
  logApiResponse(method, fullUrl, response.status, response.ok, data);

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

async function sendFormData<TData>(
  method: "POST" | "PUT" | "PATCH",
  path: string,
  body: FormData,
  options?: { authToken?: string; timeoutMs?: number }
): Promise<ApiResponse<TData>> {
  const normalizedBase = API_BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const fullUrl = `${normalizedBase}${normalizedPath}`;
  logApiRequest(method, fullUrl, body);
  const controller = new AbortController();
  const timeoutMs = options?.timeoutMs ?? DEFAULT_API_TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const response = await fetch(fullUrl, {
    method,
    headers: {
      ...(options?.authToken ? { Authorization: options.authToken } : {}),
    },
    body,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));
  const data = (await response.json().catch(() => null)) as TData | null;
  logApiResponse(method, fullUrl, response.status, response.ok, data);
  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

/** POST `multipart/form-data`. Do not set `Content-Type`; the runtime sets the boundary. */
export async function postFormData<TData>(
  path: string,
  body: FormData,
  options?: { authToken?: string; timeoutMs?: number }
): Promise<ApiResponse<TData>> {
  return sendFormData<TData>("POST", path, body, options);
}

/** PUT `multipart/form-data`. Do not set `Content-Type`; the runtime sets the boundary. */
export async function putFormData<TData>(
  path: string,
  body: FormData,
  options?: { authToken?: string; timeoutMs?: number }
): Promise<ApiResponse<TData>> {
  return sendFormData<TData>("PUT", path, body, options);
}

export async function postJson<TData>(
  path: string,
  body: Record<string, unknown>,
  options?: { authToken?: string; timeoutMs?: number }
): Promise<ApiResponse<TData>> {
  return requestJson<TData>("POST", path, { body, authToken: options?.authToken, timeoutMs: options?.timeoutMs });
}

export async function putJson<TData>(
  path: string,
  body: Record<string, unknown>,
  options?: { authToken?: string; timeoutMs?: number }
): Promise<ApiResponse<TData>> {
  return requestJson<TData>("PUT", path, { body, authToken: options?.authToken, timeoutMs: options?.timeoutMs });
}

export async function patchJson<TData>(
  path: string,
  body: Record<string, unknown>,
  options?: { authToken?: string; timeoutMs?: number }
): Promise<ApiResponse<TData>> {
  return requestJson<TData>("PATCH", path, { body, authToken: options?.authToken, timeoutMs: options?.timeoutMs });
}

export async function getJson<TData>(
  path: string,
  options?: { authToken?: string; timeoutMs?: number }
): Promise<ApiResponse<TData>> {
  return requestJson<TData>("GET", path, { authToken: options?.authToken, timeoutMs: options?.timeoutMs });
}

export async function deleteJson<TData>(
  path: string,
  options?: { authToken?: string; body?: Record<string, unknown>; timeoutMs?: number }
): Promise<ApiResponse<TData>> {
  return requestJson<TData>("DELETE", path, {
    authToken: options?.authToken,
    body: options?.body,
    timeoutMs: options?.timeoutMs,
  });
}
