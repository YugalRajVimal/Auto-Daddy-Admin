// // import { useEffect, useMemo, useRef, useState } from "react";
// // import AttachImageCheckbox from "../../../components/admin/AttachImageCheckbox";
// // import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
// // import ClipImageHover from "../../../components/admin/ClipImageHover";
// // import ComboSelectWithEditor from "../../../components/admin/ComboSelectWithEditor";
// // import ListEditorPopup from "../../../components/admin/ListEditorPopup";
// // import {
// //   CompactAutoGrowTextarea,
// //   CompactField,
// //   CompactFormFooter,
// //   CompactFormPanel,
// //   CompactFormRow,
// //   compactFixedFieldWidth,
// //   compactInputClass,
// // } from "../../../components/admin/ContentPanel";
// // import { adminNotify } from "../../../utils/adminNotify";
// // import {
// //   DUMMY_BANKS,
// //   DUMMY_EXPENSES,
// //   DUMMY_INCOME,
// //   formatDisplayDate,
// //   type BankRow,
// //   type LedgerRow,
// // } from "./accountData";
// // import {
// //   categoryLabel,
// //   cloneCategories,
// //   dedupeLabels,
// //   EXPENSE_CATEGORIES,
// //   INCOME_CATEGORIES,
// //   slugifyLabel,
// //   type CategoryOption,
// // } from "./ledgerCategories";

// // const BANK_STATUS_OPTIONS = [
// //   { value: "active", label: "Active" },
// //   { value: "inactive", label: "Inactive" },
// // ];

// // const INCOME_PAYMENT_MODE_OPTIONS = ["Bank Transfer", "Cash", "Cheque", "Online Payment"] as const;

// // type PageVariant = "bank" | "expenses" | "income";

// // type AccountsPageProps = {
// //   initialShowForm?: boolean;
// //   title?: string;
// //   variant?: PageVariant;
// // };

// // const BANKS_STORAGE_KEY = "admin.accounts.banks.v1";

// // function loadStoredBanks(fallback: BankRow[]) {
// //   if (typeof window === "undefined") return fallback;
// //   try {
// //     const raw = window.localStorage.getItem(BANKS_STORAGE_KEY);
// //     if (!raw) return fallback;
// //     const parsed = JSON.parse(raw) as unknown;
// //     if (!Array.isArray(parsed)) return fallback;
// //     return parsed as BankRow[];
// //   } catch {
// //     return fallback;
// //   }
// // }

// // function persistBanks(banks: BankRow[]) {
// //   if (typeof window === "undefined") return;
// //   try {
// //     window.localStorage.setItem(BANKS_STORAGE_KEY, JSON.stringify(banks));
// //   } catch {
// //     // ignore persistence errors (private mode / quota)
// //   }
// // }

// // function normalizeVendorLabel(value: string) {
// //   return value.trim().replace(/\s+/g, " ");
// // }

// // function VendorComboField({
// //   label,
// //   required,
// //   value,
// //   onChange,
// //   options,
// //   className,
// // }: {
// //   label: string;
// //   required?: boolean;
// //   value: string;
// //   onChange: (next: string) => void;
// //   options: string[];
// //   className?: string;
// // }) {
// //   const [open, setOpen] = useState(false);
// //   const [activeIndex, setActiveIndex] = useState(0);
// //   const rootRef = useRef<HTMLDivElement>(null);

// //   const normalizedValue = value;
// //   const filtered = useMemo(() => {
// //     const q = normalizeVendorLabel(normalizedValue).toLowerCase();
// //     const base = options
// //       .map(normalizeVendorLabel)
// //       .filter(Boolean)
// //       .filter((opt, idx, arr) => arr.findIndex((v) => v.toLowerCase() === opt.toLowerCase()) === idx);
// //     if (!q) return base.slice(0, 25);
// //     return base.filter((opt) => opt.toLowerCase().includes(q)).slice(0, 25);
// //   }, [normalizedValue, options]);

// //   useEffect(() => {
// //     if (!open) return;
// //     const onPointerDown = (e: MouseEvent) => {
// //       if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
// //     };
// //     const onKeyDown = (e: KeyboardEvent) => {
// //       if (e.key === "Escape") setOpen(false);
// //     };
// //     document.addEventListener("mousedown", onPointerDown);
// //     document.addEventListener("keydown", onKeyDown);
// //     return () => {
// //       document.removeEventListener("mousedown", onPointerDown);
// //       document.removeEventListener("keydown", onKeyDown);
// //     };
// //   }, [open]);

// //   useEffect(() => {
// //     setActiveIndex(0);
// //   }, [normalizedValue, open]);

// //   const listboxId = `vendor-listbox-${label.replace(/\s+/g, "-").toLowerCase()}`;

// //   return (
// //     <CompactField label={label} required={required} className={className}>
// //       <div ref={rootRef} className="relative">
// //         <input
// //           type="text"
// //           value={value}
// //           onChange={(e) => {
// //             onChange(e.target.value);
// //             setOpen(true);
// //           }}
// //           onFocus={() => setOpen(true)}
// //           onKeyDown={(e) => {
// //             if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
// //               setOpen(true);
// //               return;
// //             }
// //             if (!open) return;
// //             if (e.key === "ArrowDown") {
// //               e.preventDefault();
// //               setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
// //             } else if (e.key === "ArrowUp") {
// //               e.preventDefault();
// //               setActiveIndex((i) => Math.max(0, i - 1));
// //             } else if (e.key === "Enter") {
// //               const hit = filtered[activeIndex];
// //               if (hit) {
// //                 e.preventDefault();
// //                 onChange(hit);
// //                 setOpen(false);
// //               }
// //             }
// //           }}
// //           role="combobox"
// //           aria-expanded={open}
// //           aria-controls={listboxId}
// //           aria-autocomplete="list"
// //           className={compactInputClass}
// //           autoComplete="off"
// //         />

// //         {open && filtered.length > 0 ? (
// //           <div
// //             id={listboxId}
// //             role="listbox"
// //             className="absolute left-0 right-0 z-50 mt-0.5 max-h-52 overflow-y-auto rounded border border-gray-400 bg-white shadow-lg"
// //           >
// //             {filtered.map((opt, idx) => {
// //               const active = idx === activeIndex;
// //               return (
// //                 <button
// //                   key={`${opt}-${idx}`}
// //                   type="button"
// //                   role="option"
// //                   aria-selected={active}
// //                   onMouseEnter={() => setActiveIndex(idx)}
// //                   onClick={() => {
// //                     onChange(opt);
// //                     setOpen(false);
// //                   }}
// //                   className={`block w-full px-2 py-1.5 text-left text-sm hover:bg-gray-100 ${
// //                     active ? "bg-ad-green-light/60 font-semibold text-ad-green-dark" : "text-gray-900"
// //                   }`}
// //                 >
// //                   {opt}
// //                 </button>
// //               );
// //             })}
// //           </div>
// //         ) : null}
// //       </div>
// //     </CompactField>
// //   );
// // }

// // function BankAccountsPage({ initialShowForm = false, title = "Manage Banks" }: AccountsPageProps) {
// //   const [banks, setBanks] = useState(() => loadStoredBanks(DUMMY_BANKS));
// //   const [draft, setDraft] = useState<BankRow[]>(() => structuredClone(loadStoredBanks(DUMMY_BANKS)));
// //   const [showForm, setShowForm] = useState(initialShowForm);
// //   const [bankWalletName, setBankWalletName] = useState("");
// //   const [openingBalance, setOpeningBalance] = useState("");

// //   useEffect(() => {
// //     setDraft(structuredClone(banks));
// //   }, [banks]);

// //   useEffect(() => {
// //     persistBanks(banks);
// //   }, [banks]);

// //   const hasDraftChanges = useMemo(
// //     () => JSON.stringify(draft) !== JSON.stringify(banks),
// //     [draft, banks]
// //   );

// //   const updateDraftRow = (id: number, patch: Partial<BankRow>) => {
// //     setDraft((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
// //   };

// //   const setAssignToInvoice = (id: number) => {
// //     setDraft((prev) =>
// //       prev.map((row) => ({
// //         ...row,
// //         assignToInvoice: row.id === id,
// //       }))
// //     );
// //   };

// //   const resetNewBankForm = () => {
// //     setBankWalletName("");
// //     setOpeningBalance("");
// //   };

// //   const handleNewBankCancel = () => {
// //     resetNewBankForm();
// //     setShowForm(false);
// //   };

// //   const handleNewBankSave = () => {
// //     const label = bankWalletName.trim();
// //     if (!label) {
// //       adminNotify.error("Bank / wallet name is required.");
// //       return;
// //     }

// //     const parsedBalance = Number.parseFloat(openingBalance);
// //     const totalBalance = Number.isFinite(parsedBalance) ? parsedBalance : 0;
// //     const nextId = Math.max(0, ...banks.map((row) => row.id)) + 1;

// //     const newRow: BankRow = {
// //       id: nextId,
// //       label: label.toUpperCase(),
// //       assignToInvoice: banks.length === 0,
// //       status: "active",
// //       totalBalance,
// //       accountName: "",
// //       accountNumber: "",
// //       interac: "",
// //     };

// //     setBanks((prev) => [...prev, newRow]);
// //     resetNewBankForm();
// //     setShowForm(false);
// //     adminNotify.success("Bank account added.");
// //   };

// //   const handleTableUpdate = () => {
// //     setBanks(structuredClone(draft));
// //     adminNotify.success("Bank accounts updated.");
// //   };

// //   const handleTableCancel = () => {
// //     setDraft(structuredClone(banks));
// //   };

// //   const tableInputClass =
// //     "w-full min-w-[120px] border border-gray-400 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none";

// //   return (
// //     <AdminPage
// //       title={title}
// //       headerAction={
// //         !showForm ? (
// //           <button
// //             type="button"
// //             onClick={() => setShowForm(true)}
// //             className="shrink-0 rounded bg-ad-green px-4 py-2 text-sm font-bold text-white hover:bg-ad-green-dark"
// //           >
// //             + New Bank
// //           </button>
// //         ) : undefined
// //       }
// //       between={
// //         showForm ? (
// //           <CompactFormPanel
// //             footer={
// //               <CompactFormFooter
// //                 message="You are creating a 'Bank / Wallet'"
// //                 messageCenter
// //                 onSave={handleNewBankSave}
// //                 onCancel={handleNewBankCancel}
// //               />
// //             }
// //           >
// //             <CompactFormRow className="items-start">
// //               <CompactField label="Bank / Wallet Name" required className={compactFixedFieldWidth}>
// //                 <input
// //                   type="text"
// //                   value={bankWalletName}
// //                   onChange={(e) => setBankWalletName(e.target.value)}
// //                   className={compactInputClass}
// //                 />
// //               </CompactField>
// //               <CompactField label="Opening Balance" className={compactFixedFieldWidth}>
// //                 <input
// //                   type="text"
// //                   inputMode="decimal"
// //                   value={openingBalance}
// //                   onChange={(e) => setOpeningBalance(e.target.value)}
// //                   className={compactInputClass}
// //                 />
// //               </CompactField>
// //             </CompactFormRow>
// //           </CompactFormPanel>
// //         ) : undefined
// //       }
// //     >
// //       <div className="overflow-x-auto">
// //         <table className="w-full border-collapse text-sm whitespace-nowrap">
// //           <thead>
// //             <tr className="bg-ad-purple text-white">
// //               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">
// //                 Assign to Invoice
// //               </th>
// //               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Status</th>
// //               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">
// //                 Total Balance
// //               </th>
// //               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">
// //                 Account Name
// //               </th>
// //               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">
// //                 Account Number
// //               </th>
// //               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Interac</th>
// //             </tr>
// //           </thead>
// //           <tbody>
// //             {draft.map((row, idx) => (
// //               <tr key={row.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
// //                 <td className="border border-gray-300 px-3 py-2 text-center">
// //                   <label className="inline-flex cursor-pointer items-center gap-2 font-bold uppercase">
// //                     <input
// //                       type="radio"
// //                       name="assignToInvoice"
// //                       checked={row.assignToInvoice}
// //                       onChange={() => setAssignToInvoice(row.id)}
// //                       className="accent-ad-purple"
// //                     />
// //                     {row.label}
// //                   </label>
// //                 </td>
// //                 <td className="border border-gray-300 px-3 py-2 text-center">
// //                   <select
// //                     value={row.status}
// //                     onChange={(e) => updateDraftRow(row.id, { status: e.target.value })}
// //                     className={tableInputClass}
// //                   >
// //                     {BANK_STATUS_OPTIONS.map((option) => (
// //                       <option key={option.value} value={option.value}>
// //                         {option.label}
// //                       </option>
// //                     ))}
// //                   </select>
// //                 </td>
// //                 <td className="border border-gray-300 px-3 py-2 text-center">{row.totalBalance}</td>
// //                 <td className="border border-gray-300 px-3 py-2 text-center">
// //                   <input
// //                     type="text"
// //                     value={row.accountName}
// //                     onChange={(e) => updateDraftRow(row.id, { accountName: e.target.value })}
// //                     className={tableInputClass}
// //                   />
// //                 </td>
// //                 <td className="border border-gray-300 px-3 py-2 text-center">
// //                   <input
// //                     type="text"
// //                     value={row.accountNumber}
// //                     onChange={(e) => updateDraftRow(row.id, { accountNumber: e.target.value })}
// //                     className={tableInputClass}
// //                   />
// //                 </td>
// //                 <td className="border border-gray-300 px-3 py-2 text-center">
// //                   <input
// //                     type="email"
// //                     value={row.interac}
// //                     onChange={(e) => updateDraftRow(row.id, { interac: e.target.value })}
// //                     className={tableInputClass}
// //                   />
// //                 </td>
// //               </tr>
// //             ))}
// //           </tbody>
// //         </table>
// //       </div>

// //       <div className="mt-4 flex items-center justify-end gap-2">
// //         <button
// //           type="button"
// //           onClick={handleTableUpdate}
// //           disabled={!hasDraftChanges}
// //           className="inline-flex items-center gap-1.5 rounded bg-ad-green px-4 py-1.5 text-sm font-bold text-white hover:bg-ad-green-dark disabled:cursor-not-allowed disabled:opacity-50"
// //         >
// //           Update
// //           <span aria-hidden className="text-base leading-none">
// //             →
// //           </span>
// //         </button>
// //         <span className="text-xs text-gray-700">
// //           or{" "}
// //           <button
// //             type="button"
// //             onClick={handleTableCancel}
// //             disabled={!hasDraftChanges}
// //             className="font-medium text-blue-600 underline hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
// //           >
// //             Cancel
// //           </button>
// //         </span>
// //       </div>
// //     </AdminPage>
// //   );
// // }

// // function LedgerPage({
// //   initialShowForm = false,
// //   title,
// //   variant,
// // }: {
// //   initialShowForm?: boolean;
// //   title: string;
// //   variant: "expenses" | "income";
// // }) {
// //   const isExpense = variant === "expenses";
// //   const isIncome = variant === "income";
// //   const baseCategories = isExpense ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
// //   const vendorLabel = "Vendor";
// //   const billLabel = isExpense ? "Bill Number" : "Invoice Number";
// //   const initialData = isExpense ? DUMMY_EXPENSES : DUMMY_INCOME;
// //   const [banks, setBanks] = useState<BankRow[]>(() => loadStoredBanks(DUMMY_BANKS));

// //   const [categories, setCategories] = useState<CategoryOption[]>(() => cloneCategories(baseCategories));
// //   const [rows, setRows] = useState(initialData);
// //   const [selected, setSelected] = useState<Set<number>>(new Set());
// //   const [search, setSearch] = useState("");
// //   const [page, setPage] = useState(1);
// //   const [entriesPerPage, setEntriesPerPage] = useState(10);
// //   const [showForm, setShowForm] = useState(initialShowForm);
// //   const [editingId, setEditingId] = useState<number | null>(null);

// //   const [amount, setAmount] = useState("");
// //   const [date, setDate] = useState("2026-06-20");
// //   const [paymentMode, setPaymentMode] = useState("");
// //   const [bank, setBank] = useState("");
// //   const [vendor, setVendor] = useState("");
// //   const [category, setCategory] = useState("");
// //   const [subcategory, setSubcategory] = useState("");
// //   const [notes, setNotes] = useState("");
// //   const [gst, setGst] = useState(false);
// //   const [gstAmount, setGstAmount] = useState("");
// //   const [hasBillNumber, setHasBillNumber] = useState(false);
// //   const [billNumber, setBillNumber] = useState("");
// //   const [byCheque, setByCheque] = useState(false);
// //   const [chequeAccount, setChequeAccount] = useState("");
// //   const [attachReceipt, setAttachReceipt] = useState(false);
// //   const [receiptFile, setReceiptFile] = useState<File | null>(null);
// //   const [attachAttachment, setAttachAttachment] = useState(false);
// //   const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
// //   const [attachmentName, setAttachmentName] = useState<string | null>(null);

// //   const [categoriesPopupOpen, setCategoriesPopupOpen] = useState(false);
// //   const [subcategoriesPopupOpen, setSubcategoriesPopupOpen] = useState(false);
// //   const [categoriesDraft, setCategoriesDraft] = useState<string[]>([""]);
// //   const [subcategoriesDraft, setSubcategoriesDraft] = useState<string[]>([""]);
// //   const categoriesSnapshotRef = useRef<CategoryOption[]>([]);
// //   const subcategoriesSnapshotRef = useRef<{ value: string; label: string }[]>([]);

// //   const categoryLabels = useMemo(() => categories.map((cat) => cat.label), [categories]);
// //   const selectedCategory = useMemo(
// //     () => categories.find((cat) => cat.value === category),
// //     [categories, category]
// //   );
// //   const subcategoryLabels = useMemo(
// //     () => selectedCategory?.subcategories.map((sub) => sub.label) ?? [],
// //     [selectedCategory]
// //   );
// //   const selectedCategoryLabel = selectedCategory?.label ?? "";
// //   const selectedSubcategoryLabel =
// //     selectedCategory?.subcategories.find((sub) => sub.value === subcategory)?.label ?? "";

