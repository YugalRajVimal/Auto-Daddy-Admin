import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { getAuthHeader, readSession, clearSession } from "../auth/tokenStorage";
import { getSignInPathForRole } from "../auth/roleRegistry";

const baseURL = import.meta.env.VITE_API_URL as string;

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

type DebugConfig = InternalAxiosRequestConfig & {
  __apiDebug?: {
    method: string;
    url: string;
    request: unknown;
    role: string;
  };
};

let onUnauthorized: (() => void) | null = null;

export function registerUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

function shouldDebugApi(): boolean {
  if (!import.meta.env.DEV) return false;
  try {
    // Off only when explicitly disabled: localStorage.setItem("debug:api", "0")
    return window.localStorage.getItem("debug:api") !== "0";
  } catch {
    return true;
  }
}

function logApiDebug(
  meta: NonNullable<DebugConfig["__apiDebug"]>,
  response: unknown,
) {
  // eslint-disable-next-line no-console
  console.groupCollapsed(`[api] ${meta.method} ${meta.url}`);
  // eslint-disable-next-line no-console
  console.log("request:", meta.request ?? null);
  // eslint-disable-next-line no-console
  console.log("role:", meta.role);
  // eslint-disable-next-line no-console
  console.log("response:", response);
  // eslint-disable-next-line no-console
  console.groupEnd();
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const headers = getAuthHeader();
  if (headers.Authorization) {
    config.headers.Authorization = headers.Authorization;
  }

  if (shouldDebugApi()) {
    const session = readSession();
    (config as DebugConfig).__apiDebug = {
      method: config.method?.toUpperCase() ?? "GET",
      url: `${config.baseURL ?? ""}${config.url ?? ""}`,
      request: config.data ?? config.params ?? null,
      role: session?.role ?? "anonymous",
    };
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    const meta = (response.config as DebugConfig).__apiDebug;
    if (meta) {
      logApiDebug(meta, { status: response.status, data: response.data });
    }
    return response;
  },
  (error: AxiosError) => {
    const meta = (error.config as DebugConfig | undefined)?.__apiDebug;
    if (meta) {
      logApiDebug(meta, {
        status: error.response?.status ?? null,
        data: error.response?.data ?? null,
        error: error.message,
      });
    }
    if (error.response?.status === 401) {
      const session = readSession();
      if (import.meta.env.DEV) {
        console.debug("[api] 401 unauthorized", { role: session?.role });
      }
      if (onUnauthorized) {
        onUnauthorized();
      } else {
        const signInPath = session
          ? getSignInPathForRole(session.role)
          : "/";
        clearSession();
        window.location.href = signInPath;
      }
    }
    return Promise.reject(error);
  }
);

/** Returns Authorization header object — for legacy fetch calls during migration. */
export function authHeaders(): Record<string, string> {
  return getAuthHeader();
}

export default api;
