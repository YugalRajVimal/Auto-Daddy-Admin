import { useState, useEffect, useCallback } from "react";
import AdminPage from "../../../components/admin/AdminPage";
import { TableEntriesSummary } from "../../../components/admin/AdminDataTable";
import { AdminDeletedBanner, AdminDeletedToggle } from "../../../components/admin/AdminDeletedView";
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

const SHOP_TYPE_OPTIONS = [
  { value: "mechanic-shop", label: "Auto Shop", apiValue: "mechanic-shop" },
  { value: "tire-master", label: "Tyre Shop", apiValue: "tire-master" },
  { value: "car-washing", label: "Car Wash", apiValue: "car-washing" },
  { value: "tow-truck", label: "Tow Truck", apiValue: "tow-truck" },
];

const WEBSITE_SEARCH_FIELDS: AdminSearchField[] = [
  { key: "templateName", label: "Template Name" },
  { key: "url", label: "URL" },
  { key: "date", label: "Date", type: "date" },
  {
    key: "shopType",
    label: "Shop Type",
    type: "select",
    options: SHOP_TYPE_OPTIONS.map((o) => ({ value: o.label, label: o.label })),
  },
  { key: "usedBy", label: "Used by", type: "number" },
];

const websiteShopTypeLabel = (shopType: string) =>
  SHOP_TYPE_OPTIONS.find((o) => o.value === shopType)?.label ?? shopType;

// NOTE: The API returns an "_id" string. We should map to `id` for internal row usage.
type TemplateRow = {
  id: string;
  templateName: string;
  url: string;
  date: string;
  shopType: string;
  usedBy: number;
};

type WebsiteTemplatesProps = {
  initialShowForm?: boolean;
};

const API_BASE =
  import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/admin/common`
    : "/api";

// Map API data (with "_id") to local TemplateRow ("id"), and format date as YYYY-MM-DD string.
function mapApiTemplate(t: any): TemplateRow {
  return {
    id: t._id || t.id,
    templateName: t.templateName,
    url: t.url,
    // If date is ISO string, format to YYYY-MM-DD for display
    date: t.date ? t.date.slice(0, 10) : "",
    shopType: t.shopType,
    usedBy: Number(t.usedBy ?? t.usedCount ?? t.usageCount ?? 0) || 0,
  };
}

const fetchTemplates = async ({
  shopType,
}: {
  shopType?: string;
}) => {
  const params = new URLSearchParams();
  params.append("country", "Canada");
  if (shopType) params.append("shopType", shopType);
  const res = await fetch(`${API_BASE}/website-templates?${params}`);
  // DO NOT await res.json() twice
  const data = await res.json();
  if (!res.ok) throw new Error("Could not fetch templates");
  // Accepts both { data: [...] } or [...]; best effort:
  const arr = Array.isArray(data) ? data : data.data || [];
  return arr.map(mapApiTemplate);
};

const createTemplate = async (body: {
  templateName: string;
  url: string;
  date: string;
  shopType: string;
}) => {
  const res = await fetch(`${API_BASE}/website-templates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, country: "Canada" }),
  });
  if (!res.ok) throw new Error("Could not create website template");
  return await res.json();
};