// //   const subcategoryOptions = useMemo(() => selectedCategory?.subcategories ?? [], [selectedCategory]);
// //   const vendorOptions = useMemo(() => {
// //     const seen = new Map<string, string>();
// //     for (const row of rows) {
// //       const normalized = normalizeVendorLabel(row.vendor);
// //       if (!normalized) continue;
// //       const key = normalized.toLowerCase();
// //       if (!seen.has(key)) seen.set(key, normalized);
// //     }
// //     return [...seen.values()].sort((a, b) => a.localeCompare(b));
// //   }, [rows]);
// //   const chequeAccountOptions = useMemo(() => {
// //     return banks
// //       .filter((b) => String(b.status).toLowerCase() === "active")
// //       .map((b) => b.label)
// //       .filter(Boolean);
// //   }, [banks]);

// //   const bankOptions = useMemo(() => {
// //     return banks.map((b) => b.label).filter(Boolean);
// //   }, [banks]);

// //   useEffect(() => {
// //     if (typeof window === "undefined") return;
// //     const onStorage = (e: StorageEvent) => {
// //       if (e.key !== BANKS_STORAGE_KEY) return;
// //       setBanks(loadStoredBanks(DUMMY_BANKS));
// //     };
// //     window.addEventListener("storage", onStorage);
// //     return () => window.removeEventListener("storage", onStorage);
// //   }, []);

// //   useEffect(() => {
// //     if (subcategory && !subcategoryOptions.some((s) => s.value === subcategory)) {
// //       setSubcategory("");
// //     }
// //   }, [subcategory, subcategoryOptions]);

// //   const handleCategoryChange = (nextCategoryLabel: string) => {
// //     if (!nextCategoryLabel) {
// //       setCategory("");
// //       setSubcategory("");
// //       return;
// //     }
// //     const match = categories.find((cat) => cat.label === nextCategoryLabel);
// //     setCategory(match?.value ?? slugifyLabel(nextCategoryLabel));
// //     setSubcategory("");
// //   };

// //   const handleSubcategoryChange = (nextSubcategoryLabel: string) => {
// //     if (!nextSubcategoryLabel) {
// //       setSubcategory("");
// //       return;
// //     }
// //     const match = subcategoryOptions.find((sub) => sub.label === nextSubcategoryLabel);
// //     setSubcategory(match?.value ?? slugifyLabel(nextSubcategoryLabel));
// //   };

// //   const openCategoriesPopup = () => {
// //     categoriesSnapshotRef.current = cloneCategories(categories);
// //     setCategoriesDraft(categoryLabels.length ? [...categoryLabels] : [""]);
// //     setCategoriesPopupOpen(true);
// //   };

// //   const saveCategoriesPopup = () => {
// //     const labels = dedupeLabels(categoriesDraft);
// //     const previousLabels = new Set(categoryLabels.map((label) => label.toLowerCase()));
// //     const newlyAdded = labels.filter((label) => !previousLabels.has(label.toLowerCase()));

// //     const nextCategories = labels.map((label) => {
// //       const existing = categories.find((cat) => cat.label.toLowerCase() === label.toLowerCase());
// //       if (existing) return { ...existing, label };
// //       let value = slugifyLabel(label);
// //       if (categories.some((cat) => cat.value === value)) {
// //         value = `${value}-${Date.now()}`;
// //       }
// //       return { value, label, subcategories: [] };
// //     });

// //     setCategories(nextCategories);

// //     if (newlyAdded.length > 0) {
// //       const lastAdded = newlyAdded[newlyAdded.length - 1];
// //       const match = nextCategories.find((cat) => cat.label.toLowerCase() === lastAdded.toLowerCase());
// //       if (match) handleCategoryChange(match.label);
// //     } else if (category && !nextCategories.some((cat) => cat.value === category)) {
// //       handleCategoryChange(nextCategories[0]?.label ?? "");
// //     }

// //     setCategoriesPopupOpen(false);
// //   };

// //   const cancelCategoriesPopup = () => {
// //     setCategories(categoriesSnapshotRef.current);
// //     setCategoriesPopupOpen(false);
// //   };

// //   const openSubcategoriesPopup = () => {
// //     if (!category) return;
// //     subcategoriesSnapshotRef.current = [...subcategoryOptions];
// //     setSubcategoriesDraft(subcategoryLabels.length ? [...subcategoryLabels] : [""]);
// //     setSubcategoriesPopupOpen(true);
// //   };

// //   const saveSubcategoriesPopup = () => {
// //     if (!category) return;
// //     const labels = dedupeLabels(subcategoriesDraft);
// //     const previousLabels = new Set(subcategoryLabels.map((label) => label.toLowerCase()));
// //     const newlyAdded = labels.filter((label) => !previousLabels.has(label.toLowerCase()));

// //     const nextSubcategories = labels.map((label) => {
// //       const existing = subcategoryOptions.find((sub) => sub.label.toLowerCase() === label.toLowerCase());
// //       if (existing) return { ...existing, label };
// //       let value = slugifyLabel(label);
// //       if (subcategoryOptions.some((sub) => sub.value === value)) {
// //         value = `${value}-${Date.now()}`;
// //       }
// //       return { value, label };
// //     });

// //     setCategories((prev) =>
// //       prev.map((cat) => (cat.value === category ? { ...cat, subcategories: nextSubcategories } : cat))
// //     );

// //     if (newlyAdded.length > 0) {
// //       const lastAdded = newlyAdded[newlyAdded.length - 1];
// //       const match = nextSubcategories.find((sub) => sub.label.toLowerCase() === lastAdded.toLowerCase());
// //       if (match) setSubcategory(match.value);
// //     } else if (subcategory && !nextSubcategories.some((sub) => sub.value === subcategory)) {
// //       setSubcategory(nextSubcategories[0]?.value ?? "");
// //     }

// //     setSubcategoriesPopupOpen(false);
// //   };

// //   const cancelSubcategoriesPopup = () => {
// //     if (!category) return;
// //     setCategories((prev) =>
// //       prev.map((cat) =>
// //         cat.value === category ? { ...cat, subcategories: [...subcategoriesSnapshotRef.current] } : cat
// //       )
// //     );
// //     setSubcategoriesPopupOpen(false);
// //   };

// //   const filtered = rows.filter((row) => {
// //     const labels = categoryLabel(categories, row.category, row.subcategory);
// //     const haystack = [
// //       row.date,
// //       formatDisplayDate(row.date),
// //       row.vendor,
// //       String(row.amount),
// //       `${row.amount} CAD`,
// //       row.paymentMode ?? "",
// //       row.bank ?? "",
// //       labels.category,
// //       labels.subcategory,
// //       row.notes,
// //       row.billNumber ?? "",
// //       row.attachmentName ?? "",
// //     ]
// //       .join(" ")
// //       .toLowerCase();
// //     return haystack.includes(search.toLowerCase());
// //   });

// //   const totalPages = Math.max(1, Math.ceil(filtered.length / entriesPerPage));
// //   const paged = filtered.slice((page - 1) * entriesPerPage, page * entriesPerPage);

// //   const toggleSelect = (id: number) => {
// //     setSelected((prev) => {
// //       const next = new Set(prev);
// //       if (next.has(id)) next.delete(id);
// //       else next.add(id);
// //       return next;
// //     });
// //   };

// //   const toggleSelectAll = () => {
// //     if (selected.size === paged.length) setSelected(new Set());
// //     else setSelected(new Set(paged.map((r) => r.id)));
// //   };

// //   const resetForm = () => {
// //     setEditingId(null);
// //     setAmount("");
// //     setDate("2026-06-20");
// //     setPaymentMode("");
// //     setBank("");
// //     setVendor("");
// //     setCategory("");
// //     setSubcategory("");
// //     setNotes("");
// //     setGst(false);
// //     setGstAmount("");
// //     setHasBillNumber(false);
// //     setBillNumber("");
// //     setByCheque(false);
// //     setChequeAccount("");
// //     setAttachReceipt(false);
// //     setReceiptFile(null);
// //     setAttachAttachment(false);
// //     setAttachmentFile(null);
// //     setAttachmentName(null);
// //   };

// //   const openAdd = () => {
// //     resetForm();
// //     setShowForm(true);
// //   };

// //   const openEdit = (row: LedgerRow) => {
// //     setEditingId(row.id);
// //     setAmount(String(row.amount));
// //     setDate(row.date);
// //     setPaymentMode(row.paymentMode ?? "");
// //     setBank(row.bank ?? "");
// //     setVendor(row.vendor);
// //     setCategory(row.category);
// //     setSubcategory(row.subcategory);
// //     setNotes(row.notes);
// //     setGst(row.gst);
// //     setHasBillNumber(Boolean(row.billNumber));
// //     setBillNumber(row.billNumber ?? "");
// //     setByCheque(row.byCheque);
// //     setChequeAccount(row.chequeAccount ?? "");
// //     setGstAmount(row.gstAmount ?? "");
// //     setAttachReceipt(row.hasReceipt);
// //     setReceiptFile(null);
// //     setAttachAttachment(Boolean(row.attachmentName));
// //     setAttachmentFile(null);
// //     setAttachmentName(row.attachmentName ?? null);
// //     setShowForm(true);
// //   };

// //   const handleCancel = () => {
// //     resetForm();
// //     setShowForm(false);
// //   };

// //   const handleSave = () => {
// //     const parsedAmount = Number.parseFloat(amount);
// //     const normalizedVendor = vendor.trim();
// //     const normalizedPaymentMode = paymentMode.trim();
// //     const normalizedBank = bank.trim();

// //     if (!amount.trim() || !Number.isFinite(parsedAmount)) {
// //       adminNotify.error("Amount is required.");
// //       return;
// //     }
// //     if (!date) {
// //       adminNotify.error("Date is required.");
// //       return;
// //     }
// //     if (!normalizedVendor) {
// //       adminNotify.error(`${vendorLabel} is required.`);
// //       return;
// //     }
// //     if (isIncome && !normalizedPaymentMode) {
// //       adminNotify.error("Payment Mode is required.");
// //       return;
// //     }

// //     const payload: Omit<LedgerRow, "id"> = {
// //       date,
// //       vendor: normalizedVendor,
// //       amount: parsedAmount || 0,
// //       category: category || categories[0]?.value || "",
// //       subcategory: subcategory || subcategoryOptions[0]?.value || "",
// //       notes,
// //       gst,
// //       gstAmount: gst && gstAmount.trim() ? gstAmount.trim() : null,
// //       billNumber: hasBillNumber && billNumber.trim() ? billNumber.trim() : null,
// //       byCheque,
// //       chequeAccount: byCheque && chequeAccount.trim() ? chequeAccount.trim() : null,
// //       hasReceipt: isIncome ? Boolean(attachAttachment && (attachmentFile || attachmentName)) : attachReceipt,
// //       paymentMode: isIncome ? normalizedPaymentMode : undefined,
// //       bank: isIncome ? normalizedBank : undefined,
// //       attachmentName: isIncome
// //         ? attachAttachment
// //           ? attachmentFile?.name ?? attachmentName ?? undefined
// //           : undefined
// //         : undefined,
// //     };

// //     if (!payload.category) {
// //       adminNotify.error("Category is required.");
// //       return;
// //     }
// //     if (isExpense && !payload.subcategory) {
// //       adminNotify.error("Subcategory is required.");
// //       return;
// //     }

// //     if (editingId != null) {
// //       setRows((prev) => prev.map((row) => (row.id === editingId ? { ...row, ...payload } : row)));
// //     } else {
// //       setRows((prev) => [
// //         ...prev,
// //         {
// //           id: Math.max(0, ...prev.map((row) => row.id)) + 1,
// //           ...payload,
// //         },
// //       ]);
// //     }

// //     adminNotify.success(editingId != null ? "Entry updated." : "Entry added.");
// //     resetForm();
// //     setShowForm(false);
// //   };

// //   return (
// //     <AdminPage
// //       title={title}
// //       headerAction={!showForm ? <AddNewButton onClick={openAdd} /> : undefined}
// //       between={
// //         showForm ? (
// //           <CompactFormPanel
// //             footer={
// //               <CompactFormFooter
// //                 actionLabel={editingId != null ? "Update" : "Save"}
// //                 onSave={handleSave}
// //                 onCancel={handleCancel}
// //               />
// //             }
// //           >
// //             <CompactFormRow className="items-start gap-y-6">
// //               <div className={`min-w-0 shrink-0 flex-none ${compactFixedFieldWidth}`}>
// //                 <CompactField label="Amount" required className="w-full flex-none">
// //                   <input
// //                     type="text"
// //                     inputMode="decimal"
// //                     value={amount}
// //                     onChange={(e) => setAmount(e.target.value)}
// //                     className={compactInputClass}
// //                   />
// //                 </CompactField>
// //                 {isExpense ? (
// //                   <div className="mt-3">
// //                     <label className="mb-1 flex cursor-pointer items-center gap-1.5 text-xs font-bold text-ad-green-dark">
// //                       <input
// //                         type="checkbox"
// //                         checked={gst}
// //                         onChange={(e) => {
// //                           const checked = e.target.checked;
// //                           setGst(checked);
// //                           if (!checked) setGstAmount("");
// //                         }}
// //                         className="h-3.5 w-3.5 accent-ad-green"
// //                       />
// //                       GST
// //                     </label>
// //                     {gst ? (
// //                       <input
// //                         type="text"
// //                         inputMode="decimal"
// //                         value={gstAmount}
// //                         onChange={(e) => setGstAmount(e.target.value)}
// //                         placeholder="GST amount"
// //                         className={compactInputClass}
// //                       />
// //                     ) : null}
// //                   </div>
// //                 ) : null}
// //               </div>
// //               <CompactField label="Date" required className={compactFixedFieldWidth}>
// //                 <input
// //                   type="date"
// //                   value={date}
// //                   onChange={(e) => setDate(e.target.value)}
// //                   className={compactInputClass}
// //                 />
// //               </CompactField>
// //               {isIncome ? (
// //                 <CompactField label="Payment Mode" required className={compactFixedFieldWidth}>
// //                   <select
// //                     value={paymentMode}
// //                     onChange={(e) => setPaymentMode(e.target.value)}
// //                     className={compactInputClass}
// //                   >
// //                     <option value="">Select</option>
// //                     {INCOME_PAYMENT_MODE_OPTIONS.map((opt) => (
// //                       <option key={opt} value={opt}>
// //                         {opt}
// //                       </option>
// //                     ))}
// //                   </select>
// //                 </CompactField>
// //               ) : null}
// //               {isIncome ? (
// //                 <CompactField label="Bank" className={compactFixedFieldWidth}>
// //                   <select value={bank} onChange={(e) => setBank(e.target.value)} className={compactInputClass}>
// //                     <option value="">Select account</option>
// //                     {bankOptions.map((opt) => (
// //                       <option key={opt} value={opt}>
// //                         {opt}
// //                       </option>
// //                     ))}
// //                   </select>
// //                 </CompactField>
// //               ) : null}
// //               <div className={`min-w-0 shrink-0 flex-none ${compactFixedFieldWidth}`}>
// //                 <VendorComboField
// //                   label={vendorLabel}
// //                   required
// //                   value={vendor}
// //                   onChange={setVendor}
// //                   options={vendorOptions}
// //                   className="w-full flex-none"
// //                 />
// //                 {isExpense ? (
// //                   <div className="mt-3">
// //                     <label className="mb-1 flex cursor-pointer items-center gap-1.5 text-xs font-bold text-ad-green-dark">
// //                       <input
// //                         type="checkbox"
// //                         checked={hasBillNumber}
// //                         onChange={(e) => {
// //                           const checked = e.target.checked;
// //                           setHasBillNumber(checked);
// //                           if (!checked) setBillNumber("");
// //                         }}
// //                         className="h-3.5 w-3.5 accent-ad-green"
// //                       />
// //                       {billLabel}
// //                     </label>
// //                     {hasBillNumber ? (
// //                       <input
// //                         type="text"
// //                         value={billNumber}
// //                         onChange={(e) => setBillNumber(e.target.value)}
// //                         className={compactInputClass}
// //                       />
// //                     ) : null}
// //                   </div>
// //                 ) : null}
// //               </div>
// //               <div className="min-w-[160px] flex-1">
// //                 <ComboSelectWithEditor
// //                   label="Category"
// //                   required
// //                   value={selectedCategoryLabel}
// //                   placeholder="Select category"
// //                   options={categoryLabels}
// //                   onChange={handleCategoryChange}
// //                   onEditAddNew={openCategoriesPopup}
// //                   className="w-full"
// //                 />
// //                 {isExpense ? (
// //                   <div className="mt-3">
// //                     <label className="mb-1 flex cursor-pointer items-center gap-1.5 text-xs font-bold text-ad-green-dark">
// //                       <input
// //                         type="checkbox"
// //                         checked={byCheque}
// //                         onChange={(e) => {
// //                           const checked = e.target.checked;
// //                           setByCheque(checked);
// //                           if (!checked) setChequeAccount("");
// //                         }}
// //                         className="h-3.5 w-3.5 accent-ad-green"
// //                       />
// //                       By Cheque
// //                     </label>
// //                     {byCheque ? (
// //                       <select
// //                         value={chequeAccount}
// //                         onChange={(e) => setChequeAccount(e.target.value)}
// //                         className={compactInputClass}
// //                       >
// //                         <option value="">Select account</option>
// //                         {chequeAccountOptions.map((opt) => (
// //                           <option key={opt} value={opt}>
// //                             {opt}
// //                           </option>
// //                         ))}
// //                       </select>
// //                     ) : null}
// //                   </div>
// //                 ) : null}
// //               </div>
// //               {isExpense ? (
// //                 <ComboSelectWithEditor
// //                   label="Subcategory"
// //                   required
// //                   value={selectedSubcategoryLabel}
// //                   placeholder="Select subcategory"
// //                   options={subcategoryLabels}
// //                   disabled={!category}
// //                   onChange={handleSubcategoryChange}
// //                   onEditAddNew={openSubcategoriesPopup}
// //                   className="min-w-[160px] flex-1"
// //                 />
// //               ) : null}
// //               {isExpense ? (
// //                 <div className={`min-w-0 shrink-0 flex-none ${compactFixedFieldWidth}`}>
// //                   <CompactField label="Notes" className="w-full flex-none">
// //                     <CompactAutoGrowTextarea value={notes} onChange={(e) => setNotes(e.target.value)} />
// //                   </CompactField>
// //                   <div className="mt-3">
// //                     <AttachImageCheckbox
// //                       label="Attach Image of Receipt"
// //                       checked={attachReceipt}
// //                       onCheckedChange={setAttachReceipt}
// //                       file={receiptFile}
// //                       onFileChange={setReceiptFile}
// //                     />
// //                   </div>
// //                 </div>
// //               ) : null}
// //             </CompactFormRow>

