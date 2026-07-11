import { useEffect, useMemo, useRef, useState } from "react";
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
import { addSubServices, editSubService, fetchAdminServices } from "../../../lib/autoshopownerApi";
import { parseServiceCatalog } from "../../../lib/dummyServices";
import { apiMessage } from "../../../lib/shopOwnerMutations";
import type { ShopServiceCategory } from "../../../types/shopOwner";

type CatalogSub = ShopServiceCategory["subServices"][number];

type ShopServiceSubDialogProps = {
  category: ShopServiceCategory | null;
  editIndex: number | null;
  demoMode?: boolean;
  onDemoSave?: (categoryId: string, subServices: ShopServiceCategory["subServices"]) => void;
  onCancel: () => void;
  onSaved: () => void;
};

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

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
  const [catalogSubs, setCatalogSubs] = useState<CatalogSub[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const nameFieldRef = useRef<HTMLDivElement>(null);

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
    setShowSuggestions(false);
  }, [category, editIndex]);

  useEffect(() => {
    if (!category || demoMode || !token) {
      setCatalogSubs([]);
      return;
    }

    let cancelled = false;
    void (async () => {
      const findMatch = (catalog: ShopServiceCategory[]) =>
        catalog.find((item) => item.id === category.id) ??
        catalog.find(
          (item) =>
            normalizeName(item.name ?? "") === normalizeName(category.name ?? ""),
        );

      const first = await fetchAdminServices(token, {
        shopType: category.shopType || undefined,
        services: undefined,
      });
      if (cancelled) return;
      let match = first.ok ? findMatch(parseServiceCatalog(first.data)) : undefined;

      if (!match && category.shopType) {
        const all = await fetchAdminServices(token, { services: undefined });
        if (cancelled) return;
        if (all.ok) match = findMatch(parseServiceCatalog(all.data));
      }

      setCatalogSubs(match?.subServices ?? []);
    })();

    return () => {
      cancelled = true;
    };
  }, [category, demoMode, token]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!nameFieldRef.current?.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const existingNames = useMemo(() => {
    if (!category) return new Set<string>();
    return new Set(
      category.subServices
        .filter((_, index) => index !== editIndex)
        .map((sub) => normalizeName(sub.name))
        .filter(Boolean),
    );
  }, [category, editIndex]);

  const suggestions = useMemo(() => {
    const query = normalizeName(name);
    return catalogSubs
      .filter((sub) => {
        const subName = normalizeName(sub.name);
        if (!subName || existingNames.has(subName)) return false;
        if (!query) return true;
        return subName.includes(query) || normalizeName(sub.desc).includes(query);
      })
      .slice(0, 8);
  }, [catalogSubs, existingNames, name]);

  const applySuggestion = (sub: CatalogSub) => {
    setName(sub.name);
    setDesc(sub.desc ?? "");
    setPrice(String(sub.price ?? ""));
    setQty(String(sub.qty != null && sub.qty > 0 ? sub.qty : 1));
    setTax(sub.tax != null ? String(sub.tax) : "13");
    setShowSuggestions(false);
  };

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
          <div ref={nameFieldRef} className="relative">
            <input
              className={shopCompactInputClass}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              disabled={saving}
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 ? (
              <ul className="absolute left-0 right-0 z-20 mt-1 max-h-48 overflow-auto rounded border border-gray-300 bg-white shadow-md">
                {suggestions.map((sub) => (
                  <li key={`${sub.name}-${sub.desc}`}>
                    <button
                      type="button"
                      className="flex w-full flex-col items-start gap-0.5 px-2.5 py-1.5 text-left hover:bg-[#f5cce8]"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applySuggestion(sub)}
                    >
                      <span className="text-xs font-semibold text-gray-900">{sub.name}</span>
                      {sub.desc ? (
                        <span className="line-clamp-1 text-[11px] text-gray-600">{sub.desc}</span>
                      ) : null}
                      <span className="text-[11px] font-medium text-gray-700">
                        ${sub.price}
                        {sub.qty != null ? ` · qty ${sub.qty}` : ""}
                        {sub.tax != null ? ` · tax ${sub.tax}%` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </CompactField>
        <CompactField label="Description" className="min-w-[12rem] flex-1">
          <input
            className={shopCompactInputClass}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
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
