import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiEdit, FiX, FiCheck } from "react-icons/fi";

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/admin/packages`
  : "/api/admin/packages";

type PackageType = {
  _id: string;
  name: string;
  price: number;
  tasksPerDay: number;
  taskRate: number;
  features: string[];
  bv: number;
};

function safeCurrency(val: unknown) {
  const num = typeof val === "number" ? val : Number(val);
  if (isNaN(num)) return "—";
  return num.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [loading, setLoading] = useState(true);

  // For editing package
  const [editId, setEditId] = useState<string | null>(null);
  const [editPkg, setEditPkg] = useState<{ name: string; price: string; tasksPerDay: string; taskRate: string; bv: string; features: string }>({
    name: "",
    price: "",
    tasksPerDay: "",
    taskRate: "",
    bv: "",
    features: ""
  });

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch all packages on mount
  useEffect(() => {
    setLoading(true);
    fetch(API_BASE + "/top3", {
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then(async (res) => {
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || "Failed to fetch packages");
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data.packages)) {
          setPackages(data.packages);
        } else if (Array.isArray(data)) {
          setPackages(data);
        } else {
          setPackages([]);
        }
      })
      .catch((err) => setError(err.message || "Could not fetch packages"))
      .finally(() => setLoading(false));
  }, []);

  // Enable edit mode for a package
  const beginEdit = (pkg: PackageType) => {
    setEditId(pkg._id);
    setEditPkg({
      name: pkg.name,
      price: String(pkg.price),
      tasksPerDay: String(pkg.tasksPerDay),
      taskRate: String(pkg.taskRate),
      bv: String(pkg.bv),
      features: (pkg.features || []).join("\n"),
    });
    setError(null);
  };

  // Cancel inline edit
  const cancelEdit = () => {
    setEditId(null);
    setEditPkg({ name: "", price: "", tasksPerDay: "", taskRate: "", bv: "", features: "" });
    setError(null);
  };

  // Save edited package
  const saveEdit = async () => {
    if (
      !editId ||
      !editPkg.name.trim() ||
      !editPkg.price.trim() ||
      !editPkg.tasksPerDay.trim() ||
      !editPkg.taskRate.trim() ||
      !editPkg.bv.trim()
    ) {
      setError("All fields are required");
      return;
    }
    setSubmitting(true);
    try {
      const price = Number(editPkg.price);
      const tasksPerDay = Number(editPkg.tasksPerDay);
      const taskRate = Number(editPkg.taskRate);
      const bv = Number(editPkg.bv);
      const features = editPkg.features
        .split("\n")
        .map(f => f.trim())
        .filter(Boolean);
      if ([price, tasksPerDay, taskRate, bv].some((val) => isNaN(val))) {
        setError("Price, Tasks Per Day, Task Rate, and BV must be numbers");
        setSubmitting(false);
        return;
      }
      const res = await fetch(`${API_BASE}/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editPkg.name,
          price,
          tasksPerDay,
          taskRate,
          bv,
          features,
        }),
      });
      if (!res.ok) throw new Error("Failed to edit package");
      const updated = await res.json();
      const updatedPkg = updated.package || updated;
      setPackages((prev) =>
        prev.map((p) => (p._id === editId ? updatedPkg : p))
      );
      cancelEdit();
    } catch (err: any) {
      setError(err.message || "Could not edit package");
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
        Packages
      </h1>

      {error && (
        <div className="bg-white border rounded-lg p-6 mb-6 mt-2 text-sm text-red-600">{error}</div>
      )}

      <div className="bg-white border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-slate-500">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Package Name</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Tasks/Day</th>
                <th className="px-4 py-3 text-right">Task Rate</th>
                <th className="px-4 py-3 text-right">BV</th>
                <th className="px-4 py-3 text-left">Features</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {packages.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-5 text-center text-slate-500"
                  >
                    No packages found.
                  </td>
                </tr>
              ) : (
                packages.map((pkg) =>
                  editId === pkg._id ? (
                    <tr key={pkg._id} className="border-t bg-yellow-50">
                      <td className="px-4 py-3">
                        <input
                          value={editPkg.name}
                          className="w-full border rounded px-2 py-1"
                          onChange={e =>
                            setEditPkg((p) => ({ ...p, name: e.target.value }))
                          }
                          onKeyDown={e => {
                            if (e.key === "Enter") saveEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                          disabled={submitting}
                          placeholder="Package name"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          value={editPkg.price}
                          className="w-20 border rounded px-2 py-1 text-right"
                          type="number"
                          min={0}
                          onChange={e =>
                            setEditPkg((p) => ({
                              ...p,
                              price: e.target.value,
                            }))
                          }
                          onKeyDown={e => {
                            if (e.key === "Enter") saveEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                          disabled={submitting}
                          placeholder="Price"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          value={editPkg.tasksPerDay}
                          className="w-20 border rounded px-2 py-1 text-right"
                          type="number"
                          min={0}
                          onChange={e =>
                            setEditPkg((p) => ({
                              ...p,
                              tasksPerDay: e.target.value,
                            }))
                          }
                          onKeyDown={e => {
                            if (e.key === "Enter") saveEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                          disabled={submitting}
                          placeholder="Tasks/day"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          value={editPkg.taskRate}
                          className="w-20 border rounded px-2 py-1 text-right"
                          type="number"
                          min={0}
                          onChange={e =>
                            setEditPkg((p) => ({
                              ...p,
                              taskRate: e.target.value,
                            }))
                          }
                          onKeyDown={e => {
                            if (e.key === "Enter") saveEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                          disabled={submitting}
                          placeholder="Task rate"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          value={editPkg.bv}
                          className="w-16 border rounded px-2 py-1 text-right"
                          type="number"
                          min={0}
                          onChange={e =>
                            setEditPkg((p) => ({
                              ...p,
                              bv: e.target.value,
                            }))
                          }
                          onKeyDown={e => {
                            if (e.key === "Enter") saveEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                          disabled={submitting}
                          placeholder="BV"
                        />
                      </td>
                      <td className="px-4 py-3 text-left">
                        <textarea
                          value={editPkg.features}
                          className="w-full border rounded px-2 py-1"
                          rows={2}
                          onChange={e =>
                            setEditPkg((p) => ({
                              ...p,
                              features: e.target.value,
                            }))
                          }
                          onKeyDown={e => {
                            if (e.key === "Escape") cancelEdit();
                          }}
                          disabled={submitting}
                          placeholder="One feature per line"
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
                    <tr key={pkg._id} className="border-t">
                      <td className="px-4 py-3">{pkg.name}</td>
                      <td className="px-4 py-3 text-right">{safeCurrency(pkg.price)}</td>
                      <td className="px-4 py-3 text-right">{pkg.tasksPerDay}</td>
                      <td className="px-4 py-3 text-right">{safeCurrency(pkg.taskRate)}</td>
                      <td className="px-4 py-3 text-right">{pkg.bv}</td>
                      <td className="px-4 py-3 text-left">
                        {pkg.features && Array.isArray(pkg.features) && pkg.features.length > 0 ? (
                          <ul className="list-disc list-inside">
                            {pkg.features.map((f, fi) => <li key={fi}>{f}</li>)}
                          </ul>
                        ) : (
                          <span className="text-slate-400 text-xs">(None)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          className="inline-flex items-center gap-1 border px-3 py-1 rounded text-xs"
                          onClick={() => beginEdit(pkg)}
                          disabled={submitting}
                        >
                          <FiEdit /> Edit
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