// //             {isIncome ? (
// //               <CompactFormRow className="items-start gap-y-6">
// //                 <CompactField label="Notes" className={compactFixedFieldWidth}>
// //                   <CompactAutoGrowTextarea value={notes} onChange={(e) => setNotes(e.target.value)} />
// //                 </CompactField>
// //                 <div className={`min-w-0 shrink-0 flex-none ${compactFixedFieldWidth}`}>
// //                   <AttachImageCheckbox
// //                     label="Attach Image"
// //                     checked={attachAttachment}
// //                     onCheckedChange={(checked) => {
// //                       setAttachAttachment(checked);
// //                       if (!checked) {
// //                         setAttachmentFile(null);
// //                         setAttachmentName(null);
// //                       }
// //                     }}
// //                     file={attachmentFile}
// //                     onFileChange={(file) => {
// //                       setAttachmentFile(file);
// //                       setAttachmentName(file?.name ?? null);
// //                     }}
// //                   />
// //                 </div>
// //               </CompactFormRow>
// //             ) : null}
// //             {categoriesPopupOpen && (
// //               <ListEditorPopup
// //                 title="Edit / Add Categories"
// //                 items={categoriesDraft}
// //                 onChange={setCategoriesDraft}
// //                 onSave={saveCategoriesPopup}
// //                 onCancel={cancelCategoriesPopup}
// //                 placeholder="Category name"
// //               />
// //             )}
// //             {subcategoriesPopupOpen && (
// //               <ListEditorPopup
// //                 title={`Edit / Add Subcategories${selectedCategoryLabel ? ` — ${selectedCategoryLabel}` : ""}`}
// //                 items={subcategoriesDraft}
// //                 onChange={setSubcategoriesDraft}
// //                 onSave={saveSubcategoriesPopup}
// //                 onCancel={cancelSubcategoriesPopup}
// //                 placeholder="Subcategory name"
// //               />
// //             )}
// //           </CompactFormPanel>
// //         ) : undefined
// //       }
// //     >
// //       <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
// //         <div className="flex flex-wrap gap-1">
// //           <button type="button" disabled={selected.size === 0} className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
// //             ↓ Export
// //           </button>
// //           <button type="button" disabled={selected.size === 0} className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
// //             Archive
// //           </button>
// //           <button type="button" disabled={selected.size === 0} className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
// //             Delete
// //           </button>
// //           <button type="button" disabled={selected.size === 0} className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
// //             Copy
// //           </button>
// //         </div>
// //         <div className="flex items-center gap-1">
// //           <input
// //             type="text"
// //             value={search}
// //             onChange={(e) => {
// //               setSearch(e.target.value);
// //               setPage(1);
// //             }}
// //             placeholder="Live search type here..."
// //             className="border border-gray-400 bg-white px-2 py-1 text-xs"
// //           />
// //           <button type="button" className="bg-gray-500 px-3 py-1 text-xs font-medium text-white hover:bg-gray-600">
// //             Search
// //           </button>
// //         </div>
// //       </div>

// //       <div className="mb-2 flex items-center gap-2 text-xs text-gray-700">
// //         <span>Show</span>
// //         <select
// //           value={entriesPerPage}
// //           onChange={(e) => {
// //             setEntriesPerPage(Number(e.target.value));
// //             setPage(1);
// //           }}
// //           className="border border-gray-400 px-1 py-0.5"
// //         >
// //           <option value={10}>10</option>
// //           <option value={25}>25</option>
// //           <option value={50}>50</option>
// //         </select>
// //         <span>entries</span>
// //       </div>

// //       <div className="overflow-x-auto">
// //         <table className="w-full border-collapse text-sm whitespace-nowrap">
// //           <thead>
// //             <tr className="bg-ad-purple text-white">
// //               <th className="border border-ad-purple-dark px-2 py-2 text-center">
// //                 <input
// //                   type="checkbox"
// //                   checked={paged.length > 0 && selected.size === paged.length}
// //                   onChange={toggleSelectAll}
// //                   className="accent-white"
// //                 />
// //               </th>
// //               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Date</th>
// //               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">{vendorLabel}</th>
// //               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Amount</th>
// //               {isIncome ? (
// //                 <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Payment Mode</th>
// //               ) : null}
// //               {isIncome ? (
// //                 <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Bank</th>
// //               ) : null}
// //               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Category</th>
// //               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Notes</th>
// //               {isExpense ? (
// //                 <>
// //                   <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">GST</th>
// //                   <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Bill Number</th>
// //                   <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">By Cheque</th>
// //                 </>
// //               ) : null}
// //               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">
// //                 {isIncome ? "Attachment" : "Clip"}
// //               </th>
// //             </tr>
// //           </thead>
// //           <tbody>
// //             {paged.map((row, idx) => {
// //               const labels = categoryLabel(categories, row.category, row.subcategory);
// //               return (
// //                 <tr key={row.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
// //                   <td className="border border-gray-300 px-2 py-2 text-center">
// //                     <input
// //                       type="checkbox"
// //                       checked={selected.has(row.id)}
// //                       onChange={() => toggleSelect(row.id)}
// //                       className="accent-ad-purple"
// //                     />
// //                   </td>
// //                   <td className="border border-gray-300 px-3 py-2 text-center">
// //                     <button
// //                       type="button"
// //                       onClick={() => openEdit(row)}
// //                       className="text-blue-700 hover:underline"
// //                     >
// //                       {formatDisplayDate(row.date)}
// //                     </button>
// //                   </td>
// //                   <td className="border border-gray-300 px-3 py-2 text-center uppercase">{row.vendor}</td>
// //                   <td className="border border-gray-300 px-3 py-2 text-center">
// //                     {row.amount % 1 === 0 ? row.amount : row.amount.toFixed(2)} CAD
// //                   </td>
// //                   {isIncome ? (
// //                     <td className="border border-gray-300 px-3 py-2 text-center">{row.paymentMode || ""}</td>
// //                   ) : null}
// //                   {isIncome ? (
// //                     <td className="border border-gray-300 px-3 py-2 text-center">{row.bank || ""}</td>
// //                   ) : null}
// //                   <td className="border border-gray-300 px-3 py-2 text-center">
// //                     <div>
// //                       <div className="font-bold leading-tight">{labels.category}</div>
// //                       <div className="text-xs text-gray-500">{labels.subcategory}</div>
// //                     </div>
// //                   </td>
// //                   <td className="border border-gray-300 px-3 py-2 text-center">{row.notes || ""}</td>
// //                   {isExpense ? (
// //                     <>
// //                       <td className="border border-gray-300 px-3 py-2 text-center">
// //                         {row.gst
// //                           ? row.gstAmount
// //                             ? `${row.gstAmount} CAD`
// //                             : "Yes"
// //                           : "No"}
// //                       </td>
// //                       <td className="border border-gray-300 px-3 py-2 text-center">{row.billNumber || "—"}</td>
// //                       <td className="border border-gray-300 px-3 py-2 text-center">
// //                         {row.byCheque
// //                           ? row.chequeAccount
// //                             ? `Yes (${row.chequeAccount})`
// //                             : "Yes"
// //                           : "No"}
// //                       </td>
// //                     </>
// //                   ) : null}
// //                   <td className="border border-gray-300 px-3 py-2 text-center">
// //                     {row.attachmentUrl ? (
// //                       <span className="inline-flex items-center gap-2">
// //                         <ClipImageHover
// //                           imageUrl={row.attachmentUrl}
// //                           alt={`Attachment for ${row.vendor}`}
// //                           iconClassName="text-blue-600"
// //                         />
// //                         {isIncome && row.attachmentName ? (
// //                           <span className="max-w-[160px] truncate text-xs text-gray-700" title={row.attachmentName}>
// //                             {row.attachmentName}
// //                           </span>
// //                         ) : null}
// //                       </span>
// //                     ) : (
// //                       <span className="text-gray-500">--</span>
// //                     )}
// //                   </td>
// //                 </tr>
// //               );
// //             })}
// //           </tbody>
// //         </table>
// //       </div>

// //       <div className="mt-4 flex items-center justify-between">
// //         <div className="flex gap-1">
// //           {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
// //             <button
// //               key={p}
// //               type="button"
// //               onClick={() => setPage(p)}
// //               className={`h-7 w-7 border text-xs font-medium ${page === p
// //                 ? "border-ad-green bg-ad-green text-white"
// //                 : "border-gray-400 bg-white text-gray-700 hover:bg-gray-100"
// //                 }`}
// //             >
// //               {p}
// //             </button>
// //           ))}
// //         </div>
// //       </div>
// //     </AdminPage>
// //   );
// // }

// // export default function AccountsPage({ initialShowForm = false, title = "Accounts", variant = "bank" }: AccountsPageProps) {
// //   if (variant === "expenses" || variant === "income") {
// //     return <LedgerPage initialShowForm={initialShowForm} title={title} variant={variant} />;
// //   }
// //   return <BankAccountsPage initialShowForm={initialShowForm} title={title} />;
// // }

// import { useEffect, useMemo, useRef, useState } from "react";
// import AttachImageCheckbox from "../../../components/admin/AttachImageCheckbox";
// import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
// import { TableEntriesSummary } from "../../../components/admin/AdminDataTable";
// import { AdminDeletedBanner, AdminDeletedToggle } from "../../../components/admin/AdminDeletedView";
// import AdminSearchCard, {
//   emptyAdminSearchValues,
//   searchEquals,
//   searchIncludes,
//   type AdminSearchField,
// } from "../../../components/admin/AdminSearchCard";
// import ClipImageHover from "../../../components/admin/ClipImageHover";
// import ComboSelectWithEditor from "../../../components/admin/ComboSelectWithEditor";
// import ListEditorPopup from "../../../components/admin/ListEditorPopup";
// import {
//   CompactAutoGrowTextarea,
//   CompactField,
//   CompactFormFooter,
//   CompactFormPanel,
//   CompactFormRow,
//   compactFixedFieldWidth,
//   compactInputClass,
// } from "../../../components/admin/ContentPanel";
// import { useAdminDeletedView } from "../../../hooks/useAdminDeletedView";
// import { adminNotify } from "../../../utils/adminNotify";
// import { formatDisplayDate } from "./accountData";
// import {
//   cloneCategories,
//   dedupeLabels,
//   EXPENSE_CATEGORIES,
//   INCOME_CATEGORIES,
//   slugifyLabel,
//   type CategoryOption,
// } from "./ledgerCategories";

// function buildLedgerSearchFields(variant: "expenses" | "income"): AdminSearchField[] {
//   const fields: AdminSearchField[] = [
//     { key: "date", label: "Date", type: "date" },
//     { key: "vendor", label: "Vendor" },
//     { key: "amount", label: "Amount" },
//   ];
//   if (variant === "income") {
//     fields.push(
//       { key: "paymentMode", label: "Payment Mode" },
//       { key: "bank", label: "Bank" }
//     );
//   }
//   fields.push(
//     { key: "category", label: "Category" },
//     { key: "notes", label: "Notes" }
//   );
//   if (variant === "expenses") {
//     fields.push(
//       {
//         key: "gst",
//         label: "GST",
//         type: "select",
//         options: [
//           { value: "Yes", label: "Yes" },
//           { value: "No", label: "No" },
//         ],
//       },
//       { key: "billNumber", label: "Bill Number" },
//       {
//         key: "byCheque",
//         label: "By Cheque",
//         type: "select",
//         options: [
//           { value: "Yes", label: "Yes" },
//           { value: "No", label: "No" },
//         ],
//       }
//     );
//   }
//   return fields;
// }

// // ---------------------------------------------------------------------------
// // API base + fetch helpers
// // ---------------------------------------------------------------------------

// // ASSUMPTION: adjust to whatever env var / config actually exposes this in
// // your app. Falls back to a relative "/api/admin" so it still works if the
// // frontend is served behind the same host as the API.
// const BASE_ADMIN =
//   ((typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL)
//     ? (import.meta as any).env?.VITE_API_URL + "/api/admin"
//     : "/api/admin");

// async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
//   const res = await fetch(`${BASE_ADMIN}${path}`, {
//     ...init,
//     headers: {
//       ...(init?.body ? { "Content-Type": "application/json" } : {}),
//       ...(init?.headers || {}),
//     },
//   });
//   if (!res.ok) {
//     const message = await res.text().catch(() => res.statusText);
//     throw new Error(message || `Request failed (${res.status})`);
//   }
//   if (res.status === 204) return undefined as T;
//   return (await res.json()) as T;
// }

// async function apiForm<T>(path: string, method: "POST" | "PATCH", formData: FormData): Promise<T> {
//   const res = await fetch(`${BASE_ADMIN}${path}`, { method, body: formData });
//   if (!res.ok) {
//     const message = await res.text().catch(() => res.statusText);
//     throw new Error(message || `Request failed (${res.status})`);
//   }
//   return (await res.json()) as T;
// }

// // Some backends wrap list responses ({ data: [...] }), some return arrays
// // directly. Normalize here so the rest of the component doesn't care.
// function unwrapList<T>(payload: any): T[] {
//   if (Array.isArray(payload)) return payload as T[];
//   if (Array.isArray(payload?.data)) return payload.data as T[];
//   return [];
// }
// // function unwrapOne<T>(payload: any): T {
// //   return (payload?.data ?? payload) as T;
// // }

// // ---------------------------------------------------------------------------
// // Types matching the API shapes (see curl reference)
// // ---------------------------------------------------------------------------

// type BankRow = {
//   _id: string;
//   BankName: string;
//   status: "active" | "inactive";
//   openingBalance?: number;
//   totalBalance?: number;
//   AccountName: string;
//   AccountNumber: string;
//   Interac: string;
// };

// type ExpenseRow = {
//   _id: string;
//   date: string;
//   vendor: string;
//   amount: number;
//   category: string;
//   notes?: string;
//   gst?: number;
//   billNumber?: string;
//   byCheque: boolean;
//   account?: string;
//   expenseImage?: string;
// };

// type IncomeRow = {
//   _id: string;
//   date: string;
//   vendor: string;
//   amount: number;
//   paymentMode: string;
//   bank?: string;
//   category: string;
//   notes?: string;
//   incomeImage?: string;
// };

// const BANK_STATUS_OPTIONS = [
//   { value: "active", label: "Active" },
//   { value: "inactive", label: "Inactive" },
// ];

// const INCOME_PAYMENT_MODE_OPTIONS = ["Bank Transfer", "Cash", "Cheque", "Online Payment"] as const;

// type PageVariant = "bank" | "expenses" | "income";

// type AccountsPageProps = {
//   initialShowForm?: boolean;
//   title?: string;
//   variant?: PageVariant;
// };

// function normalizeVendorLabel(value: string) {
//   return value.trim().replace(/\s+/g, " ");
// }

// // Category is stored server-side as a single string. We encode
// // "Category / Subcategory" so we can round-trip both from one field.
// // ASSUMPTION: change this if the real API adds a dedicated subcategory field.
// function encodeCategory(catLabel: string, subLabel: string) {
//   return subLabel ? `${catLabel} / ${subLabel}` : catLabel;
// }
// function decodeCategory(value: string): { category: string; subcategory: string } {
//   const [category, subcategory = ""] = (value || "").split(" / ");
//   return { category, subcategory };
// }

// // ---------------------------------------------------------------------------
// // Vendor autocomplete combo (unchanged from original)
// // ---------------------------------------------------------------------------

// function VendorComboField({
//   label,
//   required,
//   value,
//   onChange,
//   options,
//   className,
// }: {
//   label: string;
//   required?: boolean;
//   value: string;
//   onChange: (next: string) => void;
//   options: string[];
//   className?: string;
// }) {
//   const [open, setOpen] = useState(false);
//   const [activeIndex, setActiveIndex] = useState(0);
//   const rootRef = useRef<HTMLDivElement>(null);

//   const normalizedValue = value;
//   const filtered = useMemo(() => {
//     const q = normalizeVendorLabel(normalizedValue).toLowerCase();
//     const base = options
//       .map(normalizeVendorLabel)
//       .filter(Boolean)
//       .filter((opt, idx, arr) => arr.findIndex((v) => v.toLowerCase() === opt.toLowerCase()) === idx);
//     if (!q) return base.slice(0, 25);
//     return base.filter((opt) => opt.toLowerCase().includes(q)).slice(0, 25);
//   }, [normalizedValue, options]);

//   useEffect(() => {
//     if (!open) return;
//     const onPointerDown = (e: MouseEvent) => {
//       if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
//     };
//     const onKeyDown = (e: KeyboardEvent) => {
//       if (e.key === "Escape") setOpen(false);
//     };
//     document.addEventListener("mousedown", onPointerDown);
//     document.addEventListener("keydown", onKeyDown);
//     return () => {
//       document.removeEventListener("mousedown", onPointerDown);
//       document.removeEventListener("keydown", onKeyDown);
//     };
//   }, [open]);

