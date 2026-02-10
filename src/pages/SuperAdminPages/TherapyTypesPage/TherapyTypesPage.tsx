import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiPlus, FiEdit, FiTrash, FiX, FiCheck } from "react-icons/fi";

// Set your API base url here
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/super-admin/therapy-types`
  : "/api/super-admin/therapy-types";

type TherapyType = {
  _id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  __v?: number;
};

export default function TherapyTypesPage() {
  const [types, setTypes] = useState<TherapyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newType, setNewType] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch all therapy types on mount
  useEffect(() => {
    setLoading(true);
    fetch(API_BASE + "/", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer` // if using JWT header
        }
      })      
      .then(async (res) => {
        if (!res.ok) {
          const msg = await res.text();

          throw new Error(msg || "Failed to fetch therapy types");
        }
        return res.json();
      })
      .then((data) => {
        // Expecting response to look like: { therapyTypes: [...] }
        console.log(data);
        if (Array.isArray(data.therapyTypes)) {
          setTypes(data.therapyTypes);
        } else {
          setTypes([]);
        }
      })
      .catch((err) => setError(err.message || "Could not fetch types"))
      .finally(() => setLoading(false));
  }, []);

  // Add a new type to API
  const addType = async () => {
    if (!newType.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(API_BASE + "/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newType.trim() }),
      });
      if (!res.ok) {
        throw new Error("Failed to add therapy type");
      }
      const added = await res.json();
      // Either return the single created therapy type or { therapyType }
      const addedType = added.therapyType || added;
      setTypes((prev) => [...prev, addedType]);
      setNewType("");
    } catch (err: any) {
      setError(err.message || "Could not add type");
    }
    setSubmitting(false);
  };

  // Delete a type by id
  const deleteType = async (id: string) => {
    if (!window.confirm("Delete this therapy type?")) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to delete therapy type");
      setTypes((prev) => prev.filter((t) => t._id !== id));
    } catch (err: any) {
      setError(err.message || "Could not delete type");
    }
    setSubmitting(false);
  };

  // Enable edit mode for a type
  const beginEdit = (type: TherapyType) => {
    setEditId(type._id);
    setEditName(type.name);
    setError(null);
  };

  // Cancel inline edit
  const cancelEdit = () => {
    setEditId(null);
    setEditName("");
    setError(null);
  };

  // Save edited type
  const saveEdit = async () => {
    if (!editId) return;
    if (!editName.trim()) {
      setError("Type name cannot be empty");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: editName }),
      });
      if (!res.ok) throw new Error("Failed to edit therapy type");
      // Should return updated therapy type, or { therapyType }
      const updated = await res.json();
      const updatedType = updated.therapyType || updated;
      setTypes((prev) =>
        prev.map((type) => (type._id === editId ? updatedType : type))
      );
      cancelEdit();
    } catch (err: any) {
      setError(err.message || "Could not edit type");
    }
    setSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen  p-8"
    >
      <h1 className="text-2xl font-bold text-slate-800 mb-6">
        Therapy Types
      </h1>

      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex gap-2">
          <input
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            placeholder="Add new therapy type"
            className="flex-1 border rounded px-3 py-2"
            onKeyDown={e => {
              if (e.key === "Enter") addType();
            }}
            disabled={submitting}
          />
          <button
            onClick={addType}
            className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded"
            disabled={submitting}
          >
            <FiPlus /> Add
          </button>
        </div>
        {error && (
          <div className="mt-2 text-sm text-red-600">{error}</div>
        )}
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-slate-500">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Therapy Type</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {types.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-5 text-center text-slate-500"
                  >
                    No therapy types found.
                  </td>
                </tr>
              ) : (
                types.map((type) =>
                  editId === type._id ? (
                    <tr key={type._id} className="border-t bg-yellow-50">
                      <td className="px-4 py-3">
                        <input
                          value={editName}
                          className="w-full border rounded px-2 py-1"
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") saveEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                          disabled={submitting}
                        />
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={saveEdit}
                          className="inline-flex items-center gap-1 border border-green-300 text-green-700 px-3 py-1 rounded text-xs"
                          disabled={submitting}
                          title="Save"
                        >
                          <FiCheck /> Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="inline-flex items-center gap-1 border border-gray-200 text-gray-600 px-3 py-1 rounded text-xs"
                          disabled={submitting}
                          title="Cancel"
                        >
                          <FiX /> Cancel
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={type._id} className="border-t">
                      <td className="px-4 py-3">{type.name}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          className="inline-flex items-center gap-1 border px-3 py-1 rounded text-xs"
                          onClick={() => beginEdit(type)}
                          disabled={submitting}
                        >
                          <FiEdit /> Edit
                        </button>
                        <button
                          onClick={() => deleteType(type._id)}
                          className="inline-flex items-center gap-1 border border-red-300 text-red-600 px-3 py-1 rounded text-xs"
                          disabled={submitting}
                        >
                          <FiTrash /> Delete
                        </button>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}
