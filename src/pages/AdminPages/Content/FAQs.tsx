import { useState } from "react";
import AdminPage from "../../../components/admin/AdminPage";
import { PanelCard, PanelFooter } from "../../../components/admin/ContentPanel";

const ROLE_OPTIONS = ["Car Owner", "Mechanics", "Washing", "Sub-Admin", "Tow Truck"];

export default function FAQsPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [roles, setRoles] = useState<Record<string, boolean>>({
    "Car Owner": false,
    Mechanics: true,
    Washing: false,
    "Sub-Admin": false,
    "Tow Truck": false,
  });
  const [faqs, setFaqs] = useState<{ id: number; title: string; answer: string }[]>([
    { id: 1, title: "FAQ - 1", answer: "Sample answer text for FAQ item." },
  ]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const toggleRole = (role: string) => {
    setRoles((prev) => ({ ...prev, [role]: !prev[role] }));
  };

  const handleSave = () => {
    if (!question.trim()) return;
    setFaqs((prev) => [
      ...prev,
      { id: prev.length + 1, title: `FAQ - ${prev.length + 1}`, answer },
    ]);
    setQuestion("");
    setAnswer("");
    setShowForm(false);
  };

  return (
    <AdminPage
      title="FAQ Management"
      panelTitle="FAQ Management"
      action={
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          + Add New
        </button>
      }
      footer={
        showForm ? (
          <PanelFooter message="You are creating FAQs" actionLabel="Save" onAction={handleSave} />
        ) : undefined
      }
    >
      {showForm && (
        <div className="mb-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-bold text-ad-green-dark">Question ?</label>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-ad-purple focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-ad-green-dark">Answer</label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={4}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-ad-purple focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            {ROLE_OPTIONS.map((role) => (
              <label key={role} className="flex items-center gap-2 text-sm font-bold text-ad-green-dark">
                <input
                  type="checkbox"
                  checked={roles[role]}
                  onChange={() => toggleRole(role)}
                  className="h-4 w-4 accent-ad-green"
                />
                {role}
              </label>
            ))}
          </div>
        </div>
      )}

      {faqs.map((faq) => (
        <div key={faq.id} className="mb-3">
          <PanelCard>
            <button
              type="button"
              onClick={() => setExpanded(expanded === faq.id ? null : faq.id)}
              className="font-bold text-ad-green-dark hover:underline"
            >
              {faq.title}
            </button>
            <div className="flex gap-3">
              <button type="button" className="text-blue-600 hover:opacity-80" title="Edit">
                ✎
              </button>
              <button
                type="button"
                className="text-ad-green hover:opacity-80"
                title="Delete"
                onClick={() => setFaqs((prev) => prev.filter((f) => f.id !== faq.id))}
              >
                🗑
              </button>
            </div>
          </PanelCard>
          {expanded === faq.id && (
            <div className="bg-gray-200 px-4 py-2 text-sm font-bold">Answer</div>
          )}
        </div>
      ))}
    </AdminPage>
  );
}