//   useEffect(() => {
//     setActiveIndex(0);
//   }, [normalizedValue, open]);

//   const listboxId = `vendor-listbox-${label.replace(/\s+/g, "-").toLowerCase()}`;

//   return (
//     <CompactField label={label} required={required} className={className}>
//       <div ref={rootRef} className="relative">
//         <input
//           type="text"
//           value={value}
//           onChange={(e) => {
//             onChange(e.target.value);
//             setOpen(true);
//           }}
//           onFocus={() => setOpen(true)}
//           onKeyDown={(e) => {
//             if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
//               setOpen(true);
//               return;
//             }
//             if (!open) return;
//             if (e.key === "ArrowDown") {
//               e.preventDefault();
//               setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
//             } else if (e.key === "ArrowUp") {
//               e.preventDefault();
//               setActiveIndex((i) => Math.max(0, i - 1));
//             } else if (e.key === "Enter") {
//               const hit = filtered[activeIndex];
//               if (hit) {
//                 e.preventDefault();
//                 onChange(hit);
//                 setOpen(false);
//               }
//             }
//           }}
//           role="combobox"
//           aria-expanded={open}
//           aria-controls={listboxId}
//           aria-autocomplete="list"
//           className={compactInputClass}
//           autoComplete="off"
//         />

//         {open && filtered.length > 0 ? (
//           <div
//             id={listboxId}
//             role="listbox"
//             className="absolute left-0 right-0 z-50 mt-0.5 max-h-52 overflow-y-auto rounded border border-gray-400 bg-white shadow-lg"
//           >
//             {filtered.map((opt, idx) => {
//               const active = idx === activeIndex;
//               return (
//                 <button
//                   key={`${opt}-${idx}`}
//                   type="button"
//                   role="option"
//                   aria-selected={active}
//                   onMouseEnter={() => setActiveIndex(idx)}
//                   onClick={() => {
//                     onChange(opt);
//                     setOpen(false);
//                   }}
//                   className={`block w-full px-2 py-1.5 text-left text-sm hover:bg-gray-100 ${
//                     active ? "bg-ad-green-light/60 font-semibold text-ad-green-dark" : "text-gray-900"
//                   }`}
//                 >
//                   {opt}
//                 </button>
//               );
//             })}
//           </div>
//         ) : null}
//       </div>
//     </CompactField>
//   );
// }

// // ---------------------------------------------------------------------------
// // Banks page — now backed by GET/POST/PATCH/DELETE /accounts/banks
// // Design kept identical to before: a radio-button "Assign to Invoice"
// // column. The only change is that it no longer maps to a persisted
// // per-bank boolean on the API — the selection is just the bank's own
// // BankName, tracked client-side, since the API has no separate field.
// // ---------------------------------------------------------------------------

// function BankAccountsPage({ initialShowForm = false, title = "Manage Banks" }: AccountsPageProps) {
//   const [banks, setBanks] = useState<BankRow[]>([]);
//   const [draft, setDraft] = useState<BankRow[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [showForm, setShowForm] = useState(initialShowForm);
//   const [bankWalletName, setBankWalletName] = useState("");
//   const [openingBalance, setOpeningBalance] = useState("");
//   const [saving, setSaving] = useState(false);

//   // "Assign to Invoice" isn't a separate field on the API — it's just
//   // "which bank's BankName is picked". We keep that selection client-side
//   // (radio button, same as the original design) instead of persisting a
//   // separate assignToInvoice flag anywhere.
//   const [assignedBankId, setAssignedBankId] = useState<string | null>(null);

//   const loadBanks = async () => {
//     setLoading(true);
//     try {
//       const payload = await apiJson<any>("/accounts/banks");
//       const list = unwrapList<BankRow>(payload);
//       setBanks(list);
//       setDraft(structuredClone(list));
//       setAssignedBankId((prev) => {
//         if (prev && list.some((b) => b._id === prev)) return prev;
//         return list[0]?._id ?? null;
//       });
//     } catch (err) {
//       adminNotify.error(err instanceof Error ? err.message : "Failed to load banks.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadBanks();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const hasDraftChanges = useMemo(
//     () => JSON.stringify(draft) !== JSON.stringify(banks),
//     [draft, banks]
//   );

//   const updateDraftRow = (id: string, patch: Partial<BankRow>) => {
//     setDraft((prev) => prev.map((row) => (row._id === id ? { ...row, ...patch } : row)));
//   };

//   const setAssignToInvoice = (id: string) => {
//     setAssignedBankId(id);
//   };

//   const resetNewBankForm = () => {
//     setBankWalletName("");
//     setOpeningBalance("");
//   };

//   const handleNewBankCancel = () => {
//     resetNewBankForm();
//     setShowForm(false);
//   };

//   const handleNewBankSave = async () => {
//     const label = bankWalletName.trim();
//     if (!label) {
//       adminNotify.error("Bank / wallet name is required.");
//       return;
//     }
//     const parsedBalance = Number.parseFloat(openingBalance);
//     const openingBalanceValue = Number.isFinite(parsedBalance) ? parsedBalance : 0;

//     setSaving(true);
//     try {
//       await apiJson<any>("/accounts/banks", {
//         method: "POST",
//         body: JSON.stringify({
//           BankName: label.toUpperCase(),
//           status: "active",
//           openingBalance: openingBalanceValue,
//           AccountName: "",
//           AccountNumber: "",
//           Interac: "",
//         }),
//       });
//       adminNotify.success("Bank account added.");
//       resetNewBankForm();
//       setShowForm(false);
//       await loadBanks();
//     } catch (err) {
//       adminNotify.error(err instanceof Error ? err.message : "Failed to add bank account.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleTableUpdate = async () => {
//     const changedRows = draft.filter((row) => {
//       const original = banks.find((b) => b._id === row._id);
//       return original && JSON.stringify(original) !== JSON.stringify(row);
//     });
//     if (changedRows.length === 0) return;

//     setSaving(true);
//     try {
//       await Promise.all(
//         changedRows.map((row) =>
//           apiJson<any>(`/accounts/banks/${row._id}`, {
//             method: "PATCH",
//             body: JSON.stringify({
//               BankName: row.BankName,
//               status: row.status,
//               totalBalance: row.totalBalance,
//               AccountName: row.AccountName,
//               AccountNumber: row.AccountNumber,
//               Interac: row.Interac,
//             }),
//           })
//         )
//       );
//       adminNotify.success("Bank accounts updated.");
//       await loadBanks();
//     } catch (err) {
//       adminNotify.error(err instanceof Error ? err.message : "Failed to update bank accounts.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleTableCancel = () => {
//     setDraft(structuredClone(banks));
//   };

//   const tableInputClass =
//     "w-full min-w-[120px] border border-gray-400 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none";

//   return (
//     <AdminPage
//       title={title}
//       headerAction={
//         !showForm ? (
//           <button
//             type="button"
//             onClick={() => setShowForm(true)}
//             className="shrink-0 rounded bg-ad-green px-4 py-2 text-sm font-bold text-white hover:bg-ad-green-dark"
//           >
//             + New Bank
//           </button>
//         ) : undefined
//       }
//       between={
//         showForm ? (
//           <CompactFormPanel
//             footer={
//               <CompactFormFooter
//                 message="You are creating a 'Bank / Wallet'"
//                 messageCenter
//                 onSave={saving ? undefined : handleNewBankSave}
//                 onCancel={saving ? undefined : handleNewBankCancel}
//                 actionLabel={saving ? "Saving..." : undefined}
//               />
        
//             }
//           >
//             <CompactFormRow className="items-start">
//               <CompactField label="Bank / Wallet Name" required className={compactFixedFieldWidth}>
//                 <input
//                   type="text"
//                   value={bankWalletName}
//                   onChange={(e) => setBankWalletName(e.target.value)}
//                   className={compactInputClass}
//                 />
//               </CompactField>
//               <CompactField label="Opening Balance" className={compactFixedFieldWidth}>
//                 <input
//                   type="text"
//                   inputMode="decimal"
//                   value={openingBalance}
//                   onChange={(e) => setOpeningBalance(e.target.value)}
//                   className={compactInputClass}
//                 />
//               </CompactField>
//             </CompactFormRow>
//           </CompactFormPanel>
//         ) : undefined
//       }
//     >
//       <div className="overflow-x-auto">
//         <table className="w-full border-collapse text-sm whitespace-nowrap">
//           <thead>
//             <tr className="bg-ad-purple text-white">
//               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">
//                 Assign to Invoice
//               </th>
//               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Status</th>
//               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">
//                 Total Balance
//               </th>
//               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">
//                 Account Name
//               </th>
//               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">
//                 Account Number
//               </th>
//               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Interac</th>
//               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Delete</th>
//             </tr>
//           </thead>
//           <tbody>
//             {loading ? (
//               <tr>
//                 <td colSpan={7} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
//                   Loading banks…
//                 </td>
//               </tr>
//             ) : draft.length === 0 ? (
//               <tr>
//                 <td colSpan={7} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
//                   No bank accounts yet.
//                 </td>
//               </tr>
//             ) : (
//               draft.map((row, idx) => (
//                 <tr key={row._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
//                   <td className="border border-gray-300 px-3 py-2 text-center">
//                     <label className="inline-flex cursor-pointer items-center gap-2 font-bold uppercase">
//                       <input
//                         type="radio"
//                         name="assignToInvoice"
//                         checked={assignedBankId === row._id}
//                         onChange={() => setAssignToInvoice(row._id)}
//                         className="accent-ad-purple"
//                       />
//                       {row.BankName}
//                     </label>
//                   </td>
//                   <td className="border border-gray-300 px-3 py-2 text-center">
//                     <select
//                       value={row.status}
//                       onChange={(e) =>
//                         updateDraftRow(row._id, { status: e.target.value as BankRow["status"] })
//                       }
//                       className={tableInputClass}
//                     >
//                       {BANK_STATUS_OPTIONS.map((option) => (
//                         <option key={option.value} value={option.value}>
//                           {option.label}
//                         </option>
//                       ))}
//                     </select>
//                   </td>
//                   <td className="border border-gray-300 px-3 py-2 text-center">
//                     {row.totalBalance ?? row.openingBalance ?? 0}
//                   </td>
//                   <td className="border border-gray-300 px-3 py-2 text-center">
//                     <input
//                       type="text"
//                       value={row.AccountName}
//                       onChange={(e) => updateDraftRow(row._id, { AccountName: e.target.value })}
//                       className={tableInputClass}
//                     />
//                   </td>
//                   <td className="border border-gray-300 px-3 py-2 text-center">
//                     <input
//                       type="text"
//                       value={row.AccountNumber}
//                       onChange={(e) => updateDraftRow(row._id, { AccountNumber: e.target.value })}
//                       className={tableInputClass}
//                     />
//                   </td>
//                   <td className="border border-gray-300 px-3 py-2 text-center">
//                     <input
//                       type="email"
//                       value={row.Interac}
//                       onChange={(e) => updateDraftRow(row._id, { Interac: e.target.value })}
//                       className={tableInputClass}
//                     />
//                   </td>
//                   <td className="border border-gray-300 px-3 py-2 text-center">
//                     <button
//                       type="button"
//                       onClick={async () => {
//                         if (!window.confirm(`Delete bank "${row.BankName}"?`)) return;
//                         try {
//                           await apiJson<any>(`/accounts/banks/${row._id}`, { method: "DELETE" });
//                           adminNotify.success("Bank account deleted.");
//                           await loadBanks();
//                         } catch (err) {
//                           adminNotify.error(err instanceof Error ? err.message : "Failed to delete bank.");
//                         }
//                       }}
//                       className="text-blue-700 hover:underline"
//                     >
//                       Delete
//                     </button>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>

//       <div className="mt-4 flex items-center justify-end gap-2">
//         <button
//           type="button"
//           onClick={handleTableUpdate}
//           disabled={!hasDraftChanges || saving}
//           className="inline-flex items-center gap-1.5 rounded bg-ad-green px-4 py-1.5 text-sm font-bold text-white hover:bg-ad-green-dark disabled:cursor-not-allowed disabled:opacity-50"
//         >
//           Update
//           <span aria-hidden className="text-base leading-none">
//             →
//           </span>
//         </button>
//         <span className="text-xs text-gray-700">
//           or{" "}
//           <button
//             type="button"
//             onClick={handleTableCancel}
//             disabled={!hasDraftChanges || saving}
//             className="font-medium text-blue-600 underline hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
//           >
//             Cancel
//           </button>
//         </span>
//       </div>
//     </AdminPage>
//   );
// }

// // ---------------------------------------------------------------------------
// // Expenses / Income ledger page — now backed by
// // GET/POST/PATCH/DELETE /accounts/expenses and /accounts/income
// // ---------------------------------------------------------------------------

// function LedgerPage({
//   initialShowForm = false,
//   title,
//   variant,
// }: {
//   initialShowForm?: boolean;
//   title: string;
//   variant: "expenses" | "income";
// }) {
//   const isExpense = variant === "expenses";
//   const isIncome = variant === "income";
//   const baseCategories = isExpense ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
//   const vendorLabel = "Vendor";
//   const billLabel = isExpense ? "Bill Number" : "Invoice Number";
//   const listPath = isExpense ? "/accounts/expenses" : "/accounts/income";

//   const [banks, setBanks] = useState<BankRow[]>([]);
//   const [categories, setCategories] = useState<CategoryOption[]>(() => cloneCategories(baseCategories));
//   const [rows, setRows] = useState<(ExpenseRow | IncomeRow)[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [selected, setSelected] = useState<Set<string>>(new Set());
//   const [search, setSearch] = useState("");
//   const ledgerSearchFields = useMemo(() => buildLedgerSearchFields(variant), [variant]);
//   const [showSearchCard, setShowSearchCard] = useState(false);
//   const [searchDraft, setSearchDraft] = useState(() => emptyAdminSearchValues(buildLedgerSearchFields(variant)));
//   const [searchFilters, setSearchFilters] = useState(() => emptyAdminSearchValues(buildLedgerSearchFields(variant)));
//   const [page, setPage] = useState(1);
//   const [entriesPerPage, setEntriesPerPage] = useState(10);
//   const [showForm, setShowForm] = useState(initialShowForm);
//   const [editingId, setEditingId] = useState<string | null>(null);

//   const [amount, setAmount] = useState("");
//   const [date, setDate] = useState("2026-06-20");
//   const [paymentMode, setPaymentMode] = useState("");
//   const [bank, setBank] = useState("");
//   const [vendor, setVendor] = useState("");
//   const [category, setCategory] = useState("");
//   const [subcategory, setSubcategory] = useState("");
//   const [notes, setNotes] = useState("");
//   const [gst, setGst] = useState(false);
//   const [gstAmount, setGstAmount] = useState("");
//   const [hasBillNumber, setHasBillNumber] = useState(false);
//   const [billNumber, setBillNumber] = useState("");
//   const [byCheque, setByCheque] = useState(false);
//   const [chequeAccount, setChequeAccount] = useState("");
//   const [attachReceipt, setAttachReceipt] = useState(false);
//   const [receiptFile, setReceiptFile] = useState<File | null>(null);
//   const [attachAttachment, setAttachAttachment] = useState(false);
//   const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

//   const resetTableControls = () => {
//     setPage(1);
//     setSelected(new Set());
//     setSearch("");
//     const empty = emptyAdminSearchValues(ledgerSearchFields);
//     setSearchDraft(empty);
//     setSearchFilters(empty);
//     setShowSearchCard(false);
//   };

//   const {
//     viewMode,
//     isDeletedView,
//     toggleViewMode,
//     deletedStash,
//     stashDeleted,
//     restoreStashed,
//   } = useAdminDeletedView<ExpenseRow | IncomeRow>({
//     onToggle: resetTableControls,
//     storageKey: "admin_deleted_view:accounts-ledger",
//   });

//   const variantStash = useMemo(
//     () =>
//       deletedStash.filter((row) =>
//         isExpense ? "byCheque" in row : "paymentMode" in row
//       ),
//     [deletedStash, isExpense]
//   );

//   const [categoriesPopupOpen, setCategoriesPopupOpen] = useState(false);
//   const [subcategoriesPopupOpen, setSubcategoriesPopupOpen] = useState(false);
//   const [categoriesDraft, setCategoriesDraft] = useState<string[]>([""]);
//   const [subcategoriesDraft, setSubcategoriesDraft] = useState<string[]>([""]);
//   const categoriesSnapshotRef = useRef<CategoryOption[]>([]);
//   const subcategoriesSnapshotRef = useRef<{ value: string; label: string }[]>([]);

//   const categoryLabels = useMemo(() => categories.map((cat) => cat.label), [categories]);
//   const selectedCategory = useMemo(
//     () => categories.find((cat) => cat.value === category),
//     [categories, category]
//   );
//   const subcategoryLabels = useMemo(
//     () => selectedCategory?.subcategories.map((sub) => sub.label) ?? [],
//     [selectedCategory]
//   );
//   const selectedCategoryLabel = selectedCategory?.label ?? "";
//   const selectedSubcategoryLabel =
//     selectedCategory?.subcategories.find((sub) => sub.value === subcategory)?.label ?? "";

//   const subcategoryOptions = useMemo(() => selectedCategory?.subcategories ?? [], [selectedCategory]);

//   const vendorOptions = useMemo(() => {
//     const seen = new Map<string, string>();
//     for (const row of rows) {
//       const normalized = normalizeVendorLabel(row.vendor);
//       if (!normalized) continue;
//       const key = normalized.toLowerCase();
//       if (!seen.has(key)) seen.set(key, normalized);
//     }
//     return [...seen.values()].sort((a, b) => a.localeCompare(b));
//   }, [rows]);

//   const chequeAccountOptions = useMemo(() => {
//     return banks
//       .filter((b) => String(b.status).toLowerCase() === "active")
//       .map((b) => b.BankName)
//       .filter(Boolean);
//   }, [banks]);

