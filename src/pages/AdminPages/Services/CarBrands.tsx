import { useEffect, useMemo, useRef, useState } from "react";
import axios, { AxiosError } from "axios";
import AttachImageCheckbox from "../../../components/admin/AttachImageCheckbox";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import { TableEntriesSummary } from "../../../components/admin/AdminDataTable";
import { AdminDeletedBanner, AdminDeletedToggle } from "../../../components/admin/AdminDeletedView";
import ClipImageHover from "../../../components/admin/ClipImageHover";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  compactInputClass,
} from "../../../components/admin/ContentPanel";
import AdminSearchCard, {
  emptyAdminSearchValues,
  searchEquals,
  searchIncludes,
  type AdminSearchField,
} from "../../../components/admin/AdminSearchCard";
import { useAdminDeletedView } from "../../../hooks/useAdminDeletedView";
import { adminNotify } from "../../../utils/adminNotify";
import { printAdminTable } from "../../../utils/adminPrintTable";

// Helper to get token and provide correct header for admin token (no Bearer)
const getAdminAuthHeaders = () => {
  // Try localStorage, then sessionStorage, then cookies.
  let token =
    window.localStorage.getItem("admin-token") ||
    window.sessionStorage.getItem("admin-token") ||
    (document.cookie.split("; ").find((row) => row.startsWith("admin-token=")) || "")
      .split("=")[1];

  // If not found, set as empty string
  if (!token) token = "";

  return {
    Authorization: token,
  };
};

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

type CarModel = {
  modelName: string;
};

type CarCompany = {
  _id: string;
  companyName: string;
  models: CarModel[];
  brandLogo?: string | null;
};

type ModelFormRow = {
  modelName: string;
};

type TableRow = {
  rowId: string;
  companyId: string;
  make: string;
  model: string;
  brandLogo?: string | null;
};

const EMPTY_MODEL: ModelFormRow = { modelName: "" };
const equalThirdFieldClass = "min-w-0 w-full";

const CAR_BRAND_SEARCH_FIELDS: AdminSearchField[] = [
  { key: "make", label: "Make" },
  { key: "model", label: "Model" },
  {
    key: "logo",
    label: "Logo",
    type: "select",
    options: [
      { value: "Yes", label: "Yes" },
      { value: "No", label: "No" },
    ],
  },
];

type ListEditorPopupProps = {
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
  onSave: () => void;
  onCancel: () => void;
  placeholder?: string;
  inputMode?: "text" | "numeric";
  /** When provided, each item gets a pencil icon to rename it in place. */
  onRename?: (oldValue: string, newValue: string) => Promise<boolean> | boolean;
};

