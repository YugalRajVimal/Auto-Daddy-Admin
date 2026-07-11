import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { CompactField } from "../admin/ContentPanel";
import { ShopDialogMotion } from "./ShopAnimated";
import { shopCompactInputClass } from "./shopLayoutStyles";

export type NumberingKind = "estimate" | "invoice";

export type NumberingValues = {
  code: string;
  number: string;
};

type ShopManageNumberingDialogProps = {
  open: boolean;
  kind: NumberingKind;
  initial: NumberingValues;
  onClose: () => void;
  onSave: (values: NumberingValues) => void;
};

const COPY: Record<
  NumberingKind,
  { title: string; codeLabel: string; numberLabel: string }
> = {
  estimate: {
    title: "Manage Estimate",
    codeLabel: "Estimate Code",
    numberLabel: "Estimate Number",
  },
  invoice: {
    title: "Manage Invoice",
    codeLabel: "Invoice Code",
    numberLabel: "Invoice Number",
  },
};

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden className="shrink-0">
      <path
        d="M8.1 2.2h3.8l.35 1.7a5.9 5.9 0 0 1 1.45.84l1.7-.45 1.9 3.3-1.35 1.15c.1.4.15.81.15 1.24s-.05.84-.15 1.24l1.35 1.15-1.9 3.3-1.7-.45a5.9 5.9 0 0 1-1.45.84l-.35 1.7H8.1l-.35-1.7a5.9 5.9 0 0 1-1.45-.84l-1.7.45-1.9-3.3 1.35-1.15A5.9 5.9 0 0 1 4.9 9.98c0-.43.05-.84.15-1.24L3.7 7.59l1.9-3.3 1.7.45c.43-.34.91-.62 1.45-.84L8.1 2.2Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export default function ShopManageNumberingDialog({
  open,
  kind,
  initial,
  onClose,
  onSave,
}: ShopManageNumberingDialogProps) {
  const copy = COPY[kind];
  const [code, setCode] = useState(initial.code);
  const [number, setNumber] = useState(initial.number);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCode(initial.code);
    setNumber(initial.number);
    setSaving(false);
  }, [open, initial.code, initial.number]);

  const handleUpdate = () => {
    const trimmedNumber = number.trim();
    if (!trimmedNumber) {
      toast.error(`${copy.numberLabel} is required.`);
      return;
    }
    setSaving(true);
    onSave({ code: code.trim(), number: trimmedNumber });
    toast.success(`${copy.title.replace("Manage ", "")} settings updated.`);
    setSaving(false);
    onClose();
  };

  return (
    <ShopDialogMotion
      open={open}
      onClose={onClose}
      placement="top"
      panelClassName="w-full max-w-md overflow-hidden rounded-lg border border-[#b2e0a0] bg-[#CCFFCC] shadow-xl"
    >
      <div className="border-b border-[#b2e0a0] bg-[#d9ead3] px-4 py-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
          <GearIcon />
          {copy.title}
        </h2>
      </div>

      <div className="space-y-4 bg-[#e8ffe8] px-5 py-5">
        <CompactField label={copy.codeLabel} className="flex-none">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={saving}
            className={shopCompactInputClass}
            autoComplete="off"
          />
        </CompactField>

        <CompactField label={copy.numberLabel} required className="flex-none">
          <input
            type="text"
            inputMode="numeric"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            disabled={saving}
            className={shopCompactInputClass}
            autoComplete="off"
          />
        </CompactField>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-[#b2e0a0] bg-[#CCFFCC] px-5 py-3">
        <button
          type="button"
          onClick={handleUpdate}
          disabled={saving}
          className="inline-flex items-center justify-center rounded bg-[#008000] px-5 py-1.5 text-sm font-bold text-white hover:brightness-95 disabled:opacity-60"
        >
          {saving ? "Updating…" : "Update"}
        </button>
        <span className="text-xs text-gray-700">
          or{" "}
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="font-medium text-blue-600 underline hover:text-blue-700 disabled:opacity-60"
          >
            Cancel
          </button>
        </span>
      </div>
    </ShopDialogMotion>
  );
}
