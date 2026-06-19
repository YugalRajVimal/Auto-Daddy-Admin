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
  compactFixedFieldWidth,
  compactInputClass,
} from "../../../components/admin/ContentPanel";

const USER_OPTIONS = [
  { value: "car-owner", label: "Car Owner" },
  { value: "mechanic", label: "Mechanic" },
  { value: "shop-owner", label: "Shop Owner" },
  { value: "associate", label: "Associate" },
  { value: "dealer", label: "Dealer" },
];

type FaqRow = {
  id: number;
  date: string;
  subject: string;
  notes: string;
  user: string;
  hasClip: boolean;
};

const DUMMY_FAQS: FaqRow[] = [
  { id: 1, date: "2026-06-16", subject: "How do I book a service?", notes: "Use the app to select a shop and time.", user: "car-owner", hasClip: false },
  { id: 2, date: "2026-06-15", subject: "What payment methods are accepted?", notes: "Credit card, debit, and wallet.", user: "car-owner", hasClip: true },
  { id: 3, date: "2026-06-14", subject: "Can I cancel an appointment?", notes: "Yes, up to 24 hours before.", user: "shop-owner", hasClip: false },
  { id: 4, date: "2026-06-13", subject: "How do mechanics join?", notes: "Complete the vendor onboarding form.", user: "mechanic", hasClip: true },
];

const DEFAULT_ANSWER = "Answer";

type FAQsPageProps = {
  initialShowForm?: boolean;
};

export default function FAQsPage({ initialShowForm = false }: FAQsPageProps) {
  const [faqs] = useState(DUMMY_FAQS);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showForm, setShowForm] = useState(initialShowForm);
  const [date, setDate] = useState("2026-06-16");
  const [user, setUser] = useState("car-owner");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(DEFAULT_ANSWER);

  const filtered = faqs.filter(
    (f) =>
      f.date.includes(search) ||
      f.subject.toLowerCase().includes(search.toLowerCase()) ||
      f.notes.toLowerCase().includes(search.toLowerCase()) ||
      (USER_OPTIONS.find((o) => o.value === f.user)?.label ?? f.user)
        .toLowerCase()
        .includes(search.toLowerCase())
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
    else setSelected(new Set(paged.map((f) => f.id)));
  };

  const resetForm = () => {
    setDate("2026-06-16");
    setUser("car-owner");
    setQuestion("");
    setAnswer(DEFAULT_ANSWER);
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
      title="FAQ Management"
      headerAction={!showForm ? <AddNewButton onClick={() => setShowForm(true)} /> : undefined}
      between={
        showForm ? (
          <CompactFormPanel
            footer={
              <CompactFormFooter
                message="You are creating an 'FAQ'"
                messageCenter
                onSave={handleSave}
                onCancel={handleCancel}
              />
            }
          >
            <CompactFormRow className="items-start">
              <CompactField label="User" required className={compactFixedFieldWidth}>
                <select
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  className={compactInputClass}
                >
                  {USER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </CompactField>
              <CompactField label="Date" required className={compactFixedFieldWidth}>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={compactInputClass}
                />
              </CompactField>
              <CompactField label="Question" required className="min-w-[200px] flex-1">
                <CompactAutoGrowTextarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Question ?"
                />
              </CompactField>
              <CompactField label="Answer" required className="min-w-[200px] flex-1">
                <CompactAutoGrowTextarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                />
              </CompactField>
            </CompactFormRow>
          </CompactFormPanel>
        ) : undefined
      }
    >
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
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">User</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Date</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Question</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Answer</th>
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
                    {USER_OPTIONS.find((o) => o.value === row.user)?.label ?? row.user}
                  </button>
                </td>
                <td className="border border-gray-300 px-3 py-2">{row.date}</td>
                <td className="border border-gray-300 px-3 py-2">{row.subject}</td>
                <td className="border border-gray-300 px-3 py-2">{row.notes}</td>
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
