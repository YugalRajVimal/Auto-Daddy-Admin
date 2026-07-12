import { useState, useEffect } from "react";
import AttachImageCheckbox from "../../../components/admin/AttachImageCheckbox";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import { AdminDeletedBanner, AdminDeletedToggle } from "../../../components/admin/AdminDeletedView";
import ClipImageHover from "../../../components/admin/ClipImageHover";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactFixedFieldWidth,
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

const USER_TYPE_OPTIONS = [
  { value: "mechanic-shop", label: "Mechanic Shop" },
  { value: "car-washing", label: "Car Washing" },
  { value: "tire-master", label: "Tire Master" },
  { value: "tow-truck", label: "Tow Truck" },
];

const INVOICE_SEARCH_FIELDS: AdminSearchField[] = [
  { key: "template", label: "Template" },
  { key: "date", label: "Date", type: "date" },
  {
    key: "country",
    label: "Country",
    type: "select",
    options: [
      { value: "Canada", label: "Canada" },
      { value: "USA", label: "USA" },
      { value: "India", label: "India" },
    ],
  },
  {
    key: "userType",
    label: "User Type",
    type: "select",
    options: USER_TYPE_OPTIONS.map((o) => ({ value: o.label, label: o.label })),
  },
  { key: "usedBy", label: "Used by", type: "number" },
];

// Mapping local userType value to API shopType
const toShopTypeApi = (userType: string) => {
  switch (userType) {
    case "mechanic-shop":
      return "auto";
    case "car-washing":
      return "wash";
    case "tire-master":
      return "tire";
    case "tow-truck":
      return "tow";
    default:
      return userType;
  }
};

const fromShopTypeApi = (shopType: string) => {
  switch (shopType) {
    case "auto":
      return "mechanic-shop";
    case "wash":
      return "car-washing";
    case "tire":
      return "tire-master";
    case "tow":
      return "tow-truck";
    default:
      return shopType;
  }
};

const getUserTypeLabel = (userType: string) => (
  USER_TYPE_OPTIONS.find(o => o.value === userType)?.label ?? userType
);

type TemplateRow = {
  id: string; // API uses string IDs
  date: string;
  userType: string;
  notes: string;
  country: string;
  usedBy: number;
  hasClip: boolean;
  imageUrl?: string | null;
};

const API_BASE = import.meta.env.VITE_API_URL
? `${import.meta.env.VITE_API_URL}/api/admin/common`
: "/api";


async function apiFetchTemplates(country: string, userTypeFilters: Record<string, boolean>, signal?: AbortSignal) {
  // To support multiple shopType filter, loop over each and merge results, or send multiple params if supported.
  // We'll pick the first checked. In real use, update this for better filter support.
  const shopTypes = Object.entries(userTypeFilters)
    .filter(([, checked]) => checked)
    .map(([t]) => toShopTypeApi(t));
  let results: TemplateRow[] = [];
  for (const shopType of shopTypes) {
    const res = await fetch(
      `${API_BASE}/invoice-templates?country=${encodeURIComponent(country)}&shopType=${encodeURIComponent(shopType)}`,
      { signal }
    );
    if (!res.ok) throw new Error("Failed to fetch templates");
    const json = await res.json();
    // Normalize response to TemplateRow[]
    if (Array.isArray(json)) {
      const mapped = json.map((tpl: any) => ({
        id: tpl.id?.toString() ?? tpl._id?.toString() ?? "",
        date: tpl.date ?? "",
        userType: fromShopTypeApi(tpl.shopType ?? ""),
        notes: tpl.templateName ?? "",
        country: tpl.country ?? "",
        usedBy: Number(tpl.usedBy ?? tpl.usedCount ?? tpl.usageCount ?? 0) || 0,
        hasClip: !!tpl.image,
        imageUrl: tpl.image ?? null,
      }));
      results = [...results, ...mapped];
    }
  }
  return results;
}

