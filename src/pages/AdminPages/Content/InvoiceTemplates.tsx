import { useState, useEffect } from "react";
import AttachImageCheckbox from "../../../components/admin/AttachImageCheckbox";
import AdminPage from "../../../components/admin/AdminPage";
import { AdminDeletedBanner, AdminDeletedToggle } from "../../../components/admin/AdminDeletedView";
// import ClipImageHover from "../../../components/admin/ClipImageHover";
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
import { DUMMY_INVOICE_TEMPLATES, resolveTemplateSlug } from "../../../components/shop/ShopDocumentTemplatePanel";
import { InvoiceTemplatePreview } from "../../../components/shop/invoice-templates/InvoiceTemplatePreview";
import { DEFAULT_INVOICE_PREVIEW } from "../../../components/shop/invoice-templates/sampleInvoiceData";

const USER_TYPE_OPTIONS = [
  { value: "mechanic-shop", label: "Mechanic Shop" },
  { value: "car-washing", label: "Car Washing" },
  { value: "tire-master", label: "Tire Service" },
  { value: "tow-truck", label: "Tow Truck" },
];

const INVOICE_SEARCH_FIELDS: AdminSearchField[] = [
  { key: "template", label: "Template" },
  { key: "date", label: "Date", type: "date" },
  {
    key: "userType",
    label: "User Type",
    type: "select",
    options: USER_TYPE_OPTIONS.map((o) => ({ value: o.label, label: o.label })),
  },
  { key: "usedBy", label: "Used by", type: "number" },
];

// Mapping local userType value to API shopType
// const toShopTypeApi = (userType: string) => {
//   switch (userType) {
//     case "mechanic-shop":
//       return "auto";
//     case "car-washing":
//       return "wash";
//     case "tire-master":
//       return "tire";
//     case "tow-truck":
//       return "tow";
//     default:
//       return userType;
//   }
// };

// const fromShopTypeApi = (shopType: string) => {
//   switch (shopType) {
//     case "auto":
//       return "mechanic-shop";
//     case "wash":
//       return "car-washing";
//     case "tire":
//       return "tire-master";
//     case "tow":
//       return "tow-truck";
//     default:
//       return shopType;
//   }
// };

const getUserTypeLabel = (userType: string) => (
  USER_TYPE_OPTIONS.find(o => o.value === userType)?.label ?? userType
);

const getTemplateLabel = (slug: string) => (
  DUMMY_INVOICE_TEMPLATES.find((t) => t.id === slug)?.name ?? slug
);

type TemplateRow = {
  id: string; // API uses string IDs
  date: string;
  userType: string;
  notes: string;
  usedBy: number;
  hasClip: boolean;
  imageUrl?: string | null;
  /** Catalog id — drives which color theme the live preview renders. */
  templateSlug: string;
};

// --- Begin Demo / Sample Data logic ---

const SAMPLE_TEMPLATES: TemplateRow[] = [
  {
    id: "tpl-1",
    date: "2023-07-01",
    userType: "mechanic-shop",
    notes: "Standard Mechanic Invoice",
    usedBy: 22,
    hasClip: true,
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/4/4f/Invoice_sample_2012-12-23_00-41.png",
    templateSlug: "classic-invoice-v1",
  },
  {
    id: "tpl-2",
    date: "2023-06-10",
    userType: "car-washing",
    notes: "Car Wash Template",
    usedBy: 11,
    hasClip: false,
    imageUrl: "",
    templateSlug: "modern-invoice-v2",
  },
  {
    id: "tpl-3",
    date: "2022-12-18",
    userType: "tire-master",
    notes: "Tire Work - Invoice",
    usedBy: 17,
    hasClip: true,
    imageUrl: "https://www.qrinvoicegenerator.com/assets/img/sample-invoice.png",
    templateSlug: "viewer-invoice-v1",
  },
  {
    id: "tpl-4",
    date: "2023-05-21",
    userType: "tow-truck",
    notes: "Tow Truck Service",
    usedBy: 13,
    hasClip: false,
    imageUrl: "",
    templateSlug: "classic-invoice-v1",
  },
  {
    id: "tpl-5",
    date: "2023-04-02",
    userType: "mechanic-shop",
    notes: "Mechanic Extended",
    usedBy: 7,
    hasClip: true,
    imageUrl: "https://www.vnrc.org/wp-content/uploads/2015/12/simple-invoice-template.png",
    templateSlug: "modern-invoice-v2",
  },
  {
    id: "tpl-6",
    date: "2023-01-15",
    userType: "car-washing",
    notes: "Special Wash",
    usedBy: 3,
    hasClip: false,
    templateSlug: "viewer-invoice-v1",
  },
];

const USE_SAMPLE_DATA = true;

