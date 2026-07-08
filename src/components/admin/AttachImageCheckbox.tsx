import { useRef } from "react";

type AttachImageCheckboxProps = {
  label?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept?: string;
  uploadButtonText?: string;
  className?: string;
};

export default function AttachImageCheckbox({
  label = "Attach Image",
  checked,
  onCheckedChange,
  file,
  onFileChange,
  accept = "image/*",
  uploadButtonText = "Upload File",
  className = "",
}: AttachImageCheckboxProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleCheckedChange = (next: boolean) => {
    onCheckedChange(next);
    if (!next) {
      onFileChange(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={`flex flex-col items-start gap-1.5 ${className}`}>
      <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-ad-green-dark">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => handleCheckedChange(e.target.checked)}
          className="h-3.5 w-3.5 accent-ad-purple"
        />
        {label}
      </label>
      {checked ? (
        <label className="inline-block cursor-pointer rounded border border-gray-400 bg-gray-200 px-3 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-300">
          {file?.name || uploadButtonText}
          <input
            type="file"
            accept={accept}
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            ref={inputRef}
            className="hidden"
          />
        </label>
      ) : null}
    </div>
  );

}
