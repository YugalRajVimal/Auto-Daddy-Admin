import { useEffect, useState } from "react";
import { FiPaperclip } from "react-icons/fi";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import {
  CompactAutoGrowTextarea,
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactFixedFieldWidth,
  compactInputClass,
  compactReadOnlyMultilineClass,
  compactReadOnlyValueClass,
} from "../../../components/admin/ContentPanel";
import { adminNotify } from "../../../utils/adminNotify";
import { printAdminTable } from "../../../utils/adminPrintTable";

// Date + gap-x-4 + Sent To (matches compactFixedFieldWidth × 2 + 16px)
const leadWebsiteFieldWidth = "w-[296px] shrink-0 flex-none sm:w-[376px]";

const ASSOCIATE_OPTIONS = [
  "Sarah Mitchell",
  "James Chen",
  "Priya Sharma",
  "Marcus Dubois",
  "Emily Watson",
  "David Okonkwo",
  "Lisa Tremblay",
  "Robert Singh",
];

type LeadStatus = "visited" | "completed";

type LeadRow = {
  id: number;
  date: string;
  name: string;
  phone: string;
  city: string;
  email: string;
  website: string;
  sentTo: string | null;
  personContacted?: string | null;
  notes: string;
  status?: LeadStatus;
  imageUrl?: string | null;
};

const leadImageUrl = (id: number) => `https://picsum.photos/seed/lead-${id}/480/320`;

