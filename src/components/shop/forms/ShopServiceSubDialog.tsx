import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { compactInputClass } from "../../admin/ContentPanel";
import DashboardPanelCard from "../../COMP";
import { useAuth } from "../../../auth";
import { apiMessage, removeMyServiceSubServices, saveMyServices, updateMyServices } from "../../../lib/shopOwnerMutations";
import type { ShopServiceCategory } from "../../../types/shopOwner";

type ShopServiceSubDialogProps = {
  category: ShopServiceCategory | null;
  editIndex: number | null;
  hasExistingServices: boolean;
  demoMode?: boolean;
  onDemoSave?: (categoryId: string, subServices: ShopServiceCategory["subServices"]) => void;
  onClose: () => void;
  onSaved: () => void;
};

export default function ShopServiceSubDialog({
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
    if (!category) return;
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
  }, [category, editIndex]);

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

  if (!category) return null;

  return (
    <DashboardPanelCard variant="form" className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 border-b border-ad-form-border pb-3">
        <h2 className="text-lg font-bold text-ad-green-dark">
          {editIndex != null ? "Edit" : "Add"} Sub-Service — {category.name}
        </h2>
      </div>

      <div className="flex flex-1 flex-col space-y-3">
        <input className={compactInputClass} placeholder="Name *" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={compactInputClass} placeholder="Price *" value={price} onChange={(e) => setPrice(e.target.value)} />
        <textarea className={compactInputClass} placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-ad-form-border bg-ad-form-bg px-3 py-2.5">
        {editIndex != null ? (
          <button type="button" className="text-sm font-semibold text-red-600" disabled={saving} onClick={() => void handleDelete()}>
            Delete
          </button>
        ) : (
          <span />
        )}
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded bg-ad-form-save px-4 py-1 text-sm font-bold text-white hover:brightness-95 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <span className="text-xs text-gray-700">
            or{" "}
            <button
              type="button"
              onClick={onClose}
              className="font-medium text-blue-600 underline hover:text-blue-700"
            >
              Cancel
            </button>
          </span>
        </div>
      </div>
    </DashboardPanelCard>
  );
}
