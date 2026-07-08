import { useEffect, useState } from "react";
import AttachImageCheckbox from "../../../components/admin/AttachImageCheckbox";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import ClipImageHover from "../../../components/admin/ClipImageHover";
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
import { printAdminTable } from "../../../utils/adminPrintTable";

// Utility to get backend API endpoint (like in ThoughtOfDay.tsx)
const API_BASE = (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/admin/common` : "/api");

// API helpers
async function fetchEntries(params: { country?: string; type?: string } = {}) {
  const searchParams = new URLSearchParams();
  if (params.country) searchParams.append("country", params.country);
  if (params.type) searchParams.append("type", params.type);
  const res = await fetch(
    `${API_BASE}/privacy-and-disclaimers${searchParams.toString() ? `?${searchParams}` : ""}`,
    { method: "GET" }
  );
  if (!res.ok) throw new Error("Failed to fetch privacy/disclaimer entries");
  return res.json();
}
async function createEntry(data: {
  date: string;
  country: string;
  type: string;
  description: string;
}) {
  const res = await fetch(`${API_BASE}/privacy-and-disclaimers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create entry");
  return res.json();
}
async function updateEntry(id: string, data: Partial<{ description: string }>) {
  const res = await fetch(`${API_BASE}/privacy-and-disclaimers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update entry");
  return res.json();
}
async function deleteEntry(id: string) {
  const res = await fetch(`${API_BASE}/privacy-and-disclaimers/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete entry");
}

const TYPE_BASE_OPTIONS = ["Privacy", "Disclaimer", "Terms of Service"];
const TYPE_OPTIONS = TYPE_BASE_OPTIONS.flatMap((base) => [
  `${base} - Web`,
  `${base} - App`,
]);

// API model type
type PrivacyApiRow = {
  _id: string;
  date: string;
  country: string;
  type: string;
  description: string;
  fileUrl?: string | null;
};

type PrivacyRow = {
  id: string;
  date: string;
  country: string;
  type: string;
  description: string;
  fileUrl?: string | null;
};

type PrivacyPageProps = {
  initialShowForm?: boolean;
};

function mapApiRowToRow(apiRow: PrivacyApiRow): PrivacyRow {
  return {
    id: apiRow._id,
    date: apiRow.date || "",
    country: apiRow.country || "",
    type: (apiRow.type || "").charAt(0).toUpperCase() + (apiRow.type || "").slice(1) + (apiRow.type?.includes("Web") || apiRow.type?.includes("App") ? "" : ""), // fallback string.
    description: apiRow.description,
    fileUrl: apiRow.fileUrl,
  };
}

export default function PrivacyPage({ initialShowForm = false }: PrivacyPageProps) {
  const [entries, setEntries] = useState<PrivacyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showForm, setShowForm] = useState(initialShowForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [country, setCountry] = useState("Canada");
  const [type, setType] = useState(TYPE_OPTIONS[0]);
  const [description, setDescription] = useState("");
  const [attachFile, setAttachFile] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetchEntries().then((raw) => {
      // Accepts response as array [{...}]
      setEntries((raw || []).map(mapApiRowToRow));
      setLoading(false);
    }).catch((e) => {
      adminNotify.error(e.message || "Failed to fetch entries");
      setLoading(false);
    });
  }, [refresh]);

  const filtered = entries.filter(
    (e) =>
      e.date.includes(search) ||
      (e.type ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (e.country ?? "").toLowerCase().includes(search.toLowerCase())
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
    else setSelected(new Set(paged.map((e) => e.id)));
  };

  const resetForm = () => {
    setDate("");
    setCountry("Canada");
    setType(TYPE_OPTIONS[0]);
    setDescription("");
    setAttachFile(false);
    setImageFile(null);
    setEditingId(null);
  };

  const openAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (row: PrivacyRow) => {
    setDate(row.date);
    setCountry(row.country);
    setType(row.type);
    setDescription(row.description);
    setAttachFile(!!row.fileUrl);
    setImageFile(null);
    setEditingId(row.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        // Only updating description for now (UI only supports this for existing entries)
        await updateEntry(editingId, { description });
        adminNotify.success("Updated successfully.");
      } else {
        // Parse type to backend value: e.g. "Privacy - Web" -> "privacy"
        const backendType = type.split(" - ")[0].toLowerCase();
        await createEntry({
          date: date || new Date().toISOString().slice(0, 10),
          country,
          type: backendType,
          description,
        });
        adminNotify.success("Saved successfully.");
      }
      setRefresh((c) => c + 1);
      resetForm();
      setShowForm(false);
    } catch (e: any) {
      adminNotify.error(e.message || "Failed to save");
    }
  };

  const handleDelete = async () => {
    // multi-delete supported by UI
    try {
      for (const id of selected) {
        await deleteEntry(id);
      }
      adminNotify.success("Deleted successfully.");
      setSelected(new Set());
      setRefresh((c) => c + 1);
    } catch (e: any) {
      adminNotify.error(e.message || "Delete failed");
    }
  };

  const handleToolbarPrint = () => {
    printAdminTable({
      title: "Privacy",
      headers: ["Date", "Country", "Type", "Description", "Clip"],
      rows: filtered.map((entry) => [
        entry.date,
        entry.country,
        entry.type,
        entry.description,
        entry.fileUrl ? "Yes" : "—",
      ]),
    });
  };

  return (
    <AdminPage
      title="Privacy and Disclaimer"
      headerAction={!showForm ? <AddNewButton onClick={openAdd} /> : undefined}
      between={
        showForm ? (
          <CompactFormPanel
            footer={
              <CompactFormFooter
                message={
                  editingId != null
                    ? "You are editing a 'Privacy and Disclaimer' entry"
                    : "You are creating a 'Privacy and Disclaimer' entry"
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
              <CompactField label="Type" required className="w-[180px] shrink-0 flex-none sm:w-[220px]">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className={compactInputClass}
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </CompactField>
              <CompactField label="Description" required className="min-w-[200px] flex-1">
                <CompactAutoGrowTextarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description"
                />
              </CompactField>
            </CompactFormRow>
            <CompactFormRow className="items-start justify-start">
              <AttachImageCheckbox
                label="Attach File"
                checked={attachFile}
                onCheckedChange={setAttachFile}
                file={imageFile}
                onFileChange={setImageFile}
                accept="*/*"
                // API doesn't support file upload in provided curl
              />
     
            </CompactFormRow>
          </CompactFormPanel>
        ) : undefined
      }
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={handleDelete}
            disabled={selected.size === 0}
            className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete
          </button>
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
              <th className="border border-ad-purple-dark px-2 py-2 text-center">
                <input
                  type="checkbox"
                  checked={paged.length > 0 && selected.size === paged.length}
                  onChange={toggleSelectAll}
                  className="accent-white"
                />
              </th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Date</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Country</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Type</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Description</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Clip</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-6">
                  Loading...
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6">
                  No entries found.
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
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="text-blue-700 hover:underline"
                    >
                      {row.date ? new Date(row.date).toISOString().slice(0, 10) : ""}
                 
                    </button>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{row.country}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{row.type}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{row.description}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    {row.fileUrl ? (
                      <ClipImageHover
                        imageUrl={row.fileUrl}
                        alt={`Attachment for ${row.type}`}
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
