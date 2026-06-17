import { useState } from "react";
import AdminPage from "../../../components/admin/AdminPage";
import { PanelCard } from "../../../components/admin/ContentPanel";

const CATEGORIES = ["Mechanics", "Washing", "Tire Master", "Tow Truck"];

const SAMPLE_SITES = [
  { id: 1, url: "Mechanic1.autodaddy.ca" },
  { id: 2, url: "Mechanic2.autodaddy.ca" },
  { id: 3, url: "Mechanic3.autodaddy.ca" },
  { id: 4, url: "Mechanic4.autodaddy.ca" },
  { id: 5, url: "Mechanic5.autodaddy.ca" },
];

const WebsiteTemplates: React.FC = () => {
  const [categories, setCategories] = useState<Record<string, boolean>>({
    Mechanics: true,
    Washing: false,
    "Tire Master": false,
    "Tow Truck": false,
  });
  const [sites, setSites] = useState(SAMPLE_SITES);

  const toggleCategory = (cat: string) => {
    setCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <AdminPage title="Website Templates">
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
        {sites.map((site) => (
          <PanelCard key={site.id}>
            <a
              href={`https://${site.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 underline hover:opacity-80"
            >
              {site.url}
            </a>
            <button
              type="button"
              className="text-ad-green hover:opacity-80"
              onClick={() => setSites((prev) => prev.filter((s) => s.id !== site.id))}
            >
              🗑
            </button>
          </PanelCard>
        ))}
      </div>
    </AdminPage>
  );
};

export default WebsiteTemplates;
