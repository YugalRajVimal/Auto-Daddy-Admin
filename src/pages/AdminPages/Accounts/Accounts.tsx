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

const TYPE_OPTIONS = [
  { value: "car-owner", label: "Car Owner" },
  { value: "auto-shop", label: "Auto Shop" },
  { value: "dealer", label: "Dealer" },
  { value: "associate", label: "Associate" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "suspended", label: "Suspended" },
  { value: "closed", label: "Closed" },
];

type AccountRow = {
  id: number;
  date: string;
  accountName: string;
  type: string;
  contact: string;
  balance: string;
  status: string;
  country: string;
  notes: string;
  hasClip: boolean;
};

const DUMMY_ACCOUNTS: AccountRow[] = [
  { id: 1, date: "2026-06-16", accountName: "Maple Auto Care", type: "auto-shop", contact: "705 991 3785", balance: "$2,450.00", status: "active", country: "Canada", notes: "Premium shop account", hasClip: true },
  { id: 2, date: "2026-06-15", accountName: "John Smith", type: "car-owner", contact: "416 555 0192", balance: "$125.50", status: "active", country: "Canada", notes: "Wallet balance — 3 job cards", hasClip: false },
  { id: 3, date: "2026-06-14", accountName: "Northern Dealers Inc.", type: "dealer", contact: "647 555 8821", balance: "$18,200.00", status: "active", country: "Canada", notes: "Fleet dealer — monthly billing", hasClip: true },
  { id: 4, date: "2026-06-13", accountName: "Quick Lube Express", type: "auto-shop", contact: "905 555 4410", balance: "$890.00", status: "pending", country: "Canada", notes: "Onboarding in progress", hasClip: false },
  { id: 5, date: "2026-06-12", accountName: "Sarah Johnson", type: "car-owner", contact: "519 555 7733", balance: "$0.00", status: "active", country: "Canada", notes: "New account — no transactions yet", hasClip: true },
  { id: 6, date: "2026-06-11", accountName: "Toronto Tire Masters", type: "auto-shop", contact: "613 555 2299", balance: "$5,670.00", status: "active", country: "Canada", notes: "Ads campaign active", hasClip: false },
  { id: 7, date: "2026-06-10", accountName: "Mike's Towing", type: "associate", contact: "312 555 8844", balance: "$340.00", status: "suspended", country: "USA", notes: "Payment overdue — follow up", hasClip: true },
  { id: 8, date: "2026-06-09", accountName: "Emily Wilson", type: "car-owner", contact: "416 555 6611", balance: "$78.25", status: "active", country: "Canada", notes: "Referral credit applied", hasClip: false },
  { id: 9, date: "2026-06-08", accountName: "West End Motors", type: "dealer", contact: "705 555 3399", balance: "$12,100.00", status: "active", country: "Canada", notes: "12 active leads this month", hasClip: true },
  { id: 10, date: "2026-06-07", accountName: "Anna Martinez", type: "car-owner", contact: "647 555 1122", balance: "$0.00", status: "closed", country: "Canada", notes: "Account closed — moved out of region", hasClip: false },
];

const DEFAULT_NOTES = "Account notes and billing details.";

type AccountsPageProps = {
  initialShowForm?: boolean;
};

export default function AccountsPage({ initialShowForm = false }: AccountsPageProps) {
  const [accounts] = useState(DUMMY_ACCOUNTS);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showForm, setShowForm] = useState(initialShowForm);
  const [date, setDate] = useState("2026-06-16");
  const [country, setCountry] = useState("Canada");
  const [accountName, setAccountName] = useState("");
  const [type, setType] = useState("car-owner");
  const [contact, setContact] = useState("");
  const [balance, setBalance] = useState("");
  const [status, setStatus] = useState("active");
  const [notes, setNotes] = useState(DEFAULT_NOTES);
  const [attachImage, setAttachImage] = useState(false);

  const filtered = accounts.filter(
    (a) =>
      a.date.includes(search) ||
      a.accountName.toLowerCase().includes(search.toLowerCase()) ||
      a.contact.includes(search) ||
      a.balance.includes(search) ||
      a.notes.toLowerCase().includes(search.toLowerCase()) ||
      a.country.toLowerCase().includes(search.toLowerCase()) ||
      (TYPE_OPTIONS.find((o) => o.value === a.type)?.label ?? a.type)
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      (STATUS_OPTIONS.find((o) => o.value === a.status)?.label ?? a.status)
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
    else setSelected(new Set(paged.map((a) => a.id)));
  };

  const resetForm = () => {
    setDate("2026-06-16");
    setCountry("Canada");
    setAccountName("");
    setType("car-owner");
    setContact("");
    setBalance("");
    setStatus("active");
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
      title="Accounts"
      headerAction={!showForm ? <AddNewButton label="New Account" onClick={() => setShowForm(true)} /> : undefined}
      between={
        showForm ? (
          <CompactFormPanel
            footer={
              <CompactFormFooter
                message="You are creating an 'Account'"
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
              <CompactField label="Account Name" required className={compactFixedFieldWidth}>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className={compactInputClass}
                />
              </CompactField>
              <CompactField label="Type" required className={compactFixedFieldWidth}>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className={compactInputClass}
                >
                  {TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </CompactField>
              <CompactField label="Contact" required className={compactFixedFieldWidth}>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className={compactInputClass}
                />
              </CompactField>
              <CompactField label="Balance" required className={compactFixedFieldWidth}>
                <input
                  type="text"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="$0.00"
                  className={compactInputClass}
                />
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
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Account Name</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Type</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Contact</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Balance</th>
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
                <td className="border border-gray-300 px-3 py-2">{row.accountName}</td>
                <td className="border border-gray-300 px-3 py-2">
                  {TYPE_OPTIONS.find((o) => o.value === row.type)?.label ?? row.type}
                </td>
                <td className="border border-gray-300 px-3 py-2">{row.contact}</td>
                <td className="border border-gray-300 px-3 py-2">{row.balance}</td>
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
