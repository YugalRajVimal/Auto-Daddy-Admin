import * as ImagePicker from "expo-image-picker";

/**
 * Landscape rectangle for deal hero images (car-owner card + shop-owner upload).
 * 16:9 is widely supported by native crop UIs (unlike very wide device-specific ratios).
 */
export const DEAL_CARD_IMAGE_ASPECT: [number, number] = [16, 9];
export const DEAL_CARD_IMAGE_ASPECT_RATIO = 16 / 9;

export function dealCardImageCropAspect(): [number, number] {
  return DEAL_CARD_IMAGE_ASPECT;
}

export function dealCardImageAspectRatio(): number {
  return DEAL_CARD_IMAGE_ASPECT_RATIO;
}

export type PickedDealImage = {
  uri: string;
  mimeType: string | null;
  fileName: string | null;
};

/** Launch library picker with 16:9 rectangular crop. Request permission before calling. */
export async function pickDealImageFromLibrary(): Promise<PickedDealImage | null> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: dealCardImageCropAspect(),
    quality: 0.85,
  });
  const asset = res.canceled ? null : res.assets[0];
  if (!asset?.uri) {
    return null;
  }
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? null,
    fileName: asset.fileName ?? null,
  };
}

/**
 * Pick up to `max` deal images. Multi-select disables in-picker crop (Expo limitation),
 * so images are taken as-is at quality 0.85.
 */
export async function pickDealImagesFromLibrary(
  max = 2
): Promise<PickedDealImage[]> {
  const limit = Math.max(1, Math.min(2, max));
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    selectionLimit: limit,
    quality: 0.85,
  });
  if (res.canceled || !res.assets?.length) return [];
  return res.assets
    .filter((a) => Boolean(a.uri))
    .slice(0, limit)
    .map((asset) => ({
      uri: asset.uri,
      mimeType: asset.mimeType ?? null,
      fileName: asset.fileName ?? null,
    }));
}
