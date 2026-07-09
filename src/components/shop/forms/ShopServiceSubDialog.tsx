import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  CompactField,
  CompactFormPanel,
  CompactFormRow,
} from "../../admin/ContentPanel";
import {
  shopCompactInputClass,
  shopProfileFormPanelClass,
  shopProfileFormPanelFooterClass,
} from "../shopLayoutStyles";
import { useAuth } from "../../../auth";
import { addSubServices, editSubService } from "../../../lib/autoshopownerApi";
import { apiMessage } from "../../../lib/shopOwnerMutations";
import type { ShopServiceCategory } from "../../../types/shopOwner";

type ShopServiceSubDialogProps = {
  category: ShopServiceCategory | null;
  editIndex: number | null;
  demoMode?: boolean;
  onDemoSave?: (categoryId: string, subServices: ShopServiceCategory["subServices"]) => void;
  onCancel: () => void;
  onSaved: () => void;
};

export default function ShopServiceSubDialog({
  category,
  editIndex,
  demoMode = false,
  onDemoSave,
  onCancel,
  onSaved,
}: ShopServiceSubDialogProps) {
  const { token } = useAuth();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("1");
  const [tax, setTax] = useState("13");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!category) return;
    if (editIndex != null && category.subServices[editIndex]) {
      const sub = category.subServices[editIndex];
      setName(sub.name);
      setPrice(String(sub.price));
      setDesc(sub.desc);
      setQty(String(sub.qty != null && sub.qty > 0 ? sub.qty : 1));
      setTax(sub.tax != null ? String(sub.tax) : "13");
    } else {
      setName("");
      setPrice("");
      setDesc("");
      setQty("1");
      setTax("13");
    }
  }, [category, editIndex]);

  const handleSave = async () => {
    if (!category) return;
    if (!name.trim()) {
      toast.error("Category name is required.");
      return;
    }
    const priceNum = parseFloat(price);
    if (!Number.isFinite(priceNum)) {
      toast.error("Enter a valid unit cost.");
      return;
    }
    const qtyNum = parseFloat(qty);
    if (!Number.isFinite(qtyNum) || qtyNum <= 0) {
      toast.error("Enter a valid quantity.");
      return;
    }
    const taxNum = parseFloat(tax);
    const nextSubs = [...category.subServices];
    const entry = {
      id: editIndex != null ? nextSubs[editIndex]?.id : undefined,
      name: name.trim(),
      desc: desc.trim(),
      price: priceNum,
      qty: qtyNum,
      ...(Number.isFinite(taxNum) ? { tax: taxNum } : {}),
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
      const subPayload = {
        name: name.trim(),
        desc: desc.trim(),
        price: priceNum,
        quantity: qtyNum,
        ...(Number.isFinite(taxNum) ? { tax: taxNum } : {}),
      };
      const res =
        editIndex != null
          ? await editSubService(token, {
              serviceId: category.id,
              subServiceIndex: editIndex,
              update: subPayload,
            })
          : await addSubServices(token, {
              serviceId: category.id,
              subServices: [subPayload],
            });
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

  const footerMessage = isEditing
    ? "You are editing a sub-service"
    : "You are creating the Category of Service list";

  return (
    <CompactFormPanel
      className={shopProfileFormPanelClass}
      showBottomBorder={false}
      footer={
        <div
          className={`flex flex-wrap items-center justify-between gap-2 px-4 py-1 ${shopProfileFormPanelFooterClass}`}
        >
          <div className="flex min-w-[180px] flex-1 items-center text-xs font-serif italic text-gray-800">
            {footerMessage}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="inline-flex min-w-[7.5rem] items-center justify-center gap-1.5 rounded bg-ad-form-save px-5 py-1 text-sm font-bold text-white hover:brightness-95 disabled:opacity-60"
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
        </div>
      }
    >
      <CompactFormRow className="flex-nowrap items-end gap-x-3 overflow-x-auto">
        <CompactField label="Name Category" required className="w-[10.5rem] shrink-0">
          <input
            className={shopCompactInputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
          />
        </CompactField>
        <CompactField label="Description" className="min-w-[12rem] flex-1">
          <textarea
            className={`${shopCompactInputClass} resize-none overflow-hidden`}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={1}
            disabled={saving}
          />
        </CompactField>
        <CompactField label="Unit Cost" required className="w-[4.5rem] shrink-0">
          <input
            className={shopCompactInputClass}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            disabled={saving}
          />
        </CompactField>
        <CompactField label="Qty" className="w-[3.5rem] shrink-0">
          <input
            className={shopCompactInputClass}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            inputMode="numeric"
            disabled={saving}
          />
        </CompactField>
        <CompactField label="Tax" className="w-[4.75rem] shrink-0">
          <div className="flex items-center gap-0.5">
            <input
              className={`${shopCompactInputClass} min-w-0 flex-1`}
              value={tax}
              onChange={(e) => setTax(e.target.value)}
              inputMode="decimal"
              disabled={saving}
            />
            <span className="shrink-0 text-xs font-semibold text-gray-700">%</span>
          </div>
        </CompactField>
      </CompactFormRow>
    </CompactFormPanel>
  );
}
