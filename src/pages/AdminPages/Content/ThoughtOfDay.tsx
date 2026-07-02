import { useState } from "react";
import { FiPaperclip } from "react-icons/fi";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import {
  CompactAutoGrowTextarea,
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactInputClass,
} from "../../../components/admin/ContentPanel";
import { adminNotify } from "../../../utils/adminNotify";
import { printAdminTable } from "../../../utils/adminPrintTable";

type NoteRow = {
  id: number;
  date: string;
  subject: string;
  notes: string;
  country: string;
  imageUrl?: string | null;
  likes: number;
};

const thoughtImageUrl = (id: number) => `https://picsum.photos/seed/thought-${id}/480/320`;

const DUMMY_NOTES: NoteRow[] = [
  { id: 1, date: "2026-06-16", subject: "Super Admin", notes: "705 991 3785", country: "Canada", imageUrl: thoughtImageUrl(1), likes: 18 },
  { id: 2, date: "2026-06-15", subject: "Admin-1", notes: "705 991 3785", country: "Canada", imageUrl: null, likes: 4 },
  { id: 3, date: "2026-06-14", subject: "Business Associates", notes: "705 991 3785", country: "Canada", imageUrl: thoughtImageUrl(3), likes: 11 },
  { id: 4, date: "2026-06-13", subject: "Super Admin", notes: "705 991 3785", country: "Canada", imageUrl: null, likes: 0 },
  { id: 5, date: "2026-06-12", subject: "Admin-1", notes: "705 991 3785", country: "Canada", imageUrl: thoughtImageUrl(5), likes: 7 },
  { id: 6, date: "2026-06-11", subject: "Business Associates", notes: "705 991 3785", country: "Canada", imageUrl: null, likes: 2 },
  { id: 7, date: "2026-06-10", subject: "Super Admin", notes: "705 991 3785", country: "Canada", imageUrl: thoughtImageUrl(7), likes: 21 },
  { id: 8, date: "2026-06-09", subject: "Admin-1", notes: "705 991 3785", country: "Canada", imageUrl: null, likes: 6 },
  { id: 9, date: "2026-06-08", subject: "Business Associates", notes: "705 991 3785", country: "Canada", imageUrl: thoughtImageUrl(9), likes: 13 },
  { id: 10, date: "2026-06-07", subject: "Super Admin", notes: "705 991 3785", country: "Canada", imageUrl: null, likes: 1 },
];

const DEFAULT_NOTE =
  "A goodman is always a best friend and, soonest to be choosen, longer to be retained it in-deed and, never to be parted with.";

type ThoughtOfDayPageProps = {
  initialShowForm?: boolean;
};

