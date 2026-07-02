import { useEffect, useMemo, useRef, useState } from "react";
import { FiPaperclip } from "react-icons/fi";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import ComboSelectWithEditor from "../../../components/admin/ComboSelectWithEditor";
import ListEditorPopup from "../../../components/admin/ListEditorPopup";
import {
  CompactAutoGrowTextarea,
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactFixedFieldWidth,
  compactInputClass,
} from "../../../components/admin/ContentPanel";
import { adminNotify } from "../../../utils/adminNotify";
import {
  DUMMY_BANKS,
  DUMMY_EXPENSES,
  DUMMY_INCOME,
  formatDisplayDate,
  type BankRow,
  type LedgerRow,
} from "./accountData";
import {
  categoryLabel,
  cloneCategories,
  dedupeLabels,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  slugifyLabel,
  type CategoryOption,
} from "./ledgerCategories";

const BANK_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const INCOME_PAYMENT_MODE_OPTIONS = ["Bank Transfer", "Cash", "Cheque", "Online Payment"] as const;

type PageVariant = "bank" | "expenses" | "income";

type AccountsPageProps = {
  initialShowForm?: boolean;
  title?: string;
  variant?: PageVariant;
};

const BANKS_STORAGE_KEY = "admin.accounts.banks.v1";

function loadStoredBanks(fallback: BankRow[]) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(BANKS_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return fallback;
    return parsed as BankRow[];
  } catch {
    return fallback;
  }
}

function persistBanks(banks: BankRow[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BANKS_STORAGE_KEY, JSON.stringify(banks));
  } catch {
    // ignore persistence errors (private mode / quota)
  }
}

