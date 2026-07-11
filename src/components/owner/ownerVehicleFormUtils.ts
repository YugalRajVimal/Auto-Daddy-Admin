export const currentYear = new Date().getFullYear();

export const ownerVehicleFieldClass =
  "w-full min-h-[36px] rounded-lg border border-[#c8c8c8] bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-[#b0b0b0] focus:border-ad-green focus:outline-none";

export const ownerVehicleSelectClass = `${ownerVehicleFieldClass} appearance-none bg-[length:10px] bg-[right_12px_center] bg-no-repeat pr-9 [background-image:url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2210%22%20height%3D%2210%22%20viewBox%3D%220%200%2010%2010%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M1.5%203.5l3.5%204%203.5-4z%22/%3E%3C/svg%3E')]`;

export const ownerVehicleReadOnlyFieldClass =
  "w-full min-h-[36px] rounded-lg border border-[#d4d4d4] bg-[#ececec] px-3 py-2 text-sm text-gray-600 cursor-default focus:outline-none disabled:cursor-default disabled:border-[#d4d4d4] disabled:bg-[#ececec] disabled:text-gray-600 disabled:opacity-100";

export const ownerVehicleReadOnlySelectClass = `${ownerVehicleReadOnlyFieldClass} appearance-none pr-3`;

export type CarCompanyCatalogModel = {
  modelName: string;
  years: Array<string | number>;
};

export type CarCompanyCatalogItem = {
  companyName: string;
  brandLogo?: string | null;
  logoUrl?: string | null;
  models: CarCompanyCatalogModel[];
};

export type CarCompaniesResponse = {
  data?: CarCompanyCatalogItem[];
  message?: string;
  success?: boolean;
};

export type VehicleApiEnvelope = {
  success?: boolean;
  message?: string;
};

export function isValidVehicleYear(value: string) {
  const year = Number(value);
  return /^\d{4}$/.test(value) && year >= 1900 && year <= currentYear + 1;
}

export function trimVehicleApiMessage(payload: VehicleApiEnvelope | null) {
  return typeof payload?.message === "string" ? payload.message.trim() : "";
}