//   const bankOptions = useMemo(() => banks.map((b) => b.BankName).filter(Boolean), [banks]);

//   const loadBanks = async () => {
//     try {
//       const payload = await apiJson<any>("/accounts/banks");
//       setBanks(unwrapList<BankRow>(payload));
//     } catch (err) {
//       adminNotify.error(err instanceof Error ? err.message : "Failed to load bank accounts.");
//     }
//   };

//   const loadRows = async () => {
//     setLoading(true);
//     try {
//       const payload = await apiJson<any>(listPath);
//       setRows(unwrapList<ExpenseRow | IncomeRow>(payload));
//     } catch (err) {
//       adminNotify.error(err instanceof Error ? err.message : "Failed to load records.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadBanks();
//     loadRows();
//     const empty = emptyAdminSearchValues(buildLedgerSearchFields(variant));
//     setSearchDraft(empty);
//     setSearchFilters(empty);
//     setShowSearchCard(false);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [variant]);

//   useEffect(() => {
//     if (subcategory && !subcategoryOptions.some((s) => s.value === subcategory)) {
//       setSubcategory("");
//     }
//   }, [subcategory, subcategoryOptions]);

//   const handleCategoryChange = (nextCategoryLabel: string) => {
//     if (!nextCategoryLabel) {
//       setCategory("");
//       setSubcategory("");
//       return;
//     }
//     const match = categories.find((cat) => cat.label === nextCategoryLabel);
//     setCategory(match?.value ?? slugifyLabel(nextCategoryLabel));
//     setSubcategory("");
//   };

//   const handleSubcategoryChange = (nextSubcategoryLabel: string) => {
//     if (!nextSubcategoryLabel) {
//       setSubcategory("");
//       return;
//     }
//     const match = subcategoryOptions.find((sub) => sub.label === nextSubcategoryLabel);
//     setSubcategory(match?.value ?? slugifyLabel(nextSubcategoryLabel));
//   };

//   const openCategoriesPopup = () => {
//     categoriesSnapshotRef.current = cloneCategories(categories);
//     setCategoriesDraft(categoryLabels.length ? [...categoryLabels] : [""]);
//     setCategoriesPopupOpen(true);
//   };

//   const saveCategoriesPopup = () => {
//     const labels = dedupeLabels(categoriesDraft);
//     const previousLabels = new Set(categoryLabels.map((label) => label.toLowerCase()));
//     const newlyAdded = labels.filter((label) => !previousLabels.has(label.toLowerCase()));

//     const nextCategories = labels.map((label) => {
//       const existing = categories.find((cat) => cat.label.toLowerCase() === label.toLowerCase());
//       if (existing) return { ...existing, label };
//       let value = slugifyLabel(label);
//       if (categories.some((cat) => cat.value === value)) {
//         value = `${value}-${Date.now()}`;
//       }
//       return { value, label, subcategories: [] };
//     });

//     setCategories(nextCategories);

//     if (newlyAdded.length > 0) {
//       const lastAdded = newlyAdded[newlyAdded.length - 1];
//       const match = nextCategories.find((cat) => cat.label.toLowerCase() === lastAdded.toLowerCase());
//       if (match) handleCategoryChange(match.label);
//     } else if (category && !nextCategories.some((cat) => cat.value === category)) {
//       handleCategoryChange(nextCategories[0]?.label ?? "");
//     }

//     setCategoriesPopupOpen(false);
//   };

//   const cancelCategoriesPopup = () => {
//     setCategories(categoriesSnapshotRef.current);
//     setCategoriesPopupOpen(false);
//   };

//   const openSubcategoriesPopup = () => {
//     if (!category) return;
//     subcategoriesSnapshotRef.current = [...subcategoryOptions];
//     setSubcategoriesDraft(subcategoryLabels.length ? [...subcategoryLabels] : [""]);
//     setSubcategoriesPopupOpen(true);
//   };

//   const saveSubcategoriesPopup = () => {
//     if (!category) return;
//     const labels = dedupeLabels(subcategoriesDraft);
//     const previousLabels = new Set(subcategoryLabels.map((label) => label.toLowerCase()));
//     const newlyAdded = labels.filter((label) => !previousLabels.has(label.toLowerCase()));

//     const nextSubcategories = labels.map((label) => {
//       const existing = subcategoryOptions.find((sub) => sub.label.toLowerCase() === label.toLowerCase());
//       if (existing) return { ...existing, label };
//       let value = slugifyLabel(label);
//       if (subcategoryOptions.some((sub) => sub.value === value)) {
//         value = `${value}-${Date.now()}`;
//       }
//       return { value, label };
//     });

//     setCategories((prev) =>
//       prev.map((cat) => (cat.value === category ? { ...cat, subcategories: nextSubcategories } : cat))
//     );

//     if (newlyAdded.length > 0) {
//       const lastAdded = newlyAdded[newlyAdded.length - 1];
//       const match = nextSubcategories.find((sub) => sub.label.toLowerCase() === lastAdded.toLowerCase());
//       if (match) setSubcategory(match.value);
//     } else if (subcategory && !nextSubcategories.some((sub) => sub.value === subcategory)) {
//       setSubcategory(nextSubcategories[0]?.value ?? "");
//     }

//     setSubcategoriesPopupOpen(false);
//   };

//   const cancelSubcategoriesPopup = () => {
//     if (!category) return;
//     setCategories((prev) =>
//       prev.map((cat) =>
//         cat.value === category ? { ...cat, subcategories: [...subcategoriesSnapshotRef.current] } : cat
//       )
//     );
//     setSubcategoriesPopupOpen(false);
//   };

//   const displayRows = isDeletedView ? variantStash : rows;

//   const filtered = displayRows.filter((row) => {
//     const decoded = decodeCategory(row.category);
//     const haystack = [
//       row.date,
//       formatDisplayDate(row.date),
//       row.vendor,
//       String(row.amount),
//       `${row.amount} CAD`,
//       (row as IncomeRow).paymentMode ?? "",
//       (row as IncomeRow).bank ?? (row as ExpenseRow).account ?? "",
//       decoded.category,
//       decoded.subcategory,
//       row.notes ?? "",
//       (row as ExpenseRow).billNumber ?? "",
//     ]
//       .join(" ")
//       .toLowerCase();
//     if (!haystack.includes(search.toLowerCase())) return false;

//     const expenseRow = row as ExpenseRow;
//     const incomeRow = row as IncomeRow;
//     const gstLabel = Number(expenseRow.gst ?? 0) > 0 ? "Yes" : "No";
//     const chequeLabel = expenseRow.byCheque ? "Yes" : "No";
//     return (
//       searchIncludes(formatDisplayDate(row.date), searchFilters.date) &&
//       searchIncludes(row.vendor, searchFilters.vendor) &&
//       searchIncludes(String(row.amount), searchFilters.amount) &&
//       searchIncludes(incomeRow.paymentMode ?? "", searchFilters.paymentMode ?? "") &&
//       searchIncludes(incomeRow.bank ?? expenseRow.account ?? "", searchFilters.bank ?? "") &&
//       searchIncludes(`${decoded.category} ${decoded.subcategory}`, searchFilters.category) &&
//       searchIncludes(row.notes ?? "", searchFilters.notes) &&
//       searchEquals(gstLabel, searchFilters.gst ?? "") &&
//       searchIncludes(expenseRow.billNumber ?? "", searchFilters.billNumber ?? "") &&
//       searchEquals(chequeLabel, searchFilters.byCheque ?? "")
//     );
//   });

//   const totalPages = Math.max(1, Math.ceil(filtered.length / entriesPerPage));
//   const paged = filtered.slice((page - 1) * entriesPerPage, page * entriesPerPage);

//   const toggleSelect = (id: string) => {
//     setSelected((prev) => {
//       const next = new Set(prev);
//       if (next.has(id)) next.delete(id);
//       else next.add(id);
//       return next;
//     });
//   };

//   const toggleSelectAll = () => {
//     if (selected.size === paged.length) setSelected(new Set());
//     else setSelected(new Set(paged.map((r) => r._id)));
//   };

//   const resetForm = () => {
//     setEditingId(null);
//     setAmount("");
//     setDate("2026-06-20");
//     setPaymentMode("");
//     setBank("");
//     setVendor("");
//     setCategory("");
//     setSubcategory("");
//     setNotes("");
//     setGst(false);
//     setGstAmount("");
//     setHasBillNumber(false);
//     setBillNumber("");
//     setByCheque(false);
//     setChequeAccount("");
//     setAttachReceipt(false);
//     setReceiptFile(null);
//     setAttachAttachment(false);
//     setAttachmentFile(null);

//   };

//   const openAdd = () => {
//     resetForm();
//     setShowSearchCard(false);
//     setShowForm(true);
//   };

//   const openEdit = (row: ExpenseRow | IncomeRow) => {
//     const decoded = decodeCategory(row.category);
//     setEditingId(row._id);
//     setAmount(String(row.amount));
//     setDate(row.date);
//     setVendor(row.vendor);
//     setNotes(row.notes ?? "");

//     const catMatch = categories.find((c) => c.label === decoded.category);
//     setCategory(catMatch?.value ?? "");
//     const subMatch = catMatch?.subcategories.find((s) => s.label === decoded.subcategory);
//     setSubcategory(subMatch?.value ?? "");

//     if (isExpense) {
//       const exp = row as ExpenseRow;
//       setGst(Boolean(exp.gst));
//       setGstAmount(exp.gst ? String(exp.gst) : "");
//       setHasBillNumber(Boolean(exp.billNumber));
//       setBillNumber(exp.billNumber ?? "");
//       setByCheque(Boolean(exp.byCheque));
//       setChequeAccount(exp.account ?? "");
//       setAttachReceipt(Boolean(exp.expenseImage));
//       setReceiptFile(null);
//     } else {
//       const inc = row as IncomeRow;
//       setPaymentMode(inc.paymentMode ?? "");
//       setBank(inc.bank ?? "");
//       setAttachAttachment(Boolean(inc.incomeImage));
//       setAttachmentFile(null);
//     }

//     setShowSearchCard(false);
//     setShowForm(true);
//   };

//   const openSearchCard = () => {
//     setShowForm(false);
//     setEditingId(null);
//     setSearchDraft({ ...searchFilters });
//     setShowSearchCard((open) => !open);
//   };

//   const handleSearchCardSearch = () => {
//     setSearchFilters({ ...searchDraft });
//     setPage(1);
//     setSelected(new Set());
//   };

//   const handleSearchCardReset = () => {
//     const empty = emptyAdminSearchValues(ledgerSearchFields);
//     setSearchDraft(empty);
//     setSearchFilters(empty);
//     setPage(1);
//     setSelected(new Set());
//   };

//   const handleCancel = () => {
//     resetForm();
//     setShowForm(false);
//   };

//   const handleSave = async () => {
//     const parsedAmount = Number.parseFloat(amount);
//     const normalizedVendor = vendor.trim();
//     const normalizedPaymentMode = paymentMode.trim();

//     if (!amount.trim() || !Number.isFinite(parsedAmount)) {
//       adminNotify.error("Amount is required.");
//       return;
//     }
//     if (!date) {
//       adminNotify.error("Date is required.");
//       return;
//     }
//     if (!normalizedVendor) {
//       adminNotify.error(`${vendorLabel} is required.`);
//       return;
//     }
//     if (isIncome && !normalizedPaymentMode) {
//       adminNotify.error("Payment Mode is required.");
//       return;
//     }
//     if (!category) {
//       adminNotify.error("Category is required.");
//       return;
//     }
//     if (isExpense && !subcategory) {
//       adminNotify.error("Subcategory is required.");
//       return;
//     }
//     if (isExpense && byCheque && !chequeAccount) {
//       adminNotify.error("Account is required when paying by cheque.");
//       return;
//     }
//     if (isIncome && normalizedPaymentMode === "Bank Transfer" && !bank) {
//       adminNotify.error("Bank is required for Bank Transfer.");
//       return;
//     }

//     const combinedCategory = encodeCategory(selectedCategoryLabel, selectedSubcategoryLabel);

//     const formData = new FormData();
//     formData.set("date", date);
//     formData.set("vendor", normalizedVendor);
//     formData.set("amount", String(parsedAmount));
//     formData.set("category", combinedCategory);
//     formData.set("notes", notes);

//     if (isExpense) {
//       formData.set("gst", gst && gstAmount.trim() ? gstAmount.trim() : "0");
//       if (hasBillNumber && billNumber.trim()) formData.set("billNumber", billNumber.trim());
//       formData.set("byCheque", String(byCheque));
//       if (byCheque && chequeAccount) formData.set("account", chequeAccount);
//       if (attachReceipt && receiptFile) formData.set("expenseImage", receiptFile);
//     } else {
//       formData.set("paymentMode", normalizedPaymentMode);
//       if (bank) formData.set("bank", bank);
//       if (attachAttachment && attachmentFile) formData.set("incomeImage", attachmentFile);
//     }

//     setSaving(true);
//     try {
//       if (editingId != null) {
//         await apiForm<any>(`${listPath}/${editingId}`, "PATCH", formData);
//       } else {
//         await apiForm<any>(listPath, "POST", formData);
//       }
//       adminNotify.success(editingId != null ? "Entry updated." : "Entry added.");
//       resetForm();
//       setShowForm(false);
//       await loadRows();
//     } catch (err) {
//       adminNotify.error(err instanceof Error ? err.message : "Failed to save entry.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleDeleteRow = async (id: string) => {
//     if (!window.confirm("Delete this entry?")) return;
//     const row = rows.find((r) => r._id === id);
//     try {
//       await apiJson<any>(`${listPath}/${id}`, { method: "DELETE" });
//       if (row) stashDeleted(row);
//       adminNotify.success("Entry deleted.");
//       setSelected((prev) => {
//         const next = new Set(prev);
//         next.delete(id);
//         return next;
//       });
//       await loadRows();
//     } catch (err) {
//       adminNotify.error(err instanceof Error ? err.message : "Failed to delete entry.");
//     }
//   };

//   const handleBulkDelete = async () => {
//     if (selected.size === 0) return;
//     if (!window.confirm(`Delete ${selected.size} selected entr${selected.size === 1 ? "y" : "ies"}?`)) return;
//     const toStash = rows.filter((r) => selected.has(r._id));
//     try {
//       await Promise.all([...selected].map((id) => apiJson<any>(`${listPath}/${id}`, { method: "DELETE" })));
//       if (toStash.length > 0) stashDeleted(toStash);
//       adminNotify.success("Selected entries deleted.");
//       setSelected(new Set());
//       await loadRows();
//     } catch (err) {
//       adminNotify.error(err instanceof Error ? err.message : "Failed to delete selected entries.");
//     }
//   };

//   const handleRestore = async (ids?: string[]) => {
//     const selectedIds = ids ?? [...selected];
//     if (selectedIds.length === 0) return;
//     const toRestore = variantStash.filter((r) => selectedIds.includes(r._id));
//     if (toRestore.length === 0) return;
//     if (!window.confirm(`Restore ${toRestore.length} entr${toRestore.length === 1 ? "y" : "ies"}?`)) return;
//     let allSucceeded = true;
//     for (const row of toRestore) {
//       try {
//         const formData = new FormData();
//         formData.set("date", row.date);
//         formData.set("vendor", row.vendor);
//         formData.set("amount", String(row.amount));
//         formData.set("category", row.category);
//         formData.set("notes", row.notes ?? "");
//         if (isExpense) {
//           const exp = row as ExpenseRow;
//           formData.set("gst", String(exp.gst ?? 0));
//           if (exp.billNumber) formData.set("billNumber", exp.billNumber);
//           formData.set("byCheque", String(Boolean(exp.byCheque)));
//           if (exp.byCheque && exp.account) formData.set("account", exp.account);
//         } else {
//           const inc = row as IncomeRow;
//           formData.set("paymentMode", inc.paymentMode ?? "");
//           if (inc.bank) formData.set("bank", inc.bank);
//         }
//         await apiForm<any>(listPath, "POST", formData);
//         restoreStashed((item) => item._id === row._id);
//       } catch {
//         allSucceeded = false;
//       }
//     }
//     setSelected(new Set());
//     adminNotify[allSucceeded ? "success" : "error"](
//       allSucceeded ? "Restored successfully." : "Some entries failed to restore."
//     );
//     await loadRows();
//   };

//   return (
//     <AdminPage
//       title={isDeletedView ? `Deleted ${title}` : title}
//       headerAction={!showForm && !showSearchCard && !isDeletedView ? <AddNewButton onClick={openAdd} /> : undefined}
//       between={
//         showSearchCard ? (
//           <AdminSearchCard
//             fields={ledgerSearchFields}
//             values={searchDraft}
//             onChange={setSearchDraft}
//             onSearch={handleSearchCardSearch}
//             onReset={handleSearchCardReset}
//             onClose={() => setShowSearchCard(false)}
//           />
//         ) : showForm && !isDeletedView ? (
//           <CompactFormPanel
//             footer={
//               <CompactFormFooter
//                 actionLabel={editingId != null ? "Update" : "Save"}
//                 onSave={saving ? undefined : handleSave}
//                 onCancel={handleCancel}
//               />
//             }
      
