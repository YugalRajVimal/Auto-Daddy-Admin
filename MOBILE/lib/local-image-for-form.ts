/** Map file extensions to MIME types for multipart uploads from local gallery URIs. */
const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".bmp": "image/bmp",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".avif": "image/avif",
};

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/bmp": "bmp",
  "image/tiff": "tiff",
  "image/avif": "avif",
};

function pathFromUri(uri: string): string {
  return uri.split("?")[0]?.toLowerCase() ?? "";
}

/**
 * Prefer `pickerMime` from expo-image-picker when present; else infer from URI extension; else JPEG.
 */
export function guessImageMimeType(uri: string, pickerMime?: string | null): string {
  const m = typeof pickerMime === "string" ? pickerMime.trim().toLowerCase() : "";
  if (m.startsWith("image/")) {
    return m;
  }
  const path = pathFromUri(uri);
  for (const [ext, mime] of Object.entries(MIME_BY_EXT)) {
    if (path.endsWith(ext)) {
      return mime;
    }
  }
  return "image/jpeg";
}

function extensionForMime(mimeType: string): string {
  return EXT_BY_MIME[mimeType] ?? "jpg";
}

/**
 * Filename for multipart `name` — keeps picker-provided names; synthesizes `fallbackBase.ext` when missing.
 */
export function uploadFileNameForImageUri(
  uri: string,
  mimeType: string,
  pickerFileName?: string | null,
  fallbackBase = "image"
): string {
  const fromPicker = typeof pickerFileName === "string" ? pickerFileName.trim() : "";
  if (fromPicker.length > 0) {
    return fromPicker;
  }
  const segment = uri.split("/").pop()?.split("?")[0] ?? "";
  if (segment.includes(".")) {
    return segment;
  }
  return `${fallbackBase}.${extensionForMime(mimeType)}`;
}

export type LocalImageMultipartPart = { uri: string; name: string; type: string };

/** Build `{ uri, name, type }` for React Native FormData file parts. */
export function localImageMultipartPart(uri: string, opts?: {
  mimeType?: string | null;
  fileName?: string | null;
  fallbackBase?: string;
}): LocalImageMultipartPart {
  const type = guessImageMimeType(uri, opts?.mimeType);
  const name = uploadFileNameForImageUri(uri, type, opts?.fileName, opts?.fallbackBase ?? "image");
  return { uri, name, type };
}
