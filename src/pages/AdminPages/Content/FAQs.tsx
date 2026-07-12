import { useState, useEffect, useCallback } from "react";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import { AdminDeletedBanner, AdminDeletedToggle } from "../../../components/admin/AdminDeletedView";
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
  searchEquals,
  searchIncludes,
  type AdminSearchField,
} from "../../../components/admin/AdminSearchCard";
import { useAdminDeletedView } from "../../../hooks/useAdminDeletedView";
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

const FAQ_SEARCH_FIELDS: AdminSearchField[] = [
  {
    key: "user",
    label: "User",
    type: "select",
    options: USER_OPTIONS.map((o) => ({ value: o.label, label: o.label })),
  },
  { key: "date", label: "Date", type: "date" },
  { key: "question", label: "Question" },
  { key: "answer", label: "Answer" },
];

const faqUserLabel = (role: string) =>
  USER_OPTIONS.find((o) => o.apiValue === role || o.value === role)?.label ?? role;

type FaqRow = {
  id: number;
  date: string;
  question: string;
  answer: string;
  role: string;
};

const DEFAULT_ANSWER = "Answer";

type FAQsPageProps = {
  initialShowForm?: boolean;
};

export default function FAQsPage({ initialShowForm = false }: FAQsPageProps) {
  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [showSearchCard, setShowSearchCard] = useState(false);
  const [searchDraft, setSearchDraft] = useState(() => emptyAdminSearchValues(FAQ_SEARCH_FIELDS));
  const [searchFilters, setSearchFilters] = useState(() => emptyAdminSearchValues(FAQ_SEARCH_FIELDS));
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showForm, setShowForm] = useState(initialShowForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [date, setDate] = useState("2026-06-16");
  const [user, setUser] = useState("car-owner");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(DEFAULT_ANSWER);
  const [isLoading, setIsLoading] = useState(false);

  const resetTableControls = () => {
    setPage(1);
    setSelected(new Set());
    setSearch("");
    const empty = emptyAdminSearchValues(FAQ_SEARCH_FIELDS);
    setSearchDraft(empty);
    setSearchFilters(empty);
    setShowSearchCard(false);
  };

  const {
    viewMode,
    isDeletedView,
    toggleViewMode,
    deletedStash,
    stashDeleted,
    restoreStashed,
  } = useAdminDeletedView<FaqRow>({
    onToggle: resetTableControls,
    storageKey: "admin_deleted_view:faqs",
  });

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

  const displayFaqs = isDeletedView ? deletedStash : faqs;

  // Filtering, searching, and pagination
  const filtered = displayFaqs.filter((f) => {
    const userLabel = faqUserLabel(f.role);
    const live =
      !search.trim() ||
      f.date?.includes(search) ||
      f.question?.toLowerCase().includes(search.toLowerCase()) ||
      f.answer?.toLowerCase().includes(search.toLowerCase()) ||
      userLabel.toLowerCase().includes(search.toLowerCase());
    if (!live) return false;
    const dateStr = f.date ? String(f.date).slice(0, 10) : "";
    return (
      searchEquals(userLabel, searchFilters.user) &&
      searchIncludes(dateStr, searchFilters.date) &&
      searchIncludes(f.question, searchFilters.question) &&
      searchIncludes(f.answer, searchFilters.answer)
    );
  });

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
    setEditingId(null);
  };

  const openAdd = () => {
    resetForm();
    setShowSearchCard(false);
    setShowForm(true);
  };

  const openEdit = (row: FaqRow) => {
    setDate(row.date);
    setUser(USER_OPTIONS.find((o) => o.apiValue === row.role)?.value ?? row.role);
    setQuestion(row.question);
    setAnswer(row.answer);
    setEditingId(row.id);
    setShowSearchCard(false);
    setShowForm(true);
  };

  const openSearchCard = () => {
    setShowForm(false);
    setEditingId(null);
    setSearchDraft({ ...searchFilters });
    setShowSearchCard((open) => !open);
  };

  const handleSearchCardSearch = () => {
    setSearchFilters({ ...searchDraft });
    setPage(1);
    setSelected(new Set());
  };

  const handleSearchCardReset = () => {
    const empty = emptyAdminSearchValues(FAQ_SEARCH_FIELDS);
    setSearchDraft(empty);
    setSearchFilters(empty);
    setPage(1);
    setSelected(new Set());
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
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const toStash = faqs.filter((f) => ids.includes(f.id));
    let allSucceeded = true;
    for (const id of ids) {
      try {
        const res = await fetch(`${API_BASE}/faqs/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error();
      } catch (_) {
        allSucceeded = false;
      }
    }
    if (toStash.length > 0) stashDeleted(toStash);
    await fetchFaqs();
    setSelected(new Set());
    adminNotify[allSucceeded ? "success" : "error"](allSucceeded ? "Deleted." : "Some failed to delete.");
  };

  const handleRestore = async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const toRestore = deletedStash.filter((f) => ids.includes(f.id));
    if (toRestore.length === 0) return;
    if (!window.confirm(`Restore ${toRestore.length} FAQ(s)?`)) return;
    let allSucceeded = true;
    for (const row of toRestore) {
      try {
        const roleForApi =
          USER_OPTIONS.find((o) => o.apiValue === row.role || o.value === row.role)?.apiValue ||
          row.role ||
          "car_owner";
        const res = await fetch(`${API_BASE}/faqs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: roleForApi,
            date: row.date,
            question: row.question,
            answer: row.answer,
          }),
        });
        if (!res.ok) throw new Error();
        restoreStashed((item) => item.id === row.id);
      } catch (_) {
        allSucceeded = false;
      }
    }
    await fetchFaqs();
    setSelected(new Set());
    adminNotify[allSucceeded ? "success" : "error"](
      allSucceeded ? "Restored successfully." : "Some FAQs failed to restore."
    );
  };

  const handleToolbarPrint = () => {
    printAdminTable({
      title: isDeletedView ? "Deleted FAQ Management" : "FAQ Management",
      headers: ["User", "Date", "Question", "Answer"],
      rows: filtered.map((faq) => [
          USER_OPTIONS.find((option) => option.apiValue === faq.role || option.value === faq.role)?.label ?? faq.role,
          faq.date,
          faq.question,
          faq.answer,
        ]),
    });
  };

  return (
    <AdminPage
      title={isDeletedView ? "Deleted FAQ Management" : "FAQ Management"}
      headerAction={!showForm && !showSearchCard && !isDeletedView ? <AddNewButton onClick={openAdd} /> : undefined}
      between={
        showSearchCard ? (
          <AdminSearchCard
            fields={FAQ_SEARCH_FIELDS}
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
          </CompactFormPanel>
        ) : undefined
      }
    >
      {isDeletedView && (
        <AdminDeletedBanner count={deletedStash.length} entityLabel="FAQs" />
      )}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {!isDeletedView ? (
            <button
              type="button"
              disabled={selected.size === 0}
              onClick={handleDelete}
              className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Delete
            </button>
          ) : (
            <button
              type="button"
              disabled={selected.size === 0}
              onClick={handleRestore}
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
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
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
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={5} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                  {isDeletedView ? "No deleted FAQs found." : "No FAQs found."}
                </td>
              </tr>
            ) : (
              paged.map((row, idx) => (
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
                      onClick={() => !isDeletedView && openEdit(row)}
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
                </tr>
              ))
            )}
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
        <AdminDeletedToggle viewMode={viewMode} onToggle={toggleViewMode} activeLabel="Active FAQs" />
      </div>
    </AdminPage>
  );
}
