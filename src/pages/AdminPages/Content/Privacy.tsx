import { useState } from "react";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactInputClass,
} from "../../../components/admin/ContentPanel";

const TYPE_OPTIONS = ["Privacy", "Disclaimer", "Terms of Service"];

export default function PrivacyPage() {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState("Privacy");
  const [description, setDescription] = useState("");
  const [web, setWeb] = useState(true);
  const [mobile, setMobile] = useState(false);

  const handleCancel = () => {
    setType("Privacy");
    setDescription("");
    setWeb(true);
    setMobile(false);
    setShowForm(false);
  };

  return (
    <AdminPage
      narrowPanel
      title="Privacy and Disclaimer"
      headerAction={!showForm ? <AddNewButton label="Add New" onClick={() => setShowForm(true)} /> : undefined}
      between={
        showForm ? (
          <CompactFormPanel
            footer={<CompactFormFooter onSave={() => setShowForm(false)} onCancel={handleCancel} />}
          >
            <CompactFormRow>
              <CompactField label="Type" required className="w-[150px] shrink-0 flex-none">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className={compactInputClass}
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </CompactField>
              <CompactField label="Description" required className="min-w-[160px] flex-1">
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description"
                  className={compactInputClass}
                />
              </CompactField>
            </CompactFormRow>
            <CompactFormRow className="items-center pt-0.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-ad-green-dark">
                <input
                  type="checkbox"
                  checked={web}
                  onChange={(e) => setWeb(e.target.checked)}
                  className="h-3.5 w-3.5 accent-ad-green"
                />
                Web
              </label>
              <label className="flex items-center gap-1.5 text-xs font-bold text-ad-green-dark">
                <input
                  type="checkbox"
                  checked={mobile}
                  onChange={(e) => setMobile(e.target.checked)}
                  className="h-3.5 w-3.5 accent-ad-green"
                />
                Mobile App
              </label>
            </CompactFormRow>
          </CompactFormPanel>
        ) : undefined
      }
    >
      <p className="text-sm text-gray-500">No entries yet. Click &quot;+ Add New&quot; to create one.</p>
    </AdminPage>
  );
}
