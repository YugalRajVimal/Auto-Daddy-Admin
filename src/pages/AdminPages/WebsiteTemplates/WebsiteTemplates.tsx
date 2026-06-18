import { useState } from "react";
import { Link } from "react-router";
import { FiRefreshCw } from "react-icons/fi";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactFixedFieldWidth,
  compactInputClass,
} from "../../../components/admin/ContentPanel";

const CATEGORIES = ["Mechanics", "Washing", "Tire Master", "Tow Truck"];

type TemplateRow = {
  id: number;
  date: string;
  subject: string;
  notes: string;
  country: string;
  hasClip: boolean;
};

const DUMMY_SITES: TemplateRow[] = [
  { id: 1, date: "2026-06-16", subject: "Mechanics", notes: "Mechanic1.autodaddy.ca", country: "Canada", hasClip: true },
  { id: 2, date: "2026-06-15", subject: "Mechanics", notes: "Mechanic2.autodaddy.ca", country: "Canada", hasClip: false },
  { id: 3, date: "2026-06-14", subject: "Washing", notes: "Wash1.autodaddy.ca", country: "Canada", hasClip: true },
  { id: 4, date: "2026-06-13", subject: "Tire Master", notes: "Tire1.autodaddy.ca", country: "USA", hasClip: false },
  { id: 5, date: "2026-06-12", subject: "Tow Truck", notes: "Tow1.autodaddy.ca", country: "Canada", hasClip: true },
];

type WebsiteTemplatesProps = {
  initialShowForm?: boolean;
};

export default function WebsiteTemplates({ initialShowForm = false }: WebsiteTemplatesProps) {
  const [sites] = useState(DUMMY_SITES);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showForm, setShowForm] = useState(initialShowForm);
  const [date, setDate] = useState("2026-06-16");
  const [country, setCountry] = useState("Canada");
  const [category, setCategory] = useState("Mechanics");
  const [url, setUrl] = useState("");
  const [categories, setCategories] = useState<Record<string, boolean>>({
    Mechanics: true,
    Washing: false,
    "Tire Master": false,
    "Tow Truck": false,
  });
  const [attachImage, setAttachImage] = useState(false);

  const filtered = sites.filter(
    (s) =>
      (categories[s.subject] ?? true) &&
      (s.date.includes(search) ||
        s.subject.toLowerCase().includes(search.toLowerCase()) ||
        s.notes.toLowerCase().includes(search.toLowerCase()) ||
        s.country.toLowerCase().includes(search.toLowerCase()))
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
    else setSelected(new Set(paged.map((s) => s.id)));
  };

  const toggleCategory = (cat: string) => {
    setCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
    setPage(1);
  };

  const resetForm = () => {
    setDate("2026-06-16");
    setCountry("Canada");
    setCategory("Mechanics");
    setUrl("");
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
      title="Web - Temp"
      headerAction={!showForm ? <AddNewButton label="New Template" onClick={() => setShowForm(true)} /> : undefined}
      between={
        showForm ? (
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
                </select>
              </CompactField>
              <CompactField label="Category" required className="w-[150px] shrink-0 flex-none sm:w-[180px]">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={compactInputClass}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </CompactField>
              <CompactField label="URL" required className="min-w-[200px] flex-1">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="example.autodaddy.ca"
                  className={compactInputClass}
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
      <div className="mb-2 flex flex-wrap items-center gap-4 border-b border-gray-300 bg-gray-100 px-3 py-2">
        {CATEGORIES.map((cat) => (
          <label key={cat} className="flex items-center gap-2 text-xs font-bold text-ad-green-dark">
            <input
              type="checkbox"
              checked={categories[cat]}
              onChange={() => toggleCategory(cat)}
              className="h-3.5 w-3.5 accent-ad-green"
            />
            {cat}
          </label>
        ))}
      </div>

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
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Category</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">URL</th>
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
                <td className="border border-gray-300 px-3 py-2">{row.subject}</td>
                <td className="border border-gray-300 px-3 py-2">
                  <a
                    href={`https://${row.notes}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 hover:underline"
                  >
                    {row.notes}
                  </a>
                </td>
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
