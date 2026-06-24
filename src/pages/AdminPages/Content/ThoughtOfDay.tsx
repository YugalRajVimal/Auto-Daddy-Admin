import { useState } from "react";
import { Link } from "react-router";
import { FiRefreshCw } from "react-icons/fi";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import {
  CompactAutoGrowTextarea,
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactInputClass,
} from "../../../components/admin/ContentPanel";

type ThoughtRow = {
  id: number;
  date: string;
  title: string;
  text: string;
  country: string;
  hasClip: boolean;
};

const DUMMY_THOUGHTS: ThoughtRow[] = [
  {
    id: 1,
    date: "2026-06-16",
    title: "Monday Motivation",
    text: "Push yourself, because no one else is going to do it for you.",
    country: "Canada",
    hasClip: true,
  },
  {
    id: 2,
    date: "2026-06-15",
    title: "Drive Safe",
    text: "A smooth road never made a skilled driver.",
    country: "Canada",
    hasClip: false,
  },
  {
    id: 3,
    date: "2026-06-14",
    title: "Daily Wisdom",
    text: "Start each day with a positive thought.",
    country: "Canada",
    hasClip: true,
  },
  {
    id: 4,
    date: "2026-06-13",
    title: "Care for Your Car",
    text: "Routine maintenance today saves costly repairs tomorrow.",
    country: "Canada",
    hasClip: false,
  },
  {
    id: 5,
    date: "2026-06-12",
    title: "Stay Prepared",
    text: "The best time to check your tires was yesterday. The second best time is now.",
    country: "Canada",
    hasClip: true,
  },
  {
    id: 6,
    date: "2026-06-11",
    title: "Road Ahead",
    text: "Focus on the journey, not just the destination.",
    country: "USA",
    hasClip: false,
  },
  {
    id: 7,
    date: "2026-06-10",
    title: "Small Steps",
    text: "Great things are done by a series of small things brought together.",
    country: "USA",
    hasClip: true,
  },
  {
    id: 8,
    date: "2026-06-09",
    title: "Keep Moving",
    text: "Do not wait for the perfect moment. Take the moment and make it perfect.",
    country: "USA",
    hasClip: false,
  },
  {
    id: 9,
    date: "2026-06-08",
    title: "Trust the Process",
    text: "Every expert was once a beginner.",
    country: "Canada",
    hasClip: true,
  },
  {
    id: 10,
    date: "2026-06-07",
    title: "Weekend Reflection",
    text: "A good friend is always a best friend — soonest chosen, longest retained, never parted with.",
    country: "Canada",
    hasClip: false,
  },
];

const DEFAULT_TEXT =
  "A good friend is always a best friend — soonest chosen, longest retained, never parted with.";

type ThoughtOfDayPageProps = {
  initialShowForm?: boolean;
};

export default function ThoughtOfDayPage({ initialShowForm = false }: ThoughtOfDayPageProps) {
  const [thoughts] = useState(DUMMY_THOUGHTS);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showForm, setShowForm] = useState(initialShowForm);
  const [date, setDate] = useState("2026-06-16");
  const [country, setCountry] = useState("Canada");
  const [title, setTitle] = useState("");
  const [text, setText] = useState(DEFAULT_TEXT);
  const [attachImage, setAttachImage] = useState(false);

  const filtered = thoughts.filter(
    (row) =>
      row.date.includes(search) ||
      row.title.toLowerCase().includes(search.toLowerCase()) ||
      row.text.toLowerCase().includes(search.toLowerCase()) ||
      row.country.toLowerCase().includes(search.toLowerCase())
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
    else setSelected(new Set(paged.map((row) => row.id)));
  };

  const resetForm = () => {
    setDate("2026-06-16");
    setCountry("Canada");
    setTitle("");
    setText(DEFAULT_TEXT);
    setAttachImage(false);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleSave = () => {
    resetForm();
    setShowForm(false);
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
              <CompactField label="Text" required>
                <CompactAutoGrowTextarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Quote shown as Thought of the Day on home screens"
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
                  Attach Image
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
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Title</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Text</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Clip</th>
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
                <td className="border border-gray-300 px-3 py-2">{row.title}</td>
                <td className="max-w-md border border-gray-300 px-3 py-2 italic text-gray-700">{row.text}</td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {row.hasClip ? (
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
              className={`h-7 w-7 border text-xs font-medium ${page === p
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
    </AdminPage>
  );
}
