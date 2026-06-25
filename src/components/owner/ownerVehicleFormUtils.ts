export const currentYear = new Date().getFullYear();

export const PREVIEW_CROP_WIDTH = 1200;
export const PREVIEW_CROP_HEIGHT = 900;

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

export async function cropImageToPreviewFrame(file: File): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read image."));
      el.src = url;
    });

    const targetRatio = PREVIEW_CROP_WIDTH / PREVIEW_CROP_HEIGHT;
    const sourceRatio = img.naturalWidth / img.naturalHeight;

    let cropW: number;
    let cropH: number;
    if (sourceRatio > targetRatio) {
      cropH = img.naturalHeight;
      cropW = cropH * targetRatio;
    } else {
      cropW = img.naturalWidth;
      cropH = cropW / targetRatio;
    }

    const sx = (img.naturalWidth - cropW) / 2;
    const sy = (img.naturalHeight - cropH) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = PREVIEW_CROP_WIDTH;
    canvas.height = PREVIEW_CROP_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not prepare image.");

    ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, PREVIEW_CROP_WIDTH, PREVIEW_CROP_HEIGHT);

    const mime = file.type.startsWith("image/") ? file.type : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, 0.9));
    if (!blob) throw new Error("Could not crop image.");

    return new File([blob], file.name || "vehicle.jpg", { type: blob.type || mime });
  } finally {
    URL.revokeObjectURL(url);
  }
}
