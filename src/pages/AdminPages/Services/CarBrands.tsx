import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import axios, { AxiosError } from "axios";
import { FiPaperclip } from "react-icons/fi";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  compactInputClass,
} from "../../../components/admin/ContentPanel";
import { adminNotify } from "../../../utils/adminNotify";
import { printAdminTable } from "../../../utils/adminPrintTable";

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
const uploadBtnClass =
  "rounded border border-gray-400 bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-300";
const equalThirdFieldClass = "min-w-0 w-full";

type ListEditorPopupProps = {
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
  onSave: () => void;
  onCancel: () => void;
  placeholder?: string;
  inputMode?: "text" | "numeric";
};

function ListEditorPopup({
  title,
  items,
  onChange,
  onSave,
  onCancel,
  placeholder = "",
  inputMode = "text",
}: ListEditorPopupProps) {
  const addItem = () => onChange([...items, ""]);
  const updateItem = (idx: number, value: string) =>
    onChange(items.map((item, i) => (i === idx ? value : item)));
  const removeItem = (idx: number) =>
    onChange(items.length <= 1 ? [""] : items.filter((_, i) => i !== idx));

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
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode={inputMode === "numeric" ? "numeric" : "text"}
                  value={item}
                  onChange={(e) =>
                    updateItem(
                      idx,
                      inputMode === "numeric" ? e.target.value.replace(/\D/g, "") : e.target.value
                    )
                  }
                  placeholder={placeholder}
                  className={`${compactInputClass} min-w-0 flex-1`}
                  autoFocus={idx === items.length - 1 && item === ""}
                />
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="shrink-0 text-base font-bold leading-none text-red-600 hover:text-red-800"
                  aria-label="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addItem}
            className="mt-3 text-xs font-semibold text-blue-700 hover:underline"
          >
            + More
          </button>
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
}: {
  label: string;
  required?: boolean;
  value: string;
  disabled?: boolean;
  placeholder?: string;
  options: string[];
  onChange: (value: string) => void;
  onEditAddNew: () => void;
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

  const displayValue = value || placeholder || "Select";

  return (
    <CompactField label={label} required={required} className={equalThirdFieldClass}>
      <div ref={rootRef} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((prev) => !prev)}
          className={`${compactInputClass} flex w-full items-center justify-between text-left disabled:cursor-not-allowed disabled:bg-gray-100 ${
            value ? "text-gray-900" : "text-gray-500"
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
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className={`block w-full px-2 py-1.5 text-left text-sm hover:bg-gray-100 ${
                  !value ? "bg-gray-50 font-medium text-gray-700" : "text-gray-500"
                }`}
              >
                {placeholder ?? "Select"}
              </button>
              {options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={`block w-full px-2 py-1.5 text-left text-sm hover:bg-gray-100 ${
                    opt === value ? "bg-ad-green-light/60 font-semibold text-ad-green-dark" : "text-gray-900"
                  }`}
                >
                  {opt}
                </button>
              ))}
              {value && !options.includes(value) && (
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

function cloneModelRows(rows: ModelFormRow[]): ModelFormRow[] {
  return rows.map((m) => ({ modelName: m.modelName }));
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
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showForm, setShowForm] = useState(initialShowForm);

  const [editingCompany, setEditingCompany] = useState<CarCompany | null>(null);
  const [make, setMake] = useState("");
  const [modelRows, setModelRows] = useState<ModelFormRow[]>([{ ...EMPTY_MODEL }]);
  const [brandLogoFile, setBrandLogoFile] = useState<File | null>(null);
  const [brandLogoPreviewUrl, setBrandLogoPreviewUrl] = useState<string | null>(null);
  const [attachBrandLogo, setAttachBrandLogo] = useState(false);
  const brandLogoRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<{ url: string; title: string } | null>(null);
  const [modelsPopupOpen, setModelsPopupOpen] = useState(false);
  const [makesPopupOpen, setMakesPopupOpen] = useState(false);
  const [modelsDraft, setModelsDraft] = useState<string[]>([]);
  const [makesDraft, setMakesDraft] = useState<string[]>([]);
  const [sessionMakeNames, setSessionMakeNames] = useState<string[]>([]);
  const [selectedModelName, setSelectedModelName] = useState("");
  const modelsSnapshotRef = useRef<ModelFormRow[]>([]);
  const makesSnapshotRef = useRef<string[]>([]);

  const fetchCompanies = async (q = "") => {
    setLoading(true);
    setError("");
    try {
      let url = `${import.meta.env.VITE_API_URL}/api/admin/car-company`;
      if (q) url += `?companyName=${encodeURIComponent(q)}`;
      const res = await axios.get(url);
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

  const handleSearch = () => {
    setPage(1);
    fetchCompanies(search);
  };

  const handleClearSearch = () => {
    setSearch("");
    setPage(1);
    fetchCompanies("");
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (!logoPreview) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLogoPreview(null);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [logoPreview]);

  const tableRows = useMemo(() => flattenCompanies(companies), [companies]);

  const filtered = tableRows.filter(
    (r) =>
      r.make.toLowerCase().includes(search.toLowerCase()) ||
      r.model.toLowerCase().includes(search.toLowerCase())
  );

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
    setModelsPopupOpen(false);
    setMakesPopupOpen(false);
    setSessionMakeNames([]);
    setSelectedModelName("");
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
    const firstModel = company.models?.find((m) => m.modelName.trim());
    setSelectedModelName(firstModel?.modelName ?? "");
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
    setSelectedModelName("");
    setError("");
  };

  const openAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditCompany = (company: CarCompany) => {
    populateFormFromCompany(company);
    setShowForm(true);
  };

  const openEditByRow = (row: TableRow) => {
    const company = companies.find((c) => c._id === row.companyId);
    if (company) openEditCompany(company);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const openModelsPopup = () => {
    modelsSnapshotRef.current = cloneModelRows(modelRows);
    const names = modelRows.map((m) => m.modelName).filter((n) => n.trim());
    setModelsDraft(names.length ? names : [""]);
    setModelsPopupOpen(true);
  };

  const saveModelsPopup = () => {
    const names = dedupeStrings(modelsDraft);
    const next: ModelFormRow[] = names.map((name) => {
      const existing = modelRows.find((m) => m.modelName.toLowerCase() === name.toLowerCase());
      return existing ? { ...existing, modelName: name } : { modelName: name };
    });
    setModelRows(next.length ? next : [{ ...EMPTY_MODEL }]);
    if (
      next.length &&
      (!selectedModelName || !next.some((m) => m.modelName === selectedModelName))
    ) {
      const first = next[0];
      setSelectedModelName(first.modelName);
    }
    setModelsPopupOpen(false);
  };

  const cancelModelsPopup = () => {
    setModelRows(modelsSnapshotRef.current);
    setModelsPopupOpen(false);
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
    setMakesDraft(allMakeOptions.length ? [...allMakeOptions] : [""]);
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

  const namedModels = useMemo(
    () => modelRows.filter((m) => m.modelName.trim()),
    [modelRows]
  );

  const handleMakeChange = (makeName: string) => {
    if (!makeName.trim()) {
      setMake("");
      setEditingCompany(null);
      setModelRows([{ ...EMPTY_MODEL }]);
      setSelectedModelName("");
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

  const handleModelChange = (modelName: string) => {
    setSelectedModelName(modelName);
  };

  const makeFilled = make.trim().length > 0;
  const modelFilled = selectedModelName.trim().length > 0;

  const handleBrandLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    setBrandLogoFile(file);
    if (brandLogoPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(brandLogoPreviewUrl);
    setBrandLogoPreviewUrl(URL.createObjectURL(file));
  };

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
      if (attachBrandLogo && brandLogoFile) formData.append("brandLogo", brandLogoFile);

      if (editingCompany) {
        await axios.patch(`${API_BASE}/admin/car-company/${editingCompany._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        adminNotify.success("Car brand updated.");
        setSuccessMsg("Car brand updated.");
      } else {
        await axios.post(`${API_BASE}/admin/car-company`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
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

  const handleDeleteCompany = async (companyId: string, label: string) => {
    if (!window.confirm(`Delete car brand "${label}" and all its models?`)) return;
    setActionLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await axios.delete(`${API_BASE}/admin/car-company/${companyId}`);
      adminNotify.success("Car brand deleted.");
      setSuccessMsg("Car brand deleted.");
      setSelected((prev) => {
        const next = new Set(prev);
        for (const id of prev) {
          if (id.startsWith(`${companyId}::`)) next.delete(id);
        }
        return next;
      });
      fetchCompanies(search);
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      const msg = axErr?.response?.data?.message || axErr?.message || "Failed to delete car brand";
      setError(msg);
      adminNotify.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const findRowById = (id: string) => tableRows.find((r) => r.rowId === id);

  const handleToolbarDelete = () => {
    if (selected.size !== 1) return;
    const row = findRowById([...selected][0]);
    if (row) handleDeleteCompany(row.companyId, row.make);
  };

  const handleToolbarPrint = () => {
    printAdminTable({
      title: "Car Brands",
      headers: ["Make", "Model", "Logo"],
      rows: tableRows
        .filter((row) => selected.has(row.rowId))
        .map((row) => [row.make, row.model, row.brandLogo ? "Yes" : "—"]),
    });
  };

  const formMessage = editingCompany
    ? "You are updating a 'Car Brand'"
    : "You are creating a 'Car Brand'";

  return (
    <AdminPage
      title="Car Brands"
      headerAction={!showForm ? <AddNewButton onClick={openAdd} /> : undefined}
      between={
        showForm ? (
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
            <div className="grid w-full grid-cols-3 gap-x-4 gap-y-3 items-start">
              <ComboSelectWithEditor
                label="Make"
                required
                value={make}
                placeholder="Select make"
                options={allMakeOptions}
                onChange={handleMakeChange}
                onEditAddNew={openMakesPopup}
              />
              <ComboSelectWithEditor
                label="Model"
                required
                value={selectedModelName}
                placeholder="Select model"
                options={namedModels.map((m) => m.modelName)}
                disabled={!makeFilled}
                onChange={handleModelChange}
                onEditAddNew={openModelsPopup}
              />
              <CompactField label="Brand Logo" className={equalThirdFieldClass}>
                <div className="min-w-0 w-full">
                  <label className="mb-1 flex cursor-pointer items-center gap-1.5 text-xs font-bold text-ad-green-dark">
                    <input
                      type="checkbox"
                      checked={attachBrandLogo}
                      disabled={!modelFilled && !makeFilled}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setAttachBrandLogo(checked);
                        if (checked) {
                          if (editingCompany?.brandLogo && !brandLogoFile) {
                            setBrandLogoPreviewUrl(getBackendImageUrl(editingCompany.brandLogo));
                          }
                        } else {
                          setBrandLogoFile(null);
                          if (brandLogoPreviewUrl?.startsWith("blob:")) URL.revokeObjectURL(brandLogoPreviewUrl);
                          setBrandLogoPreviewUrl(null);
                          if (brandLogoRef.current) brandLogoRef.current.value = "";
                        }
                      }}
                      className="h-3.5 w-3.5 accent-ad-green disabled:opacity-60"
                    />
                    Attach logo
                  </label>
                  {attachBrandLogo ? (
                    <div className="flex w-full min-w-0 items-center gap-1.5">
                      {brandLogoPreviewUrl ? (
                        <img
                          src={brandLogoPreviewUrl}
                          alt=""
                          className="h-[30px] w-[30px] shrink-0 rounded border border-gray-300 object-contain bg-white"
                        />
                      ) : null}
                      <input
                        readOnly
                        value={
                          brandLogoFile?.name ??
                          (brandLogoPreviewUrl && editingCompany?.brandLogo && !brandLogoFile
                            ? "Current logo"
                            : "")
                        }
                        placeholder="No file chosen"
                        tabIndex={-1}
                        className={`${compactInputClass} min-w-0 flex-1 cursor-default`}
                      />
                      <button
                        type="button"
                        onClick={() => brandLogoRef.current?.click()}
                        className={`${uploadBtnClass} shrink-0`}
                      >
                        Upload
                      </button>
                      {brandLogoPreviewUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveBrandLogo}
                          className={`${uploadBtnClass} shrink-0`}
                        >
                          Remove
                        </button>
                      )}
                      <input
                        ref={brandLogoRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleBrandLogoChange}
                      />
                    </div>
                  ) : null}
                </div>
              </CompactField>
            </div>

            {makesPopupOpen && (
              <ListEditorPopup
                title="Makes"
                items={makesDraft}
                onChange={setMakesDraft}
                onSave={saveMakesPopup}
                onCancel={cancelMakesPopup}
                placeholder="Make name"
              />
            )}

            {modelsPopupOpen && (
              <ListEditorPopup
                title="Models"
                items={modelsDraft}
                onChange={setModelsDraft}
                onSave={saveModelsPopup}
                onCancel={cancelModelsPopup}
                placeholder="Model name"
              />
            )}

          </CompactFormPanel>
        ) : undefined
      }
    >
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
          <button
            type="button"
            onClick={handleToolbarDelete}
            disabled={selected.size === 0 || actionLoading}
            className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={handleToolbarPrint}
            disabled={selected.size === 0}
            className="bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark disabled:cursor-not-allowed disabled:opacity-50"
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
            onClick={handleSearch}
            className="bg-gray-500 px-3 py-1 text-xs font-medium text-white hover:bg-gray-600"
          >
            Search
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
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Make</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Model</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Logo</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={4} className="border border-gray-300 px-3 py-6 text-center text-gray-500">
                  {loading ? "Loading car brands…" : "No car brands found."}
                </td>
              </tr>
            ) : (
              paged.map((row, idx) => (
                <tr key={row.rowId} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                  <td className="border border-gray-300 px-2 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(row.rowId)}
                      onChange={() => toggleSelect(row.rowId)}
                      className="accent-ad-purple"
                    />
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => openEditByRow(row)}
                      className="text-blue-700 hover:underline"
                    >
                      {row.make}
                    </button>
                  </td>
                  <td className="border border-gray-300 px-3 py-2">{row.model}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    {row.brandLogo ? (
                      <button
                        type="button"
                        onClick={() =>
                          setLogoPreview({
                            url: getBackendImageUrl(row.brandLogo!),
                            title: `${row.make} logo`,
                          })
                        }
                        className="inline-flex items-center justify-center rounded p-1 text-ad-purple hover:bg-ad-purple/10 hover:text-ad-purple-dark"
                        aria-label={`View ${row.make} logo`}
                        title="View logo"
                      >
                        <FiPaperclip className="size-5" aria-hidden />
                      </button>
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

      {logoPreview && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setLogoPreview(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[min(90vw,480px)] rounded border border-gray-300 bg-white p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLogoPreview(null)}
              className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gray-700 text-sm text-white hover:bg-gray-900"
              aria-label="Close"
            >
              ×
            </button>
            <p className="mb-3 text-center text-sm font-semibold text-ad-green-dark">{logoPreview.title}</p>
            <img
              src={logoPreview.url}
              alt={logoPreview.title}
              className="mx-auto max-h-[70vh] max-w-full object-contain"
            />
          </div>
        </div>
      )}
    </AdminPage>
  );
}
