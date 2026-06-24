import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { compactInputClass } from "../../admin/ContentPanel";
import { useAuth } from "../../../auth";
import { apiMessage, removeMyServiceSubServices, saveMyServices, updateMyServices } from "../../../lib/shopOwnerMutations";
import type { ShopServiceCategory } from "../../../types/shopOwner";
import { shopCancelButtonClass, shopSaveButtonClass } from "./ShopFormPage";

type ShopServiceSubDialogProps = {
  open: boolean;
  category: ShopServiceCategory | null;
  editIndex: number | null;
  hasExistingServices: boolean;
  demoMode?: boolean;
  onDemoSave?: (categoryId: string, subServices: ShopServiceCategory["subServices"]) => void;
  onClose: () => void;
  onSaved: () => void;
};

export default function ShopServiceSubDialog({
  open,
  category,
  editIndex,
  hasExistingServices,
  demoMode = false,
  onDemoSave,
  onClose,
  onSaved,
}: ShopServiceSubDialogProps) {
  const { token } = useAuth();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !category) return;
    if (editIndex != null && category.subServices[editIndex]) {
      const sub = category.subServices[editIndex];
      setName(sub.name);
      setPrice(String(sub.price));
      setDesc(sub.desc);
    } else {
      setName("");
      setPrice("");
      setDesc("");
    }
  }, [category, editIndex, open]);

  const handleSave = async () => {
    if (!category) return;
    if (!name.trim()) {
      toast.error("Sub-service name is required.");
      return;
    }
    const priceNum = parseFloat(price);
    if (!Number.isFinite(priceNum)) {
      toast.error("Enter a valid price.");
      return;
    }
    const nextSubs = [...category.subServices];
    const entry = { id: editIndex != null ? nextSubs[editIndex]?.id : undefined, name: name.trim(), desc: desc.trim(), price: priceNum };
    if (editIndex != null) nextSubs[editIndex] = entry;
    else nextSubs.push(entry);

    if (demoMode && onDemoSave) {
      onDemoSave(category.id, nextSubs);
      toast.success("Saved.");
      onSaved();
      onClose();
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
      toast.success(apiMessage(res.data) || "Saved.");
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!category || editIndex == null) return;
    const subName = category.subServices[editIndex]?.name;
    if (!subName) return;

    if (demoMode && onDemoSave) {
      const nextSubs = category.subServices.filter((_, index) => index !== editIndex);
      onDemoSave(category.id, nextSubs);
      toast.success("Deleted.");
      onSaved();
      onClose();
      return;
    }

    if (!token) return;
    setSaving(true);
    try {
      const res = await removeMyServiceSubServices(token, category.id, subName);
      if (!res.ok) {
        toast.error(apiMessage(res.data) || "Could not delete.");
        return;
      }
      toast.success("Deleted.");
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open || !category) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-lg border border-gray-200 bg-white p-5 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-ad-purple">
          {editIndex != null ? "Edit" : "Add"} Sub-Service — {category.name}
        </h2>
        <div className="space-y-3">
          <input className={compactInputClass} placeholder="Name *" value={name} onChange={(e) => setName(e.target.value)} />
          <input className={compactInputClass} placeholder="Price *" value={price} onChange={(e) => setPrice(e.target.value)} />
          <textarea className={compactInputClass} placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} />
        </div>
        <div className="mt-5 flex justify-between gap-2">
          {editIndex != null ? (
            <button type="button" className="text-sm font-semibold text-red-600" disabled={saving} onClick={() => void handleDelete()}>
              Delete
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button type="button" className={shopCancelButtonClass} onClick={onClose}>Cancel</button>
            <button type="button" className={shopSaveButtonClass} disabled={saving} onClick={() => void handleSave()}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
