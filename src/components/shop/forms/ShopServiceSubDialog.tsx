import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  CompactField,
  CompactFormPanel,
  CompactFormRow,
} from "../../admin/ContentPanel";
import { shopCompactInputClass, shopCompactTextareaClass } from "../shopLayoutStyles";
import { useAuth } from "../../../auth";
import { apiMessage, saveMyServices, updateMyServices } from "../../../lib/shopOwnerMutations";
import type { ShopServiceCategory } from "../../../types/shopOwner";

const checkboxBoxClass =
  "inline-block border border-gray-300 bg-gray-100 px-2 py-0.5 text-xs text-gray-800";

type ShopServiceSubDialogProps = {
  category: ShopServiceCategory | null;
  editIndex: number | null;
  hasExistingServices: boolean;
  demoMode?: boolean;
  onDemoSave?: (categoryId: string, subServices: ShopServiceCategory["subServices"]) => void;
  onCancel: () => void;
  onSaved: () => void;
};

export default function ShopServiceSubDialog({
  category,
  editIndex,
  hasExistingServices,
  demoMode = false,
  onDemoSave,
  onCancel,
  onSaved,
}: ShopServiceSubDialogProps) {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("1");
  const [desc, setDesc] = useState("");
  const [showUploadImage, setShowUploadImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!category) return;
    if (editIndex != null && category.subServices[editIndex]) {
      const sub = category.subServices[editIndex];
      setName(sub.name);
      setPrice(String(sub.price));
      setDesc(sub.desc);
      setQty("1");
    } else {
      setName("");
      setPrice("");
      setDesc("");
      setQty("1");
    }
    setShowUploadImage(false);
    setImageFile(null);
  }, [category, editIndex]);

  const handleSave = async () => {
    if (!category) return;
    if (!name.trim()) {
      toast.error("Sub-category name is required.");
      return;
    }
    const priceNum = parseFloat(price);
    if (!Number.isFinite(priceNum)) {
      toast.error("Enter a valid unit price.");
      return;
    }
    const nextSubs = [...category.subServices];
    const entry = {
      id: editIndex != null ? nextSubs[editIndex]?.id : undefined,
      name: name.trim(),
      desc: desc.trim(),
      price: priceNum,
    };
    if (editIndex != null) nextSubs[editIndex] = entry;
    else nextSubs.push(entry);

    if (demoMode && onDemoSave) {
      onDemoSave(category.id, nextSubs);
      toast.success(editIndex != null ? "Updated." : "Saved.");
      onSaved();
      onCancel();
      return;
    }

    if (!token) return;
    setSaving(true);
    try {
      const payload = [{ id: category.id, subServices: nextSubs }];
      const res = hasExistingServices
        ? await updateMyServices(token, payload)
        : await saveMyServices(token, payload);
      if (!res.ok) {
        toast.error(apiMessage(res.data) || "Could not save.");
        return;
      }
      toast.success(apiMessage(res.data) || (editIndex != null ? "Updated." : "Saved."));
      onSaved();
      onCancel();
    } finally {
      setSaving(false);
    }
  };

  if (!category) return null;

  const isEditing = editIndex != null;
  const saveLabel = isEditing ? "Update" : "Save";
  const savingLabel = isEditing ? "Updating…" : "Saving…";

  return (
    <CompactFormPanel
      className="mb-4 shrink-0"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-ad-form-border bg-ad-form-required-bg px-3 py-2.5">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="inline-flex min-w-[7.5rem] items-center justify-center rounded bg-ad-form-save px-6 py-1.5 text-sm font-bold text-white hover:brightness-95 disabled:opacity-60"
          >
            {saving ? savingLabel : saveLabel}
          </button>
          <span className="text-xs text-gray-700">
            or{" "}
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="font-medium text-blue-600 underline hover:text-blue-700 disabled:opacity-60"
            >
              Cancel
            </button>
          </span>
        </div>
      }
    >
      <CompactFormRow columns={4}>
        <CompactField label="Sub- Category" required>
          <input
            className={shopCompactInputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
          />
        </CompactField>
        <CompactField label="Description">
          <textarea
            className={shopCompactTextareaClass}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={1}
            disabled={saving}
          />
        </CompactField>
        <CompactField label="Unit Price" required>
          <input
            className={shopCompactInputClass}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            disabled={saving}
          />
        </CompactField>
        <CompactField label="Qty">
          <input
            className={shopCompactInputClass}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            inputMode="numeric"
            disabled={saving}
          />
        </CompactField>
      </CompactFormRow>

      <CompactFormRow className="items-start" columns={4}>
        <div className="min-w-0 w-full">
          <div className="flex flex-col items-start gap-2">
            <div className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                id="shop-sub-service-upload-image"
                checked={showUploadImage}
                onChange={(e) => setShowUploadImage(e.target.checked)}
                disabled={saving}
                className="h-3.5 w-3.5 accent-ad-green"
              />
              <label htmlFor="shop-sub-service-upload-image" className="text-xs font-bold text-ad-green-dark">
                Upload Image
              </label>
            </div>
            {showUploadImage ? (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                  className={`${checkboxBoxClass} hover:bg-gray-200 disabled:opacity-60`}
                >
                  Upload Image
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                />
                {imageFile ? (
                  <span className="text-xs text-gray-600">{imageFile.name}</span>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </CompactFormRow>
    </CompactFormPanel>
  );
}
