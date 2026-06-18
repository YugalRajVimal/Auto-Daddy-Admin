import { useState } from "react";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  PanelCard,
  compactInputClass,
} from "../../../components/admin/ContentPanel";

const ROLE_OPTIONS = ["Car Owner", "Mechanics", "Washing", "Sub-Admin", "Tow Truck"];

export default function FAQsPage() {
  const [question, setQuestion] = useState("Question ?");
  const [answer, setAnswer] = useState("Answer");
  const [roles, setRoles] = useState<Record<string, boolean>>({
    "Car Owner": false,
    Mechanics: true,
    Washing: false,
    "Sub-Admin": false,
    "Tow Truck": false,
  });
  const [faqs, setFaqs] = useState<{ id: number; title: string; answer: string }[]>([
    { id: 1, title: "FAQ - 1", answer: "Answer" },
  ]);
  const [expanded, setExpanded] = useState<number | null>(1);
  const [showForm, setShowForm] = useState(false);

  const toggleRole = (role: string) => {
    setRoles((prev) => ({ ...prev, [role]: !prev[role] }));
  };

  const handleCancel = () => {
    setQuestion("Question ?");
    setAnswer("Answer");
    setShowForm(false);
  };

  const handleSave = () => {
    if (!question.trim()) return;
    setFaqs((prev) => [
      ...prev,
      { id: prev.length + 1, title: `FAQ - ${prev.length + 1}`, answer },
    ]);
    setQuestion("Question ?");
    setAnswer("Answer");
    setShowForm(false);
  };

  return (
    <AdminPage
      narrowPanel
      title="FAQ Management"
      headerAction={!showForm ? <AddNewButton label="Add New" onClick={() => setShowForm(true)} /> : undefined}
      between={
        showForm ? (
          <CompactFormPanel
            footer={<CompactFormFooter onSave={handleSave} onCancel={handleCancel} />}
          >
            <CompactFormRow>
              <CompactField label="Question ?" required className="min-w-[140px] flex-1">
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className={compactInputClass}
                />
              </CompactField>
              <CompactField label="Answer" required className="min-w-[140px] flex-[2]">
                <input
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className={compactInputClass}
                />
              </CompactField>
            </CompactFormRow>
            <CompactFormRow className="items-center pt-0.5">
              {ROLE_OPTIONS.map((role) => (
                <label key={role} className="flex items-center gap-1.5 text-xs font-bold text-ad-green-dark">
                  <input
                    type="checkbox"
                    checked={roles[role]}
                    onChange={() => toggleRole(role)}
                    className="h-3.5 w-3.5 accent-ad-green"
                  />
                  {role}
                </label>
              ))}
            </CompactFormRow>
          </CompactFormPanel>
        ) : undefined
      }
    >
      {faqs.map((faq) => (
          <div key={faq.id} className="mb-0">
            <PanelCard className="mb-0 rounded-b-none">
              <button
                type="button"
                onClick={() => setExpanded(expanded === faq.id ? null : faq.id)}
                className="font-bold text-ad-green-dark"
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
              <div className="mb-3 bg-gray-200 px-4 py-2 text-sm font-bold text-black">{faq.answer}</div>
            )}
          </div>
        ))}
    </AdminPage>
  );
}
