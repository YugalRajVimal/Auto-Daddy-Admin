import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
import { getJson } from "../../../api/mobileAuth";
import { useAuth } from "../../../auth";
import { addSubServices, editSubService, fetchAdminServices } from "../../../lib/autoshopownerApi";
import { parseServiceCatalog } from "../../../lib/dummyServices";
import { apiMessage } from "../../../lib/shopOwnerMutations";
import type { ShopServiceCategory } from "../../../types/shopOwner";

type CatalogSub = ShopServiceCategory["subServices"][number];

type SuggestionEntry = CatalogSub & {
  serviceId: string;
  serviceName: string;
};

type CarCompanyCatalogItem = {
  companyName: string;
  models: Array<{ modelName: string; years: Array<string | number> }>;
};

type ShopServiceSubDialogProps = {
  category: ShopServiceCategory | null;
  editIndex: number | null;
  /** Already-loaded shop services — used immediately for name suggestions. */
  suggestionCategories?: ShopServiceCategory[];
  demoMode?: boolean;
  onDemoSave?: (categoryId: string, subServices: ShopServiceCategory["subServices"]) => void;
  onCancel: () => void;
  onSaved: () => void;
};

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function suggestionKey(sub: { name: string; make?: string; model?: string; serviceId?: string }): string {
  return [
    sub.serviceId ?? "",
    normalizeName(sub.name),
    normalizeName(sub.make ?? ""),
    normalizeName(sub.model ?? ""),
  ].join("|");
}

function collectSuggestionEntries(services: ShopServiceCategory[]): SuggestionEntry[] {
  const seen = new Set<string>();
  const out: SuggestionEntry[] = [];
  for (const service of services) {
    for (const sub of service.subServices) {
      if (!normalizeName(sub.name)) continue;
      const entry: SuggestionEntry = {
        ...sub,
        serviceId: service.id,
        serviceName: service.name ?? "",
      };
      const key = suggestionKey(entry);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(entry);
    }
  }
  return out;
}

function mergeSuggestionEntries(...lists: SuggestionEntry[][]): SuggestionEntry[] {
  const seen = new Set<string>();
  const out: SuggestionEntry[] = [];
  for (const list of lists) {
    for (const entry of list) {
      const key = suggestionKey(entry);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(entry);
    }
  }
  return out;
}

function fieldMatchesFilter(value: string | undefined, filter: string): boolean {
  const needle = normalizeName(filter);
  if (!needle) return true;
  const hay = normalizeName(value ?? "");
  // Unscoped catalog rows (no make/model) are available for any selection.
  if (!hay) return true;
  return hay === needle;
}

function serviceMatchesCategory(
  entry: SuggestionEntry,
  category: ShopServiceCategory | null,
): boolean {
  if (!category) return true;
  if (entry.serviceId && category.id && entry.serviceId === category.id) return true;
  const entryName = normalizeName(entry.serviceName);
  const categoryName = normalizeName(category.name ?? "");
  return Boolean(entryName && categoryName && entryName === categoryName);
}