const deleteTemplate = async (id: string) => {
  const res = await fetch(`${API_BASE}/website-templates/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Could not delete template");
};

export default function WebsiteTemplates({ initialShowForm = false }: WebsiteTemplatesProps) {
  const [sites, setSites] = useState<TemplateRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [showSearchCard, setShowSearchCard] = useState(false);
  const [searchDraft, setSearchDraft] = useState(() =>
    emptyAdminSearchValues(WEBSITE_SEARCH_FIELDS)
  );
  const [searchFilters, setSearchFilters] = useState(() =>
    emptyAdminSearchValues(WEBSITE_SEARCH_FIELDS)
  );
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showForm, setShowForm] = useState(initialShowForm);
  const [date, setDate] = useState("2026-06-16");
  const [shopType, setShopType] = useState("mechanic-shop");
  const [url, setUrl] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [shopTypeFilters, setShopTypeFilters] = useState<Record<string, boolean>>({
    "mechanic-shop": true,
    "car-washing": false,
    "tire-master": false,
    "tow-truck": false,
  });
  const [loading, setLoading] = useState(false);

  const resetTableControls = () => {
    setPage(1);
    setSelected(new Set());
    setSearch("");
    const empty = emptyAdminSearchValues(WEBSITE_SEARCH_FIELDS);
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
  } = useAdminDeletedView<TemplateRow>({
    onToggle: resetTableControls,
    storageKey: "admin_deleted_view:website-templates",
  });

  // Helper: Convert checked filters to API shopType params
  const getActiveShopTypeFilter = () => {
    return Object.entries(shopTypeFilters).find(([_, val]) => val)?.[0];
  };

  // Fetch templates
  const fetchAndSetTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const activeShopType = getActiveShopTypeFilter();
      const arr = await fetchTemplates({ shopType: activeShopType });
      setSites(arr || []);
    } catch (e) {
      adminNotify.error("Failed to fetch website templates");
    }
    setLoading(false);
  }, [shopTypeFilters]);

  useEffect(() => {
    fetchAndSetTemplates();
  }, [fetchAndSetTemplates, search, entriesPerPage, page]);

  // Filtering and pagination (client-side, for live search)
  const displaySites = isDeletedView ? deletedStash : sites;

  const filtered = displaySites.filter((s) => {
    const shopTypeLabel = websiteShopTypeLabel(s.shopType);
    const live =
      !search.trim() ||
      s.date.includes(search) ||
      shopTypeLabel.toLowerCase().includes(search.toLowerCase()) ||
      s.templateName.toLowerCase().includes(search.toLowerCase()) ||
      s.url.toLowerCase().includes(search.toLowerCase()) ||
      String(s.usedBy).includes(search);
    if (!live) return false;
    const dateStr = s.date ? String(s.date).slice(0, 10) : "";
    return (
      searchIncludes(s.templateName, searchFilters.templateName) &&
      searchIncludes(s.url, searchFilters.url) &&
      searchIncludes(dateStr, searchFilters.date) &&
      searchEquals(shopTypeLabel, searchFilters.shopType) &&
      searchIncludes(s.usedBy, searchFilters.usedBy)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / entriesPerPage));
  const pageStartIndex = (page - 1) * entriesPerPage;
  const paged = filtered.slice(pageStartIndex, pageStartIndex + entriesPerPage);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (paged.length > 0 && selected.size === paged.length) setSelected(new Set());
    else setSelected(new Set(paged.map((s) => s.id)));
  };

  const toggleShopType = (type: string) => {
    setShopTypeFilters((prev) => ({ ...prev, [type]: !prev[type] }));
    setPage(1);
    setTimeout(fetchAndSetTemplates, 0);
  };

  const resetForm = () => {
    setDate("2026-06-16");
    setShopType("mechanic-shop");
    setUrl("");
    setTemplateName("");
  };

  const openSearchCard = () => {
    setShowForm(false);
    setSearchDraft({ ...searchFilters });
    setShowSearchCard((open) => !open);
  };

  const handleSearchCardSearch = () => {
    setSearchFilters({ ...searchDraft });
    setPage(1);
    setSelected(new Set());
  };

  const handleSearchCardReset = () => {
    const empty = emptyAdminSearchValues(WEBSITE_SEARCH_FIELDS);
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
    try {
      await createTemplate({
        templateName,
        url,
        date,
        shopType: shopType,
      });
      adminNotify.success("Saved successfully.");
      fetchAndSetTemplates();
      resetForm();
      setShowForm(false);
    } catch (e) {
      adminNotify.error("Failed to create website template.");
    }
  };

  const handleDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm("Are you sure you want to delete selected template(s)?")) return;
    const toDelete = sites.filter((s) => selected.has(s.id));
    try {
      for (const id of selected) {
        await deleteTemplate(id);
      }
      stashDeleted(toDelete);
      adminNotify.success("Deleted selected template(s).");
      setSelected(new Set());
      fetchAndSetTemplates();
    } catch (e) {
      adminNotify.error("Failed to delete template(s).");
    }
  };

  const handleRestore = async () => {
    if (selected.size === 0) return;
    const toRestore = deletedStash.filter((s) => selected.has(s.id));
    if (toRestore.length === 0) return;
    if (!window.confirm(`Restore ${toRestore.length} template(s)?`)) return;
    try {
      for (const row of toRestore) {
        await createTemplate({
          templateName: row.templateName,
          url: row.url,
          date: row.date,
          shopType: row.shopType,
        });
      }
      restoreStashed((item) => selected.has(item.id));
      setSelected(new Set());
      adminNotify.success("Template(s) restored.");
      fetchAndSetTemplates();
    } catch (e) {
      adminNotify.error("Failed to restore template(s).");
    }
  };

  const handleToolbarPrint = () => {
    printAdminTable({
      title: isDeletedView ? "Deleted Website Templates" : "Website Templates",
      headers: [
        "Template Name",
        "URL",
        "Date",
        "Shop Type",
        "Used by",
      ],
      rows: filtered.map((template, idx) => {
        const templateName = template.templateName || `Template ${idx + 1}`;
        return [
          templateName,
          template.url,
          template.date,
          SHOP_TYPE_OPTIONS.find((option) => option.value === template.shopType)?.label ??
            template.shopType,
          String(template.usedBy),
        ];
      }),
    });
  };

  return (
    <AdminPage
      title={isDeletedView ? "Deleted Web - Temp" : "Web - Temp"}
      between={
        showSearchCard ? (
          <AdminSearchCard
            fields={WEBSITE_SEARCH_FIELDS}
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
                message="You are creating a 'Website Template'"
                messageCenter
                onSave={handleSave}
                onCancel={handleCancel}
              />
            }
          >
            <CompactFormRow className="items-start">
              <CompactField label="Template Name" required className={compactFixedFieldWidth}>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Classic Garage"
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
              <CompactField label="Shop Type" required className="w-[150px] shrink-0 flex-none sm:w-[180px]">
                <select
                  value={shopType}
                  onChange={(e) => setShopType(e.target.value)}
                  className={compactInputClass}
                >
                  {SHOP_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </CompactField>
              <CompactField label="URL" required className="min-w-[200px] flex-1">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/my-template"
                  className={compactInputClass}
                />
              </CompactField>
            </CompactFormRow>
          </CompactFormPanel>
        ) : undefined
      }
    >
      {isDeletedView && (
        <AdminDeletedBanner count={deletedStash.length} entityLabel="website templates" />
      )}
      <div className="mb-2 flex flex-wrap items-center gap-4 border-b border-gray-300 bg-gray-100 px-3 py-2">
        {SHOP_TYPE_OPTIONS.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-xs font-bold text-ad-green-dark">
            <input
              type="checkbox"
              checked={shopTypeFilters[option.value]}
              onChange={() => toggleShopType(option.value)}
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
              onClick={handleDelete}
              disabled={selected.size === 0}
              className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Delete
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRestore}
              disabled={selected.size === 0}
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
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">
                Template Name
              </th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">URL</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Date</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Shop Type</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Used by</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-500">
                  {isDeletedView ? "No deleted templates found." : "No templates found."}
                </td>
              </tr>
            ) : (
              paged.map((row, idx) => (
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
                    {row.templateName || `Template ${pageStartIndex + idx + 1}`}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:underline"
                    >
                      {row.url}
                    </a>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{row.date}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    {SHOP_TYPE_OPTIONS.find((o) => o.value === row.shopType)?.label ?? row.shopType}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{row.usedBy}</td>
                </tr>
              ))
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
