import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
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

type PageVariant = "bank" | "expenses" | "income";

type AccountsPageProps = {
  initialShowForm?: boolean;
  title?: string;
  variant?: PageVariant;
};

function BankAccountsPage({ initialShowForm = false, title = "Manage Banks" }: AccountsPageProps) {
  const [banks, setBanks] = useState(DUMMY_BANKS);
  const [draft, setDraft] = useState<BankRow[]>(() => structuredClone(DUMMY_BANKS));
  const [showForm, setShowForm] = useState(initialShowForm);
  const [bankWalletName, setBankWalletName] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");

  useEffect(() => {
    setDraft(structuredClone(banks));
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
    if (!label) return;

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
  };

  const handleTableUpdate = () => {
    setBanks(structuredClone(draft));
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
  const baseCategories = isExpense ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const vendorLabel = isExpense ? "Vendor" : "Source";
  const billLabel = isExpense ? "Bill Number" : "Invoice Number";
  const recordLabel = isExpense ? "Expense" : "Income";
  const initialData = isExpense ? DUMMY_EXPENSES : DUMMY_INCOME;

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
  const [vendor, setVendor] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [notes, setNotes] = useState("");
  const [gst, setGst] = useState(false);
  const [hasBillNumber, setHasBillNumber] = useState(false);
  const [billNumber, setBillNumber] = useState("");
  const [byCheque, setByCheque] = useState(false);
  const [attachReceipt, setAttachReceipt] = useState(false);

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
      labels.category,
      labels.subcategory,
      row.notes,
      row.billNumber ?? "",
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
    setVendor("");
    setCategory("");
    setSubcategory("");
    setNotes("");
    setGst(false);
    setHasBillNumber(false);
    setBillNumber("");
    setByCheque(false);
    setAttachReceipt(false);
  };

  const openAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (row: LedgerRow) => {
    setEditingId(row.id);
    setAmount(String(row.amount));
    setDate(row.date);
    setVendor(row.vendor);
    setCategory(row.category);
    setSubcategory(row.subcategory);
    setNotes(row.notes);
    setGst(row.gst);
    setHasBillNumber(Boolean(row.billNumber));
    setBillNumber(row.billNumber ?? "");
    setByCheque(row.byCheque);
    setAttachReceipt(row.hasReceipt);
    setShowForm(true);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleSave = () => {
    const parsedAmount = Number.parseFloat(amount) || 0;
    const payload: Omit<LedgerRow, "id"> = {
      date,
      vendor: vendor.trim(),
      amount: parsedAmount,
      category: category || categories[0]?.value || "",
      subcategory: subcategory || subcategoryOptions[0]?.value || "",
      notes,
      gst,
      billNumber: hasBillNumber && billNumber.trim() ? billNumber.trim() : null,
      byCheque,
      hasReceipt: attachReceipt,
    };

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
                actionLabel="Save"
                onSave={handleSave}
                onCancel={handleCancel}
              />
            }
          >
            <CompactFormRow className="items-start">
              <CompactField label="Amount" required className={compactFixedFieldWidth}>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={compactInputClass}
                />
              </CompactField>
              <CompactField label="Date" required className={compactFixedFieldWidth}>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={compactInputClass}
                />
              </CompactField>
              <CompactField label={vendorLabel} required className={compactFixedFieldWidth}>
                <input
                  type="text"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className={compactInputClass}
                />
              </CompactField>
              <ComboSelectWithEditor
                label="Category"
                required
                value={selectedCategoryLabel}
                placeholder="Select category"
                options={categoryLabels}
                onChange={handleCategoryChange}
                onEditAddNew={openCategoriesPopup}
                className="min-w-[160px] flex-1"
              />
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
              <CompactField label="Notes" className="min-w-[160px] flex-1">
                <CompactAutoGrowTextarea value={notes} onChange={(e) => setNotes(e.target.value)} />
              </CompactField>
            </CompactFormRow>
            <CompactFormRow className="items-start justify-start gap-x-6 gap-y-3">
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-ad-green-dark">
                <input
                  type="checkbox"
                  checked={gst}
                  onChange={(e) => setGst(e.target.checked)}
                  className="h-3.5 w-3.5 accent-ad-green"
                />
                GST
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-ad-green-dark">
                  <input
                    type="checkbox"
                    checked={hasBillNumber}
                    onChange={(e) => setHasBillNumber(e.target.checked)}
                    className="h-3.5 w-3.5 accent-ad-green"
                  />
                  {billLabel}
                </label>
                {hasBillNumber ? (
                  <input
                    type="text"
                    value={billNumber}
                    onChange={(e) => setBillNumber(e.target.value)}
                    className="w-[120px] border border-gray-400 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                  />
                ) : null}
              </div>
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-ad-green-dark">
                <input
                  type="checkbox"
                  checked={byCheque}
                  onChange={(e) => setByCheque(e.target.checked)}
                  className="h-3.5 w-3.5 accent-ad-green"
                />
                By Cheque
              </label>
              <div className="flex flex-col items-start gap-1.5">
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-ad-green-dark">
                  <input
                    type="checkbox"
                    checked={attachReceipt}
                    onChange={(e) => setAttachReceipt(e.target.checked)}
                    className="h-3.5 w-3.5 accent-ad-green"
                  />
                  Attach Image of Receipt
                </label>
                {attachReceipt ? (
                  <label className="inline-block cursor-pointer rounded border border-gray-400 bg-gray-200 px-3 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-300">
                    Upload File
                    <input type="file" accept="image/*" className="hidden" />
                  </label>
                ) : null}
              </div>
            </CompactFormRow>
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
          <button type="button" className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700">
            ↓ Export
          </button>
          <button type="button" className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700">
            Archive
          </button>
          <button type="button" className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700">
            Delete
          </button>
          <button type="button" className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700">
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
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Category</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Notes</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Clip</th>
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
                  <td className="border border-gray-300 px-3 py-2">
                    <div>
                      <div className="font-bold leading-tight">{labels.category}</div>
                      <div className="text-xs text-gray-500">{labels.subcategory}</div>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-3 py-2">{row.notes || ""}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    {row.hasReceipt ? (
                      <FiPaperclip className="inline text-blue-600" size={16} aria-hidden />
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
        <Link to="#" className="text-sm text-blue-700 hover:underline">
          Deleted
        </Link>
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
