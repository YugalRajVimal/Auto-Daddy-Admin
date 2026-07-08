import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { getAuthHeader, readSession, clearSession } from "../auth/tokenStorage";
import { getSignInPathForRole } from "../auth/roleRegistry";

const baseURL = import.meta.env.VITE_API_URL as string;

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

let onUnauthorized: (() => void) | null = null;

export function registerUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const headers = getAuthHeader();
  if (headers.Authorization) {
    config.headers.Authorization = headers.Authorization;
  }

  if (import.meta.env.DEV) {
    const session = readSession();
    console.debug("[api]", config.method?.toUpperCase(), config.url, {
      role: session?.role ?? "anonymous",
    });
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
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
