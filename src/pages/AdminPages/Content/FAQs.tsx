import { useState, useEffect, useCallback } from "react";
import AttachImageCheckbox from "../../../components/admin/AttachImageCheckbox";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import ClipImageHover, { adminClipImageUrl } from "../../../components/admin/ClipImageHover";
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

const API_BASE = (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/admin/common` : "/api");

const USER_OPTIONS = [
  { value: "car-owner", label: "Car Owner", apiValue: "car_owner" },
  { value: "mechanic", label: "Mechanic", apiValue: "mechanic" },
  { value: "shop-owner", label: "Shop Owner", apiValue: "shop_owner" },
  { value: "associate", label: "Associate", apiValue: "associate" },
  { value: "dealer", label: "Dealer", apiValue: "dealer" },
];

type FaqRow = {
  id: number;
  date: string;
  question: string;
  answer: string;
  role: string;
  hasClip?: boolean; // just for consistency, not present in API, derive below
  imageUrl?: string | null;
};

const DEFAULT_ANSWER = "Answer";

type FAQsPageProps = {
  initialShowForm?: boolean;
};

export default function FAQsPage({ initialShowForm = false }: FAQsPageProps) {
  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showForm, setShowForm] = useState(initialShowForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [date, setDate] = useState("2026-06-16");
  const [user, setUser] = useState("car-owner");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(DEFAULT_ANSWER);
  const [attachImage, setAttachImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetching all FAQs -- optionally by role
  const fetchFaqs = useCallback(async () => {
    setIsLoading(true);
    try {
      // NOTE: Change 'car_owner' to a variable filter if needed
      const res = await fetch(`${API_BASE}/faqs?role=car_owner`);
      if (!res.ok) throw new Error("Failed to fetch FAQs");
      const data = await res.json();
      // The API probably returns array of { id, date, question, answer, role }
      setFaqs(Array.isArray(data) ? data : []);
    } catch (err) {
      adminNotify.error("Could not fetch FAQs.");
      setFaqs([]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  // Prepare fields for UI (sort-of normalize to FaqRow)
  const faqsWithExtras: FaqRow[] = faqs.map((faq) => {
    // Simulate attachments for display only. In real case, check for image in API.
    let imageUrl: string | undefined = undefined;
    let hasClip = false;
    // Just as a demo: fakes for entries with even ids
    if (attachImage && (editingId === faq.id)) {
      hasClip = !!imageFile;
      // ignore imageUrl, this is only during editing
    } else if (faq.id % 2 === 0) {
      // dummy display for every second FAQ, for illustration! Replace as needed.
      hasClip = true;
      imageUrl = adminClipImageUrl(`faq-${faq.id}`);
    }
    return { ...faq, hasClip, imageUrl };
  });

  // Filtering, searching, and pagination
  const filtered = faqsWithExtras.filter(
    (f) =>
      f.date?.includes(search) ||
      f.question?.toLowerCase().includes(search.toLowerCase()) ||
      f.answer?.toLowerCase().includes(search.toLowerCase()) ||
      (USER_OPTIONS.find((o) => o.apiValue === f.role || o.value === f.role)?.label ?? f.role)
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
    setAttachImage(false);
    setImageFile(null);
    setEditingId(null);
  };

  const openAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (row: FaqRow) => {
    setDate(row.date);
    setUser(USER_OPTIONS.find((o) => o.apiValue === row.role)?.value ?? row.role);
    setQuestion(row.question);
    setAnswer(row.answer);
    setAttachImage(!!row.hasClip);
    setImageFile(null);
    setEditingId(row.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleSave = async () => {
    // The backend expects role, date, question, answer
    const roleForApi = USER_OPTIONS.find((o) => o.value === user)?.apiValue || "car_owner";
    const payload = {
      role: roleForApi,
      date,
      question,
      answer,
    };

    try {
      let res;
      if (editingId == null) {
        // Create
        res = await fetch(`${API_BASE}/faqs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create");
        adminNotify.success("Saved successfully.");
      } else {
        // Update (API only supports updating answer according to cURL given)
        res = await fetch(`${API_BASE}/faqs/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          // The API only wants answer for PUT
          body: JSON.stringify({ answer }),
        });
        if (!res.ok) throw new Error("Failed to update.");
        adminNotify.success("Updated successfully.");
      }
      await fetchFaqs();
      resetForm();
      setShowForm(false);
    } catch (err: any) {
      adminNotify.error(err?.message || "Failed to save FAQ.");
    }
  };

  const handleDelete = async () => {
    // bulk delete
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    let allSucceeded = true;
    for (let id of ids) {
      try {
        const res = await fetch(`${API_BASE}/faqs/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error();
      } catch (_) {
        allSucceeded = false;
      }
    }
    await fetchFaqs();
    setSelected(new Set());
    adminNotify[allSucceeded ? "success" : "error"](allSucceeded ? "Deleted." : "Some failed to delete.");
  };

  const handleToolbarPrint = () => {
    printAdminTable({
      title: "FAQ Management",
      headers: ["User", "Date", "Question", "Answer", "Clip"],
      rows: filtered.map((faq) => [
          USER_OPTIONS.find((option) => option.apiValue === faq.role || option.value === faq.role)?.label ?? faq.role,
          faq.date,
          faq.question,
          faq.answer,
          faq.hasClip ? "Yes" : "—",
        ]),
    });
  };

  return (
    <AdminPage
      title="FAQ Management"
      headerAction={!showForm ? <AddNewButton onClick={openAdd} /> : undefined}
      between={
        showForm ? (
          <CompactFormPanel
            footer={
              <CompactFormFooter
                message={editingId != null ? "You are editing an 'FAQ'" : "You are creating an 'FAQ'"}
                messageCenter
                actionLabel={editingId != null ? "Update" : "Save"}
                onSave={isLoading ? undefined : handleSave}
                onCancel={handleCancel}
                // removed unsupported 'saving' prop
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
            <CompactFormRow className="items-start justify-start">
              <AttachImageCheckbox
                checked={attachImage}
                onCheckedChange={setAttachImage}
                file={imageFile}
                onFileChange={setImageFile}
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
            disabled={selected.size === 0}
            onClick={handleDelete}
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
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">User</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Date</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Question</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Answer</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Clip</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((row, idx) => (
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
                    {USER_OPTIONS.find((o) => o.apiValue === row.role || o.value === row.role)?.label ?? row.role}
                  </button>
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {row.date ? new Date(row.date).toISOString().slice(0, 10) : ""}
                </td>
           
                <td className="border border-gray-300 px-3 py-2 text-center">{row.question}</td>
                <td className="border border-gray-300 px-3 py-2 text-center">{row.answer}</td>
                <td className="border border-gray-300 px-3 py-2 text-center">
                  {row.imageUrl ? (
                    <ClipImageHover
                      imageUrl={row.imageUrl}
                      alt={`Attachment for ${row.question}`}
                    />
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
    </AdminPage>
  );
}