function normalizeVendorLabel(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function VendorComboField({
  label,
  required,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (next: string) => void;
  options: string[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const normalizedValue = value;
  const filtered = useMemo(() => {
    const q = normalizeVendorLabel(normalizedValue).toLowerCase();
    const base = options
      .map(normalizeVendorLabel)
      .filter(Boolean)
      .filter((opt, idx, arr) => arr.findIndex((v) => v.toLowerCase() === opt.toLowerCase()) === idx);
    if (!q) return base.slice(0, 25);
    return base.filter((opt) => opt.toLowerCase().includes(q)).slice(0, 25);
  }, [normalizedValue, options]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [normalizedValue, open]);

  const listboxId = `vendor-listbox-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <CompactField label={label} required={required} className={className}>
      <div ref={rootRef} className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
              setOpen(true);
              return;
            }
            if (!open) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) => Math.max(0, i - 1));
            } else if (e.key === "Enter") {
              const hit = filtered[activeIndex];
              if (hit) {
                e.preventDefault();
                onChange(hit);
                setOpen(false);
              }
            }
          }}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          className={compactInputClass}
          autoComplete="off"
        />

        {open && filtered.length > 0 ? (
          <div
            id={listboxId}
            role="listbox"
            className="absolute left-0 right-0 z-50 mt-0.5 max-h-52 overflow-y-auto rounded border border-gray-400 bg-white shadow-lg"
          >
            {filtered.map((opt, idx) => {
              const active = idx === activeIndex;
              return (
                <button
                  key={`${opt}-${idx}`}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={`block w-full px-2 py-1.5 text-left text-sm hover:bg-gray-100 ${
                    active ? "bg-ad-green-light/60 font-semibold text-ad-green-dark" : "text-gray-900"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </CompactField>
  );
}

function BankAccountsPage({ initialShowForm = false, title = "Manage Banks" }: AccountsPageProps) {
  const [banks, setBanks] = useState(() => loadStoredBanks(DUMMY_BANKS));
  const [draft, setDraft] = useState<BankRow[]>(() => structuredClone(loadStoredBanks(DUMMY_BANKS)));
  const [showForm, setShowForm] = useState(initialShowForm);
  const [bankWalletName, setBankWalletName] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");

  useEffect(() => {
    setDraft(structuredClone(banks));
  }, [banks]);

  useEffect(() => {
    persistBanks(banks);
  }, [banks]);

  const hasDraftChanges = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(banks),
    [draft, banks]
  );

  const updateDraftRow = (id: number, patch: Partial<BankRow>) => {
    setDraft((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const setAssignToInvoice = (id: number) => {
    setDraft((prev) =>
      prev.map((row) => ({
        ...row,
        assignToInvoice: row.id === id,
      }))
    );
  };

  const resetNewBankForm = () => {
    setBankWalletName("");
    setOpeningBalance("");
  };

  const handleNewBankCancel = () => {
    resetNewBankForm();
    setShowForm(false);
  };

  const handleNewBankSave = () => {
    const label = bankWalletName.trim();
    if (!label) {
      adminNotify.error("Bank / wallet name is required.");
      return;
    }

    const parsedBalance = Number.parseFloat(openingBalance);
    const totalBalance = Number.isFinite(parsedBalance) ? parsedBalance : 0;
    const nextId = Math.max(0, ...banks.map((row) => row.id)) + 1;

    const newRow: BankRow = {
      id: nextId,
      label: label.toUpperCase(),
      assignToInvoice: banks.length === 0,
      status: "active",
      totalBalance,
      accountName: "",
      accountNumber: "",
      interac: "",
    };

    setBanks((prev) => [...prev, newRow]);
    resetNewBankForm();
    setShowForm(false);
    adminNotify.success("Bank account added.");
  };

  const handleTableUpdate = () => {
    setBanks(structuredClone(draft));
    adminNotify.success("Bank accounts updated.");
  };

  const handleTableCancel = () => {
    setDraft(structuredClone(banks));
  };

  const tableInputClass =
    "w-full min-w-[120px] border border-gray-400 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none";

  return (
    <AdminPage
      title={title}
      headerAction={
        !showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="shrink-0 rounded bg-ad-green px-4 py-2 text-sm font-bold text-white hover:bg-ad-green-dark"
          >
            + New Bank
          </button>
        ) : undefined
      }
      between={
        showForm ? (
          <CompactFormPanel
            footer={
              <CompactFormFooter
                message="You are creating a 'Bank / Wallet'"
                messageCenter
                onSave={handleNewBankSave}
                onCancel={handleNewBankCancel}
              />
            }
          >
            <CompactFormRow className="items-start">
              <CompactField label="Bank / Wallet Name" required className={compactFixedFieldWidth}>
                <input
                  type="text"
                  value={bankWalletName}
                  onChange={(e) => setBankWalletName(e.target.value)}
                  className={compactInputClass}
                />
              </CompactField>
              <CompactField label="Opening Balance" className={compactFixedFieldWidth}>
                <input
                  type="text"
                  inputMode="decimal"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  className={compactInputClass}
                />
              </CompactField>
            </CompactFormRow>
          </CompactFormPanel>
        ) : undefined
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-ad-purple text-white">
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">
                Assign to Invoice
              </th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Status</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">
                Total Balance
              </th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">
                Account Name
              </th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">
                Account Number
              </th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Interac</th>
            </tr>
          </thead>
          <tbody>
            {draft.map((row, idx) => (
              <tr key={row.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                <td className="border border-gray-300 px-3 py-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 font-bold uppercase">
                    <input
                      type="radio"
                      name="assignToInvoice"
                      checked={row.assignToInvoice}
                      onChange={() => setAssignToInvoice(row.id)}
                      className="accent-ad-purple"
                    />
                    {row.label}
                  </label>
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  <select
                    value={row.status}
                    onChange={(e) => updateDraftRow(row.id, { status: e.target.value })}
                    className={tableInputClass}
                  >
                    {BANK_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="border border-gray-300 px-3 py-2">{row.totalBalance}</td>
                <td className="border border-gray-300 px-3 py-2">
                  <input
                    type="text"
                    value={row.accountName}
                    onChange={(e) => updateDraftRow(row.id, { accountName: e.target.value })}
                    className={tableInputClass}
                  />
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  <input
                    type="text"
                    value={row.accountNumber}
                    onChange={(e) => updateDraftRow(row.id, { accountNumber: e.target.value })}
                    className={tableInputClass}
                  />
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  <input
                    type="email"
                    value={row.interac}
                    onChange={(e) => updateDraftRow(row.id, { interac: e.target.value })}
                    className={tableInputClass}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleTableUpdate}
          disabled={!hasDraftChanges}
          className="inline-flex items-center gap-1.5 rounded bg-ad-green px-4 py-1.5 text-sm font-bold text-white hover:bg-ad-green-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          Update
          <span aria-hidden className="text-base leading-none">
            →
          </span>
        </button>
        <span className="text-xs text-gray-700">
          or{" "}
          <button
            type="button"
            onClick={handleTableCancel}
            disabled={!hasDraftChanges}
            className="font-medium text-blue-600 underline hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
        </span>
      </div>
    </AdminPage>
  );
}

function LedgerPage({
  initialShowForm = false,
  title,
  variant,
}: {
  initialShowForm?: boolean;
  title: string;
  variant: "expenses" | "income";
}) {
  const isExpense = variant === "expenses";
  const isIncome = variant === "income";
  const baseCategories = isExpense ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const vendorLabel = "Vendor";
  const billLabel = isExpense ? "Bill Number" : "Invoice Number";
  const initialData = isExpense ? DUMMY_EXPENSES : DUMMY_INCOME;
  const [banks, setBanks] = useState<BankRow[]>(() => loadStoredBanks(DUMMY_BANKS));

  const [categories, setCategories] = useState<CategoryOption[]>(() => cloneCategories(baseCategories));
  const [rows, setRows] = useState(initialData);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showForm, setShowForm] = useState(initialShowForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("2026-06-20");
  const [paymentMode, setPaymentMode] = useState("");
  const [bank, setBank] = useState("");
  const [vendor, setVendor] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [notes, setNotes] = useState("");
  const [gst, setGst] = useState(false);
  const [gstAmount, setGstAmount] = useState("");
  const [hasBillNumber, setHasBillNumber] = useState(false);
  const [billNumber, setBillNumber] = useState("");
  const [byCheque, setByCheque] = useState(false);
  const [chequeAccount, setChequeAccount] = useState("");
  const [attachReceipt, setAttachReceipt] = useState(false);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);

  const [categoriesPopupOpen, setCategoriesPopupOpen] = useState(false);
  const [subcategoriesPopupOpen, setSubcategoriesPopupOpen] = useState(false);
  const [categoriesDraft, setCategoriesDraft] = useState<string[]>([""]);
  const [subcategoriesDraft, setSubcategoriesDraft] = useState<string[]>([""]);
  const categoriesSnapshotRef = useRef<CategoryOption[]>([]);
  const subcategoriesSnapshotRef = useRef<{ value: string; label: string }[]>([]);

  const categoryLabels = useMemo(() => categories.map((cat) => cat.label), [categories]);
  const selectedCategory = useMemo(
    () => categories.find((cat) => cat.value === category),
    [categories, category]
  );
  const subcategoryLabels = useMemo(
    () => selectedCategory?.subcategories.map((sub) => sub.label) ?? [],
    [selectedCategory]
  );
  const selectedCategoryLabel = selectedCategory?.label ?? "";
  const selectedSubcategoryLabel =
    selectedCategory?.subcategories.find((sub) => sub.value === subcategory)?.label ?? "";

  const subcategoryOptions = useMemo(() => selectedCategory?.subcategories ?? [], [selectedCategory]);
  const vendorOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const row of rows) {
      const normalized = normalizeVendorLabel(row.vendor);
      if (!normalized) continue;
      const key = normalized.toLowerCase();
      if (!seen.has(key)) seen.set(key, normalized);
    }
    return [...seen.values()].sort((a, b) => a.localeCompare(b));
  }, [rows]);
  const chequeAccountOptions = useMemo(() => {
    return banks
      .filter((b) => String(b.status).toLowerCase() === "active")
      .map((b) => b.label)
      .filter(Boolean);
  }, [banks]);

  const bankOptions = useMemo(() => {
    return banks.map((b) => b.label).filter(Boolean);
  }, [banks]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== BANKS_STORAGE_KEY) return;
      setBanks(loadStoredBanks(DUMMY_BANKS));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (subcategory && !subcategoryOptions.some((s) => s.value === subcategory)) {
      setSubcategory("");
    }
  }, [subcategory, subcategoryOptions]);

  const handleCategoryChange = (nextCategoryLabel: string) => {
    if (!nextCategoryLabel) {
      setCategory("");
      setSubcategory("");
      return;
    }
    const match = categories.find((cat) => cat.label === nextCategoryLabel);
    setCategory(match?.value ?? slugifyLabel(nextCategoryLabel));
    setSubcategory("");
  };

  const handleSubcategoryChange = (nextSubcategoryLabel: string) => {
    if (!nextSubcategoryLabel) {
      setSubcategory("");
      return;
    }
    const match = subcategoryOptions.find((sub) => sub.label === nextSubcategoryLabel);
    setSubcategory(match?.value ?? slugifyLabel(nextSubcategoryLabel));
  };

  const openCategoriesPopup = () => {
    categoriesSnapshotRef.current = cloneCategories(categories);
    setCategoriesDraft(categoryLabels.length ? [...categoryLabels] : [""]);
    setCategoriesPopupOpen(true);
  };

  const saveCategoriesPopup = () => {
    const labels = dedupeLabels(categoriesDraft);
    const previousLabels = new Set(categoryLabels.map((label) => label.toLowerCase()));
    const newlyAdded = labels.filter((label) => !previousLabels.has(label.toLowerCase()));

    const nextCategories = labels.map((label) => {
      const existing = categories.find((cat) => cat.label.toLowerCase() === label.toLowerCase());
      if (existing) return { ...existing, label };
      let value = slugifyLabel(label);
      if (categories.some((cat) => cat.value === value)) {
        value = `${value}-${Date.now()}`;
      }
      return { value, label, subcategories: [] };
    });

    setCategories(nextCategories);

    if (newlyAdded.length > 0) {
      const lastAdded = newlyAdded[newlyAdded.length - 1];
      const match = nextCategories.find((cat) => cat.label.toLowerCase() === lastAdded.toLowerCase());
      if (match) handleCategoryChange(match.label);
    } else if (category && !nextCategories.some((cat) => cat.value === category)) {
      handleCategoryChange(nextCategories[0]?.label ?? "");
    }

    setCategoriesPopupOpen(false);
  };

  const cancelCategoriesPopup = () => {
    setCategories(categoriesSnapshotRef.current);
    setCategoriesPopupOpen(false);
  };

  const openSubcategoriesPopup = () => {
    if (!category) return;
    subcategoriesSnapshotRef.current = [...subcategoryOptions];
    setSubcategoriesDraft(subcategoryLabels.length ? [...subcategoryLabels] : [""]);
    setSubcategoriesPopupOpen(true);
  };

  const saveSubcategoriesPopup = () => {
    if (!category) return;
    const labels = dedupeLabels(subcategoriesDraft);
    const previousLabels = new Set(subcategoryLabels.map((label) => label.toLowerCase()));
    const newlyAdded = labels.filter((label) => !previousLabels.has(label.toLowerCase()));

    const nextSubcategories = labels.map((label) => {
      const existing = subcategoryOptions.find((sub) => sub.label.toLowerCase() === label.toLowerCase());
      if (existing) return { ...existing, label };
      let value = slugifyLabel(label);
      if (subcategoryOptions.some((sub) => sub.value === value)) {
        value = `${value}-${Date.now()}`;
      }
      return { value, label };
    });

    setCategories((prev) =>
      prev.map((cat) => (cat.value === category ? { ...cat, subcategories: nextSubcategories } : cat))
    );

    if (newlyAdded.length > 0) {
      const lastAdded = newlyAdded[newlyAdded.length - 1];
      const match = nextSubcategories.find((sub) => sub.label.toLowerCase() === lastAdded.toLowerCase());
      if (match) setSubcategory(match.value);
    } else if (subcategory && !nextSubcategories.some((sub) => sub.value === subcategory)) {
      setSubcategory(nextSubcategories[0]?.value ?? "");
    }

    setSubcategoriesPopupOpen(false);
  };

  const cancelSubcategoriesPopup = () => {
    if (!category) return;
    setCategories((prev) =>
      prev.map((cat) =>
        cat.value === category ? { ...cat, subcategories: [...subcategoriesSnapshotRef.current] } : cat
      )
    );
    setSubcategoriesPopupOpen(false);
  };

  const filtered = rows.filter((row) => {
    const labels = categoryLabel(categories, row.category, row.subcategory);
    const haystack = [
      row.date,
      formatDisplayDate(row.date),
      row.vendor,
      String(row.amount),
      `${row.amount} CAD`,
      row.paymentMode ?? "",
      row.bank ?? "",
      labels.category,
      labels.subcategory,
      row.notes,
      row.billNumber ?? "",
      row.attachmentName ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / entriesPerPage));
  const paged = filtered.slice((page - 1) * entriesPerPage, page * entriesPerPage);

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === paged.length) setSelected(new Set());
    else setSelected(new Set(paged.map((r) => r.id)));
  };

  const resetForm = () => {
    setEditingId(null);
    setAmount("");
    setDate("2026-06-20");
    setPaymentMode("");
    setBank("");
    setVendor("");
    setCategory("");
    setSubcategory("");
    setNotes("");
    setGst(false);
    setGstAmount("");
    setHasBillNumber(false);
    setBillNumber("");
    setByCheque(false);
    setChequeAccount("");
    setAttachReceipt(false);
    setAttachmentName(null);
  };

  const openAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (row: LedgerRow) => {
    setEditingId(row.id);
    setAmount(String(row.amount));
    setDate(row.date);
    setPaymentMode(row.paymentMode ?? "");
    setBank(row.bank ?? "");
    setVendor(row.vendor);
    setCategory(row.category);
    setSubcategory(row.subcategory);
    setNotes(row.notes);
    setGst(row.gst);
    setHasBillNumber(Boolean(row.billNumber));
    setBillNumber(row.billNumber ?? "");
    setByCheque(row.byCheque);
    setAttachReceipt(row.hasReceipt);
    setAttachmentName(row.attachmentName ?? null);
    setShowForm(true);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleSave = () => {
    const parsedAmount = Number.parseFloat(amount);
    const normalizedVendor = vendor.trim();
    const normalizedPaymentMode = paymentMode.trim();
    const normalizedBank = bank.trim();

    if (!amount.trim() || !Number.isFinite(parsedAmount)) {
      adminNotify.error("Amount is required.");
      return;
    }
    if (!date) {
      adminNotify.error("Date is required.");
      return;
    }
    if (!normalizedVendor) {
      adminNotify.error(`${vendorLabel} is required.`);
      return;
    }
    if (isIncome && !normalizedPaymentMode) {
      adminNotify.error("Payment Mode is required.");
      return;
    }

    const payload: Omit<LedgerRow, "id"> = {
      date,
      vendor: normalizedVendor,
      amount: parsedAmount || 0,
      category: category || categories[0]?.value || "",
      subcategory: subcategory || subcategoryOptions[0]?.value || "",
      notes,
      gst,
      billNumber: hasBillNumber && billNumber.trim() ? billNumber.trim() : null,
      byCheque,
      hasReceipt: isIncome ? Boolean(attachmentName) : attachReceipt,
      paymentMode: isIncome ? normalizedPaymentMode : undefined,
      bank: isIncome ? normalizedBank : undefined,
      attachmentName: isIncome ? attachmentName : undefined,
    };

    if (!payload.category) {
      adminNotify.error("Category is required.");
      return;
    }
    if (isExpense && !payload.subcategory) {
      adminNotify.error("Subcategory is required.");
      return;
    }

    if (editingId != null) {
      setRows((prev) => prev.map((row) => (row.id === editingId ? { ...row, ...payload } : row)));
    } else {
      setRows((prev) => [
        ...prev,
        {
          id: Math.max(0, ...prev.map((row) => row.id)) + 1,
          ...payload,
        },
      ]);
    }

    adminNotify.success(editingId != null ? "Entry updated." : "Entry added.");
    resetForm();
    setShowForm(false);
  };

  return (
    <AdminPage
      title={title}
      headerAction={!showForm ? <AddNewButton onClick={openAdd} /> : undefined}
      between={
        showForm ? (
          <CompactFormPanel
            footer={
              <CompactFormFooter
                actionLabel={editingId != null ? "Update" : "Save"}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            }
          >
            <CompactFormRow className="items-start gap-y-6">
              <div className={`min-w-0 shrink-0 flex-none ${compactFixedFieldWidth}`}>
                <CompactField label="Amount" required className="w-full flex-none">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={compactInputClass}
                  />
                </CompactField>
                {isExpense ? (
                  <div className="mt-3">
                    <label className="mb-1 flex cursor-pointer items-center gap-1.5 text-xs font-bold text-ad-green-dark">
                      <input
                        type="checkbox"
                        checked={gst}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setGst(checked);
                          if (!checked) setGstAmount("");
                        }}
                        className="h-3.5 w-3.5 accent-ad-green"
                      />
                      GST
                    </label>
                    {gst ? (
                      <input
                        type="text"
                        inputMode="decimal"
                        value={gstAmount}
                        onChange={(e) => setGstAmount(e.target.value)}
                        placeholder="GST amount"
                        className={compactInputClass}
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>
              <CompactField label="Date" required className={compactFixedFieldWidth}>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={compactInputClass}
                />
              </CompactField>
              {isIncome ? (
                <CompactField label="Payment Mode" required className={compactFixedFieldWidth}>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className={compactInputClass}
                  >
                    <option value="">Select</option>
                    {INCOME_PAYMENT_MODE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </CompactField>
              ) : null}
              {isIncome ? (
                <CompactField label="Bank" className={compactFixedFieldWidth}>
                  <select value={bank} onChange={(e) => setBank(e.target.value)} className={compactInputClass}>
                    <option value="">Select account</option>
                    {bankOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </CompactField>
              ) : null}
              <div className={`min-w-0 shrink-0 flex-none ${compactFixedFieldWidth}`}>
                <VendorComboField
                  label={vendorLabel}
                  required
                  value={vendor}
                  onChange={setVendor}
                  options={vendorOptions}
                  className="w-full flex-none"
                />
                {isExpense ? (
                  <div className="mt-3">
                    <label className="mb-1 flex cursor-pointer items-center gap-1.5 text-xs font-bold text-ad-green-dark">
                      <input
                        type="checkbox"
                        checked={hasBillNumber}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setHasBillNumber(checked);
                          if (!checked) setBillNumber("");
                        }}
                        className="h-3.5 w-3.5 accent-ad-green"
                      />
                      {billLabel}
                    </label>
                    {hasBillNumber ? (
                      <input
                        type="text"
                        value={billNumber}
                        onChange={(e) => setBillNumber(e.target.value)}
                        className={compactInputClass}
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className="min-w-[160px] flex-1">
                <ComboSelectWithEditor
                  label="Category"
                  required
                  value={selectedCategoryLabel}
                  placeholder="Select category"
                  options={categoryLabels}
                  onChange={handleCategoryChange}
                  onEditAddNew={openCategoriesPopup}
                  className="w-full"
                />
                {isExpense ? (
                  <div className="mt-3">
                    <label className="mb-1 flex cursor-pointer items-center gap-1.5 text-xs font-bold text-ad-green-dark">
                      <input
                        type="checkbox"
                        checked={byCheque}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setByCheque(checked);
                          if (!checked) setChequeAccount("");
                        }}
                        className="h-3.5 w-3.5 accent-ad-green"
                      />
                      By Cheque
                    </label>
                    {byCheque ? (
                      <select
                        value={chequeAccount}
                        onChange={(e) => setChequeAccount(e.target.value)}
                        className={compactInputClass}
                      >
                        <option value="">Select account</option>
                        {chequeAccountOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                ) : null}
              </div>
              {isExpense ? (
                <ComboSelectWithEditor
                  label="Subcategory"
                  required
                  value={selectedSubcategoryLabel}
                  placeholder="Select subcategory"
                  options={subcategoryLabels}
                  disabled={!category}
                  onChange={handleSubcategoryChange}
                  onEditAddNew={openSubcategoriesPopup}
                  className="min-w-[160px] flex-1"
                />
              ) : null}
              {isExpense ? (
                <div className="min-w-[160px] flex-1">
                  <CompactField label="Notes" className="w-full flex-none">
                    <CompactAutoGrowTextarea value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </CompactField>
                  <div className="mt-3">
                    <label className="mb-1 flex cursor-pointer items-center gap-1.5 text-xs font-bold text-ad-green-dark">
                      <input
                        type="checkbox"
                        checked={attachReceipt}
                        onChange={(e) => setAttachReceipt(e.target.checked)}
                        className="h-3.5 w-3.5 accent-ad-green"
                      />
                      Attach Image of Receipt
                    </label>
                    {attachReceipt ? (
                      <label className="block w-full cursor-pointer rounded border border-gray-400 bg-gray-200 px-3 py-1.5 text-center text-xs font-medium text-gray-700 hover:bg-gray-300">
                        Upload File
                        <input type="file" accept="image/*" className="hidden" />
                      </label>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </CompactFormRow>

            {isIncome ? (
              <CompactFormRow className="items-start gap-y-6">
                <div className="min-w-0 flex-1">
                  <CompactField label="Notes" className="w-full">
                    <CompactAutoGrowTextarea value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </CompactField>
                </div>
                <div className={`min-w-0 shrink-0 flex-none ${compactFixedFieldWidth}`}>
                  <CompactField label="Attachment" className="w-full">
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        setAttachmentName(file ? file.name : null);
                      }}
                      className="w-full text-xs"
                    />
                    {attachmentName ? (
                      <div className="mt-1 text-[11px] text-gray-600">Selected: {attachmentName}</div>
                    ) : (
                      <div className="mt-1 text-[11px] text-gray-600">No file selected.</div>
                    )}
                  </CompactField>
                </div>
              </CompactFormRow>
            ) : null}
            {categoriesPopupOpen && (
              <ListEditorPopup
                title="Edit / Add Categories"
                items={categoriesDraft}
                onChange={setCategoriesDraft}
                onSave={saveCategoriesPopup}
                onCancel={cancelCategoriesPopup}
                placeholder="Category name"
              />
            )}
            {subcategoriesPopupOpen && (
              <ListEditorPopup
                title={`Edit / Add Subcategories${selectedCategoryLabel ? ` — ${selectedCategoryLabel}` : ""}`}
                items={subcategoriesDraft}
                onChange={setSubcategoriesDraft}
                onSave={saveSubcategoriesPopup}
                onCancel={cancelSubcategoriesPopup}
                placeholder="Subcategory name"
              />
            )}
          </CompactFormPanel>
        ) : undefined
      }
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
        <div className="flex flex-wrap gap-1">
          <button type="button" disabled={selected.size === 0} className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
            ↓ Export
          </button>
          <button type="button" disabled={selected.size === 0} className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
            Archive
          </button>
          <button type="button" disabled={selected.size === 0} className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
            Delete
          </button>
          <button type="button" disabled={selected.size === 0} className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
            Copy
          </button>
        </div>
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Live search type here..."
            className="border border-gray-400 bg-white px-2 py-1 text-xs"
          />
          <button type="button" className="bg-gray-500 px-3 py-1 text-xs font-medium text-white hover:bg-gray-600">
            Search
          </button>
        </div>
      </div>

      <div className="mb-2 flex items-center gap-2 text-xs text-gray-700">
        <span>Show</span>
        <select
          value={entriesPerPage}
          onChange={(e) => {
            setEntriesPerPage(Number(e.target.value));
            setPage(1);
          }}
          className="border border-gray-400 px-1 py-0.5"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
        <span>entries</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-ad-purple text-white">
              <th className="border border-ad-purple-dark px-2 py-2 text-left">
                <input
                  type="checkbox"
                  checked={paged.length > 0 && selected.size === paged.length}
                  onChange={toggleSelectAll}
                  className="accent-white"
                />
              </th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Date</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">{vendorLabel}</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Amount</th>
              {isIncome ? (
                <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Payment Mode</th>
              ) : null}
              {isIncome ? (
                <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Bank</th>
              ) : null}
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Category</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Notes</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">
                {isIncome ? "Attachment" : "Clip"}
              </th>
            </tr>
          </thead>
          <tbody>
            {paged.map((row, idx) => {
              const labels = categoryLabel(categories, row.category, row.subcategory);
              return (
                <tr key={row.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                  <td className="border border-gray-300 px-2 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggleSelect(row.id)}
                      className="accent-ad-purple"
                    />
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="text-blue-700 hover:underline"
                    >
                      {formatDisplayDate(row.date)}
                    </button>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 uppercase">{row.vendor}</td>
                  <td className="border border-gray-300 px-3 py-2">
                    {row.amount % 1 === 0 ? row.amount : row.amount.toFixed(2)} CAD
                  </td>
                  {isIncome ? (
                    <td className="border border-gray-300 px-3 py-2">{row.paymentMode || ""}</td>
                  ) : null}
                  {isIncome ? (
                    <td className="border border-gray-300 px-3 py-2">{row.bank || ""}</td>
                  ) : null}
                  <td className="border border-gray-300 px-3 py-2">
                    <div>
                      <div className="font-bold leading-tight">{labels.category}</div>
                      <div className="text-xs text-gray-500">{labels.subcategory}</div>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-3 py-2">{row.notes || ""}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    {row.hasReceipt || Boolean(row.attachmentName) ? (
                      <span className="inline-flex items-center gap-2">
                        <FiPaperclip className="inline text-blue-600" size={16} aria-hidden />
                        {isIncome && row.attachmentName ? (
                          <span className="max-w-[160px] truncate text-xs text-gray-700" title={row.attachmentName}>
                            {row.attachmentName}
                          </span>
                        ) : null}
                      </span>
                    ) : (
                      <span className="text-gray-500">--</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={`h-7 w-7 border text-xs font-medium ${page === p
                ? "border-ad-green bg-ad-green text-white"
                : "border-gray-400 bg-white text-gray-700 hover:bg-gray-100"
                }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </AdminPage>
  );
}

export default function AccountsPage({ initialShowForm = false, title = "Accounts", variant = "bank" }: AccountsPageProps) {
  if (variant === "expenses" || variant === "income") {
    return <LedgerPage initialShowForm={initialShowForm} title={title} variant={variant} />;
  }
  return <BankAccountsPage initialShowForm={initialShowForm} title={title} />;
}
