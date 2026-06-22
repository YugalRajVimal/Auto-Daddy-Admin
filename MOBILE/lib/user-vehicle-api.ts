import { putJson, type ApiResponse } from "@/lib/api";

export type UserVehiclePutEnvelope = {
  success?: boolean;
  message?: string;
  data?: unknown;
};

export function userVehiclePutMessage(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const m = (data as UserVehiclePutEnvelope).message;
  return typeof m === "string" ? m.trim() : "";
}

export function putUserVehicleDisabled(
  vehicleId: string,
  disabled: boolean,
  authToken: string
): Promise<ApiResponse<UserVehiclePutEnvelope>> {
  return putJson<UserVehiclePutEnvelope>(`/api/user/vehicle/${vehicleId}`, { disabled }, { authToken });
}
