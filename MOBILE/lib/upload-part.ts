/** React Native multipart file part (expo ImagePicker / DocumentPicker). */
export type UploadPart = {
  uri: string;
  name?: string;
  type?: string;
};

export function appendUploadPart(fd: FormData, key: string, part: UploadPart | null | undefined) {
  if (!part?.uri) return;
  fd.append(key, {
    uri: part.uri,
    name: part.name ?? "upload.jpg",
    type: part.type ?? "image/jpeg",
  } as never);
}