export default function ShopServiceSubDialog({
  category,
  editIndex,
  suggestionCategories = [],
  demoMode = false,
  onDemoSave,
  onCancel,
  onSaved,
}: ShopServiceSubDialogProps) {
  const { token } = useAuth();
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("1");
  const [tax, setTax] = useState("13");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState<CarCompanyCatalogItem[]>([]);
  const [catalogSubs, setCatalogSubs] = useState<SuggestionEntry[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );
  const nameFieldRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const updateMenuPosition = useCallback(() => {
    const input = nameInputRef.current;
    if (!input) return;
    const rect = input.getBoundingClientRect();
    const gap = 2;
    const menuHeight = menuRef.current?.offsetHeight ?? 192;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    let top = rect.bottom + gap;
    if (spaceBelow < Math.min(menuHeight, 140) && spaceAbove > spaceBelow) {
      top = Math.max(gap, rect.top - menuHeight - gap);
    }
    setMenuStyle({
      top,
      left: rect.left,
      width: Math.max(rect.width, 220),
    });
  }, []);

  useEffect(() => {
    if (!token) {
      setCompanies([]);
      return;
    }
    let cancelled = false;
    void getJson<{ data?: CarCompanyCatalogItem[] }>("/api/user/car-companies", token).then((res) => {
      if (cancelled) return;
      if (res.ok && Array.isArray(res.data?.data)) setCompanies(res.data.data);
      else setCompanies([]);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!category) return;
    if (editIndex != null && category.subServices[editIndex]) {
      const sub = category.subServices[editIndex];
      setMake(sub.make ?? "");
      setModel(sub.model ?? "");
      setName(sub.name);
      setPrice(String(sub.price));
      setDesc(sub.desc);
      setQty(String(sub.qty != null && sub.qty > 0 ? sub.qty : 1));
      setTax(sub.tax != null ? String(sub.tax) : "13");
    } else {
      setMake("");
      setModel("");
      setName("");
      setPrice("");
      setDesc("");
      setQty("1");
      setTax("13");
    }
    setShowSuggestions(false);
  }, [category, editIndex]);

  useEffect(() => {
    // Seed from currently loaded shop categories so suggestions work even before the catalog fetch returns.
    if (suggestionCategories.length > 0) {
      setCatalogSubs(collectSuggestionEntries(suggestionCategories));
    }
  }, [suggestionCategories]);

  useEffect(() => {
    if (!category || demoMode || !token) {
      if (suggestionCategories.length === 0) setCatalogSubs([]);
      return;
    }

    let cancelled = false;
    void (async () => {
      const res = await fetchAdminServices(token, { services: undefined });
      if (cancelled) return;
      if (!res.ok) return;

      // Merge unique sub-services from /api/autoshopowner/services with shop-loaded ones.
      setCatalogSubs(
        mergeSuggestionEntries(
          collectSuggestionEntries(suggestionCategories),
          collectSuggestionEntries(parseServiceCatalog(res.data)),
        ),
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [category, demoMode, suggestionCategories, token]);

  const modelOptions = useMemo(() => {
    const company = companies.find((c) => c.companyName === make);
    const models = company?.models ?? [];
    if (model && !models.some((m) => m.modelName === model)) {
      return [{ modelName: model, years: [] as Array<string | number> }, ...models];
    }
    return models;
  }, [companies, make, model]);

  const makeOptions = useMemo(() => {
    const names = companies.map((c) => c.companyName);
    if (make && !names.includes(make)) return [make, ...names];
    return names;
  }, [companies, make]);

  const suggestions = useMemo(() => {
    const query = normalizeName(name);
    const makeKey = normalizeName(make);
    const modelKey = normalizeName(model);

    const scored = catalogSubs
      .filter((sub) => {
        if (!serviceMatchesCategory(sub, category)) return false;
        if (!fieldMatchesFilter(sub.make, make)) return false;
        if (!fieldMatchesFilter(sub.model, model)) return false;
        const subName = normalizeName(sub.name);
        if (!subName) return false;
        if (query && !subName.includes(query)) return false;
        return true;
      })
      .map((sub) => {
        let score = 0;
        if (makeKey && normalizeName(sub.make ?? "") === makeKey) score += 2;
        if (modelKey && normalizeName(sub.model ?? "") === modelKey) score += 2;
        return { sub, score };
      })
      .sort((a, b) => b.score - a.score || a.sub.name.localeCompare(b.sub.name));

    const seenNames = new Set<string>();
    const matched: SuggestionEntry[] = [];
    for (const { sub } of scored) {
      const subName = normalizeName(sub.name);
      if (seenNames.has(subName)) continue;
      seenNames.add(subName);
      matched.push(sub);
      if (matched.length >= 12) break;
    }
    return matched;
  }, [catalogSubs, category, make, model, name]);

  const openSuggestions = useCallback(() => {
    setShowSuggestions(true);
    updateMenuPosition();
  }, [updateMenuPosition]);

  useEffect(() => {
    if (!showSuggestions || suggestions.length === 0) return;
    updateMenuPosition();
    const raf = requestAnimationFrame(() => updateMenuPosition());
    window.addEventListener("scroll", updateMenuPosition, true);
    window.addEventListener("resize", updateMenuPosition);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", updateMenuPosition, true);
      window.removeEventListener("resize", updateMenuPosition);
    };
  }, [showSuggestions, suggestions, updateMenuPosition]);

  useEffect(() => {
    if (!showSuggestions) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (nameFieldRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setShowSuggestions(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowSuggestions(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [showSuggestions]);

  const applySuggestion = (sub: SuggestionEntry) => {
    setMake(sub.make ?? make);
    setModel(sub.model ?? model);
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
      make: make.trim(),
      model: model.trim(),
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
        make: make.trim(),
        model: model.trim(),
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
        <CompactField label="Make" className="w-[9rem] shrink-0">
          <select
            className={shopCompactInputClass}
            value={make}
            onChange={(e) => {
              setMake(e.target.value);
              setModel("");
              setShowSuggestions(false);
            }}
            disabled={saving}
          >
            <option value="">Select make</option>
            {makeOptions.map((companyName) => (
              <option key={companyName} value={companyName}>
                {companyName}
              </option>
            ))}
          </select>
        </CompactField>
        <CompactField label="Model" className="w-[9rem] shrink-0">
          <select
            className={shopCompactInputClass}
            value={model}
            onChange={(e) => {
              setModel(e.target.value);
              setShowSuggestions(false);
            }}
            disabled={saving || !make}
          >
            <option value="">Select model</option>
            {modelOptions.map((m) => (
              <option key={m.modelName} value={m.modelName}>
                {m.modelName}
              </option>
            ))}
          </select>
        </CompactField>
        <CompactField label="Name Category" required className="w-[10.5rem] shrink-0">
          <div ref={nameFieldRef} className="relative">
            <input
              ref={nameInputRef}
              className={shopCompactInputClass}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                openSuggestions();
              }}
              onFocus={openSuggestions}
              disabled={saving}
              autoComplete="off"
              role="combobox"
              aria-expanded={showSuggestions && suggestions.length > 0}
              aria-autocomplete="list"
            />
            {showSuggestions && suggestions.length > 0 && menuStyle
              ? createPortal(
                  <ul
                    ref={menuRef}
                    role="listbox"
                    style={{
                      position: "fixed",
                      top: menuStyle.top,
                      left: menuStyle.left,
                      width: menuStyle.width,
                      zIndex: 10000,
                    }}
                    className="max-h-52 overflow-auto rounded border border-gray-400 bg-white shadow-lg"
                  >
                    {suggestions.map((sub) => {
                      const vehicleLabel = [sub.make, sub.model].filter(Boolean).join(" · ");
                      return (
                        <li key={suggestionKey(sub)} role="option">
                          <button
                            type="button"
                            className="flex w-full flex-col items-start gap-0.5 px-2.5 py-1.5 text-left hover:bg-[#f5cce8]"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => applySuggestion(sub)}
                          >
                            <span className="text-sm font-semibold text-gray-900">{sub.name}</span>
                            {vehicleLabel ? (
                              <span className="text-[11px] font-medium text-gray-700">{vehicleLabel}</span>
                            ) : null}
                            {sub.desc ? (
                              <span className="line-clamp-1 text-[11px] text-gray-600">{sub.desc}</span>
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>,
                  document.body,
                )
              : null}
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