// Simulate fetching from API if not using sample data
async function apiFetchTemplates(
  // signal?: AbortSignal
): Promise<TemplateRow[]> {
  if (USE_SAMPLE_DATA) {
    return SAMPLE_TEMPLATES;
  }
  // fallback: unreachable in demo, but code kept for future
  return [];
}

// --- End Demo / Sample Data logic ---

// async function apiUpdateTemplate(
//   id: string,
//   data: Partial<{
//     templateName: string;
//     date: string;
//     country: string;
//     shopType: string;
//     image?: string | null;
//     invoiceTemplateSlug: string;
//   }>
// ) {
//   // In sample/demo mode, just show success and return dummy.
//   return { ok: true };
// }

// async function apiDeleteTemplate(id: string) {
//   // In sample/demo mode, just show success and return dummy.
//   return { ok: true };
// }

type InvoiceTemplatesPageProps = {
  initialShowForm?: boolean;
};

// PreviewPopover: Preview on hover for "click" icon in table
function PreviewPopover({
  open,
  children,
}: {
  templateId: string;
  open: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative inline-block">
      {children}
      {open && (
        <div
          className="absolute left-1/2 z-50 mt-2 w-60 -translate-x-1/2 rounded border border-gray-300 bg-white shadow-xl"
          style={{ top: "100%" }}
        >
          <div className="">
            {/* <InvoiceTemplatePreview
              templateId={templateId}
              data={DEFAULT_INVOICE_PREVIEW}
              mode="thumbnail"
            /> */}
          </div>
        </div>
      )}
    </div>
  );
}

