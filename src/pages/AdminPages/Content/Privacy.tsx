import { useState } from "react";
import AdminPage from "../../../components/admin/AdminPage";
import { PanelFooter } from "../../../components/admin/ContentPanel";

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
      panelTitle="Privacy and Disclaimer"
      action={
        !showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="text-sm font-medium text-blue-700 hover:underline"
          >
            + Add New
          </button>
        ) : undefined
      }
      footer={
        showForm ? (
          <PanelFooter
            message="You are creating Privacy and Disclaimer"
            actionLabel="Save"
            onAction={() => setShowForm(false)}
            cancelLabel="Cancel"
            onCancel={handleCancel}
          />
        ) : undefined
      }
    >
      {showForm && (
      <div className="space-y-4">
        <div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full max-w-xs appearance-none rounded border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-ad-purple focus:outline-none"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-bold text-ad-green-dark">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Answer"
            rows={8}
            className="w-full rounded border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-ad-purple focus:outline-none"
          />
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm font-bold text-ad-green-dark">
            <input
              type="checkbox"
              checked={web}
              onChange={(e) => setWeb(e.target.checked)}
              className="h-4 w-4 accent-ad-green"
            />
            Web
          </label>
          <label className="flex items-center gap-2 text-sm font-bold text-ad-green-dark">
            <input
              type="checkbox"
              checked={mobile}
              onChange={(e) => setMobile(e.target.checked)}
              className="h-4 w-4 accent-ad-green"
            />
            Mobile App
          </label>
        </div>
      </div>
      )}
    </AdminPage>
  );
}