const DUMMY_LEADS: LeadRow[] = [
  { id: 1, date: "2026-06-16", name: "John Smith", phone: "705 991 3785", city: "Toronto", email: "john.s@email.com", website: "autodaddy.ca", sentTo: "Sarah Mitchell", notes: "Interested in oil change package", status: "visited", imageUrl: leadImageUrl(1) },
  { id: 2, date: "2026-06-15", name: "Maria Garcia", phone: "416 555 0192", city: "Brampton", email: "maria.g@email.com", website: "autoshop12.ca", sentTo: "James Chen", notes: "Referred by Auto Shop #12", status: "visited", imageUrl: leadImageUrl(2) },
  { id: 3, date: "2026-06-14", name: "David Chen", phone: "647 555 8821", city: "Mississauga", email: "d.chen@email.com", website: "fleetcare.com", sentTo: "Marcus Dubois", notes: "Fleet account inquiry — 5 vehicles", status: "visited", imageUrl: leadImageUrl(3) },
  { id: 4, date: "2026-06-13", name: "Sarah Johnson", phone: "905 555 4410", city: "Hamilton", email: "sarah.j@email.com", website: "autodaddy.ca", sentTo: "Emily Watson", personContacted: "Sarah Johnson", notes: "Brake inspection request", status: "completed", imageUrl: leadImageUrl(4) },
  { id: 5, date: "2026-06-12", name: "Michael Brown", phone: "519 555 7733", city: "London", email: "m.brown@email.com", website: "premium.autodaddy.ca", sentTo: "Robert Singh", personContacted: "Michael Brown", notes: "Signed up for premium plan", status: "completed", imageUrl: leadImageUrl(5) },
  { id: 6, date: "2026-06-11", name: "Emily Wilson", phone: "613 555 2299", city: "Ottawa", email: "emily.w@email.com", website: "autodaddy.ca", sentTo: "Lisa Tremblay", notes: "Follow up scheduled for Friday" },
  { id: 7, date: "2026-06-10", name: "James Taylor", phone: "312 555 8844", city: "Toronto", email: "j.taylor@email.com", website: "autodaddy.com", sentTo: "David Okonkwo", notes: "Tire rotation quote needed" },
  { id: 8, date: "2026-06-09", name: "Lisa Anderson", phone: "416 555 6611", city: "Markham", email: "l.anderson@email.com", website: "dealerpartners.ca", sentTo: "Sarah Mitchell", notes: "Dealer partnership interest" },
  { id: 9, date: "2026-06-08", name: "Robert Lee", phone: "705 555 3399", city: "Barrie", email: "r.lee@email.com", website: "autodaddy.ca", sentTo: "James Chen", notes: "Callback requested after 5 PM" },
  { id: 10, date: "2026-06-07", name: "Anna Martinez", phone: "647 555 1122", city: "Toronto", email: "a.martinez@email.com", website: "autodaddy.ca", sentTo: null, notes: "New car owner onboarding" },
  { id: 11, date: "2026-06-06", name: "Kevin Nguyen", phone: "905 555 9021", city: "Vaughan", email: "k.nguyen@email.com", website: "northside.auto", sentTo: "Priya Sharma", notes: "Site visit completed — requested winter tire quote", status: "visited", imageUrl: leadImageUrl(11) },
  { id: 12, date: "2026-06-05", name: "Olivia Park", phone: "416 555 7788", city: "Toronto", email: "olivia.p@email.com", website: "autodaddy.ca", sentTo: "Emily Watson", notes: "Walk-in visit for AC service estimate", status: "visited", imageUrl: leadImageUrl(12) },
  { id: 13, date: "2026-06-04", name: "Daniel Wright", phone: "519 555 4419", city: "Kitchener", email: "d.wright@email.com", website: "wrightfleet.ca", sentTo: "David Okonkwo", notes: "Visited showroom — comparing maintenance plans", status: "visited", imageUrl: leadImageUrl(13) },
  { id: 14, date: "2026-06-03", name: "Sophie Tremblay", phone: "613 555 3300", city: "Ottawa", email: "s.tremblay@email.com", website: "autodaddy.ca", sentTo: "Lisa Tremblay", personContacted: "Sophie Tremblay", notes: "Positive feedback after test drive booking", status: "completed", imageUrl: leadImageUrl(14) },
  { id: 15, date: "2026-06-02", name: "Marcus Allen", phone: "705 555 8820", city: "Barrie", email: "m.allen@email.com", website: "allenmotors.ca", sentTo: "Marcus Dubois", personContacted: "Marcus Allen", notes: "Marked positive — ready to sign service contract", status: "completed", imageUrl: leadImageUrl(15) },
  { id: 16, date: "2026-06-01", name: "Hannah Brooks", phone: "647 555 1190", city: "Toronto", email: "h.brooks@email.com", website: "premium.autodaddy.ca", sentTo: "Robert Singh", personContacted: "Hannah Brooks", notes: "Positive lead from referral campaign", status: "completed", imageUrl: leadImageUrl(16) },
  { id: 17, date: "2026-05-31", name: "Tyler Singh", phone: "905 555 6677", city: "Mississauga", email: "t.singh@email.com", website: "autodaddy.ca", sentTo: "James Chen", notes: "Second visit — confirmed interest in detailing package", status: "visited", imageUrl: leadImageUrl(17) },
  { id: 18, date: "2026-05-30", name: "Rachel Kim", phone: "416 555 9033", city: "Toronto", email: "r.kim@email.com", website: "kimautos.ca", sentTo: "Sarah Mitchell", personContacted: "Rachel Kim", notes: "Strong positive response to follow-up call", status: "completed", imageUrl: leadImageUrl(18) },
];

const DEFAULT_NOTES = "Lead notes and follow-up details.";

type LeadSection = "all" | "visited" | "completed";

type LeadsPageProps = {
  initialShowForm?: boolean;
  title?: string;
  showAddNew?: boolean;
  readOnly?: boolean;
  section?: LeadSection;
};

