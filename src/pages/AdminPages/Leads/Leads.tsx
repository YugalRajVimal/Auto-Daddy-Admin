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

const SOURCE_OPTIONS = [
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "walk-in", label: "Walk-in" },
  { value: "phone", label: "Phone" },
];

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "closed", label: "Closed" },
];

type LeadRow = {
  id: number;
  date: string;
  name: string;
  phone: string;
  email: string;
  source: string;
  status: string;
  country: string;
  notes: string;
  hasClip: boolean;
};

const DUMMY_LEADS: LeadRow[] = [
  { id: 1, date: "2026-06-16", name: "John Smith", phone: "705 991 3785", email: "john.s@email.com", source: "website", status: "new", country: "Canada", notes: "Interested in oil change package", hasClip: true },
  { id: 2, date: "2026-06-15", name: "Maria Garcia", phone: "416 555 0192", email: "maria.g@email.com", source: "referral", status: "contacted", country: "Canada", notes: "Referred by Auto Shop #12", hasClip: false },
  { id: 3, date: "2026-06-14", name: "David Chen", phone: "647 555 8821", email: "d.chen@email.com", source: "walk-in", status: "qualified", country: "Canada", notes: "Fleet account inquiry — 5 vehicles", hasClip: true },
  { id: 4, date: "2026-06-13", name: "Sarah Johnson", phone: "905 555 4410", email: "sarah.j@email.com", source: "phone", status: "new", country: "Canada", notes: "Brake inspection request", hasClip: false },
  { id: 5, date: "2026-06-12", name: "Michael Brown", phone: "519 555 7733", email: "m.brown@email.com", source: "website", status: "closed", country: "Canada", notes: "Signed up for premium plan", hasClip: true },
  { id: 6, date: "2026-06-11", name: "Emily Wilson", phone: "613 555 2299", email: "emily.w@email.com", source: "referral", status: "contacted", country: "Canada", notes: "Follow up scheduled for Friday", hasClip: false },
  { id: 7, date: "2026-06-10", name: "James Taylor", phone: "312 555 8844", email: "j.taylor@email.com", source: "website", status: "new", country: "USA", notes: "Tire rotation quote needed", hasClip: true },
  { id: 8, date: "2026-06-09", name: "Lisa Anderson", phone: "416 555 6611", email: "l.anderson@email.com", source: "walk-in", status: "qualified", country: "Canada", notes: "Dealer partnership interest", hasClip: false },
  { id: 9, date: "2026-06-08", name: "Robert Lee", phone: "705 555 3399", email: "r.lee@email.com", source: "phone", status: "contacted", country: "Canada", notes: "Callback requested after 5 PM", hasClip: true },
  { id: 10, date: "2026-06-07", name: "Anna Martinez", phone: "647 555 1122", email: "a.martinez@email.com", source: "website", status: "new", country: "Canada", notes: "New car owner onboarding", hasClip: false },
];

const DEFAULT_NOTES = "Lead notes and follow-up details.";

type LeadsPageProps = {
  initialShowForm?: boolean;
};

export default function LeadsPage({ initialShowForm = false }: LeadsPageProps) {
  const [leads] = useState(DUMMY_LEADS);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showForm, setShowForm] = useState(initialShowForm);
  const [date, setDate] = useState("2026-06-16");
  const [country, setCountry] = useState("Canada");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("website");
  const [status, setStatus] = useState("new");
  const [notes, setNotes] = useState(DEFAULT_NOTES);
  const [attachImage, setAttachImage] = useState(false);

  const filtered = leads.filter(
    (l) =>
      l.date.includes(search) ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      l.notes.toLowerCase().includes(search.toLowerCase()) ||
      l.country.toLowerCase().includes(search.toLowerCase()) ||
      (SOURCE_OPTIONS.find((o) => o.value === l.source)?.label ?? l.source)
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (STATUS_OPTIONS.find((o) => o.value === l.status)?.label ?? l.status)
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
    else setSelected(new Set(paged.map((l) => l.id)));
  };

  const resetForm = () => {
    setDate("2026-06-16");
    setCountry("Canada");
    setName("");
    setPhone("");
    setEmail("");
    setSource("website");
    setStatus("new");
    setNotes(DEFAULT_NOTES);
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
      title="Leads"
      headerAction={!showForm ? <AddNewButton label="New Lead" onClick={() => setShowForm(true)} /> : undefined}
      between={
        showForm ? (
          <CompactFormPanel
            footer={
              <CompactFormFooter
                message="You are creating a 'Lead'"
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
              <CompactField label="Name" required className={compactFixedFieldWidth}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={compactInputClass}
                />
              </CompactField>
              <CompactField label="Phone" required className={compactFixedFieldWidth}>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={compactInputClass}
                />
              </CompactField>
              <CompactField label="Email" required className={compactFixedFieldWidth}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={compactInputClass}
                />
              </CompactField>
              <CompactField label="Source" required className={compactFixedFieldWidth}>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className={compactInputClass}
                >
                  {SOURCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </CompactField>
              <CompactField label="Status" required className={compactFixedFieldWidth}>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={compactInputClass}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </CompactField>
              <CompactField label="Notes" required className="min-w-[200px] flex-1">
                <CompactAutoGrowTextarea value={notes} onChange={(e) => setNotes(e.target.value)} />
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
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Name</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Phone</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Email</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Source</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Status</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Country</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Notes</th>
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
                <td className="border border-gray-300 px-3 py-2">{row.name}</td>
                <td className="border border-gray-300 px-3 py-2">{row.phone}</td>
                <td className="border border-gray-300 px-3 py-2">{row.email}</td>
                <td className="border border-gray-300 px-3 py-2">
                  {SOURCE_OPTIONS.find((o) => o.value === row.source)?.label ?? row.source}
                </td>
                <td className="border border-gray-300 px-3 py-2 capitalize">
                  {STATUS_OPTIONS.find((o) => o.value === row.status)?.label ?? row.status}
                </td>
                <td className="border border-gray-300 px-3 py-2">{row.country}</td>
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
    </AdminPage>
  );
}
