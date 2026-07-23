import {
  deleteJson,
  getJson,
  patchJson,
  postFormData,
  postJson,
  putFormData,
  putJson,
  type ApiResponse,
} from "@/lib/api";

/** Thin wrappers matching web `autoshopownerHttp` signatures (token as positional arg). */

export function getJsonAutoshopowner<T>(path: string, token: string): Promise<ApiResponse<T>> {
  return getJson<T>(path, { authToken: token });
}

export function postJsonAutoshopowner<T>(
  path: string,
  body: Record<string, unknown>,
  token: string
): Promise<ApiResponse<T>> {
  return postJson<T>(path, body, { authToken: token });
}

export function putJsonAutoshopowner<T>(
  path: string,
  body: Record<string, unknown>,
  token: string
): Promise<ApiResponse<T>> {
  return putJson<T>(path, body, { authToken: token });
}

export function patchJsonAutoshopowner<T>(
  path: string,
  body: Record<string, unknown>,
  token: string
): Promise<ApiResponse<T>> {
  return patchJson<T>(path, body, { authToken: token });
}

export function deleteJsonAutoshopowner<T>(
  path: string,
  token: string,
  body?: Record<string, unknown>
): Promise<ApiResponse<T>> {
  return deleteJson<T>(path, { authToken: token, body });
}

export function postFormAutoshopowner<T>(
  path: string,
  body: FormData,
  token: string
): Promise<ApiResponse<T>> {
  return postFormData<T>(path, body, { authToken: token });
}

export function putFormAutoshopowner<T>(
  path: string,
  body: FormData,
  token: string
): Promise<ApiResponse<T>> {
  return putFormData<T>(path, body, { authToken: token });
}
