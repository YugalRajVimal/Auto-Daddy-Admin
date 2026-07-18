import { useEffect, useState, useCallback } from "react";
import AttachImageCheckbox from "../../../components/admin/AttachImageCheckbox";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import { TableEntriesSummary } from "../../../components/admin/AdminDataTable";
import { AdminDeletedBanner, AdminDeletedToggle } from "../../../components/admin/AdminDeletedView";
import ClipImageHover from "../../../components/admin/ClipImageHover";
import { useAdminDeletedView } from "../../../hooks/useAdminDeletedView";
import {
  CompactAutoGrowTextarea,
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactFixedFieldWidth,
  compactInputClass,
} from "../../../components/admin/ContentPanel";
import AdminSearchCard, {
  emptyAdminSearchValues,
  searchIncludes,
  type AdminSearchField,
} from "../../../components/admin/AdminSearchCard";
import { adminNotify } from "../../../utils/adminNotify";
import { printAdminTable } from "../../../utils/adminPrintTable";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Utility to get backend API endpoint
const API_BASE = (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/admin/common` : "/api");

const THOUGHT_SEARCH_FIELDS: AdminSearchField[] = [
  { key: "date", label: "Date", type: "date" },
  { key: "subject", label: "Subject" },
  { key: "notes", label: "Notes" },
];

// NoteRow type remains the same
type NoteRow = {
  id?: number;
  _id?: string;
  date: string;
  subject: string;
  notes: string;
  image?: string | null;
  imageUrl?: string | null;
  likes: number;
};

type ThoughtOfDayPageProps = {
  initialShowForm?: boolean;
};

function sortNotes(notes: NoteRow[]) {
  return [...notes].sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    if (a.id && b.id) return b.id - a.id;
    return 0;
  });
}

function isTodayOrFuture(date: Date) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const comp = new Date(date);
  comp.setHours(0, 0, 0, 0);
  return comp >= now;
}

export default function ThoughtOfDayPage({ initialShowForm = false }: ThoughtOfDayPageProps) {
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [showSearchCard, setShowSearchCard] = useState(false);
  const [searchDraft, setSearchDraft] = useState(() => emptyAdminSearchValues(THOUGHT_SEARCH_FIELDS));
  const [searchFilters, setSearchFilters] = useState(() => emptyAdminSearchValues(THOUGHT_SEARCH_FIELDS));
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showForm, setShowForm] = useState(initialShowForm);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  // Use Date objects for react-datepicker
  const [date, setDate] = useState<Date | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [attachImage, setAttachImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // --- Trash/deleted view (in-memory only) ---
  const resetTableControls = () => {
    setPage(1);
    setSelected(new Set());
    setSearch("");
    const empty = emptyAdminSearchValues(THOUGHT_SEARCH_FIELDS);
    setSearchDraft(empty);
    setSearchFilters(empty);
    setShowSearchCard(false);
  };

  const { viewMode, isDeletedView, toggleViewMode, deletedStash, stashDeleted, restoreStashed } =
    useAdminDeletedView<NoteRow>({
      onToggle: resetTableControls,
      storageKey: "admin_deleted_view:thought-of-day",
    });

  const displayNotes = isDeletedView ? deletedStash : notes;

  // --------- API Filter Query Construction ---------
  const getApiQuery = useCallback(() => {
    const params: Record<string, string> = {};
    // Main filters for API support: date (if exact), subject, notes
    if (searchFilters.date) params.date = searchFilters.date;
    params.country = "Canada";
    if (searchFilters.subject) params.subject = searchFilters.subject;
    if (searchFilters.notes) params.notes = searchFilters.notes;
    // Support for top-bar "live" search (free text)
    if (search.trim()) {
      params.search = search.trim();
    }
    return new URLSearchParams(params).toString();
  }, [searchFilters, search]);

  // ------------ Data Fetching w/ API Filters -------------
  const fetchNotes = useCallback(() => {
    if (isDeletedView) return;
    const query = getApiQuery();
    const url = `${API_BASE}/thought-of-the-day${query ? `?${query}` : ""}`;
    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error(`Failed to fetch: ${r.statusText}`);
        const data = await r.json();
        const arrayData: NoteRow[] = Array.isArray(data) ? data : [data];
        setNotes(
          arrayData.map((item) => ({
            id: item.id ?? undefined,
            _id: item._id ?? undefined,
            date: item.date,
            subject: item.subject,
            notes: item.notes,
            likes: item.likes ?? 0,
            imageUrl: item.imageUrl || item.image || null,
            image: item.image ?? undefined,
          }))
        );
      })
      .catch(() => setNotes([]));
    // eslint-disable-next-line
  }, [getApiQuery, isDeletedView]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Utility to get key string for any row (string id: _id or id)
  const getRowKey = (row: NoteRow) => (row._id ? String(row._id) : String(row.id ?? ""));

  const findNoteByKey = (key: string) => notes.find((n) => getRowKey(n) === key);

  // --- Filtering logic: only for deleted view, active mode handled by API ---
  const filtered = isDeletedView
    ? displayNotes.filter((n) => {
        const live =
          !search.trim() ||
          n.date.includes(search) ||
          n.subject.toLowerCase().includes(search.toLowerCase()) ||
          (n.notes ?? "").toLowerCase().includes(search.toLowerCase()) ||
          String(n.likes ?? 0).includes(search);
        if (!live) return false;
        const dateStr = n.date ? String(n.date).slice(0, 10) : "";
        return (
          searchIncludes(dateStr, searchFilters.date) &&
          searchIncludes(n.subject, searchFilters.subject) &&
          searchIncludes(n.notes, searchFilters.notes)
        );
      })
    : displayNotes;

  const totalPages = Math.max(1, Math.ceil(filtered.length / entriesPerPage));
  const paged = filtered.slice((page - 1) * entriesPerPage, page * entriesPerPage);

  const toggleSelect = (row: NoteRow) => {
    const key = getRowKey(row);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === paged.length) setSelected(new Set());
    else setSelected(new Set(paged.map((n) => getRowKey(n))));
  };

  const resetForm = () => {
    setDate(new Date());
    setDateError(null);
    setTitle("");
    setNote("");
    setAttachImage(false);
    setImageFile(null);
    setEditingKey(null);
    setPreviewImageUrl(null);
  };

  const openAdd = () => {
    resetForm();
    setShowSearchCard(false);
    setShowForm(true);
  };

  const openEdit = (row: NoteRow) => {
    setDate(row.date ? new Date(row.date) : null);
    setDateError(null);
    setTitle(row.subject);
    setNote(row.notes);
    setAttachImage(Boolean(row.imageUrl));
    setImageFile(null);
    setEditingKey(getRowKey(row));
    setShowSearchCard(false);
    setShowForm(true);
    setPreviewImageUrl(typeof row.imageUrl === "string" ? row.imageUrl : null);
  };

  const openSearchCard = () => {
    setShowForm(false);
    setEditingKey(null);
    setSearchDraft({ ...searchFilters });
    setShowSearchCard((open) => !open);
  };

  // --- Search Card and top-bar "search" actions ---
  const handleSearchCardSearch = () => {
    setSearchFilters({ ...searchDraft });
    setPage(1);
    setSelected(new Set());
  };

  const handleSearchCardReset = () => {
    const empty = emptyAdminSearchValues(THOUGHT_SEARCH_FIELDS);
    setSearchDraft(empty);
    setSearchFilters(empty);
    setPage(1);
    setSelected(new Set());
  };

  // Top-bar search (live search)
  const handleQuickSearch = (val: string) => {
    setSearch(val);
    setPage(1);
    setSelected(new Set());
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  // ----- ADD & EDIT (no filtering here) -----
  const handleSave = async () => {
    setDateError(null);
    if (!date) {
      setDateError("Please select a date.");
      return;
    }
    if (!isTodayOrFuture(date)) {
      setDateError("Date must be today or in the future.");
      return;
    }

    const formData = new FormData();
    formData.append("date", date.toISOString().slice(0, 10));
    formData.append("country", "Canada");
    formData.append("subject", title);
    if (note) formData.append("notes", note);
    const existingLikes =
      editingKey != null ? findNoteByKey(editingKey)?.likes ?? 0 : 0;
    formData.append("likes", String(existingLikes));
    if (editingKey == null) {
      if (attachImage && imageFile) {
        formData.append("thoughtImage", imageFile);
      }
    } else {
      if (attachImage && imageFile) {
        formData.append("thoughtImage", imageFile);
      }
    }

    try {
      let resp: Response;
      if (editingKey == null) {
        resp = await fetch(`${API_BASE}/thought-of-the-day`, {
          method: "POST",
          body: formData,
        });
      } else {
        resp = await fetch(`${API_BASE}/thought-of-the-day/${editingKey}`, {
          method: "PUT",
          body: formData,
        });
      }
      if (!resp.ok) throw new Error("Failed to save");

      adminNotify.success(editingKey == null ? "Saved successfully." : "Updated successfully.");
      fetchNotes();
    } catch (e: any) {
      adminNotify.error("Save failed");
    }
    resetForm();
    setShowForm(false);
  };

  // ----- DELETE (single and multi, but confirm all at once for multi) -----
  const handleDelete = async (row: NoteRow, skipConfirm = false) => {
    if (!skipConfirm && !window.confirm(`Delete thought for "${row.subject}"?`)) return;
    try {
      const key = getRowKey(row);
      const resp = await fetch(`${API_BASE}/thought-of-the-day/${key}`, {
        method: "DELETE",
      });
      if (!resp.ok) throw new Error();
      setNotes((prev) => prev.filter((n) => getRowKey(n) !== key));
      stashDeleted(row);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      adminNotify.success("Thought deleted successfully.");
      fetchNotes();
    } catch {
      adminNotify.error("Delete failed");
    }
  };

  // Modified: one confirmation for all selected
  const handleToolbarDelete = async () => {
    if (selected.size === 0) return;
    const keys = [...selected];
    // Build a string describing what will be deleted, e.g. dates
    const toDelete = keys
      .map(k => {
        const row = findNoteByKey(k);
        return row ? `"${row.subject}"` : "";
      })
      .filter(Boolean)
      .join(", ");

    const message =
      selected.size === 1
        ? `Delete thought for ${toDelete}?`
        : `Delete ${selected.size} thoughts (${toDelete})?`;

    if (!window.confirm(message)) return;

    for (const key of keys) {
      const row = findNoteByKey(key);
      if (row) {
        // eslint-disable-next-line no-await-in-loop
        await handleDelete(row, true);
      }
    }
    fetchNotes();
  };

  // For restore: unchanged, as bulk restore is not mentioned in prompt.
  const handleRestore = () => {
    if (selected.size !== 1) return;
    const key = [...selected][0];
    const row = deletedStash.find((n) => getRowKey(n) === key);
    if (!row) return;
    if (!window.confirm(`Restore thought for "${row.date}"?`)) return;
    restoreStashed((item) => getRowKey(item) === key);
    setNotes((prev) => sortNotes([...prev, row]));
    setSelected(new Set());
    adminNotify.success("Thought restored successfully.");
  };

  const handleToolbarPrint = () => {
    printAdminTable({
      title: isDeletedView ? "Deleted Today's Tips" : "Today's Tip",
      headers: ["Date", "Subject", "Notes", "Likes", "Image"],
      rows: filtered.map((noteRow) => [
        noteRow.date,
        noteRow.subject,
        noteRow.notes,
        String(noteRow.likes ?? 0),
        noteRow.imageUrl ? "Yes" : "—",
      ]),
    });
  };

  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <AdminPage
      title={isDeletedView ? "Deleted Today's Tips" : "Today's Tip"}
      headerAction={
        !showForm && !showSearchCard && !isDeletedView ? <AddNewButton onClick={openAdd} /> : undefined
      }
      between={
        showSearchCard ? (
          <AdminSearchCard
            fields={THOUGHT_SEARCH_FIELDS}
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
                  editingKey != null
                    ? "You are editing a 'Thought of the Day'"
                    : "You are creating a 'Thought of the Day'"
                }
                messageCenter
                actionLabel={editingKey != null ? "Update" : "Save"}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            }
          >
            <CompactFormRow className="items-start">
              <CompactField label="Date" required className={compactFixedFieldWidth}>
                <DatePicker
                  selected={date}
                  onChange={(val: Date | null) => {
                    setDate(val);
                    setDateError(null);
                  }}
                  minDate={new Date()}
                  dateFormat="yyyy-MM-dd"
                  className={compactInputClass}
                  placeholderText="Select date"
                  showPopperArrow={false}
                  isClearable
                />
                {dateError && (
                  <span className="text-xs text-red-600 block mt-1">{dateError}</span>
                )}
              </CompactField>
              <CompactField label="Subject" required className={compactFixedFieldWidth}>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={compactInputClass}
                  required
                />
              </CompactField>
              <CompactField label="Note" className="min-w-0 flex-1">
                <CompactAutoGrowTextarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </CompactField>
            </CompactFormRow>
            <CompactFormRow className="items-start justify-start gap-4">
              <AttachImageCheckbox
                label="Attach Image"
                checked={attachImage}
                onCheckedChange={setAttachImage}
                file={imageFile}
                onFileChange={(file) => {
                  setImageFile(file);
                  if (file) {
                    const url = URL.createObjectURL(file);
                    setPreviewImageUrl(url);
                  } else {
                    setPreviewImageUrl(null);
                  }
                }}
              />
              {(previewImageUrl) && (
                <div className="flex flex-col items-start">
                  <button
                    type="button"
                    className="text-xs text-blue-700 underline hover:text-blue-900 p-0 rounded-none"
                    onClick={() => setPreviewOpen(true)}
                  >
                    Preview Image
                  </button>
                  <img
                    src={
                      previewImageUrl.startsWith("http") ||
                      previewImageUrl.startsWith("/")
                        ? previewImageUrl
                        : `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + '/' : '/'}${previewImageUrl.replace(/^\/+/, '')}`
                    }
                    alt="Preview"
                    style={{ maxWidth: 80, maxHeight: 60, marginTop: 4, borderRadius: 4 }}
                  />
                </div>
              )}
            </CompactFormRow>

            {previewOpen && previewImageUrl && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
                onClick={() => setPreviewOpen(false)}
              >
                <div
                  className="bg-white p-4 rounded shadow-lg"
                  style={{ maxWidth: 500 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={
                      previewImageUrl.startsWith("http") ||
                      previewImageUrl.startsWith("/")
                        ? previewImageUrl
                        : `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + '/' : '/'}${previewImageUrl.replace(/^\/+/, '')}`
                    }
                    alt="Preview"
                    style={{ maxWidth: "100%", maxHeight: 400, borderRadius: 10, display: "block", margin: "0 auto" }}
                  />
                  <button
                    type="button"
                    className="mt-2 px-3 py-1 rounded bg-gray-300 hover:bg-gray-400 text-gray-700 text-xs"
                    onClick={() => setPreviewOpen(false)}
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            )}
          </CompactFormPanel>
        ) : undefined
      }
    >
      {isDeletedView && (
        <AdminDeletedBanner count={deletedStash.length} entityLabel="thoughts" />
      )}

      {/* Filter/Toolbar */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {!isDeletedView ? (
            <button
              type="button"
              onClick={handleToolbarDelete}
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
            onChange={(e) => handleQuickSearch(e.target.value)}
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
          onChange={e => {
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

      {/* Table */}
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
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium" style={{ width: "26%" }}>Subject</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium" style={{ width: "36%" }}>Notes</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Likes</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Image</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={6} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                  {isDeletedView ? "No deleted thoughts found." : "No thoughts found."}
                </td>
              </tr>
            ) : paged.map((row, idx) => (
              <tr
                key={getRowKey(row)}
                className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}
              >
                <td className="border border-gray-300 px-2 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={selected.has(getRowKey(row))}
                    onChange={() => toggleSelect(row)}
                    className="accent-ad-purple"
                  />
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => openEdit(row)}
                    className="text-blue-700 hover:underline"
                  >
                    {new Date(row.date).toISOString().slice(0, 10)}
                  </button>
                </td>
                <td className="border border-gray-300 px-3 py-2 text-left align-top whitespace-normal break-words min-w-[200px]" style={{ width: "26%" }}>{row.subject}</td>
                <td className="border border-gray-300 px-3 py-2 text-left align-top whitespace-normal break-words min-w-[240px]" style={{ width: "36%" }}>{row.notes}</td>
                <td className="border border-gray-300 px-3 py-2 text-center">{row.likes ?? 0}</td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {(row.imageUrl || row.image) ? (
                    <div className="flex flex-col items-center gap-1">
                      <ClipImageHover
                        imageUrl={
                          ((): string => {
                            if (row.imageUrl && (row.imageUrl.startsWith("http") || row.imageUrl.startsWith("/"))) {
                              return row.imageUrl;
                            } else if (row.imageUrl) {
                              return `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + '/' : '/'}${row.imageUrl.replace(/^\/+/, '')}`;
                            } else if (row.image && !(row.image.startsWith("http") || row.image.startsWith("/"))) {
                              return `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + '/' : '/'}${row.image.replace(/^\/+/, '')}`;
                            } else if (row.image) {
                              return row.image;
                            }
                            return "";
                          })()
                        }
                        alt={`Image for ${row.subject}`}
                        size={20}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewImageUrl(row.imageUrl || row.image || null);
                          setPreviewOpen(true);
                        }}
                        className="text-xs text-blue-700 underline hover:text-blue-900 p-0 rounded-none"
                        style={{margin:0, padding:0, border:'none', background:'none'}}
                      >
                        Preview
                      </button>
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

      {/* Global Preview Modal for Table (reuse previewImageUrl, previewOpen state) */}
      {previewOpen && previewImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="bg-white p-4 rounded shadow-lg"
            style={{ maxWidth: 500 }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={
                previewImageUrl.startsWith("http") ||
                previewImageUrl.startsWith("/")
                  ? previewImageUrl
                  : `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + '/' : '/'}${previewImageUrl.replace(/^\/+/, '')}`
              }
              alt="Preview"
              style={{ maxWidth: "100%", maxHeight: 400, borderRadius: 10, display: "block", margin: "0 auto" }}
            />
            <button
              type="button"
              className="mt-2 px-3 py-1 rounded bg-gray-300 hover:bg-gray-400 text-gray-700 text-xs"
              onClick={() => setPreviewOpen(false)}
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* Pagination */}
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
          activeLabel="Active Tips"
        />
      </div>
    </AdminPage>
  );
}
