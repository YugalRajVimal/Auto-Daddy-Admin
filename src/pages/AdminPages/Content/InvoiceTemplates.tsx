import { useState } from "react";
import AdminPage from "../../../components/admin/AdminPage";
import { PanelCard } from "../../../components/admin/ContentPanel";

const CATEGORIES = ["Mechanics", "Washing", "Tire Master", "Tow Truck"];

const SAMPLE_TEMPLATES = [
  { id: 1, label: "Invoice Template - 1" },
  { id: 2, label: "Invoice Template - 2" },
  { id: 3, label: "Invoice Template - 3" },
];

export default function InvoiceTemplatesPage() {
  const [categories, setCategories] = useState<Record<string, boolean>>({
    Mechanics: true,
    Washing: false,
    "Tire Master": false,
    "Tow Truck": false,
  });
  const [templates, setTemplates] = useState(SAMPLE_TEMPLATES);

  const toggleCategory = (cat: string) => {
    setCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <AdminPage narrowPanel noPanel title="Inv - Temp">
      <div className="rounded-t-2xl rounded-b-xl border border-ad-green-dark/30 bg-ad-green-light p-4 md:p-5">
        <div className="mb-4 flex flex-wrap gap-4 border-b border-ad-green-dark/40 pb-4">
          {CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center gap-2 text-sm font-bold text-ad-green-dark">
              <input
                type="checkbox"
                checked={categories[cat]}
                onChange={() => toggleCategory(cat)}
                className="h-4 w-4 accent-ad-green"
              />
              {cat}
            </label>
          ))}
        </div>
        {templates.map((t) => (
          <PanelCard key={t.id}>
            <a href="#" className="text-blue-700 underline hover:opacity-80">
              {t.label}
            </a>
            <button
              type="button"
              className="text-ad-green hover:opacity-80"
              onClick={() => setTemplates((prev) => prev.filter((x) => x.id !== t.id))}
            >
              🗑
            </button>
          </PanelCard>
        ))}
      </div>
    </AdminPage>
  );
}
