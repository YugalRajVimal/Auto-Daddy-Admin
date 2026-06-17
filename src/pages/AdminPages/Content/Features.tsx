import { useState } from "react";
import AdminPage from "../../../components/admin/AdminPage";
import { PanelCard, PanelFooter } from "../../../components/admin/ContentPanel";

const INITIAL_FEATURES = [{ id: 1, name: "Car Brands Speciality" }];

export default function FeaturesPage() {
  const [features, setFeatures] = useState(INITIAL_FEATURES);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");

  const handleSave = () => {
    if (!newName.trim()) return;
    setFeatures((prev) => [...prev, { id: prev.length + 1, name: newName.trim() }]);
    setNewName("");
    setShowForm(false);
  };

  return (
    <AdminPage
      title="Product Features"
      panelTitle="Product Features"
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
        <PanelFooter
          message="You are creating a Product Features for Display"
          actionLabel="Save"
          onAction={handleSave}
        />
      }
    >
      {showForm && (
        <div className="mb-4">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Feature name"
            className="w-full rounded border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-ad-purple focus:outline-none"
          />
        </div>
      )}

      {features.map((feature) => (
        <PanelCard key={feature.id}>
          <span className="font-bold text-ad-green-dark">{feature.name}</span>
          <button
            type="button"
            className="text-ad-green hover:opacity-80"
            title="Delete"
            onClick={() => setFeatures((prev) => prev.filter((f) => f.id !== feature.id))}
          >
            🗑
          </button>
        </PanelCard>
      ))}
    </AdminPage>
  );
}
