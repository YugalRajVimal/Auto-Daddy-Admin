import type { PickedImage } from "@/components/car-owner/my-vehicles/add-vehicle-helpers";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { Image } from "react-native";

/** Longest side cap (px) before upload — enough for readable document photos. */
const MAX_LONG_EDGE = 1920;
/** JPEG quality for multipart upload (balance size vs. legibility). */
const JPEG_QUALITY = 0.72;

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (e) => reject(e)
    );
  });
}

function jpegFileNameFromPicker(picked: PickedImage): string {
  const base =
    typeof picked.fileName === "string" ? picked.fileName.replace(/\.[^.]+$/, "").trim() : "";
  return base.length > 0 ? `${base}.jpg` : "document.jpg";
}

/**
 * Downscales large images and re-encodes as JPEG to shrink upload size.
 * On failure, returns the original `picked` so upload can still proceed.
 */
export async function prepareImageForDocumentUpload(picked: PickedImage): Promise<PickedImage> {
  const fallbackName = jpegFileNameFromPicker(picked);
  try {
    const { width: w, height: h } = await getImageSize(picked.uri);
    const longEdge = Math.max(w, h);
    const actions =
      longEdge > MAX_LONG_EDGE
        ? w >= h
          ? [{ resize: { width: MAX_LONG_EDGE } }]
          : [{ resize: { height: MAX_LONG_EDGE } }]
        : [];

    const out = await manipulateAsync(picked.uri, actions, {
      compress: JPEG_QUALITY,
      format: SaveFormat.JPEG,
    });
    return {
      uri: out.uri,
      mimeType: "image/jpeg",
      fileName: fallbackName,
    };
  } catch {
    return picked;
  }
}