// async function apiCreateTemplate(data: {
//   templateName: string;
//   date: string;
//   country: string;
//   shopType: string;
//   image?: string | null;
// }) {
//   const res = await fetch(`${API_BASE}/invoice-templates`, {
//     method: "POST",
//     headers: {"Content-Type": "application/json"},
//     body: JSON.stringify(data)
//   });
//   if (!res.ok) throw new Error("Failed to create template");
//   return await res.json();
// }

async function apiUpdateTemplate(id: string, data: Partial<{ templateName: string; date: string; country: string; shopType: string; image?: string | null; }>) {
  const res = await fetch(`${API_BASE}/invoice-templates/${id}`, {
    method: "PUT",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to update template");
  return await res.json();
}

async function apiDeleteTemplate(id: string) {
  const res = await fetch(`${API_BASE}/invoice-templates/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete template");
  return await res.json();
}

type InvoiceTemplatesPageProps = {
  initialShowForm?: boolean;
};

export default function InvoiceTemplatesPage({ initialShowForm = false }: InvoiceTemplatesPageProps) {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [showSearchCard, setShowSearchCard] = useState(false);
  const [searchDraft, setSearchDraft] = useState(() => emptyAdminSearchValues(INVOICE_SEARCH_FIELDS));
  const [searchFilters, setSearchFilters] = useState(() => emptyAdminSearchValues(INVOICE_SEARCH_FIELDS));
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showForm, setShowForm] = useState(initialShowForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [country, setCountry] = useState("Canada");
  const [userType, setUserType] = useState("mechanic-shop");
  const [label, setLabel] = useState("");
  const [userTypeFilters, setUserTypeFilters] = useState<Record<string, boolean>>({
    "mechanic-shop": true,
    "car-washing": false,
    "tire-master": false,
    "tow-truck": false,
  });
  const [attachImage, setAttachImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const resetTableControls = () => {
    setPage(1);
    setSelected(new Set());
    setSearch("");
    const empty = emptyAdminSearchValues(INVOICE_SEARCH_FIELDS);
    setSearchDraft(empty);
    setSearchFilters(empty);
    setShowSearchCard(false);
  };

  const { viewMode, isDeletedView, toggleViewMode, deletedStash, stashDeleted, restoreStashed } =
    useAdminDeletedView<TemplateRow>({
      onToggle: resetTableControls,
      storageKey: "admin_deleted_view:invoice-templates",
    });

  // You may want to also support fetch status and errors, skipped here for clarity

  // Fetch templates when country or userTypeFilters changes or on mount
  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();
    apiFetchTemplates(country, userTypeFilters, controller.signal)
      .then((data) => {
        if (!ignore) setTemplates(data);
      })
      .catch(() => { if (!ignore) setTemplates([]); });
    return () => { ignore = true; controller.abort(); };
  }, [country, userTypeFilters]);

  const displayTemplates = isDeletedView ? deletedStash : templates;

  const filtered = displayTemplates.filter((t) => {
    const userTypeLabel = getUserTypeLabel(t.userType);
    const live =
      (userTypeFilters[t.userType] ?? true) &&
      (!search.trim() ||
        t.date.includes(search) ||
        userTypeLabel.toLowerCase().includes(search.toLowerCase()) ||
        t.notes.toLowerCase().includes(search.toLowerCase()) ||
        t.country.toLowerCase().includes(search.toLowerCase()) ||
        String(t.usedBy).includes(search));
    if (!live) return false;
    const dateStr = t.date ? String(t.date).slice(0, 10) : "";
    return (
      searchIncludes(t.notes, searchFilters.template) &&
      searchIncludes(dateStr, searchFilters.date) &&
      searchEquals(t.country, searchFilters.country) &&
      searchEquals(userTypeLabel, searchFilters.userType) &&
      searchIncludes(t.usedBy, searchFilters.usedBy)
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
    else setSelected(new Set(paged.map((t) => t.id)));
  };

  const toggleUserType = (type: string) => {
    setUserTypeFilters((prev) => ({ ...prev, [type]: !prev[type] }));
    setPage(1);
  };

  const resetForm = () => {
    setDate(""); // API will require explicit date
    setCountry("Canada");
    setUserType("mechanic-shop");
    setLabel("");
    setAttachImage(false);
    setImageFile(null);
    setEditingId(null);
  };

  const openAdd = () => {
    resetForm();
    setShowSearchCard(false);
    setShowForm(true);
  };

  const openEdit = (row: TemplateRow) => {
    setDate(row.date);
    setCountry(row.country);
    setUserType(row.userType);
    setLabel(row.notes);
    setAttachImage(row.hasClip);
    setImageFile(null);
    setEditingId(row.id);
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
    const empty = emptyAdminSearchValues(INVOICE_SEARCH_FIELDS);
    setSearchDraft(empty);
    setSearchFilters(empty);
    setPage(1);
    setSelected(new Set());
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  // Image upload simulation, real API would require actual upload;
  // Use a stubbed URL if attachImage and file is selected. (Or implement real upload)
  // async function uploadImageIfNeeded(): Promise<string | null> {
  //   if (attachImage && imageFile) {
  //     // In real project, upload image and get the URL.
  //     // Here we simulate an upload:
  //     return URL.createObjectURL(imageFile); // Placeholder: should be provided by server
  //   }
  //   return null;
  // }

  const handleSave = async () => {
    try {
      // const imageUrl = await uploadImageIfNeeded();
      if (editingId == null) {
        // Create
        // const templateData = {
        //   templateName: label,
        //   date,
        //   country,
        //   shopType: toShopTypeApi(userType),
        //   image: attachImage ? imageUrl : null,
        // };
        // const resp = await apiCreateTemplate(templateData);
        adminNotify.success("Saved successfully.");
        // Re-fetch
        apiFetchTemplates(country, userTypeFilters).then(setTemplates);
      } else {
        // Edit
        const updateData: any = { templateName: label }; // Only updating templateName per cURL, extend as needed
        // If wanted: updateData.* = fields if changed
        await apiUpdateTemplate(editingId, updateData);
        adminNotify.success("Updated successfully.");
        apiFetchTemplates(country, userTypeFilters).then(setTemplates);
      }
      resetForm();
      setShowForm(false);
    } catch (e: any) {
      adminNotify.error(e.message || "Error saving template");
    }
  };

  const handleToolbarPrint = () => {
    printAdminTable({
      title: "Invoice Templates",
      headers: ["Template", "Date", "Country", "User Type", "Used by", "Clip"],
      rows: filtered.map((template) => [
        template.notes,
        template.date,
        template.country,
        getUserTypeLabel(template.userType),
        String(template.usedBy),
        template.hasClip ? "Yes" : "—",
      ]),
    });
  };

  // Delete single or multiple
  const handleDelete = async () => {
    if (selected.size === 0) return;
    const toDelete = templates.filter((t) => selected.has(t.id));
    try {
      await Promise.all(Array.from(selected).map(apiDeleteTemplate));
      stashDeleted(toDelete);
      adminNotify.success("Deleted selected template(s).");
      setSelected(new Set());
      apiFetchTemplates(country, userTypeFilters).then(setTemplates);
    } catch (e: any) {
      adminNotify.error("Error deleting selected");
    }
  };

  const handleRestore = () => {
    if (selected.size === 0) return;
    const toRestore = deletedStash.filter((t) => selected.has(t.id));
    if (toRestore.length === 0) return;
    if (!window.confirm(`Restore ${toRestore.length} template(s)?`)) return;
    restoreStashed((item) => selected.has(item.id));
    setTemplates((prev) => [...toRestore, ...prev.filter((t) => !selected.has(t.id))]);
    setSelected(new Set());
    adminNotify.success("Template(s) restored.");
  };

  return (
    <AdminPage
      title={isDeletedView ? "Deleted Inv - Temp" : "Inv - Temp"}
      headerAction={!showForm && !showSearchCard && !isDeletedView ? <AddNewButton onClick={openAdd} /> : undefined}
      between={
        showSearchCard ? (
          <AdminSearchCard
            fields={INVOICE_SEARCH_FIELDS}
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
                message={
                  editingId != null
                    ? "You are editing an 'Invoice Template'"
                    : "You are creating an 'Invoice Template'"
                }
                messageCenter
                actionLabel={editingId != null ? "Update" : "Save"}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            }
          >
            <CompactFormRow className="items-start">
              <CompactField label="Date" required className={compactFixedFieldWidth}>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={compactInputClass}
                />
              </CompactField>
              <CompactField label="Country" required className={compactFixedFieldWidth}>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={compactInputClass}
                >
                  <option value="Canada">Canada</option>
                  <option value="USA">USA</option>
                  <option value="India">India</option>
                </select>
              </CompactField>
              <CompactField label="User Type" required className="w-[150px] shrink-0 flex-none sm:w-[180px]">
                <select
                  value={userType}
                  onChange={(e) => setUserType(e.target.value)}
                  className={compactInputClass}
                >
                  {USER_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </CompactField>
              <CompactField label="Template Name" required className="min-w-[200px] flex-1">
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Invoice Template - 1"
                  className={compactInputClass}
                />
              </CompactField>
            </CompactFormRow>
            <CompactFormRow className="items-start justify-start">
              <AttachImageCheckbox
                checked={attachImage}
                onCheckedChange={setAttachImage}
                file={imageFile}
                onFileChange={setImageFile}
              />
            </CompactFormRow>
          </CompactFormPanel>
        ) : undefined
      }
    >
      {isDeletedView && (
        <AdminDeletedBanner count={deletedStash.length} entityLabel="invoice templates" />
      )}
      <div className="mb-2 flex flex-wrap items-center gap-4 border-b border-gray-300 bg-gray-100 px-3 py-2">
        {USER_TYPE_OPTIONS.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-xs font-bold text-ad-green-dark">
            <input
              type="checkbox"
              checked={userTypeFilters[option.value]}
              onChange={() => toggleUserType(option.value)}
              className="h-3.5 w-3.5 accent-ad-green"
            />
            {option.label}
          </label>
        ))}
      </div>

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {!isDeletedView ? (
            <button
              type="button"
              disabled={selected.size === 0}
              onClick={handleDelete}
              className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Delete
            </button>
          ) : (
            <button
              type="button"
              disabled={selected.size === 0}
              onClick={handleRestore}
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
              <th className="border border-ad-purple-dark px-2 py-2 text-center">
                <input
                  type="checkbox"
                  checked={paged.length > 0 && selected.size === paged.length}
                  onChange={toggleSelectAll}
                  className="accent-white"
                />
              </th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Template</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Date</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Country</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">User Type</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Used by</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Clip</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={7} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                  {isDeletedView ? "No deleted invoice templates found." : "No invoice templates found."}
                </td>
              </tr>
            ) : paged.map((row, idx) => (
              <tr key={row.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                <td className="border border-gray-300 px-2 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => toggleSelect(row.id)}
                    className="accent-ad-purple"
                  />
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {!isDeletedView ? (
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="text-blue-700 hover:underline"
                    >
                      {row.notes}
                    </button>
                  ) : (
                    row.notes
                  )}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {row.date ? new Date(row.date).toLocaleDateString() : "--"}
                </td>
           
                <td className="border border-gray-300 px-3 py-2 text-center">{row.country}</td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {getUserTypeLabel(row.userType)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">{row.usedBy}</td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {row.imageUrl ? (
                    <ClipImageHover
                      imageUrl={row.imageUrl}
                      alt={`Attachment for ${row.notes}`}
                    />
                  ) : (
                    <span className="text-gray-500">--</span>
                  )}
                </td>
              </tr>
            ))}
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
        <AdminDeletedToggle
          viewMode={viewMode}
          onToggle={toggleViewMode}
          activeLabel="Active Templates"
        />
      </div>
    </AdminPage>
  );
}
