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

const INITIAL_FEATURES = [{ id: 1, name: "Car Brands Speciality" }];

export default function FeaturesPage() {
  const [features, setFeatures] = useState(INITIAL_FEATURES);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCancel = () => {
    setNewName("");
    setShowForm(false);
  };

  const handleSave = () => {
    if (!newName.trim()) return;
    setFeatures((prev) => [...prev, { id: prev.length + 1, name: newName.trim() }]);
    setNewName("");
    setShowForm(false);
  };

  return (
    <AdminPage
      narrowPanel
      title="Product Features"
      headerAction={!showForm ? <AddNewButton label="Add New" onClick={() => setShowForm(true)} /> : undefined}
      between={
        showForm ? (
          <CompactFormPanel
            footer={<CompactFormFooter onSave={handleSave} onCancel={handleCancel} />}
          >
            <CompactFormRow>
              <CompactField label="Feature name" required className="flex-1">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Feature name"
                  className={compactInputClass}
                />
              </CompactField>
            </CompactFormRow>
          </CompactFormPanel>
        ) : undefined
      }
    >
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