//           >
//             <CompactFormRow className="items-start gap-y-6">
//               <div
//                 className={`min-w-0 shrink-0 flex-none ${
//                   isIncome ? "w-[100px] sm:w-[120px]" : compactFixedFieldWidth
//                 }`}
//               >
//                 <CompactField label="Amount" required className="w-full flex-none">
//                   <input
//                     type="text"
//                     inputMode="decimal"
//                     value={amount}
//                     onChange={(e) => setAmount(e.target.value)}
//                     className={compactInputClass}
//                   />
//                 </CompactField>
//                 {isExpense ? (
//                   <div className="mt-3">
//                     <label className="mb-1 flex cursor-pointer items-center gap-1.5 text-xs font-bold text-ad-green-dark">
//                       <input
//                         type="checkbox"
//                         checked={gst}
//                         onChange={(e) => {
//                           const checked = e.target.checked;
//                           setGst(checked);
//                           if (!checked) setGstAmount("");
//                         }}
//                         className="h-3.5 w-3.5 accent-ad-green"
//                       />
//                       GST
//                     </label>
//                     {gst ? (
//                       <input
//                         type="text"
//                         inputMode="decimal"
//                         value={gstAmount}
//                         onChange={(e) => setGstAmount(e.target.value)}
//                         placeholder="GST amount"
//                         className={compactInputClass}
//                       />
//                     ) : null}
//                   </div>
//                 ) : null}
//               </div>
//               <div
//                 className={`min-w-0 shrink-0 flex-none ${
//                   isIncome ? "w-[100px] sm:w-[120px]" : compactFixedFieldWidth
//                 }`}
//               >
//                 <CompactField label="Date" required className="w-full flex-none">
//                   <input
//                     type="date"
//                     value={date}
//                     onChange={(e) => setDate(e.target.value)}
//                     className={compactInputClass}
//                   />
//                 </CompactField>
//                 {isExpense ? (
//                   <div className="mt-3">
//                     <label className="mb-1 flex cursor-pointer items-center gap-1.5 text-xs font-bold text-ad-green-dark">
//                       <input
//                         type="checkbox"
//                         checked={hasBillNumber}
//                         onChange={(e) => {
//                           const checked = e.target.checked;
//                           setHasBillNumber(checked);
//                           if (!checked) setBillNumber("");
//                         }}
//                         className="h-3.5 w-3.5 accent-ad-green"
//                       />
//                       {billLabel}
//                     </label>
//                     {hasBillNumber ? (
//                       <input
//                         type="text"
//                         value={billNumber}
//                         onChange={(e) => setBillNumber(e.target.value)}
//                         className={compactInputClass}
//                       />
//                     ) : null}
//                   </div>
//                 ) : null}
//               </div>
//               {isIncome ? (
//                 <CompactField label="Payment Mode" required className={compactFixedFieldWidth}>
//                   <select
//                     value={paymentMode}
//                     onChange={(e) => setPaymentMode(e.target.value)}
//                     className={compactInputClass}
//                   >
//                     <option value="">Select</option>
//                     {INCOME_PAYMENT_MODE_OPTIONS.map((opt) => (
//                       <option key={opt} value={opt}>
//                         {opt}
//                       </option>
//                     ))}
//                   </select>
//                 </CompactField>
//               ) : null}
//               {isIncome ? (
//                 <CompactField
//                   label="Bank"
//                   required={paymentMode === "Bank Transfer"}
//                   className={compactFixedFieldWidth}
//                 >
//                   <select value={bank} onChange={(e) => setBank(e.target.value)} className={compactInputClass}>
//                     <option value="">Select account</option>
//                     {bankOptions.map((opt) => (
//                       <option key={opt} value={opt}>
//                         {opt}
//                       </option>
//                     ))}
//                   </select>
//                 </CompactField>
//               ) : null}
//               <div className={`min-w-0 shrink-0 flex-none ${compactFixedFieldWidth}`}>
//                 <VendorComboField
//                   label={vendorLabel}
//                   required
//                   value={vendor}
//                   onChange={setVendor}
//                   options={vendorOptions}
//                   className="w-full flex-none"
//                 />
//                 {isExpense ? (
//                   <div className="mt-3">
//                     <label className="mb-1 flex cursor-pointer items-center gap-1.5 text-xs font-bold text-ad-green-dark">
//                       <input
//                         type="checkbox"
//                         checked={byCheque}
//                         onChange={(e) => {
//                           const checked = e.target.checked;
//                           setByCheque(checked);
//                           if (!checked) setChequeAccount("");
//                         }}
//                         className="h-3.5 w-3.5 accent-ad-green"
//                       />
//                       By Cheque
//                     </label>
//                     {byCheque ? (
//                       <select
//                         value={chequeAccount}
//                         onChange={(e) => setChequeAccount(e.target.value)}
//                         className={compactInputClass}
//                       >
//                         <option value="">Select account</option>
//                         {chequeAccountOptions.map((opt) => (
//                           <option key={opt} value={opt}>
//                             {opt}
//                           </option>
//                         ))}
//                       </select>
//                     ) : null}
//                   </div>
//                 ) : null}
//               </div>
//               <ComboSelectWithEditor
//                 label="Category"
//                 required
//                 value={selectedCategoryLabel}
//                 placeholder="Select category"
//                 options={categoryLabels}
//                 onChange={handleCategoryChange}
//                 onEditAddNew={openCategoriesPopup}
//                 className={isIncome ? "w-[120px] shrink-0 flex-none sm:w-[140px]" : "min-w-[160px] flex-1"}
//               />
//               {isExpense ? (
//                 <ComboSelectWithEditor
//                   label="Subcategory"
//                   required
//                   value={selectedSubcategoryLabel}
//                   placeholder="Select subcategory"
//                   options={subcategoryLabels}
//                   disabled={!category}
//                   onChange={handleSubcategoryChange}
//                   onEditAddNew={openSubcategoriesPopup}
//                   className="min-w-[160px] flex-1"
//                 />
//               ) : null}
//               {isExpense ? (
//                 <div className={`min-w-0 shrink-0 flex-none ${compactFixedFieldWidth}`}>
//                   <CompactField label="Notes" className="w-full flex-none">
//                     <CompactAutoGrowTextarea value={notes} onChange={(e) => setNotes(e.target.value)} />
//                   </CompactField>
//                   <div className="mt-3">
//                     <AttachImageCheckbox
//                       label="Attach Image of Receipt"
//                       checked={attachReceipt}
//                       onCheckedChange={setAttachReceipt}
//                       file={receiptFile}
//                       onFileChange={setReceiptFile}
//                     />
//                   </div>
//                 </div>
//               ) : null}
//               {isIncome ? (
//                 <CompactField label="Notes" className="min-w-[160px] flex-1">
//                   <CompactAutoGrowTextarea value={notes} onChange={(e) => setNotes(e.target.value)} />
//                 </CompactField>
//               ) : null}
//             </CompactFormRow>

//             {isIncome ? (
//               <CompactFormRow className="items-start gap-y-6">
//                 <div className={`min-w-0 shrink-0 flex-none ${compactFixedFieldWidth}`}>
//                   <AttachImageCheckbox
//                     label="Attach Image"
//                     checked={attachAttachment}
//                     onCheckedChange={(checked) => {
//                       setAttachAttachment(checked);
//                       if (!checked) {
//                         setAttachmentFile(null);
//                       }
//                     }}
//                     file={attachmentFile}
//                     onFileChange={(file) => {
//                       setAttachmentFile(file);
//                     }}
//                   />
//                 </div>
//               </CompactFormRow>
//             ) : null}
//             {categoriesPopupOpen && (
//               <ListEditorPopup
//                 title="Edit / Add Categories"
//                 items={categoriesDraft}
//                 onChange={setCategoriesDraft}
//                 onSave={saveCategoriesPopup}
//                 onCancel={cancelCategoriesPopup}
//                 placeholder="Category name"
//               />
//             )}
//             {subcategoriesPopupOpen && (
//               <ListEditorPopup
//                 title={`Edit / Add Subcategories${selectedCategoryLabel ? ` — ${selectedCategoryLabel}` : ""}`}
//                 items={subcategoriesDraft}
//                 onChange={setSubcategoriesDraft}
//                 onSave={saveSubcategoriesPopup}
//                 onCancel={cancelSubcategoriesPopup}
//                 placeholder="Subcategory name"
//               />
//             )}
//           </CompactFormPanel>
//         ) : undefined
//       }
//     >
//       {isDeletedView && (
//         <AdminDeletedBanner count={variantStash.length} entityLabel="entries" />
//       )}
//       <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
//         <div className="flex flex-wrap gap-1">
//           <button type="button" disabled={selected.size === 0} className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
//             ↓ Export
//           </button>
//           <button type="button" disabled={selected.size === 0} className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
//             Archive
//           </button>
//           {!isDeletedView ? (
//             <button
//               type="button"
//               disabled={selected.size === 0}
//               onClick={handleBulkDelete}
//               className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
//             >
//               Delete
//             </button>
//           ) : (
//             <button
//               type="button"
//               disabled={selected.size === 0}
//               onClick={() => handleRestore()}
//               className="bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark disabled:cursor-not-allowed disabled:opacity-50"
//             >
//               Restore
//             </button>
//           )}
//           <button type="button" disabled={selected.size === 0} className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
//             Copy
//           </button>
//         </div>
//         <div className="flex items-center gap-1">
//           <input
//             type="text"
//             value={search}
//             onChange={(e) => {
//               setSearch(e.target.value);
//               setPage(1);
//             }}
//             placeholder="Live search type here..."
//             className="border border-gray-400 bg-white px-2 py-1 text-xs"
//           />
//           <button
//             type="button"
//             onClick={openSearchCard}
//             className={`px-3 py-1 text-xs font-medium text-white hover:bg-gray-600 ${
//               showSearchCard ? "bg-gray-700" : "bg-gray-500"
//             }`}
//           >
//             Filters
//           </button>
//         </div>
//       </div>

//       <div className="mb-2 flex items-center gap-2 text-xs text-gray-700">
//         <span>Show</span>
//         <select
//           value={entriesPerPage}
//           onChange={(e) => {
//             setEntriesPerPage(Number(e.target.value));
//             setPage(1);
//           }}
//           className="border border-gray-400 px-1 py-0.5"
//         >
//           <option value={10}>10</option>
//           <option value={25}>25</option>
//           <option value={50}>50</option>
//         </select>
//         <span>entries</span>
//       </div>

//       <div className="overflow-x-auto">
//         <table className="w-full border-collapse text-sm whitespace-nowrap">
//           <thead>
//             <tr className="bg-ad-purple text-white">
//               <th className="border border-ad-purple-dark px-2 py-2 text-center">
//                 <input
//                   type="checkbox"
//                   checked={paged.length > 0 && selected.size === paged.length}
//                   onChange={toggleSelectAll}
//                   className="accent-white"
//                 />
//               </th>
//               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Date</th>
//               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">{vendorLabel}</th>
//               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Amount</th>
//               {isIncome ? (
//                 <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Payment Mode</th>
//               ) : null}
//               {isIncome ? (
//                 <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Bank</th>
//               ) : null}
//               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Category</th>
//               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Notes</th>
//               {isExpense ? (
//                 <>
//                   <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">GST</th>
//                   <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Bill Number</th>
//                   <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">By Cheque</th>
//                 </>
//               ) : null}
//               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">
//                 {isIncome ? "Attachment" : "Clip"}
//               </th>
//               <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">
//                 {isDeletedView ? "Restore" : "Delete"}
//               </th>
//             </tr>
//           </thead>
//           <tbody>
//             {loading && !isDeletedView ? (
//               <tr>
//                 <td colSpan={12} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
//                   Loading…
//                 </td>
//               </tr>
//             ) : paged.length === 0 ? (
//               <tr>
//                 <td colSpan={12} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
//                   {isDeletedView ? "No deleted entries found." : "No entries found."}
//                 </td>
//               </tr>
//             ) : (
//               paged.map((row, idx) => {
//                 const decoded = decodeCategory(row.category);
//                 const incomeRow = row as IncomeRow;
//                 const expenseRow = row as ExpenseRow;
//                 const attachmentUrl = isIncome ? incomeRow.incomeImage : expenseRow.expenseImage;
//                 return (
//                   <tr key={row._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
//                     <td className="border border-gray-300 px-2 py-2 text-center">
//                       <input
//                         type="checkbox"
//                         checked={selected.has(row._id)}
//                         onChange={() => toggleSelect(row._id)}
//                         className="accent-ad-purple"
//                       />
//                     </td>
//                     <td className="border border-gray-300 px-3 py-2 text-center">
//                       <button
//                         type="button"
//                         onClick={() => openEdit(row)}
//                         disabled={isDeletedView}
//                         className="text-blue-700 hover:underline disabled:cursor-default disabled:no-underline"
//                       >
//                         {formatDisplayDate(row.date)}
//                       </button>
//                     </td>
//                     <td className="border border-gray-300 px-3 py-2 text-center uppercase">{row.vendor}</td>
//                     <td className="border border-gray-300 px-3 py-2 text-center">
//                       {row.amount % 1 === 0 ? row.amount : row.amount.toFixed(2)}
//                     </td>
//                     {isIncome ? (
//                       <td className="border border-gray-300 px-3 py-2 text-center">{incomeRow.paymentMode || ""}</td>
//                     ) : null}
//                     {isIncome ? (
//                       <td className="border border-gray-300 px-3 py-2 text-center">{incomeRow.bank || ""}</td>
//                     ) : null}
//                     <td className="border border-gray-300 px-3 py-2 text-center">
//                       <div>
//                         <div className="font-bold leading-tight">{decoded.category}</div>
//                         <div className="text-xs text-gray-500">{decoded.subcategory}</div>
//                       </div>
//                     </td>
//                     <td className="border border-gray-300 px-3 py-2 text-left align-top whitespace-normal break-words min-w-[240px]">{row.notes || ""}</td>
//                     {isExpense ? (
//                       <>
//                         <td className="border border-gray-300 px-3 py-2 text-center">
//                           {expenseRow.gst ? `${expenseRow.gst} CAD` : "No"}
//                         </td>
//                         <td className="border border-gray-300 px-3 py-2 text-center">
//                           {expenseRow.billNumber || "—"}
//                         </td>
//                         <td className="border border-gray-300 px-3 py-2 text-center">
//                           {expenseRow.byCheque
//                             ? expenseRow.account
//                               ? `Yes (${expenseRow.account})`
//                               : "Yes"
//                             : "No"}
//                         </td>
//                       </>
//                     ) : null}
//                     <td className="border border-gray-300 px-3 py-2 text-center">
//                       {attachmentUrl ? (
//                         <span className="inline-flex items-center gap-2">
//                           <ClipImageHover
//                             imageUrl={attachmentUrl}
//                             alt={`Attachment for ${row.vendor}`}
//                             iconClassName="text-blue-600"
//                           />
//                         </span>
//                       ) : (
//                         <span className="text-gray-500">--</span>
//                       )}
//                     </td>
//                     <td className="border border-gray-300 px-3 py-2 text-center">
//                       {isDeletedView ? (
//                         <button
//                           type="button"
//                           onClick={() => handleRestore([row._id])}
//                           className="text-blue-700 hover:underline"
//                         >
//                           Restore
//                         </button>
//                       ) : (
//                         <button
//                           type="button"
//                           onClick={() => handleDeleteRow(row._id)}
//                           className="text-blue-700 hover:underline"
//                         >
//                           Delete
//                         </button>
//                       )}
//                     </td>
//                   </tr>
//                 );
//               })
//             )}
//           </tbody>
//         </table>
//       </div>

//       <div className="mt-4 flex items-center justify-between">
//         <TableEntriesSummary total={filtered.length} page={page} pageSize={entriesPerPage} />
//         <div className="flex gap-1">
//           {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
//             <button
//               key={p}
//               type="button"
//               onClick={() => setPage(p)}
//               className={`h-7 w-7 border text-xs font-medium ${page === p
//                 ? "border-ad-green bg-ad-green text-white"
//                 : "border-gray-400 bg-white text-gray-700 hover:bg-gray-100"
//                 }`}
//             >
//               {p}
//             </button>
//           ))}
//         </div>
//         <AdminDeletedToggle
//           viewMode={viewMode}
//           onToggle={toggleViewMode}
//           activeLabel="Active Entries"
//         />
//       </div>
//     </AdminPage>
//   );
// }

// export default function AccountsPage({ initialShowForm = false, title = "Accounts", variant = "bank" }: AccountsPageProps) {
//   if (variant === "expenses" || variant === "income") {
//     return <LedgerPage initialShowForm={initialShowForm} title={title} variant={variant} />;
//   }
//   return <BankAccountsPage initialShowForm={initialShowForm} title={title} />;
// }

import { useEffect, useMemo, useRef, useState } from "react";
import AttachImageCheckbox from "../../../components/admin/AttachImageCheckbox";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import { TableEntriesSummary } from "../../../components/admin/AdminDataTable";
import { AdminDeletedBanner, AdminDeletedToggle } from "../../../components/admin/AdminDeletedView";
import AdminSearchCard, {
  emptyAdminSearchValues,
  searchEquals,
  searchIncludes,
  type AdminSearchField,
} from "../../../components/admin/AdminSearchCard";
import ClipImageHover from "../../../components/admin/ClipImageHover";
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
import { useAdminDeletedView } from "../../../hooks/useAdminDeletedView";
import { adminNotify } from "../../../utils/adminNotify";
import { formatDisplayDate } from "./accountData";
import {
  cloneCategories,
  dedupeLabels,
  EXPENSE_CATEGORIES,
  expenseApiRowsToOptions,
  INCOME_CATEGORIES,
  slugifyLabel,
  type CategoryOption,
} from "./ledgerCategories";
import {
  addExpenseCategory,
  editExpenseCategory,
  fetchExpenseCategories,
  removeExpenseCategory,
} from "./accountsAPI";
 
function buildLedgerSearchFields(variant: "expenses" | "income"): AdminSearchField[] {
  const fields: AdminSearchField[] = [
    { key: "date", label: "Date", type: "date" },
    { key: "vendor", label: "Vendor" },
    { key: "amount", label: "Amount" },
  ];
  if (variant === "income") {
    fields.push(
      { key: "paymentMode", label: "Payment Mode" },
      { key: "bank", label: "Bank" }
    );
  }
  fields.push(
    { key: "category", label: "Category" },
    { key: "notes", label: "Notes" }
  );
  if (variant === "expenses") {
    fields.push(
      {
        key: "gst",
        label: "GST",
        type: "select",
        options: [
          { value: "Yes", label: "Yes" },
          { value: "No", label: "No" },
        ],
      },
      { key: "billNumber", label: "Bill Number" },
      {
        key: "byCheque",
        label: "By Cheque",
        type: "select",
        options: [
          { value: "Yes", label: "Yes" },
          { value: "No", label: "No" },
        ],
      }
    );
  }
  return fields;
}
 
