import React, { useEffect, useState } from "react";
import { FiTag, FiCheckCircle, FiEdit, FiTrash2, FiPlusCircle } from "react-icons/fi";
import { motion } from "framer-motion";

// You can replace this with your Toast utility or Ant message -- shown with window.alert for now
const showToast = (msg: string, type: "success" | "error") => {
  if (type === "success") {
    window.alert(msg);
  } else {
    window.alert(msg);
  }
};

const API_BASE_URL = import.meta.env.VITE_API_URL || "";
const API_BASE = `${API_BASE_URL}/api/super-admin/discount-coupons`;

interface DiscountCoupon {
  _id?: string;
  couponCode: string;
  discount: number;
  discountEnabled: boolean;
  validityDays: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function ManageDiscounts() {
  const [coupons, setCoupons] = useState<DiscountCoupon[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [editCoupon, setEditCoupon] = useState<DiscountCoupon | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({
    couponCode: "",
    discount: 1,
    discountEnabled: true,
    validityDays: 1,
  });
  const [modalLoading, setModalLoading] = useState(false);

  // Fetch all coupons
  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE);
      const data = await res.json();
      if (data.success) {
        setCoupons(Array.isArray(data.data) ? data.data : []);
      } else {
        showToast(data.error || "Failed to fetch discount coupons", "error");
      }
    } catch (err) {
      showToast("Failed to fetch discount coupons", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // Modal Open for ADD
  const handleAdd = () => {
    setEditCoupon(null);
    setModalForm({
      couponCode: "",
      discount: 1,
      discountEnabled: true,
      validityDays: 1,
    });
    setModalOpen(true);
  };

  // Modal Open for EDIT
  const handleEdit = (coupon: DiscountCoupon) => {
    setEditCoupon(coupon);
    setModalForm({
      couponCode: coupon.couponCode,
      discount: coupon.discount,
      discountEnabled: coupon.discountEnabled,
      validityDays: coupon.validityDays,
    });
    setModalOpen(true);
  };

  // Modal Cancel
  const handleModalCancel = () => {
    setModalOpen(false);
    setEditCoupon(null);
    setModalForm({
      couponCode: "",
      discount: 1,
      discountEnabled: true,
      validityDays: 1,
    });
    setModalLoading(false);
  };

  // Modal Save
  const handleModalSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!modalForm.couponCode.trim().match(/^[A-Za-z0-9_-]+$/) || modalForm.couponCode.trim() === "") {
      showToast("Please enter a valid coupon code (alphanumeric, dash, or underscore only)", "error");
      return;
    }
    if (!(modalForm.discount >= 1 && modalForm.discount <= 100)) {
      showToast("Discount should be 1-100", "error");
      return;
    }
    if (!modalForm.validityDays || modalForm.validityDays < 1) {
      showToast("Minimum 1 validity day", "error");
      return;
    }
    setModalLoading(true);

    try {
      if (editCoupon) {
        // Update existing
        const res = await fetch(`${API_BASE}/${editCoupon.couponCode}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(modalForm),
        });
        const data = await res.json();
        if (data.success) {
          showToast("Discount coupon updated.", "success");
          setModalOpen(false);
          setEditCoupon(null);
          fetchCoupons();
        } else {
          showToast(data.error || "Failed to update coupon.", "error");
        }
      } else {
        // Add new
        const res = await fetch(API_BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(modalForm),
        });
        const data = await res.json();
        if (data.success) {
          showToast("Discount coupon created.", "success");
          setModalOpen(false);
          setEditCoupon(null);
          fetchCoupons();
        } else {
          showToast(data.error || "Failed to add coupon.", "error");
        }
      }
    } catch (err) {
      showToast("Something went wrong.", "error");
    }
    setModalLoading(false);
  };

  // Delete coupon
  const handleDelete = async (coupon: DiscountCoupon) => {
    if (!window.confirm(`Delete coupon "${coupon.couponCode}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE}/${coupon.couponCode}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("Coupon deleted.", "success");
        fetchCoupons();
      } else {
        showToast(data.error || "Failed to delete coupon.", "error");
      }
    } catch {
      showToast("Failed to delete coupon.", "error");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen p-8"
    >
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Discount Coupons</h1>

      <div className="mb-6 flex justify-between items-center">
        <div>
          <button
            className="inline-flex items-center gap-1  rounded-md bg-blue-600 px-4 py-2  text-white hover:bg-blue-700"
            onClick={handleAdd}
          >
            <FiPlusCircle /> Add Discount Coupon
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left">Coupon Code</th>
              <th className="px-4 py-3 text-left">Discount (%)</th>
              <th className="px-4 py-3 text-left">Enabled</th>
              <th className="px-4 py-3 text-left">Validity (Days)</th>
              <th className="px-4 py-3 text-left">Created At</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c._id || c.couponCode} className="border-t">
                <td className="px-4 py-4 font-semibold text-slate-700 flex items-center gap-2">
                  <FiTag className="text-blue-600" />
                  {c.couponCode}
                  {c.discountEnabled && (
                    <FiCheckCircle className="ml-2 text-green-500" title="Active" />
                  )}
                </td>
                <td className="px-4 py-4">{c.discount}%</td>
                <td className="px-4 py-4">
                  {c.discountEnabled ? (
                    <span className="text-green-600 font-medium">Yes</span>
                  ) : (
                    <span className="text-slate-400">No</span>
                  )}
                </td>
                <td className="px-4 py-4">{c.validityDays}</td>
                <td className="px-4 py-4">
                  {c.createdAt
                    ? new Date(c.createdAt).toLocaleDateString("en-IN")
                    : <span className="italic text-slate-400">N/A</span>}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
                      onClick={() => handleEdit(c)}
                    >
                      <FiEdit /> Edit
                    </button>
                    <button
                      className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(c)}
                      title="Delete"
                    >
                      <FiTrash2 /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center p-6 text-slate-400">
                  {loading ? "Loading..." : "No discount coupons found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Add / Edit */}
      {modalOpen && (
        <div className="fixed z-50 inset-0 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full relative">
            <button
              className="absolute top-3 right-3 text-lg text-slate-400 hover:text-red-500"
              onClick={handleModalCancel}
            >
              &times;
            </button>
            <h2 className="text-lg font-bold mb-4">
              {editCoupon ? "Edit Discount Coupon" : "Add Discount Coupon"}
            </h2>
            <form
              onSubmit={handleModalSave}
              className="space-y-4"
              autoComplete="off"
            >
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Coupon Code
                </label>
                <input
                  type="text"
                  className={`w-full border rounded px-3 py-2 ${editCoupon ? "bg-gray-100 text-gray-600 cursor-not-allowed" : ""}`}
                  value={modalForm.couponCode}
                  onChange={e =>
                    setModalForm(f => ({
                      ...f,
                      couponCode: e.target.value.toUpperCase(),
                    }))
                  }
                  disabled={!!editCoupon}
                  autoFocus
                  spellCheck={false}
                  required
                  pattern="^[A-Za-z0-9_-]+$"
                  title="Alphanumeric, dash or underscore only"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Discount (%)
                </label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2"
                  value={modalForm.discount}
                  min={1}
                  max={100}
                  onChange={e =>
                    setModalForm(f => ({
                      ...f,
                      discount: Number(e.target.value)
                    }))
                  }
                  required
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Enabled
                </label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={modalForm.discountEnabled ? "true" : "false"}
                  onChange={e =>
                    setModalForm(f => ({
                      ...f,
                      discountEnabled: e.target.value === "true"
                    }))
                  }
                  required
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Validity (Days)
                </label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2"
                  value={modalForm.validityDays}
                  min={1}
                  onChange={e =>
                    setModalForm(f => ({
                      ...f,
                      validityDays: Number(e.target.value)
                    }))
                  }
                  required
                />
              </div>
              <div className="flex justify-end gap-4 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 rounded border"
                  onClick={handleModalCancel}
                  disabled={modalLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded text-white ${modalLoading ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"}`}
                  disabled={modalLoading}
                >
                  {modalLoading
                    ? (editCoupon ? "Saving..." : "Creating...")
                    : (editCoupon ? "Save" : "Create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}