export default function ThoughtOfDayPage({ initialShowForm = false }: ThoughtOfDayPageProps) {
  const [notes] = useState(DUMMY_NOTES);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showForm, setShowForm] = useState(initialShowForm);
  const [date, setDate] = useState("2026-06-16");
  const [country, setCountry] = useState("Canada");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState(DEFAULT_NOTE);
  const [attachImage, setAttachImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<{ url: string; title: string } | null>(null);

  const filtered = notes.filter(
    (n) =>
      n.date.includes(search) ||
      n.subject.toLowerCase().includes(search.toLowerCase()) ||
      n.notes.includes(search) ||
      n.country.toLowerCase().includes(search.toLowerCase()) ||
      String(n.likes ?? 0).includes(search)
  );

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
    else setSelected(new Set(paged.map((n) => n.id)));
  };

  const resetForm = () => {
    setDate("2026-06-16");
    setCountry("Canada");
    setTitle("");
    setNote(DEFAULT_NOTE);
    setAttachImage(false);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleSave = () => {
    adminNotify.success("Saved successfully.");
    resetForm();
    setShowForm(false);
  };

  const handleToolbarPrint = () => {
    printAdminTable({
      title: "Today's Tip",
      headers: ["Date", "Country", "Subject", "Notes", "Likes", "Image"],
      rows: notes
        .filter((note) => selected.has(note.id))
        .map((note) => [
          note.date,
          note.country,
          note.subject,
          note.notes,
          String(note.likes ?? 0),
          note.imageUrl ? "Yes" : "—",
        ]),
    });
  };

  return (
    <AdminPage
      title="Today's Tip"
      headerAction={!showForm ? <AddNewButton onClick={() => setShowForm(true)} /> : undefined}
      between={
        showForm ? (
          <CompactFormPanel
            footer={
              <CompactFormFooter
                message="You are creating a 'Thought of the Day'"
                messageCenter
                onSave={handleSave}
                onCancel={handleCancel}
              />
            }
          >
            <CompactFormRow className="items-start">
              <CompactField label="Date" required>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={compactInputClass}
                />
              </CompactField>
              <CompactField label="Country" required>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={compactInputClass}
                >
                  <option value="Canada">Canada</option>
                  <option value="USA">USA</option>
                </select>
              </CompactField>
              <CompactField label="Title" required>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={compactInputClass}
                />
              </CompactField>
              <CompactField label="Note" required>
                <CompactAutoGrowTextarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </CompactField>
            </CompactFormRow>
            <CompactFormRow className="justify-start">
              <div className="flex flex-col items-start gap-1.5">
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-ad-green-dark">
                  <input
                    type="checkbox"
                    checked={attachImage}
                    onChange={(e) => setAttachImage(e.target.checked)}
                    className="h-3.5 w-3.5 accent-ad-green"
                  />
                  Attach Image of Receipt
                </label>
                {attachImage ? (
                  <label className="inline-block cursor-pointer rounded border border-gray-400 bg-gray-200 px-3 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-300">
                    Upload File
                    <input type="file" accept="image/*" className="hidden" />
                  </label>
                ) : null}
              </div>
            </CompactFormRow>
          </CompactFormPanel>
        ) : undefined
      }
    >
      {/* Toolbar */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
        <div className="flex flex-wrap gap-1">
          <button type="button" disabled={selected.size === 0} className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
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

      {/* Table */}
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
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Country</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Subject</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Notes</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Likes</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Image</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((row, idx) => (
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
                    onClick={() => setShowForm(true)}
                    className="text-blue-700 hover:underline"
                  >
                    {row.date}
                  </button>
                </td>
                <td className="border border-gray-300 px-3 py-2">{row.country}</td>
                <td className="border border-gray-300 px-3 py-2">{row.subject}</td>
                <td className="border border-gray-300 px-3 py-2">{row.notes}</td>
                <td className="border border-gray-300 px-3 py-2 text-center">{row.likes ?? 0}</td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {row.imageUrl ? (
                    <button
                      type="button"
                      onClick={() =>
                        setImagePreview({
                          url: row.imageUrl!,
                          title: `${row.subject} — image`,
                        })
                      }
                      className="inline-flex items-center justify-center rounded p-1 text-ad-purple hover:bg-ad-purple/10 hover:text-ad-purple-dark"
                      aria-label={`View image for ${row.subject}`}
                      title="View image"
                    >
                      <FiPaperclip className="size-5" aria-hidden />
                    </button>
                  ) : (
                    <span className="text-gray-500">--</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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

      {imagePreview && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setImagePreview(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[min(90vw,480px)] rounded border border-gray-300 bg-white p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setImagePreview(null)}
              className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gray-700 text-sm text-white hover:bg-gray-900"
              aria-label="Close"
            >
              ×
            </button>
            <p className="mb-3 text-center text-sm font-semibold text-ad-green-dark">{imagePreview.title}</p>
            <img
              src={imagePreview.url}
              alt={imagePreview.title}
              className="mx-auto max-h-[70vh] max-w-full object-contain"
            />
          </div>
        </div>
      )}
    </AdminPage>
  );
}