// ---------------------------------------------------------------------------
// API base + fetch helpers
// ---------------------------------------------------------------------------
 
// ASSUMPTION: adjust to whatever env var / config actually exposes this in
// your app. Falls back to a relative "/api/admin" so it still works if the
// frontend is served behind the same host as the API.
const BASE_ADMIN =
  ((typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL)
    ? (import.meta as any).env?.VITE_API_URL + "/api/admin"
    : "/api/admin");
 
async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_ADMIN}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(message || `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
 
async function apiForm<T>(path: string, method: "POST" | "PATCH", formData: FormData): Promise<T> {
  const res = await fetch(`${BASE_ADMIN}${path}`, { method, body: formData });
  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(message || `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}
 
// Some backends wrap list responses ({ data: [...] }), some return arrays
// directly. Normalize here so the rest of the component doesn't care.
function unwrapList<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (Array.isArray(payload?.data)) return payload.data as T[];
  return [];
}
// function unwrapOne<T>(payload: any): T {
//   return (payload?.data ?? payload) as T;
// }
 
// ---------------------------------------------------------------------------
// Types matching the API shapes (see curl reference)
// ---------------------------------------------------------------------------
 
type BankRow = {
  _id: string;
  BankName: string;
  status: "active" | "inactive";
  openingBalance?: number;
  totalBalance?: number;
  AccountName: string;
  AccountNumber: string;
  Interac: string;
};
 
type ExpenseRow = {
  _id: string;
  date: string;
  vendor: string;
  amount: number;
  category: string;
  notes?: string;
  gst?: number;
  billNumber?: string;
  byCheque: boolean;
  account?: string;
  expenseImage?: string;
};
 
type IncomeRow = {
  _id: string;
  date: string;
  vendor: string;
  amount: number;
  paymentMode: string;
  bank?: string;
  category: string;
  notes?: string;
  incomeImage?: string;
};
 
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
 
function normalizeVendorLabel(value: string) {
  return value.trim().replace(/\s+/g, " ");
}
 
// Category is stored server-side as a single string. We encode
// "Category / Subcategory" so we can round-trip both from one field.
// ASSUMPTION: change this if the real API adds a dedicated subcategory field.
function encodeCategory(catLabel: string, subLabel: string) {
  return subLabel ? `${catLabel} / ${subLabel}` : catLabel;
}
function decodeCategory(value: string): { category: string; subcategory: string } {
  const [category, subcategory = ""] = (value || "").split(" / ");
  return { category, subcategory };
}
 
// ---------------------------------------------------------------------------
// Vendor autocomplete combo (unchanged from original)
// ---------------------------------------------------------------------------
 
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
 
// ---------------------------------------------------------------------------
// Banks page — now backed by GET/POST/PATCH/DELETE /accounts/banks
// Design kept identical to before: a radio-button "Assign to Invoice"
// column. The only change is that it no longer maps to a persisted
// per-bank boolean on the API — the selection is just the bank's own
// BankName, tracked client-side, since the API has no separate field.
// ---------------------------------------------------------------------------
 
