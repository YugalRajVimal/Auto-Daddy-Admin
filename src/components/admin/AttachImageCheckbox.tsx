import { useRef } from "react";
import { FaCamera } from "react-icons/fa";

type AttachImageCheckboxProps = {
  label?: string;
  required?: boolean;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Single-file mode (default). Ignored when `maxFiles` > 1. */
  file?: File | null;
  onFileChange?: (file: File | null) => void;
  /** Multi-file mode when `maxFiles` > 1. */
  files?: File[];
  onFilesChange?: (files: File[]) => void;
  /** Max selectable images. Defaults to 1. */
  maxFiles?: number;
  accept?: string;
  uploadButtonText?: string;
  className?: string;
  /**
   * "field" (admin content forms): a labelled box with a blue camera button instead of a checkbox.
   * Picking a file marks the image as attached; clearing it un-marks it.
   */
  variant?: "checkbox" | "field";
};

export default function AttachImageCheckbox({
  label = "Attach Image",
  required = false,
  checked,
  onCheckedChange,
  file = null,
  onFileChange,
  files = [],
  onFilesChange,
  maxFiles = 1,
  accept = "image/*",
  uploadButtonText = "Upload File",
  className = "",
  variant = "checkbox",
}: AttachImageCheckboxProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const multi = maxFiles > 1;
  const selectedFiles: File[] = multi ? files : file ? [file] : [];

  const clearInput = () => {
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleCheckedChange = (next: boolean) => {
    onCheckedChange(next);
    if (!next) {
      if (multi) onFilesChange?.([]);
      else onFileChange?.(null);
      clearInput();
    }
  };

  const handleFilesPicked = (list: FileList | null) => {
    const picked = Array.from(list ?? []).slice(0, maxFiles);
    if (multi) onFilesChange?.(picked);
    else onFileChange?.(picked[0] ?? null);
  };

  if (variant === "field") {
    const name = selectedFiles.length > 1 ? `${selectedFiles.length} files selected` : selectedFiles[0]?.name;
    return (
      <div className={`w-full ${className}`}>
        <span className="mb-1 block text-base text-gray-900">
          {label}
          {required ? <span className="text-red-600"> *</span> : null}
        </span>
        <div className="flex h-12 items-center justify-between gap-2 rounded-lg border border-gray-400 bg-white px-4">
          <span className="min-w-0 flex-1 truncate text-base text-gray-800">
            {name ?? (checked ? "Image attached" : "")}
          </span>
          {checked ? (
            <button
              type="button"
              onClick={() => handleCheckedChange(false)}
              aria-label="Remove image"
              className="text-lg leading-none text-gray-500 hover:text-red-600"
            >
              ×
            </button>
          ) : null}
          <label className="cursor-pointer text-[#0000ff] hover:text-blue-900" title="Choose image">
            <FaCamera size={26} aria-hidden />
            <input
              type="file"
              accept={accept}
              multiple={multi}
              ref={inputRef}
              className="hidden"
              onChange={(e) => {
                handleFilesPicked(e.target.files);
                if ((e.target.files?.length ?? 0) > 0) onCheckedChange(true);
              }}
            />
          </label>
        </div>
      </div>
    );
  }

  const buttonLabel =
    selectedFiles.length === 0
      ? uploadButtonText
      : selectedFiles.length === 1
        ? selectedFiles[0].name
        : `${selectedFiles.length} files selected`;

  return (
    <div className={`flex flex-col items-start gap-1.5 ${className}`}>
      <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-ad-green-dark">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => handleCheckedChange(e.target.checked)}
          className="h-3.5 w-3.5 accent-ad-purple"
        />
        <span>
          {label}
          {required ? <span className="text-red-600"> *</span> : null}
          {multi ? (
            <span className="font-medium text-gray-600"> (up to {maxFiles})</span>
          ) : null}
        </span>
      </label>
      {checked ? (
        <div className="flex flex-col items-start gap-1">
          <label className="inline-block cursor-pointer rounded border border-gray-400 bg-gray-200 px-3 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-300">
            {buttonLabel}
            <input
              type="file"
              accept={accept}
              multiple={multi}
              onChange={(e) => handleFilesPicked(e.target.files)}
              ref={inputRef}
              className="hidden"
            />
          </label>
          {multi && selectedFiles.length > 1 ? (
            <ul className="space-y-0.5 text-[11px] text-gray-600">
              {selectedFiles.map((f) => (
                <li key={`${f.name}-${f.size}-${f.lastModified}`} className="max-w-[12rem] truncate">
                  {f.name}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