function ListEditorPopup({
  title,
  items,
  onChange,
  onSave,
  onCancel,
  placeholder = "",
  onRename,
}: ListEditorPopupProps) {
  const [inputValue, setInputValue] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [renaming, setRenaming] = useState(false);

  const addItem = () => {
    const v = inputValue.trim();
    if (!v) return;
    if (items.some((i) => i.toLowerCase() === v.toLowerCase())) {
      setInputValue("");
      return;
    }
    onChange([...items, v]);
    setInputValue("");
  };

  const removeItem = (idx: number) => onChange(items.filter((_, i) => i !== idx));

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditDraft(items[idx]);
  };

  const cancelEdit = () => {
    setEditingIdx(null);
    setEditDraft("");
  };

  const commitEdit = async () => {
    if (editingIdx === null) return;
    const oldValue = items[editingIdx];
    const newValue = editDraft.trim();
    if (!newValue || newValue.toLowerCase() === oldValue.toLowerCase()) {
      cancelEdit();
      return;
    }
    if (items.some((i, i2) => i2 !== editingIdx && i.toLowerCase() === newValue.toLowerCase())) {
      cancelEdit();
      return;
    }
    setRenaming(true);
    try {
      const ok = onRename ? await onRename(oldValue, newValue) : true;
      if (ok !== false) {
        onChange(items.map((i, i2) => (i2 === editingIdx ? newValue : i)));
      }
    } finally {
      setRenaming(false);
      cancelEdit();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="flex w-full max-w-sm flex-col overflow-hidden rounded border border-gray-300 bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-ad-green-light px-4 py-2.5 text-center text-sm font-bold text-ad-green-dark">
          {title}
        </div>
        <div className="max-h-[50vh] overflow-y-auto px-4 py-3">
          {items.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {items.map((item, idx) =>
                editingIdx === idx ? (
                  <span
                    key={`${item}-${idx}`}
                    className="inline-flex items-center gap-1 rounded-full bg-white px-1.5 py-0.5 ring-1 ring-ad-green"
                  >
                    <input
                      type="text"
                      autoFocus
                      value={editDraft}
                      disabled={renaming}
                      onChange={(e) => setEditDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          commitEdit();
                        }
                        if (e.key === "Escape") {
                          e.preventDefault();
                          cancelEdit();
                        }
                      }}
                      onBlur={commitEdit}
                      className="w-24 border-0 bg-transparent p-0 text-xs focus:outline-none focus:ring-0"
                    />
                  </span>
                ) : (
                  <span
                    key={`${item}-${idx}`}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-800"
                  >
                    {item}
                    {onRename && (
                      <button
                        type="button"
                        onClick={() => startEdit(idx)}
                        className="text-xs leading-none text-gray-500 hover:text-ad-green-dark"
                        aria-label={`Rename ${item}`}
                        title="Rename"
                      >
                        ✎
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-sm font-bold leading-none text-red-600 hover:text-red-800"
                      aria-label={`Remove ${item}`}
                    >
                      ×
                    </button>
                  </span>
                )
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-500">None added yet.</p>
          )}

          <div className="mt-3 flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addItem();
                }
              }}
              placeholder={placeholder}
              className={`${compactInputClass} min-w-0 flex-1`}
              autoFocus
            />
            <button
              type="button"
              onClick={addItem}
              className="shrink-0 rounded bg-ad-green px-3 py-1.5 text-xs font-semibold text-white hover:bg-ad-green-dark"
            >
              Add
            </button>
          </div>
        </div>
        <div className="flex items-center justify-center gap-4 border-t border-gray-200 px-4 py-3">
          <button
            type="button"
            onClick={onSave}
            className="rounded bg-ad-green px-6 py-1.5 text-xs font-semibold text-white hover:bg-ad-green-dark"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function ComboSelectWithEditor({
  label,
  required,
  value,
  disabled,
  placeholder,
  options,
  onChange,
  onEditAddNew,
  multi = false,
  multiValue = [],
  onToggleValue,
}: {
  label: string;
  required?: boolean;
  value?: string;
  disabled?: boolean;
  placeholder?: string;
  options: string[];
  onChange?: (value: string) => void;
  onEditAddNew: () => void;
  multi?: boolean;
  multiValue?: string[];
  onToggleValue?: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  const displayValue = multi
    ? multiValue.length
      ? multiValue.join(", ")
      : placeholder || "Select"
    : value || placeholder || "Select";

  // Sort options alphabetically (use memo so it's not sorted on every render)
  const sortedOptions = useMemo(
    () => [...options].sort((a, b) => a.localeCompare(b)),
    [options]
  );

  return (
    <CompactField label={label} required={required} className={equalThirdFieldClass}>
      <div ref={rootRef} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((prev) => !prev)}
          className={`${compactInputClass} flex w-full items-center justify-between text-left disabled:cursor-not-allowed disabled:bg-gray-100 ${
            (multi ? multiValue.length > 0 : !!value) ? "text-gray-900" : "text-gray-500"
          }`}
        >
          <span className="truncate">{displayValue}</span>
          <span className="ml-2 shrink-0 text-[10px] text-gray-500">{open ? "▲" : "▼"}</span>
        </button>

        {open && !disabled && (
          <div className="absolute left-0 right-0 z-50 mt-0.5 max-h-52 overflow-hidden rounded border border-gray-400 bg-white shadow-lg">
            <button
              type="button"
              onClick={() => {
                onEditAddNew();
                setOpen(false);
              }}
              className="block w-full border-b-2 border-ad-green-dark bg-ad-green px-2 py-2 text-left text-sm font-bold tracking-wide text-white shadow-inner hover:bg-ad-green-dark"
            >
              + Edit / Add New
            </button>
            <div className="max-h-40 overflow-y-auto">
              {!multi && (
                <button
                  type="button"
                  onClick={() => {
                    onChange?.("");
                    setOpen(false);
                  }}
                  className={`block w-full px-2 py-1.5 text-left text-sm hover:bg-gray-100 ${
                    !value ? "bg-gray-50 font-medium text-gray-700" : "text-gray-500"
                  }`}
                >
                  {placeholder ?? "Select"}
                </button>
              )}
              {sortedOptions.map((opt) =>
                multi ? (
                  <label
                    key={opt}
                    className={`flex w-full cursor-pointer items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-gray-100 ${
                      multiValue.includes(opt)
                        ? "bg-ad-green-light/60 font-semibold text-ad-green-dark"
                        : "text-gray-900"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={multiValue.includes(opt)}
                      onChange={() => onToggleValue?.(opt)}
                      className="accent-ad-green"
                    />
                    {opt}
                  </label>
                ) : (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      onChange?.(opt);
                      setOpen(false);
                    }}
                    className={`block w-full px-2 py-1.5 text-left text-sm hover:bg-gray-100 ${
                      opt === value ? "bg-ad-green-light/60 font-semibold text-ad-green-dark" : "text-gray-900"
                    }`}
                  >
                    {opt}
                  </button>
                )
              )}
              {!multi && value && !sortedOptions.includes(value) && (
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="block w-full bg-ad-green-light/60 px-2 py-1.5 text-left text-sm font-semibold text-ad-green-dark"
                >
                  {value}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </CompactField>
  );
}

/**
 * Model selector: unlike Make, this shows every available model directly —
 * no dropdown to open first. An input + Add button sits above the checklist
 * so new models can be created inline without a separate popup.
 */
function InlineModelSelector({
  label,
  required,
  disabled,
  options,
  selected,
  onToggle,
  onAddModel,
  onRemoveModel,
  placeholder = "Add a model…",
  className,
}: {
  label: string;
  required?: boolean;
  disabled?: boolean;
  options: string[];
  selected: string[];
  onToggle: (name: string) => void;
  onAddModel: (name: string) => void;
  onRemoveModel: (name: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [inputValue, setInputValue] = useState("");

  const sortedOptions = useMemo(
    () => [...options].sort((a, b) => a.localeCompare(b)),
    [options]
  );

  const handleAdd = () => {
    const v = inputValue.trim();
    if (!v || disabled) return;
    onAddModel(v);
    setInputValue("");
  };

  return (
    <CompactField label={label} required={required} className={className ?? equalThirdFieldClass}>
      <div className={`rounded border border-gray-400 bg-white ${disabled ? "opacity-60" : ""}`}>
        <div className="flex items-center gap-2 border-b border-gray-300 p-1.5">
          <input
            type="text"
            value={inputValue}
            disabled={disabled}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder={placeholder}
            className={`${compactInputClass} min-w-0 flex-1 border-0`}
          />
          <button
            type="button"
            disabled={disabled || !inputValue.trim()}
            onClick={handleAdd}
            className="shrink-0 rounded bg-ad-green px-3 py-1.5 text-xs font-semibold text-white hover:bg-ad-green-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add
          </button>
        </div>
        <div className="max-h-40 overflow-y-auto p-1.5">
          {sortedOptions.length === 0 ? (
            <p className="px-1 py-1 text-xs text-gray-500">No models yet — add one above.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {sortedOptions.map((opt) => (
                <label
                  key={opt}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${
                    selected.includes(opt)
                      ? "bg-ad-green-light font-semibold text-ad-green-dark"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(opt)}
                    disabled={disabled}
                    onChange={() => onToggle(opt)}
                    className="accent-ad-green"
                  />
                  {opt}
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={(e) => {
                      e.preventDefault();
                      onRemoveModel(opt);
                    }}
                    className="text-sm font-bold leading-none text-red-600 hover:text-red-800"
                    aria-label={`Remove ${opt}`}
                  >
                    ×
                  </button>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </CompactField>
  );
}

function getBackendImageUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path;
  const base = import.meta.env.VITE_API_URL || "";
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}

function dedupeStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of values) {
    const v = raw.trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(v);
  }
  return result;
}

function flattenCompanies(companies: CarCompany[]): TableRow[] {
  const rows: TableRow[] = [];
  for (const company of companies) {
    for (const model of company.models ?? []) {
      rows.push({
        rowId: `${company._id}::${model.modelName}`,
        companyId: company._id,
        make: company.companyName,
        model: model.modelName,
        brandLogo: company.brandLogo,
      });
    }
    if (!company.models?.length) {
      rows.push({
        rowId: `${company._id}::__none__`,
        companyId: company._id,
        make: company.companyName,
        model: "—",
        brandLogo: company.brandLogo,
      });
    }
  }
  // Sort rows alphabetically by make, then by model
  rows.sort((a, b) => {
    const makeCmp = (a.make || "").localeCompare(b.make || "");
    if (makeCmp !== 0) return makeCmp;
    return (a.model || "").localeCompare(b.model || "");
  });
  return rows;
}

type CarBrandsPageProps = {
  initialShowForm?: boolean;
};

export default function CarBrandsPage({ initialShowForm = false }: CarBrandsPageProps) {
  const [companies, setCompanies] = useState<CarCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [showSearchCard, setShowSearchCard] = useState(false);
  const [searchDraft, setSearchDraft] = useState(() => emptyAdminSearchValues(CAR_BRAND_SEARCH_FIELDS));
  const [searchFilters, setSearchFilters] = useState(() => emptyAdminSearchValues(CAR_BRAND_SEARCH_FIELDS));
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showForm, setShowForm] = useState(initialShowForm);

  const [editingCompany, setEditingCompany] = useState<CarCompany | null>(null);
  const [make, setMake] = useState("");
  const [modelRows, setModelRows] = useState<ModelFormRow[]>([{ ...EMPTY_MODEL }]);
  const [brandLogoFile, setBrandLogoFile] = useState<File | null>(null);
  const [brandLogoPreviewUrl, setBrandLogoPreviewUrl] = useState<string | null>(null);
  const [attachBrandLogo, setAttachBrandLogo] = useState(false);
  const [makesPopupOpen, setMakesPopupOpen] = useState(false);
  const [makesDraft, setMakesDraft] = useState<string[]>([]);
  const [sessionMakeNames, setSessionMakeNames] = useState<string[]>([]);
  // Multi-select: all models currently selected/associated for the chosen make
  const [selectedModelNames, setSelectedModelNames] = useState<string[]>([]);
  const makesSnapshotRef = useRef<string[]>([]);

  const resetTableControls = () => {
    setPage(1);
    setSelected(new Set());
    setSearch("");
    const empty = emptyAdminSearchValues(CAR_BRAND_SEARCH_FIELDS);
    setSearchDraft(empty);
    setSearchFilters(empty);
    setShowSearchCard(false);
  };

  const {
    viewMode,
    isDeletedView,
    toggleViewMode,
    deletedStash,
    restoreStashed,
  } = useAdminDeletedView<CarCompany>({
    onToggle: resetTableControls,
    storageKey: "admin_deleted_view:car-brands",
  });

  const fetchCompanies = async (q = "") => {
    setLoading(true);
    setError("");
    try {
      let url = `${import.meta.env.VITE_API_URL}/api/admin/car-company`;
      if (q) url += `?companyName=${encodeURIComponent(q)}`;
      const res = await axios.get(url, { headers: getAdminAuthHeaders() });
      setCompanies(res.data?.data ?? []);
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      const msg = axErr?.response?.data?.message || axErr?.message || "Error fetching companies";
      setError(msg);
      adminNotify.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearch("");
    setPage(1);
    fetchCompanies("");
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const tableRows = useMemo(
    () => flattenCompanies(isDeletedView ? deletedStash : companies),
    [companies, deletedStash, isDeletedView]
  );

  const filtered = tableRows.filter((r) => {
    const live =
      !search.trim() ||
      r.make.toLowerCase().includes(search.toLowerCase()) ||
      r.model.toLowerCase().includes(search.toLowerCase());
    if (!live) return false;
    return (
      searchIncludes(r.make, searchFilters.make) &&
      searchIncludes(r.model, searchFilters.model) &&
      searchEquals(r.brandLogo ? "Yes" : "No", searchFilters.logo)
    );
  });

  // Sort the filtered rows alphabetically by make, then model
  const sortedFiltered = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const makeCmp = (a.make || "").localeCompare(b.make || "");
        if (makeCmp !== 0) return makeCmp;
        return (a.model || "").localeCompare(b.model || "");
      }),
    [filtered]
  );

  const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / entriesPerPage));
  const paged = sortedFiltered.slice((page - 1) * entriesPerPage, page * entriesPerPage);

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
    else setSelected(new Set(paged.map((r) => r.rowId)));
  };

  const resetForm = () => {
    setMake("");
    setModelRows([{ ...EMPTY_MODEL }]);
    setBrandLogoFile(null);
    if (brandLogoPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(brandLogoPreviewUrl);
    setBrandLogoPreviewUrl(null);
    setAttachBrandLogo(false);
    setEditingCompany(null);
    setError("");
    setMakesPopupOpen(false);
    setSessionMakeNames([]);
    setSelectedModelNames([]);
  };

  const populateFormFromCompany = (company: CarCompany) => {
    setEditingCompany(company);
    setMake(company.companyName);
    setModelRows(
      company.models?.length
        ? company.models.map((m) => ({
            modelName: m.modelName,
          }))
        : [{ ...EMPTY_MODEL }]
    );
    setBrandLogoFile(null);
    if (brandLogoPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(brandLogoPreviewUrl);
    setBrandLogoPreviewUrl(null);
    setAttachBrandLogo(false);
    // Select ALL models already associated with this make
    const allModelNames = (company.models ?? [])
      .map((m) => m.modelName.trim())
      .filter(Boolean);
    setSelectedModelNames(allModelNames);
    setError("");
  };

  const resetFormForNewMake = (makeName: string) => {
    setEditingCompany(null);
    setMake(makeName);
    setModelRows([{ ...EMPTY_MODEL }]);
    setBrandLogoFile(null);
    if (brandLogoPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(brandLogoPreviewUrl);
    setBrandLogoPreviewUrl(null);
    setAttachBrandLogo(false);
    setSelectedModelNames([]);
    setError("");
  };

  const openAdd = () => {
    resetForm();
    setShowSearchCard(false);
    setShowForm(true);
  };

  const openEditCompany = (company: CarCompany) => {
    populateFormFromCompany(company);
    setShowSearchCard(false);
    setShowForm(true);
  };

  const openEditByRow = (row: TableRow) => {
    const company = (isDeletedView ? deletedStash : companies).find((c) => c._id === row.companyId);
    if (company) openEditCompany(company);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const openSearchCard = () => {
    setShowForm(false);
    setEditingCompany(null);
    setSearchDraft({ ...searchFilters });
    setShowSearchCard((open) => !open);
  };

  const handleSearchCardSearch = () => {
    setSearchFilters({ ...searchDraft });
    setPage(1);
    setSelected(new Set());
  };

  const handleSearchCardReset = () => {
    const empty = emptyAdminSearchValues(CAR_BRAND_SEARCH_FIELDS);
    setSearchDraft(empty);
    setSearchFilters(empty);
    setPage(1);
    setSelected(new Set());
  };

  const companyMakeNames = useMemo(
    () => dedupeStrings(companies.map((c) => c.companyName)),
    [companies]
  );

  const allMakeOptions = useMemo(
    () =>
      dedupeStrings([
        ...companyMakeNames,
        ...sessionMakeNames,
        ...(make.trim() ? [make.trim()] : []),
      ]).sort((a, b) => a.localeCompare(b)),
    [companyMakeNames, sessionMakeNames, make]
  );

  const openMakesPopup = () => {
    makesSnapshotRef.current = [...sessionMakeNames];
    setMakesDraft([...allMakeOptions]);
    setMakesPopupOpen(true);
  };

  const saveMakesPopup = () => {
    const names = dedupeStrings(makesDraft);
    const previousOptions = new Set(
      [...companyMakeNames, ...sessionMakeNames, ...(make.trim() ? [make.trim()] : [])].map((n) =>
        n.toLowerCase()
      )
    );
    const newlyAdded = names.filter((n) => !previousOptions.has(n.toLowerCase()));

    const newSession = names.filter(
      (n) => !companyMakeNames.some((c) => c.toLowerCase() === n.toLowerCase())
    );
    setSessionMakeNames(newSession);

    let makeToSelect: string | null = null;
    if (newlyAdded.length > 0) {
      const newlyAddedKeys = new Set(newlyAdded.map((n) => n.toLowerCase()));
      for (let i = makesDraft.length - 1; i >= 0; i--) {
        const trimmed = makesDraft[i].trim();
        if (trimmed && newlyAddedKeys.has(trimmed.toLowerCase())) {
          makeToSelect = trimmed;
          break;
        }
      }
      makeToSelect ??= newlyAdded[newlyAdded.length - 1];
    } else if (make && !names.some((n) => n.toLowerCase() === make.toLowerCase())) {
      makeToSelect = names[0] ?? "";
    }

    if (makeToSelect) {
      handleMakeChange(makeToSelect);
    }
    setMakesPopupOpen(false);
  };

  const cancelMakesPopup = () => {
    setSessionMakeNames(makesSnapshotRef.current);
    setMakesPopupOpen(false);
  };

  /**
   * Renames a make. If it belongs to an already-saved company, persists the
   * rename immediately via PATCH (keeping its models/country/logo intact).
   * If it's only a session/local name (not yet saved), just relabels it.
   * Also keeps the currently-selected `make` field in sync if it was renamed.
   */
  const handleRenameMake = async (oldName: string, newName: string): Promise<boolean> => {
    const trimmedNew = newName.trim();
    if (!trimmedNew) return false;

    const existingCompany = companies.find(
      (c) => c.companyName.toLowerCase() === oldName.toLowerCase()
    );

    if (existingCompany) {
      setActionLoading(true);
      try {
        const formData = new FormData();
        formData.append("companyName", trimmedNew);
        formData.append(
          "models",
          JSON.stringify(
            (existingCompany.models || [])
              .map((m) => ({ modelName: m.modelName.trim() }))
              .filter((m) => m.modelName)
          )
        );
        formData.append("country", "Canada");
        await axios.patch(`${API_BASE}/admin/car-company/${existingCompany._id}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            ...getAdminAuthHeaders(),
          },
        });
        setCompanies((prev) =>
          prev.map((c) => (c._id === existingCompany._id ? { ...c, companyName: trimmedNew } : c))
        );
        if (editingCompany?._id === existingCompany._id) {
          setEditingCompany((prev) => (prev ? { ...prev, companyName: trimmedNew } : prev));
        }
        adminNotify.success(`Renamed "${oldName}" to "${trimmedNew}".`);
      } catch (err) {
        const axErr = err as AxiosError<{ message?: string }>;
        const msg = axErr?.response?.data?.message || axErr?.message || "Failed to rename make";
        adminNotify.error(msg);
        return false;
      } finally {
        setActionLoading(false);
      }
    } else {
      setSessionMakeNames((prev) =>
        prev.map((n) => (n.toLowerCase() === oldName.toLowerCase() ? trimmedNew : n))
      );
    }

    if (make.toLowerCase() === oldName.toLowerCase()) {
      setMake(trimmedNew);
    }
    return true;
  };

  const namedModels = useMemo(
    () => modelRows.filter((m) => m.modelName.trim()),
    [modelRows]
  );

  const handleMakeChange = (makeName: string) => {
    if (!makeName.trim()) {
      setMake("");
      setEditingCompany(null);
      setModelRows([{ ...EMPTY_MODEL }]);
      setSelectedModelNames([]);
      return;
    }
    const company = companies.find(
      (c) => c.companyName.toLowerCase() === makeName.toLowerCase()
    );
    if (company) {
      populateFormFromCompany(company);
    } else {
      resetFormForNewMake(makeName);
    }
  };

  // Toggle a single model in/out of the multi-select
  const toggleSelectedModel = (modelName: string) => {
    setSelectedModelNames((prev) =>
      prev.includes(modelName)
        ? prev.filter((n) => n !== modelName)
        : [...prev, modelName]
    );
  };

  // Add a brand-new model to the pool for this make, and auto-select it.
  const addModelInline = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const exists = modelRows.some((m) => m.modelName.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      setModelRows((prev) => {
        const withoutEmpty = prev.filter((m) => m.modelName.trim());
        return [...withoutEmpty, { modelName: trimmed }];
      });
    }
    setSelectedModelNames((prev) =>
      prev.some((n) => n.toLowerCase() === trimmed.toLowerCase()) ? prev : [...prev, trimmed]
    );
  };

  // Remove a model entirely from the pool for this make.
  const removeModelInline = (name: string) => {
    setModelRows((prev) => {
      const next = prev.filter((m) => m.modelName.toLowerCase() !== name.toLowerCase());
      return next.length ? next : [{ ...EMPTY_MODEL }];
    });
    setSelectedModelNames((prev) => prev.filter((n) => n.toLowerCase() !== name.toLowerCase()));
  };

  const makeFilled = make.trim().length > 0;

  const handleRemoveBrandLogo = () => {
    setBrandLogoFile(null);
    if (brandLogoPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(brandLogoPreviewUrl);
    setBrandLogoPreviewUrl(null);
  };

  const getProcessedModels = () => {
    const byName = new Map<string, { modelName: string }>();
    for (const m of modelRows) {
      const modelName = m.modelName.trim();
      if (!modelName) continue;
      const key = modelName.toLowerCase();
      const existing = byName.get(key);
      if (existing) continue;
      byName.set(key, { modelName });
    }
    return [...byName.values()];
  };

  const validateForm = () => {
    if (!make.trim()) {
      const msg = "Make is required.";
      setError(msg);
      adminNotify.error(msg);
      return false;
    }
    const processed = getProcessedModels();
    if (processed.length === 0) {
      const msg = "Add at least one model.";
      setError(msg);
      adminNotify.error(msg);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setActionLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const formData = new FormData();
      formData.append("companyName", make.trim());
      formData.append("models", JSON.stringify(getProcessedModels()));
      formData.append("country", "Canada");
      if (attachBrandLogo && brandLogoFile) formData.append("brandLogo", brandLogoFile);

      if (editingCompany) {
        await axios.patch(
          `${API_BASE}/admin/car-company/${editingCompany._id}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              ...getAdminAuthHeaders(),
            },
          }
        );
        adminNotify.success("Car brand updated.");
        setSuccessMsg("Car brand updated.");
      } else {
        await axios.post(
          `${API_BASE}/admin/car-company`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              ...getAdminAuthHeaders(),
            },
          }
        );
        adminNotify.success("Car brand added.");
        setSuccessMsg("Car brand added.");
      }
      resetForm();
      setShowForm(false);
      fetchCompanies(search);
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      const msg =
        axErr?.response?.data?.message ||
        axErr?.message ||
        (editingCompany ? "Failed to update car brand" : "Failed to add car brand");
      setError(msg);
      adminNotify.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const findRowById = (id: string) => tableRows.find((r) => r.rowId === id);

  const handleToolbarDelete = async () => {
    if (selected.size === 0) return;
  
    const rows = [...selected]
      .map(findRowById)
      .filter((r): r is TableRow => !!r && r.model !== "—"); // skip "no models" placeholder rows
  
    if (rows.length === 0) return;
  
    const label =
      rows.length === 1 ? `${rows[0].make} - ${rows[0].model}` : `${rows.length} models`;
    if (!window.confirm(`Remove ${label}?`)) return;
  
    // Group selected rows by companyId so each make gets a single PATCH call
    // removing all of its selected models at once.
    const byCompany = new Map<string, TableRow[]>();
    for (const r of rows) {
      const arr = byCompany.get(r.companyId) ?? [];
      arr.push(r);
      byCompany.set(r.companyId, arr);
    }
  
    setActionLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      for (const [companyId, rowsForCompany] of byCompany) {
        const company = companies.find((c) => c._id === companyId);
        if (!company) continue;
  
        const removeNames = new Set(rowsForCompany.map((r) => r.model.toLowerCase()));
        const remainingModels = (company.models || [])
          .filter((m) => !removeNames.has(m.modelName.toLowerCase()))
          .map((m) => ({ modelName: m.modelName.trim() }))
          .filter((m) => m.modelName);
  
        const formData = new FormData();
        formData.append("companyName", company.companyName);
        formData.append("models", JSON.stringify(remainingModels));
        formData.append("country", "Canada");
  
        await axios.patch(
          `${API_BASE}/admin/car-company/${companyId}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              ...getAdminAuthHeaders(),
            },
          }
        );
      }
  
      adminNotify.success("Model(s) removed.");
      setSuccessMsg("Model(s) removed.");
      setSelected(new Set());
      fetchCompanies(search);
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      const msg = axErr?.response?.data?.message || axErr?.message || "Failed to remove model(s)";
      setError(msg);
      adminNotify.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async () => {
    if (selected.size !== 1) return;
    const row = findRowById([...selected][0]);
    if (!row) return;
    const company = deletedStash.find((c) => c._id === row.companyId);
    if (!company) return;
    if (!window.confirm(`Restore car brand "${company.companyName}"?`)) return;
    setActionLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const formData = new FormData();
      formData.append("companyName", company.companyName);
      formData.append(
        "models",
        JSON.stringify(
          (company.models || [])
            .map((m) => ({ modelName: m.modelName.trim() }))
            .filter((m) => m.modelName)
        )
      );
      formData.append("country", "Canada");
      await axios.post(
        `${API_BASE}/admin/car-company`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            ...getAdminAuthHeaders(),
          },
        }
      );
      restoreStashed((item) => item._id === company._id);
      adminNotify.success("Car brand restored.");
      setSuccessMsg("Car brand restored.");
      setSelected(new Set());
      fetchCompanies(search);
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      const msg = axErr?.response?.data?.message || axErr?.message || "Failed to restore car brand";
      setError(msg);
      adminNotify.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToolbarPrint = () => {
    printAdminTable({
      title: isDeletedView ? "Deleted Car Brands" : "Car Brands",
      headers: ["Make", "Model", "Logo"],
      rows: sortedFiltered.map((row) => [row.make, row.model, row.brandLogo ? "Yes" : "—"]),
    });
  };

  const formMessage = editingCompany
    ? "You are updating a 'Car Brand'"
    : "You are creating a 'Car Brand'";

  return (
    <AdminPage
      title={isDeletedView ? "Deleted Car Brands" : "Car Brands"}
      headerAction={!showForm && !showSearchCard && !isDeletedView ? <AddNewButton onClick={openAdd} /> : undefined}
      between={
        showSearchCard ? (
          <AdminSearchCard
            fields={CAR_BRAND_SEARCH_FIELDS}
            values={searchDraft}
            onChange={setSearchDraft}
            onSearch={handleSearchCardSearch}
            onReset={handleSearchCardReset}
            onClose={() => setShowSearchCard(false)}
          />
        ) : showForm ? (
          <CompactFormPanel
            footer={
              <CompactFormFooter
                message={formMessage}
                messageCenter
                actionLabel={
                  actionLoading
                    ? (editingCompany ? "Updating..." : "Saving...")
                    : (editingCompany ? "Update" : "Save")
                }
                onSave={handleSave}
                onCancel={handleCancel}
              />
            }
          >
            {error && (
              <div className="mb-2 rounded border border-red-200 bg-red-100 px-3 py-2 text-xs text-red-800">
                {error}
              </div>
            )}
            <div className="grid w-full grid-cols-4 gap-x-4 gap-y-3 items-start">
              <ComboSelectWithEditor
                label="Make"
                required
                value={make}
                placeholder="Select make"
                options={allMakeOptions}
                onChange={handleMakeChange}
                onEditAddNew={openMakesPopup}
              />
              <InlineModelSelector
                label="Model"
                required
                disabled={!makeFilled}
                options={namedModels.map((m) => m.modelName)}
                selected={selectedModelNames}
                onToggle={toggleSelectedModel}
                onAddModel={addModelInline}
                onRemoveModel={removeModelInline}
                className="col-span-2"
              />
              <div className={equalThirdFieldClass}>
                <AttachImageCheckbox
                  label="Attach Image"
                  checked={attachBrandLogo}
                  onCheckedChange={(checked) => {
                    setAttachBrandLogo(checked);
                    if (checked) {
                      if (editingCompany?.brandLogo && !brandLogoFile) {
                        setBrandLogoPreviewUrl(getBackendImageUrl(editingCompany.brandLogo));
                      }
                    } else {
                      handleRemoveBrandLogo();
                    }
                  }}
                  file={brandLogoFile}
                  onFileChange={(file) => {
                    if (!file) {
                      handleRemoveBrandLogo();
                      return;
                    }
                    setBrandLogoFile(file);
                    if (brandLogoPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(brandLogoPreviewUrl);
                    setBrandLogoPreviewUrl(URL.createObjectURL(file));
                  }}
                />
              </div>
            </div>

            {makesPopupOpen && (
              <ListEditorPopup
                title="Makes"
                items={makesDraft}
                onChange={setMakesDraft}
                onSave={saveMakesPopup}
                onCancel={cancelMakesPopup}
                onRename={handleRenameMake}
                placeholder="Make name"
              />
            )}
          </CompactFormPanel>
        ) : undefined
      }
    >
      {isDeletedView && (
        <AdminDeletedBanner count={deletedStash.length} entityLabel="car brands" />
      )}
      {successMsg && !showForm && (
        <div className="mb-2 rounded border border-green-200 bg-green-100 px-3 py-2 text-xs text-green-800">
          {successMsg}
        </div>
      )}
      {error && !showForm && (
        <div className="mb-2 rounded border border-red-200 bg-red-100 px-3 py-2 text-xs text-red-800">
          {error}
        </div>
      )}

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {!isDeletedView ? (
            <button
              type="button"
              onClick={handleToolbarDelete}
              disabled={selected.size === 0 || actionLoading}
              className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Delete
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRestore}
              disabled={selected.size === 0 || actionLoading}
              className="bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              Restore
            </button>
          )}
          <button
            type="button"
            onClick={handleToolbarPrint}
            className="bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark"
          >
            Print
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
            placeholder="Live Search here"
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
          <button
            type="button"
            onClick={handleClearSearch}
            className="border border-gray-400 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
          >
            Clear
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
        {loading && <span className="text-gray-500">Loading…</span>}
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
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Make</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Model</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Logo</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={4} className="border border-gray-300 px-3 py-6 text-center text-gray-500">
                  {loading
                    ? "Loading car brands…"
                    : isDeletedView
                      ? "No deleted car brands found."
                      : "No car brands found."}
                </td>
              </tr>
            ) : (
              paged.map((row, idx) => (
                <tr key={row.rowId} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                  <td className="border border-gray-300 px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selected.has(row.rowId)}
                      onChange={() => toggleSelect(row.rowId)}
                      className="accent-ad-purple"
                    />
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => openEditByRow(row)}
                      className="text-blue-700 hover:underline"
                    >
                      {row.make}
                    </button>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{row.model}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    {row.brandLogo ? (
                      <ClipImageHover
                        imageUrl={getBackendImageUrl(row.brandLogo)}
                        alt={`${row.make} logo`}
                        size={20}
                        iconClassName="text-ad-purple"
                      />
                    ) : (
                      <span className="text-gray-500">--</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <TableEntriesSummary total={sortedFiltered.length} page={page} pageSize={entriesPerPage} />
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
        <AdminDeletedToggle viewMode={viewMode} onToggle={toggleViewMode} activeLabel="Active Car Brands" />
      </div>
    </AdminPage>
  );
}