export default function LeadsPage({
  initialShowForm = false,
  title = "Leads",
  showAddNew = true,
  readOnly = false,
  section = "all",
}: LeadsPageProps) {
  const [leads, setLeads] = useState(DUMMY_LEADS);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showForm, setShowForm] = useState(initialShowForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [date, setDate] = useState("2026-06-16");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState(DEFAULT_NOTES);
  const [sentTo, setSentTo] = useState("");
  const [status, setStatus] = useState<LeadStatus>("visited");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [viewingLead, setViewingLead] = useState<LeadRow | null>(null);
  const [imagePreview, setImagePreview] = useState<{ url: string; title: string } | null>(null);
  const [editingObjectUrl, setEditingObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!imagePreview) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setImagePreview(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [imagePreview]);

  const sectionLeads = leads.filter((l) => {
    if (section === "visited") return l.status === "visited";
    if (section === "completed") return l.status === "completed";
    return l.status !== "visited" && l.status !== "completed";
  });

  const filtered = sectionLeads.filter(
    (l) =>
      l.date.includes(search) ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) ||
      l.city.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      l.notes.toLowerCase().includes(search.toLowerCase()) ||
      (l.sentTo?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (l.personContacted?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      l.website.toLowerCase().includes(search.toLowerCase())
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
    setEditingId(null);
    setDate("2026-06-16");
    setName("");
    setPhone("");
    setCity("");
    setEmail("");
    setWebsite("");
    setNotes(DEFAULT_NOTES);
    setSentTo("");
    setStatus("visited");
    setImageUrl(null);
    if (editingObjectUrl) URL.revokeObjectURL(editingObjectUrl);
    setEditingObjectUrl(null);
  };

  const openAdd = () => {
    resetForm();
    setViewingLead(null);
    setShowForm(true);
  };

  const openView = (row: LeadRow) => {
    setViewingLead(row);
    setShowForm(false);
    resetForm();
  };

  const openEdit = (row: LeadRow) => {
    setViewingLead(null);
    setEditingId(row.id);
    setDate(row.date);
    setName(row.name);
    setPhone(row.phone);
    setCity(row.city);
    setEmail(row.email);
    setWebsite(row.website);
    setNotes(row.notes);
    setSentTo(row.sentTo || "");
    // In "Visited Leads", allow changing visited -> completed (dropdown). In "Completed", status is fixed.
    setStatus(row.status ?? (section === "completed" ? "completed" : "visited"));
    setImageUrl(row.imageUrl ?? null);
    setShowForm(true);
  };

  const closeView = () => {
    setViewingLead(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleSave = () => {
    const payload = {
      date,
      name,
      phone,
      city,
      email,
      website,
      notes,
      sentTo: sentTo || null,
      ...(editingId != null ? { status, imageUrl } : {}),
    };

    if (editingId != null) {
      setLeads((prev) =>
        prev.map((lead) => (lead.id === editingId ? { ...lead, ...payload } : lead))
      );
    } else {
      setLeads((prev) => [
        ...prev,
        {
          id: Math.max(0, ...prev.map((lead) => lead.id)) + 1,
          ...payload,
        },
      ]);
    }

    adminNotify.success(editingId != null ? "Lead updated." : "Lead created.");
    resetForm();
    setShowForm(false);
  };

  const sentToLabel =
    section === "visited" ? "Visited By" : section === "completed" ? "Completed By" : "Sent To";

  const handleToolbarPrint = () => {
    const headers = [
      "Date",
      "Name",
      "Phone",
      "City",
      "Email",
      "Website",
      "Notes",
      sentToLabel,
      "Image",
    ];

    printAdminTable({
      title: "Leads",
      headers,
      rows: sectionLeads
        .filter((lead) => selected.has(lead.id))
        .map((lead) => [
          lead.date,
          lead.name,
          lead.phone,
          lead.city,
          lead.email,
          lead.website,
          lead.notes,
          lead.sentTo || "-",
          lead.imageUrl ? "Yes" : "—",
        ]),
    });
  };

  const viewDetailPanel = viewingLead ? (
    <CompactFormPanel
      footer={
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-ad-form-border bg-ad-form-required-bg px-3 py-2.5">
          <div />
          <span className="text-center text-xs font-serif italic text-gray-800">
            You are viewing a &apos;Lead&apos;
          </span>
          <div className="flex justify-end">
            {!readOnly && (
              <button
                type="button"
                onClick={() => openEdit(viewingLead)}
                className="mr-2 rounded border border-ad-green bg-ad-green px-4 py-1 text-sm font-medium text-white hover:bg-ad-green-dark"
              >
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={closeView}
              className="rounded border border-gray-400 bg-white px-4 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Close
            </button>
          </div>
        </div>
      }
    >
      <CompactFormRow className="w-full items-start">
        <CompactField label="Date" className={compactFixedFieldWidth}>
          <div className={compactReadOnlyValueClass}>{viewingLead.date}</div>
        </CompactField>
        <CompactField label="Name" className="min-w-0 flex-1">
          <div className={compactReadOnlyValueClass}>{viewingLead.name}</div>
        </CompactField>
        <CompactField label="Phone" className={compactFixedFieldWidth}>
          <div className={compactReadOnlyValueClass}>{viewingLead.phone}</div>
        </CompactField>
        <CompactField label="City" className={compactFixedFieldWidth}>
          <div className={compactReadOnlyValueClass}>{viewingLead.city}</div>
        </CompactField>
        <CompactField label="Email" className="min-w-0 flex-1">
          <div className={compactReadOnlyValueClass}>{viewingLead.email}</div>
        </CompactField>
      </CompactFormRow>
      <CompactFormRow className="w-full items-start">
        <CompactField label="Website" className={leadWebsiteFieldWidth}>
          <div className={compactReadOnlyValueClass}>{viewingLead.website}</div>
        </CompactField>
        <CompactField label="Notes" className="min-w-0 flex-1">
          <div className={`${compactReadOnlyMultilineClass} whitespace-pre-wrap`}>{viewingLead.notes}</div>
        </CompactField>
      </CompactFormRow>
      <CompactFormRow className="w-full items-start">
        <CompactField label={sentToLabel} className={compactFixedFieldWidth}>
          <div className={compactReadOnlyValueClass}>{viewingLead.sentTo || "-"}</div>
        </CompactField>
        <CompactField label="Status" className={compactFixedFieldWidth}>
          {section === "visited" ? (
            <select
              value={viewingLead.status ?? "visited"}
              onChange={(e) => {
                const nextStatus = e.target.value as LeadStatus;
                setLeads((prev) =>
                  prev.map((lead) =>
                    lead.id === viewingLead.id ? { ...lead, status: nextStatus } : lead
                  )
                );
                setViewingLead((prev) => (prev ? { ...prev, status: nextStatus } : prev));
                adminNotify.success(
                  nextStatus === "completed" ? "Marked as completed." : "Marked as visited."
                );
              }}
              className={compactInputClass}
            >
              <option value="visited">visited</option>
              <option value="completed">completed</option>
            </select>
          ) : (
            <div className={compactReadOnlyValueClass}>{viewingLead.status || "-"}</div>
          )}
        </CompactField>
        <CompactField label="Image" className="min-w-0 flex-1">
          {viewingLead.imageUrl ? (
            <button
              type="button"
              onClick={() =>
                setImagePreview({
                  url: viewingLead.imageUrl!,
                  title: `${viewingLead.name} — lead image`,
                })
              }
              className="inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
            >
              <FiPaperclip className="size-4" aria-hidden />
              View
            </button>
          ) : (
            <div className={compactReadOnlyValueClass}>-</div>
          )}
        </CompactField>
      </CompactFormRow>
    </CompactFormPanel>
  ) : undefined;

  return (
    <AdminPage
      title={title}
      noPanel={!showAddNew}
      headerAction={showAddNew && !showForm && !viewingLead ? <AddNewButton onClick={openAdd} /> : undefined}
      between={
        viewDetailPanel ??
        (!readOnly && showForm ? (
          <CompactFormPanel
            footer={
              <CompactFormFooter
                message={editingId != null ? "You are editing a 'Lead'" : "You are creating a 'Lead'"}
                messageCenter
                onSave={handleSave}
                onCancel={handleCancel}
              />
            }
          >
            <CompactFormRow className="w-full items-start">
              <CompactField label="Date" required className={compactFixedFieldWidth}>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={compactInputClass}
                />
              </CompactField>
              <CompactField label="Name" required className="min-w-0 flex-1">
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
              <CompactField label="City" required className={compactFixedFieldWidth}>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={compactInputClass}
                />
              </CompactField>
              <CompactField label="Email" required className="min-w-0 flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={compactInputClass}
                />
              </CompactField>
            </CompactFormRow>
            <CompactFormRow className="w-full items-start">
              <CompactField label="Website" required className={leadWebsiteFieldWidth}>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className={compactInputClass}
                />
              </CompactField>
              <CompactField label="Notes" required className="min-w-0 flex-1">
                <CompactAutoGrowTextarea value={notes} onChange={(e) => setNotes(e.target.value)} />
              </CompactField>
              <CompactField label={sentToLabel} className={compactFixedFieldWidth}>
                <select
                  value={sentTo}
                  onChange={(e) => setSentTo(e.target.value)}
                  className={compactInputClass}
                >
                  <option value="">-</option>
                  {ASSOCIATE_OPTIONS.map((associate) => (
                    <option key={associate} value={associate}>
                      {associate}
                    </option>
                  ))}
                </select>
              </CompactField>
            </CompactFormRow>
            {editingId != null && (
              <CompactFormRow className="w-full items-start">
                <CompactField label="Upload Image" className="min-w-0 flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (editingObjectUrl) URL.revokeObjectURL(editingObjectUrl);
                      const url = URL.createObjectURL(file);
                      setEditingObjectUrl(url);
                      setImageUrl(url);
                    }}
                    className={compactInputClass}
                  />
                  {imageUrl && (
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setImagePreview({ url: imageUrl, title: `${name || "Lead"} — lead image` })}
                        className="inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        <FiPaperclip className="size-4" aria-hidden />
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (editingObjectUrl) URL.revokeObjectURL(editingObjectUrl);
                          setEditingObjectUrl(null);
                          setImageUrl(null);
                        }}
                        className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </CompactField>
                <CompactField label="Status" className={compactFixedFieldWidth}>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as LeadStatus)}
                    className={compactInputClass}
                    disabled={section === "completed"}
                  >
                    {section === "completed" ? (
                      <option value="completed">completed</option>
                    ) : section === "visited" ? (
                      <>
                        <option value="visited">visited</option>
                        <option value="completed">completed</option>
                      </>
                    ) : (
                      <>
                        <option value="visited">visited</option>
                        <option value="completed">completed</option>
                      </>
                    )}
                  </select>
                </CompactField>
              </CompactFormRow>
            )}
          </CompactFormPanel>
        ) : undefined)
      }
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {!readOnly && (
            <>
              <button type="button" disabled={selected.size === 0} className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
                Delete
              </button>
            </>
          )}
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
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">City</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Email</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Website</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Notes</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">{sentToLabel}</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">View Image</th>
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
                    onClick={() => openView(row)}
                    className="text-blue-700 hover:underline"
                  >
                    {row.date}
                  </button>
                </td>
                <td className="border border-gray-300 px-3 py-2">{row.name}</td>
                <td className="border border-gray-300 px-3 py-2">{row.phone}</td>
                <td className="border border-gray-300 px-3 py-2">{row.city}</td>
                <td className="border border-gray-300 px-3 py-2">{row.email}</td>
                <td className="border border-gray-300 px-3 py-2">{row.website}</td>
                <td className="border border-gray-300 px-3 py-2">{row.notes}</td>
                <td className="border border-gray-300 px-3 py-2">{row.sentTo || "-"}</td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {row.imageUrl ? (
                    <button
                      type="button"
                      onClick={() =>
                        setImagePreview({
                          url: row.imageUrl!,
                          title: `${row.name} — lead image`,
                        })
                      }
                      className="inline-flex items-center justify-center rounded p-1 text-ad-purple hover:bg-ad-purple/10 hover:text-ad-purple-dark"
                      aria-label={`View image for ${row.name}`}
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