function BankAccountsPage({ initialShowForm = false, title = "Manage Banks" }: AccountsPageProps) {
  const [banks, setBanks] = useState<BankRow[]>([]);
  const [draft, setDraft] = useState<BankRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(initialShowForm);
  const [bankWalletName, setBankWalletName] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [saving, setSaving] = useState(false);
 
  // "Assign to Invoice" isn't a separate field on the API — it's just
  // "which bank's BankName is picked". We keep that selection client-side
  // (radio button, same as the original design) instead of persisting a
  // separate assignToInvoice flag anywhere.
  const [assignedBankId, setAssignedBankId] = useState<string | null>(null);
 
  const loadBanks = async () => {
    setLoading(true);
    try {
      const payload = await apiJson<any>("/accounts/banks");
      const list = unwrapList<BankRow>(payload);
      setBanks(list);
      setDraft(structuredClone(list));
      setAssignedBankId((prev) => {
        if (prev && list.some((b) => b._id === prev)) return prev;
        return list[0]?._id ?? null;
      });
    } catch (err) {
      adminNotify.error(err instanceof Error ? err.message : "Failed to load banks.");
    } finally {
      setLoading(false);
    }
  };
 
  useEffect(() => {
    loadBanks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
 
  const hasDraftChanges = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(banks),
    [draft, banks]
  );
 
  const updateDraftRow = (id: string, patch: Partial<BankRow>) => {
    setDraft((prev) => prev.map((row) => (row._id === id ? { ...row, ...patch } : row)));
  };
 
  const setAssignToInvoice = (id: string) => {
    setAssignedBankId(id);
  };
 
  const resetNewBankForm = () => {
    setBankWalletName("");
    setOpeningBalance("");
  };
 
  const handleNewBankCancel = () => {
    resetNewBankForm();
    setShowForm(false);
  };
 
  const handleNewBankSave = async () => {
    const label = bankWalletName.trim();
    if (!label) {
      adminNotify.error("Bank / wallet name is required.");
      return;
    }
    const parsedBalance = Number.parseFloat(openingBalance);
    const openingBalanceValue = Number.isFinite(parsedBalance) ? parsedBalance : 0;
 
    setSaving(true);
    try {
      await apiJson<any>("/accounts/banks", {
        method: "POST",
        body: JSON.stringify({
          BankName: label.toUpperCase(),
          status: "active",
          openingBalance: openingBalanceValue,
          AccountName: "",
          AccountNumber: "",
          Interac: "",
        }),
      });
      adminNotify.success("Bank account added.");
      resetNewBankForm();
      setShowForm(false);
      await loadBanks();
    } catch (err) {
      adminNotify.error(err instanceof Error ? err.message : "Failed to add bank account.");
    } finally {
      setSaving(false);
    }
  };
 
  const handleTableUpdate = async () => {
    const changedRows = draft.filter((row) => {
      const original = banks.find((b) => b._id === row._id);
      return original && JSON.stringify(original) !== JSON.stringify(row);
    });
    if (changedRows.length === 0) return;
 
    setSaving(true);
    try {
      await Promise.all(
        changedRows.map((row) =>
          apiJson<any>(`/accounts/banks/${row._id}`, {
            method: "PATCH",
            body: JSON.stringify({
              BankName: row.BankName,
              status: row.status,
              totalBalance: row.totalBalance,
              AccountName: row.AccountName,
              AccountNumber: row.AccountNumber,
              Interac: row.Interac,
            }),
          })
        )
      );
      adminNotify.success("Bank accounts updated.");
      await loadBanks();
    } catch (err) {
      adminNotify.error(err instanceof Error ? err.message : "Failed to update bank accounts.");
    } finally {
      setSaving(false);
    }
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
                onSave={saving ? undefined : handleNewBankSave}
                onCancel={saving ? undefined : handleNewBankCancel}
                actionLabel={saving ? "Saving..." : undefined}
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
        <table className="w-full border-collapse text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-ad-purple text-white">
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">
                Assign to Invoice
              </th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Status</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">
                Total Balance
              </th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">
                Account Name
              </th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">
                Account Number
              </th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Interac</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Delete</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                  Loading banks…
                </td>
              </tr>
            ) : draft.length === 0 ? (
              <tr>
                <td colSpan={7} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                  No bank accounts yet.
                </td>
              </tr>
            ) : (
              draft.map((row, idx) => (
                <tr key={row._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <label className="inline-flex cursor-pointer items-center gap-2 font-bold uppercase">
                      <input
                        type="radio"
                        name="assignToInvoice"
                        checked={assignedBankId === row._id}
                        onChange={() => setAssignToInvoice(row._id)}
                        className="accent-ad-purple"
                      />
                      {row.BankName}
                    </label>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <select
                      value={row.status}
                      onChange={(e) =>
                        updateDraftRow(row._id, { status: e.target.value as BankRow["status"] })
                      }
                      className={tableInputClass}
                    >
                      {BANK_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    {row.totalBalance ?? row.openingBalance ?? 0}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <input
                      type="text"
                      value={row.AccountName}
                      onChange={(e) => updateDraftRow(row._id, { AccountName: e.target.value })}
                      className={tableInputClass}
                    />
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <input
                      type="text"
                      value={row.AccountNumber}
                      onChange={(e) => updateDraftRow(row._id, { AccountNumber: e.target.value })}
                      className={tableInputClass}
                    />
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <input
                      type="email"
                      value={row.Interac}
                      onChange={(e) => updateDraftRow(row._id, { Interac: e.target.value })}
                      className={tableInputClass}
                    />
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm(`Delete bank "${row.BankName}"?`)) return;
                        try {
                          await apiJson<any>(`/accounts/banks/${row._id}`, { method: "DELETE" });
                          adminNotify.success("Bank account deleted.");
                          await loadBanks();
                        } catch (err) {
                          adminNotify.error(err instanceof Error ? err.message : "Failed to delete bank.");
                        }
                      }}
                      className="text-blue-700 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
 
      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleTableUpdate}
          disabled={!hasDraftChanges || saving}
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
            disabled={!hasDraftChanges || saving}
            className="font-medium text-blue-600 underline hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
        </span>
      </div>
    </AdminPage>
  );
}
 
// ---------------------------------------------------------------------------
// Expenses / Income ledger page — now backed by
// GET/POST/PATCH/DELETE /accounts/expenses and /accounts/income
// ---------------------------------------------------------------------------
 
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
  const listPath = isExpense ? "/accounts/expenses" : "/accounts/income";
 
  const [banks, setBanks] = useState<BankRow[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>(() => cloneCategories(baseCategories));
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesSaving, setCategoriesSaving] = useState(false);
  const [rows, setRows] = useState<(ExpenseRow | IncomeRow)[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const ledgerSearchFields = useMemo(() => buildLedgerSearchFields(variant), [variant]);
  const [showSearchCard, setShowSearchCard] = useState(false);
  const [searchDraft, setSearchDraft] = useState(() => emptyAdminSearchValues(buildLedgerSearchFields(variant)));
  const [searchFilters, setSearchFilters] = useState(() => emptyAdminSearchValues(buildLedgerSearchFields(variant)));
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showForm, setShowForm] = useState(initialShowForm);
  const [editingId, setEditingId] = useState<string | null>(null);
 
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
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [attachAttachment, setAttachAttachment] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
 
  const resetTableControls = () => {
    setPage(1);
    setSelected(new Set());
    setSearch("");
    const empty = emptyAdminSearchValues(ledgerSearchFields);
    setSearchDraft(empty);
    setSearchFilters(empty);
    setShowSearchCard(false);
  };
 
  const {
    viewMode,
    isDeletedView,
    toggleViewMode,
    deletedStash,
    stashDeleted,
    restoreStashed,
  } = useAdminDeletedView<ExpenseRow | IncomeRow>({
    onToggle: resetTableControls,
    storageKey: "admin_deleted_view:accounts-ledger",
  });
 
  const variantStash = useMemo(
    () =>
      deletedStash.filter((row) =>
        isExpense ? "byCheque" in row : "paymentMode" in row
      ),
    [deletedStash, isExpense]
  );
 
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
    selectedCategory?.subcategories.find((sub) => sub.value === subcategory)?.label ?? subcategory;
 
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
      .map((b) => b.BankName)
      .filter(Boolean);
  }, [banks]);
 
  const bankOptions = useMemo(() => banks.map((b) => b.BankName).filter(Boolean), [banks]);
 
  const loadBanks = async () => {
    try {
      const payload = await apiJson<any>("/accounts/banks");
      setBanks(unwrapList<BankRow>(payload));
    } catch (err) {
      adminNotify.error(err instanceof Error ? err.message : "Failed to load bank accounts.");
    }
  };
 
  const loadRows = async () => {
    setLoading(true);
    try {
      const payload = await apiJson<any>(listPath);
      setRows(unwrapList<ExpenseRow | IncomeRow>(payload));
    } catch (err) {
      adminNotify.error(err instanceof Error ? err.message : "Failed to load records.");
    } finally {
      setLoading(false);
    }
  };
 
  // Expense categories are backend-managed (fixed master list) via
  // /admin/accounts/expenses-category. Income categories remain a local,
  // client-only list — no API was provided for those.
  const loadExpenseCategories = async () => {
    setCategoriesLoading(true);
    try {
      const apiRows = await fetchExpenseCategories();
      setCategories(expenseApiRowsToOptions(apiRows));
    } catch (err) {
      adminNotify.error(err instanceof Error ? err.message : "Failed to load expense categories.");
    } finally {
      setCategoriesLoading(false);
    }
  };
 
  useEffect(() => {
    loadBanks();
    loadRows();
    if (isExpense) {
      loadExpenseCategories();
    } else {
      setCategories(cloneCategories(baseCategories));
    }
    const empty = emptyAdminSearchValues(buildLedgerSearchFields(variant));
    setSearchDraft(empty);
    setSearchFilters(empty);
    setShowSearchCard(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant]);
 
  const handleCategoryChange = (nextCategoryLabel: string) => {
    if (!nextCategoryLabel) {
      setCategory("");
      setSubcategory("");
      return;
    }
    const match = categories.find((cat) => cat.label === nextCategoryLabel);
    if (!match) {
      if (isExpense) {
        // Expense categories are a fixed master list managed via the
        // "manage categories" popup (backed by the expenses-category API).
        // Typing something that isn't in the list is not allowed here —
        // only subcategories are freely typeable.
        adminNotify.error(`"${nextCategoryLabel}" isn't a category yet. Use the + to add it first.`);
        return;
      }
      setCategory(slugifyLabel(nextCategoryLabel));
      setSubcategory("");
      return;
    }
    setCategory(match.value);
    setSubcategory("");
  };
 
  const handleSubcategoryChange = (nextSubcategoryLabel: string) => {
    if (!nextSubcategoryLabel) {
      setSubcategory("");
      return;
    }
    // Subcategories are always free-typeable, for both expenses and
    // income: if it matches a known suggestion we use that; otherwise we
    // accept whatever the user typed as a one-off value for this entry.
    const match = subcategoryOptions.find((sub) => sub.label === nextSubcategoryLabel);
    setSubcategory(match?.value ?? nextSubcategoryLabel);
  };
 
  const openCategoriesPopup = () => {
    categoriesSnapshotRef.current = cloneCategories(categories);
    setCategoriesDraft(categoryLabels.length ? [...categoryLabels] : [""]);
    setCategoriesPopupOpen(true);
  };
 
  // Local-only category list editing (income has no backing API).
  const saveCategoriesPopupLocal = () => {
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
 
  // API-backed category list editing (expenses). The ListEditorPopup only
  // gives us a flat list of labels with no per-item id, so we diff against
  // the previous label set: anything new is created, anything missing is
  // deleted. A pure rename (same position, different text) is therefore
  // handled as a delete + create rather than an in-place PUT — acceptable
  // here since categories don't carry other server-side relationships.
  const saveCategoriesPopupApi = async () => {
    if (categoriesSaving) return;
    const labels = dedupeLabels(categoriesDraft);
    const previousByLower = new Map(categories.map((cat) => [cat.label.toLowerCase(), cat]));
    const nextLower = new Set(labels.map((l) => l.toLowerCase()));
 
    const toAdd = labels.filter((label) => !previousByLower.has(label.toLowerCase()));
    const toRemove = categories.filter((cat) => !nextLower.has(cat.label.toLowerCase()));
 
    setCategoriesSaving(true);
    try {
      for (const cat of toRemove) {
        await removeExpenseCategory(cat.value);
      }
      let lastCreatedLabel: string | null = null;
      for (const label of toAdd) {
        await addExpenseCategory({ name: label });
        lastCreatedLabel = label;
      }
      const apiRows = await fetchExpenseCategories();
      const nextCategories = expenseApiRowsToOptions(apiRows);
      setCategories(nextCategories);
 
      if (lastCreatedLabel) {
        const match = nextCategories.find((cat) => cat.label.toLowerCase() === lastCreatedLabel!.toLowerCase());
        if (match) handleCategoryChange(match.label);
      } else if (category && !nextCategories.some((cat) => cat.value === category)) {
        handleCategoryChange(nextCategories[0]?.label ?? "");
      }
      adminNotify.success("Categories updated.");
      setCategoriesPopupOpen(false);
    } catch (err) {
      adminNotify.error(err instanceof Error ? err.message : "Failed to update categories.");
    } finally {
      setCategoriesSaving(false);
    }
  };
 
  const saveCategoriesPopup = () => {
    if (isExpense) {
      void saveCategoriesPopupApi();
    } else {
      saveCategoriesPopupLocal();
    }
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
 
  // Local-only subcategory-suggestion list editing (income).
  const saveSubcategoriesPopupLocal = () => {
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
 
  // API-backed subcategory-suggestion editing (expenses). Subcategories on
  // the backend are just an array of names owned by the parent category,
  // so this is a single PUT replacing the whole list — matches curl #5/#6.
  // Note: these are only the *suggestion* list stored on the category;
  // the actual ledger entry's subcategory is still free text (see
  // handleSubcategoryChange) and doesn't require being in this list.
  const saveSubcategoriesPopupApi = async () => {
    if (!category || categoriesSaving) return;
    const labels = dedupeLabels(subcategoriesDraft);
 
    setCategoriesSaving(true);
    try {
      const updated = await editExpenseCategory(category, { subcategories: labels });
      const nextSubcategories = (updated.subcategories ?? []).map((sub) => ({
        value: sub.name,
        label: sub.name,
      }));
      setCategories((prev) =>
        prev.map((cat) => (cat.value === category ? { ...cat, subcategories: nextSubcategories } : cat))
      );
 
      if (subcategory && !nextSubcategories.some((sub) => sub.value === subcategory)) {
        // The typed-in subcategory value is kept as-is even if it's no
        // longer (or never was) in the suggestion list — see note above.
      }
      adminNotify.success("Subcategories updated.");
      setSubcategoriesPopupOpen(false);
    } catch (err) {
      adminNotify.error(err instanceof Error ? err.message : "Failed to update subcategories.");
    } finally {
      setCategoriesSaving(false);
    }
  };
 
  const saveSubcategoriesPopup = () => {
    if (isExpense) {
      void saveSubcategoriesPopupApi();
    } else {
      saveSubcategoriesPopupLocal();
    }
  };
 
  const cancelSubcategoriesPopup = () => {
    if (!category) return;
    if (!isExpense) {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.value === category ? { ...cat, subcategories: [...subcategoriesSnapshotRef.current] } : cat
        )
      );
    }
    setSubcategoriesPopupOpen(false);
  };
 
  const displayRows = isDeletedView ? variantStash : rows;
 
  const filtered = displayRows.filter((row) => {
    const decoded = decodeCategory(row.category);
    const haystack = [
      row.date,
      formatDisplayDate(row.date),
      row.vendor,
      String(row.amount),
      `${row.amount} CAD`,
      (row as IncomeRow).paymentMode ?? "",
      (row as IncomeRow).bank ?? (row as ExpenseRow).account ?? "",
      decoded.category,
      decoded.subcategory,
      row.notes ?? "",
      (row as ExpenseRow).billNumber ?? "",
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(search.toLowerCase())) return false;
 
    const expenseRow = row as ExpenseRow;
    const incomeRow = row as IncomeRow;
    const gstLabel = Number(expenseRow.gst ?? 0) > 0 ? "Yes" : "No";
    const chequeLabel = expenseRow.byCheque ? "Yes" : "No";
    return (
      searchIncludes(formatDisplayDate(row.date), searchFilters.date) &&
      searchIncludes(row.vendor, searchFilters.vendor) &&
      searchIncludes(String(row.amount), searchFilters.amount) &&
      searchIncludes(incomeRow.paymentMode ?? "", searchFilters.paymentMode ?? "") &&
      searchIncludes(incomeRow.bank ?? expenseRow.account ?? "", searchFilters.bank ?? "") &&
      searchIncludes(`${decoded.category} ${decoded.subcategory}`, searchFilters.category) &&
      searchIncludes(row.notes ?? "", searchFilters.notes) &&
      searchEquals(gstLabel, searchFilters.gst ?? "") &&
      searchIncludes(expenseRow.billNumber ?? "", searchFilters.billNumber ?? "") &&
      searchEquals(chequeLabel, searchFilters.byCheque ?? "")
    );
  });
 
  const totalPages = Math.max(1, Math.ceil(filtered.length / entriesPerPage));
  const paged = filtered.slice((page - 1) * entriesPerPage, page * entriesPerPage);
 
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
 
  const toggleSelectAll = () => {
    if (selected.size === paged.length) setSelected(new Set());
    else setSelected(new Set(paged.map((r) => r._id)));
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
    setReceiptFile(null);
    setAttachAttachment(false);
    setAttachmentFile(null);
 
  };
 
  const openAdd = () => {
    resetForm();
    setShowSearchCard(false);
    setShowForm(true);
  };
 
  const openEdit = (row: ExpenseRow | IncomeRow) => {
    const decoded = decodeCategory(row.category);
    setEditingId(row._id);
    setAmount(String(row.amount));
    setDate(row.date);
    setVendor(row.vendor);
    setNotes(row.notes ?? "");
 
    const catMatch = categories.find((c) => c.label === decoded.category);
    setCategory(catMatch?.value ?? "");
    const subMatch = catMatch?.subcategories.find((s) => s.label === decoded.subcategory);
    setSubcategory(subMatch?.value ?? decoded.subcategory ?? "");
 
    if (isExpense) {
      const exp = row as ExpenseRow;
      setGst(Boolean(exp.gst));
      setGstAmount(exp.gst ? String(exp.gst) : "");
      setHasBillNumber(Boolean(exp.billNumber));
      setBillNumber(exp.billNumber ?? "");
      setByCheque(Boolean(exp.byCheque));
      setChequeAccount(exp.account ?? "");
      setAttachReceipt(Boolean(exp.expenseImage));
      setReceiptFile(null);
    } else {
      const inc = row as IncomeRow;
      setPaymentMode(inc.paymentMode ?? "");
      setBank(inc.bank ?? "");
      setAttachAttachment(Boolean(inc.incomeImage));
      setAttachmentFile(null);
    }
 
    setShowSearchCard(false);
    setShowForm(true);
  };
 
  const openSearchCard = () => {
    setShowForm(false);
    setEditingId(null);
    setSearchDraft({ ...searchFilters });
    setShowSearchCard((open) => !open);
  };
 
  const handleSearchCardSearch = () => {
    setSearchFilters({ ...searchDraft });
    setPage(1);
    setSelected(new Set());
  };
 
  const handleSearchCardReset = () => {
    const empty = emptyAdminSearchValues(ledgerSearchFields);
    setSearchDraft(empty);
    setSearchFilters(empty);
    setPage(1);
    setSelected(new Set());
  };
 
  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };
 
  const handleSave = async () => {
    const parsedAmount = Number.parseFloat(amount);
    const normalizedVendor = vendor.trim();
    const normalizedPaymentMode = paymentMode.trim();
 
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
    if (!category) {
      adminNotify.error("Category is required.");
      return;
    }
    if (isExpense && !subcategory) {
      adminNotify.error("Subcategory is required.");
      return;
    }
    if (isExpense && byCheque && !chequeAccount) {
      adminNotify.error("Account is required when paying by cheque.");
      return;
    }
    if (isIncome && normalizedPaymentMode === "Bank Transfer" && !bank) {
      adminNotify.error("Bank is required for Bank Transfer.");
      return;
    }
 
    const combinedCategory = encodeCategory(selectedCategoryLabel, selectedSubcategoryLabel);
 
    const formData = new FormData();
    formData.set("date", date);
    formData.set("vendor", normalizedVendor);
    formData.set("amount", String(parsedAmount));
    formData.set("category", combinedCategory);
    formData.set("notes", notes);
 
    if (isExpense) {
      formData.set("gst", gst && gstAmount.trim() ? gstAmount.trim() : "0");
      if (hasBillNumber && billNumber.trim()) formData.set("billNumber", billNumber.trim());
      formData.set("byCheque", String(byCheque));
      if (byCheque && chequeAccount) formData.set("account", chequeAccount);
      if (attachReceipt && receiptFile) formData.set("expenseImage", receiptFile);
    } else {
      formData.set("paymentMode", normalizedPaymentMode);
      if (bank) formData.set("bank", bank);
      if (attachAttachment && attachmentFile) formData.set("incomeImage", attachmentFile);
    }
 
    setSaving(true);
    try {
      if (editingId != null) {
        await apiForm<any>(`${listPath}/${editingId}`, "PATCH", formData);
      } else {
        await apiForm<any>(listPath, "POST", formData);
      }
      adminNotify.success(editingId != null ? "Entry updated." : "Entry added.");
      resetForm();
      setShowForm(false);
      await loadRows();
    } catch (err) {
      adminNotify.error(err instanceof Error ? err.message : "Failed to save entry.");
    } finally {
      setSaving(false);
    }
  };
 
  const handleDeleteRow = async (id: string) => {
    if (!window.confirm("Delete this entry?")) return;
    const row = rows.find((r) => r._id === id);
    try {
      await apiJson<any>(`${listPath}/${id}`, { method: "DELETE" });
      if (row) stashDeleted(row);
      adminNotify.success("Entry deleted.");
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await loadRows();
    } catch (err) {
      adminNotify.error(err instanceof Error ? err.message : "Failed to delete entry.");
    }
  };
 
  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} selected entr${selected.size === 1 ? "y" : "ies"}?`)) return;
    const toStash = rows.filter((r) => selected.has(r._id));
    try {
      await Promise.all([...selected].map((id) => apiJson<any>(`${listPath}/${id}`, { method: "DELETE" })));
      if (toStash.length > 0) stashDeleted(toStash);
      adminNotify.success("Selected entries deleted.");
      setSelected(new Set());
      await loadRows();
    } catch (err) {
      adminNotify.error(err instanceof Error ? err.message : "Failed to delete selected entries.");
    }
  };
 
  const handleRestore = async (ids?: string[]) => {
    const selectedIds = ids ?? [...selected];
    if (selectedIds.length === 0) return;
    const toRestore = variantStash.filter((r) => selectedIds.includes(r._id));
    if (toRestore.length === 0) return;
    if (!window.confirm(`Restore ${toRestore.length} entr${toRestore.length === 1 ? "y" : "ies"}?`)) return;
    let allSucceeded = true;
    for (const row of toRestore) {
      try {
        const formData = new FormData();
        formData.set("date", row.date);
        formData.set("vendor", row.vendor);
        formData.set("amount", String(row.amount));
        formData.set("category", row.category);
        formData.set("notes", row.notes ?? "");
        if (isExpense) {
          const exp = row as ExpenseRow;
          formData.set("gst", String(exp.gst ?? 0));
          if (exp.billNumber) formData.set("billNumber", exp.billNumber);
          formData.set("byCheque", String(Boolean(exp.byCheque)));
          if (exp.byCheque && exp.account) formData.set("account", exp.account);
        } else {
          const inc = row as IncomeRow;
          formData.set("paymentMode", inc.paymentMode ?? "");
          if (inc.bank) formData.set("bank", inc.bank);
        }
        await apiForm<any>(listPath, "POST", formData);
        restoreStashed((item) => item._id === row._id);
      } catch {
        allSucceeded = false;
      }
    }
    setSelected(new Set());
    adminNotify[allSucceeded ? "success" : "error"](
      allSucceeded ? "Restored successfully." : "Some entries failed to restore."
    );
    await loadRows();
  };
 
  return (
    <AdminPage
      title={isDeletedView ? `Deleted ${title}` : title}
      headerAction={!showForm && !showSearchCard && !isDeletedView ? <AddNewButton onClick={openAdd} /> : undefined}
      between={
        showSearchCard ? (
          <AdminSearchCard
            fields={ledgerSearchFields}
            values={searchDraft}
            onChange={setSearchDraft}
            onSearch={handleSearchCardSearch}
            onReset={handleSearchCardReset}
            onClose={() => setShowSearchCard(false)}
          />
        ) : showForm && !isDeletedView ? (
          <CompactFormPanel
            footer={
              <CompactFormFooter
                actionLabel={editingId != null ? "Update" : "Save"}
                onSave={saving ? undefined : handleSave}
                onCancel={handleCancel}
              />
            }
      
          >
            <CompactFormRow className="items-start gap-y-6">
              <div
                className={`min-w-0 shrink-0 flex-none ${
                  isIncome ? "w-[100px] sm:w-[120px]" : compactFixedFieldWidth
                }`}
              >
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
              <div
                className={`min-w-0 shrink-0 flex-none ${
                  isIncome ? "w-[100px] sm:w-[120px]" : compactFixedFieldWidth
                }`}
              >
                <CompactField label="Date" required className="w-full flex-none">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={compactInputClass}
                  />
                </CompactField>
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
                <CompactField
                  label="Bank"
                  required={paymentMode === "Bank Transfer"}
                  className={compactFixedFieldWidth}
                >
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
              <ComboSelectWithEditor
                label="Category"
                required
                value={selectedCategoryLabel}
                placeholder={isExpense && categoriesLoading ? "Loading categories…" : "Select category"}
                options={categoryLabels}
                disabled={isExpense && categoriesLoading}
                onChange={handleCategoryChange}
                onEditAddNew={openCategoriesPopup}
                className={isIncome ? "w-[120px] shrink-0 flex-none sm:w-[140px]" : "min-w-[160px] flex-1"}
              />
              {isExpense ? (
                <ComboSelectWithEditor
                  label="Subcategory"
                  required
                  value={selectedSubcategoryLabel}
                  placeholder="Select or type a subcategory"
                  options={subcategoryLabels}
                  disabled={!category}
                  onChange={handleSubcategoryChange}
                  onEditAddNew={openSubcategoriesPopup}
                  className="min-w-[160px] flex-1"
                />
              ) : null}
              {isExpense ? (
                <div className={`min-w-0 shrink-0 flex-none ${compactFixedFieldWidth}`}>
                  <CompactField label="Notes" className="w-full flex-none">
                    <CompactAutoGrowTextarea value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </CompactField>
                  <div className="mt-3">
                    <AttachImageCheckbox
                      label="Attach Image of Receipt"
                      checked={attachReceipt}
                      onCheckedChange={setAttachReceipt}
                      file={receiptFile}
                      onFileChange={setReceiptFile}
                    />
                  </div>
                </div>
              ) : null}
              {isIncome ? (
                <CompactField label="Notes" className="min-w-[160px] flex-1">
                  <CompactAutoGrowTextarea value={notes} onChange={(e) => setNotes(e.target.value)} />
                </CompactField>
              ) : null}
            </CompactFormRow>
 
            {isIncome ? (
              <CompactFormRow className="items-start gap-y-6">
                <div className={`min-w-0 shrink-0 flex-none ${compactFixedFieldWidth}`}>
                  <AttachImageCheckbox
                    label="Attach Image"
                    checked={attachAttachment}
                    onCheckedChange={(checked) => {
                      setAttachAttachment(checked);
                      if (!checked) {
                        setAttachmentFile(null);
                      }
                    }}
                    file={attachmentFile}
                    onFileChange={(file) => {
                      setAttachmentFile(file);
                    }}
                  />
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
      {isDeletedView && (
        <AdminDeletedBanner count={variantStash.length} entityLabel="entries" />
      )}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
        <div className="flex flex-wrap gap-1">
          <button type="button" disabled={selected.size === 0} className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
            ↓ Export
          </button>
          <button type="button" disabled={selected.size === 0} className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
            Archive
          </button>
          {!isDeletedView ? (
            <button
              type="button"
              disabled={selected.size === 0}
              onClick={handleBulkDelete}
              className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Delete
            </button>
          ) : (
            <button
              type="button"
              disabled={selected.size === 0}
              onClick={() => handleRestore()}
              className="bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              Restore
            </button>
          )}
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
          <button
            type="button"
            onClick={openSearchCard}
            className={`px-3 py-1 text-xs font-medium text-white hover:bg-gray-600 ${
              showSearchCard ? "bg-gray-700" : "bg-gray-500"
            }`}
          >
            Filters
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
        <table className="w-full border-collapse text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-ad-purple text-white">
              <th className="border border-ad-purple-dark px-2 py-2 text-center">
                <input
                  type="checkbox"
                  checked={paged.length > 0 && selected.size === paged.length}
                  onChange={toggleSelectAll}
                  className="accent-white"
                />
              </th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Date</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">{vendorLabel}</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Amount</th>
              {isIncome ? (
                <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Payment Mode</th>
              ) : null}
              {isIncome ? (
                <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Bank</th>
              ) : null}
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Category</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Notes</th>
              {isExpense ? (
                <>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">GST</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Bill Number</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">By Cheque</th>
                </>
              ) : null}
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">
                {isIncome ? "Attachment" : "Clip"}
              </th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">
                {isDeletedView ? "Restore" : "Delete"}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && !isDeletedView ? (
              <tr>
                <td colSpan={12} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={12} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                  {isDeletedView ? "No deleted entries found." : "No entries found."}
                </td>
              </tr>
            ) : (
              paged.map((row, idx) => {
                const decoded = decodeCategory(row.category);
                const incomeRow = row as IncomeRow;
                const expenseRow = row as ExpenseRow;
                const attachmentUrl = isIncome ? incomeRow.incomeImage : expenseRow.expenseImage;
                return (
                  <tr key={row._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                    <td className="border border-gray-300 px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={selected.has(row._id)}
                        onChange={() => toggleSelect(row._id)}
                        className="accent-ad-purple"
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        disabled={isDeletedView}
                        className="text-blue-700 hover:underline disabled:cursor-default disabled:no-underline"
                      >
                        {formatDisplayDate(row.date)}
                      </button>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center uppercase">{row.vendor}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      {row.amount % 1 === 0 ? row.amount : row.amount.toFixed(2)}
                    </td>
                    {isIncome ? (
                      <td className="border border-gray-300 px-3 py-2 text-center">{incomeRow.paymentMode || ""}</td>
                    ) : null}
                    {isIncome ? (
                      <td className="border border-gray-300 px-3 py-2 text-center">{incomeRow.bank || ""}</td>
                    ) : null}
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      <div>
                        <div className="font-bold leading-tight">{decoded.category}</div>
                        <div className="text-xs text-gray-500">{decoded.subcategory}</div>
                      </div>
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-left align-top whitespace-normal break-words min-w-[240px]">{row.notes || ""}</td>
                    {isExpense ? (
                      <>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          {expenseRow.gst ? `${expenseRow.gst} CAD` : "No"}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          {expenseRow.billNumber || "—"}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          {expenseRow.byCheque
                            ? expenseRow.account
                              ? `Yes (${expenseRow.account})`
                              : "Yes"
                            : "No"}
                        </td>
                      </>
                    ) : null}
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      {attachmentUrl ? (
                        <span className="inline-flex items-center gap-2">
                          <ClipImageHover
                            imageUrl={attachmentUrl}
                            alt={`Attachment for ${row.vendor}`}
                            iconClassName="text-blue-600"
                          />
                        </span>
                      ) : (
                        <span className="text-gray-500">--</span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      {isDeletedView ? (
                        <button
                          type="button"
                          onClick={() => handleRestore([row._id])}
                          className="text-blue-700 hover:underline"
                        >
                          Restore
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(row._id)}
                          className="text-blue-700 hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
 
      <div className="mt-4 flex items-center justify-between">
        <TableEntriesSummary total={filtered.length} page={page} pageSize={entriesPerPage} />
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
        <AdminDeletedToggle
          viewMode={viewMode}
          onToggle={toggleViewMode}
          activeLabel="Active Entries"
        />
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


















