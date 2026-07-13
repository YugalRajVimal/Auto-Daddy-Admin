export const currentYear = new Date().getFullYear();

export const ownerVehicleLabelClass =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500";

export const ownerVehicleFieldClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70";

export const ownerVehicleSelectClass = `${ownerVehicleFieldClass} appearance-none bg-[length:10px] bg-[right_12px_center] bg-no-repeat pr-9 [background-image:url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2210%22%20height%3D%2210%22%20viewBox%3D%220%200%2010%2010%22%3E%3Cpath%20fill%3D%22%2364758b%22%20d%3D%22M1.5%203.5l3.5%204%203.5-4z%22/%3E%3C/svg%3E')]`;

export const ownerVehicleReadOnlyFieldClass =
  "h-10 w-full cursor-default rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 shadow-sm outline-none disabled:cursor-default disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-600 disabled:opacity-100";

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