export default function InvoiceTemplatesPage({ initialShowForm = false }: InvoiceTemplatesPageProps) {
  // Use sample data for the demo
  const [templates, setTemplates] = useState<TemplateRow[]>(SAMPLE_TEMPLATES);
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
  const [userType, setUserType] = useState("mechanic-shop");
  const [label, setLabel] = useState("");
  const [templateSlug, setTemplateSlug] = useState(DUMMY_INVOICE_TEMPLATES[0]?.id ?? "");
  const [attachImage, setAttachImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // For preview popover: control which ID is hovered
  const [hoveredPreviewId, setHoveredPreviewId] = useState<string | null>(null);

  const resetTableControls = () => {
    setPage(1);
    setSelected(new Set());
    setSearch("");
    const empty = emptyAdminSearchValues(INVOICE_SEARCH_FIELDS);
    setSearchDraft(empty);
    setSearchFilters(empty);
    setShowSearchCard(false);
  };

  // The deleted view will just use state locally, no API, in sample mode
  const {
    viewMode,
    isDeletedView,
    toggleViewMode,
    deletedStash,
    stashDeleted,
    restoreStashed,
  } = useAdminDeletedView<TemplateRow>({
    onToggle: resetTableControls,
    storageKey: "admin_deleted_view:invoice-templates",
  });

  // For the demo, we'll set templates from sample on first mount, and every filter change
  useEffect(() => {
    let ignore = false;
    // simulate async with a timeout
    apiFetchTemplates().then((data) => {
      if (!ignore) setTemplates(data);
    });
    return () => {
      ignore = true;
    };
  }, []);

  const displayTemplates = isDeletedView ? deletedStash : templates;

  const filtered = displayTemplates.filter((t) => {
    const userTypeLabel = getUserTypeLabel(t.userType);
    const live =
      !search.trim() ||
      t.date.includes(search) ||
      userTypeLabel.toLowerCase().includes(search.toLowerCase()) ||
      t.notes.toLowerCase().includes(search.toLowerCase()) ||
      String(t.usedBy).includes(search);
    if (!live) return false;
    const dateStr = t.date ? String(t.date).slice(0, 10) : "";
    return (
      searchIncludes(t.notes, searchFilters.template) &&
      searchIncludes(dateStr, searchFilters.date) &&
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

  const resetForm = () => {
    setDate(""); // API will require explicit date
    setUserType("mechanic-shop");
    setLabel("");
    setTemplateSlug(DUMMY_INVOICE_TEMPLATES[0]?.id ?? "");
    setAttachImage(false);
    setImageFile(null);
    setEditingId(null);
  };

  const openEdit = (row: TemplateRow) => {
    setDate(row.date);
    setUserType(row.userType);
    setLabel(row.notes);
    setTemplateSlug(resolveTemplateSlug(DUMMY_INVOICE_TEMPLATES, row.templateSlug));
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

  // No real upload in sample/demo
  const handleSave = async () => {
    try {
      if (editingId == null) {
        // In demo: just add a fake row
        const newId = "tpl-" + (Math.random() * 1e6).toFixed(0);
        setTemplates((prev) => [
          ...prev,
          {
            id: newId,
            date,
            userType,
            notes: label,
            usedBy: 0,
            hasClip: attachImage,
            templateSlug,
            imageUrl: attachImage
              ? "https://upload.wikimedia.org/wikipedia/commons/4/4f/Invoice_sample_2012-12-23_00-41.png"
              : "",
          },
        ]);
        adminNotify.success("Saved successfully (sample data).");
      } else {
        // Edit sample in place
        setTemplates((prev) =>
          prev.map((tpl) =>
            tpl.id === editingId
              ? {
                  ...tpl,
                  date,
                  userType,
                  notes: label,
                  hasClip: attachImage,
                  templateSlug,
                }
              : tpl
          )
        );
        adminNotify.success("Updated successfully (sample data).");
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
      headers: ["Template", "Design", "Date", "User Type", "Used by", "Clip"],
      rows: filtered.map((template) => [
        template.notes,
        getTemplateLabel(template.templateSlug),
        template.date,
        getUserTypeLabel(template.userType),
        String(template.usedBy),
        template.hasClip ? "Yes" : "—",
      ]),
    });
  };

  // Delete single or multiple (in sample: just remove from state and put in local deletedStash)
  const handleDelete = async () => {
    if (selected.size === 0) return;
    const toDelete = templates.filter((t) => selected.has(t.id));
    try {
      setTemplates((prev) => prev.filter((tpl) => !selected.has(tpl.id)));
      stashDeleted(toDelete);
      adminNotify.success("Deleted selected template(s) (sample data).");
      setSelected(new Set());
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
              <CompactField label="Design" required className="w-[180px] shrink-0 flex-none sm:w-[220px]">
                <select
                  value={templateSlug}
                  onChange={(e) => setTemplateSlug(e.target.value)}
                  className={compactInputClass}
                >
                  {DUMMY_INVOICE_TEMPLATES.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
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
            <CompactFormRow className="items-start justify-start">
              <div className="w-full max-w-sm">
                <p className="mb-1 text-xs font-semibold text-gray-600">Live preview</p>
                <div className="overflow-hidden rounded border border-gray-300">
                  <InvoiceTemplatePreview
                    templateId={templateSlug}
                    data={DEFAULT_INVOICE_PREVIEW}
                    mode="thumbnail"
                  />
                </div>
              </div>
            </CompactFormRow>
          </CompactFormPanel>
        ) : undefined
      }
    >
      {isDeletedView && (
        <AdminDeletedBanner count={deletedStash.length} entityLabel="invoice templates" />
      )}

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

      <div className="overflow-x-auto ">
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
              {/* Remove Preview column, shift columns left, add a new "Preview" icon in Template cell */}
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Template</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Design</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Date</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">User Type</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Used by</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Clip</th>
            </tr>
          </thead>
          <tbody className="">
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
                <td className="border border-gray-300 px-3 py-2 text-left align-top whitespace-normal break-words min-w-[200px]">

                  <div className="flex items-center gap-1">
                    {/* Edit button (existing) */}
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
                  </div>
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {getTemplateLabel(row.templateSlug)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {row.date ? new Date(row.date).toLocaleDateString() : "--"}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {getUserTypeLabel(row.userType)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">{row.usedBy}</td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {row.imageUrl ? (
                    <div className="">
                      <PreviewPopover
                        templateId={row.templateSlug}
                        open={hoveredPreviewId === row.id}
                      >
                        <button
                          type="button"
                          tabIndex={-1}
                          aria-label="Preview"
                          className="ml-2 text-gray-400 hover:text-ad-purple transition-colors"
                          onMouseEnter={() => setHoveredPreviewId(row.id)}
                          onMouseLeave={() => setHoveredPreviewId(null)}
                          onFocus={() => setHoveredPreviewId(row.id)}
                          onBlur={() => setHoveredPreviewId(null)}
                          style={{padding: 0, background: "none", border: "none", lineHeight: 1}}
                        >
                          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 4.5c-5 0-8 4.1-8 5.5s3 5.5 8 5.5 8-4.1 8-5.5-3-5.5-8-5.5zm0 9A4 4 0 1 1 10 7a4 4 0 0 1 0 8zm0-2.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
                          </svg>
                        </button>
                        {hoveredPreviewId === row.id && (
                          <div
                            className="fixed z-[9999] right-[150px] top-1/2  -translate-y-1/2"
                            
                          >
                            <div className="w-60 rounded border border-gray-300 bg-white shadow-xl">
                              <div className="px-2 py-2">
                                <InvoiceTemplatePreview
                                  templateId={row.templateSlug}
                                  data={DEFAULT_INVOICE_PREVIEW}
                                  mode="thumbnail"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </PreviewPopover>
                    </div>
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
              className={`h-7 w-7 border text-xs font-medium ${
                page === p
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