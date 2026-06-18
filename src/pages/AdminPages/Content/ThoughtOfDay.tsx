import { useState } from "react";
import { Link } from "react-router";
import { FiRefreshCw } from "react-icons/fi";

type NoteRow = {
  id: number;
  date: string;
  subject: string;
  notes: string;
  country: string;
  hasClip: boolean;
};

const DUMMY_NOTES: NoteRow[] = [
  { id: 1, date: "2026-06-16", subject: "Super Admin", notes: "705 991 3785", country: "Canada", hasClip: true },
  { id: 2, date: "2026-06-15", subject: "Admin-1", notes: "705 991 3785", country: "Canada", hasClip: false },
  { id: 3, date: "2026-06-14", subject: "Business Associates", notes: "705 991 3785", country: "Canada", hasClip: true },
  { id: 4, date: "2026-06-13", subject: "Super Admin", notes: "705 991 3785", country: "Canada", hasClip: false },
  { id: 5, date: "2026-06-12", subject: "Admin-1", notes: "705 991 3785", country: "Canada", hasClip: true },
  { id: 6, date: "2026-06-11", subject: "Business Associates", notes: "705 991 3785", country: "Canada", hasClip: false },
  { id: 7, date: "2026-06-10", subject: "Super Admin", notes: "705 991 3785", country: "Canada", hasClip: true },
  { id: 8, date: "2026-06-09", subject: "Admin-1", notes: "705 991 3785", country: "Canada", hasClip: false },
  { id: 9, date: "2026-06-08", subject: "Business Associates", notes: "705 991 3785", country: "Canada", hasClip: true },
  { id: 10, date: "2026-06-07", subject: "Super Admin", notes: "705 991 3785", country: "Canada", hasClip: false },
];

export default function ThoughtOfDayPage() {
  const [notes] = useState(DUMMY_NOTES);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const filtered = notes.filter(
    (n) =>
      n.date.includes(search) ||
      n.subject.toLowerCase().includes(search.toLowerCase()) ||
      n.notes.includes(search) ||
      n.country.toLowerCase().includes(search.toLowerCase())
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

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-white py-4 md:py-5">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-gray-500 md:text-3xl">Today&apos;s Tip</h1>
        <Link
          to="/admin/thought-of-day/new"
          className="rounded bg-ad-green px-4 py-2 text-sm font-bold text-white hover:bg-ad-green-dark"
        >
          New Note
        </Link>
      </div>

      {/* Toolbar */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
        <div className="flex flex-wrap gap-1">
          <button type="button" className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700">
            Update
          </button>
          <button type="button" className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700">
            Shoot
          </button>
          <button type="button" className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700">
            Delete
          </button>
          <button type="button" className="bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark">
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
            className="border border-gray-400 px-2 py-1 text-xs"
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
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Subject</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Notes</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Country</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Clip</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((note, idx) => (
              <tr key={note.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                <td className="border border-gray-300 px-2 py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(note.id)}
                    onChange={() => toggleSelect(note.id)}
                    className="accent-ad-purple"
                  />
                </td>
                <td className="border border-gray-300 px-3 py-2">
                  <Link to={`/admin/thought-of-day/new`} className="text-blue-700 hover:underline">
                    {note.date}
                  </Link>
                </td>
                <td className="border border-gray-300 px-3 py-2">{note.subject}</td>
                <td className="border border-gray-300 px-3 py-2">{note.notes}</td>
                <td className="border border-gray-300 px-3 py-2">{note.country}</td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {note.hasClip ? (
                    <FiRefreshCw className="inline text-ad-green" size={16} />
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
        <Link to="#" className="text-sm text-blue-700 hover:underline">
          Deleted
        </Link>
      </div>
    </div>
  );
}
