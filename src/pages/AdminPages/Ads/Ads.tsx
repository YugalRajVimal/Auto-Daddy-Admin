import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import axios from "axios";
import AdminPage from "../../../components/admin/AdminPage";

interface BusinessProfile {
  _id: string;
  businessName?: string;
  businessAddress?: string;
  city?: string;
  pincode?: string;
  businessPhone?: string;
}

interface AutoShopOwner {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
  isDisabled?: boolean;
  isProfileComplete?: boolean;
  businessProfile?: BusinessProfile | null;
  createdAt?: string;
}

interface Ad {
  _id: string;
  category: string;
  websiteURL: string;
  imageUpload: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_OPTIONS = [
  { label: "Deals", value: "Deals" },
  { label: "Ads", value: "Ads" },
  { label: "Calendor", value: "Calendor" },
];

const API_URL = import.meta.env.VITE_API_URL;

function getOwnerStatus(owner: AutoShopOwner): { label: string; color: string } {
  if (owner.isDisabled) return { label: "Suspended", color: "#dc3545" };
  if (!owner.isProfileComplete) return { label: "Incomplete", color: "#ffc107" };
  if (!owner.businessProfile) return { label: "No Business", color: "#999" };
  return { label: "Active", color: "#28a745" };
}

const OwnerAdsModal: React.FC<{
  open: boolean;
  onClose: () => void;
  owner: AutoShopOwner | null;
  ads: Ad[];
  adsLoading: boolean;
  adsError: string | null;
  onAdd: () => void;
  onEdit: (ad: Ad) => void;
  onDelete: (adId: string) => void;
}> = ({ open, onClose, owner, ads, adsLoading, adsError, onAdd, onEdit, onDelete }) => {
  if (!open || !owner) return null;

  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="relative w-full max-w-3xl rounded border border-[#d2d6de] bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#f4f4f4] px-6 py-4">
          <div>
            <span className="text-lg font-bold text-[#007bff]">
              {owner.businessProfile?.businessName || owner.name}
            </span>
            <span className="ml-3 text-sm text-[#777]">
              {owner.name}
              {owner.businessProfile?.businessAddress ? ` · ${owner.businessProfile.businessAddress}` : ""}
            </span>
          </div>
          <button aria-label="Close" onClick={onClose} className="text-2xl text-[#999] hover:text-[#555]">
            ×
          </button>
        </div>
        <div className="max-h-[60vh] overflow-auto p-6">
          <div className="mb-5 flex justify-between">
            <h3 className="text-[18px] font-bold text-[#333]">Ads List</h3>
            <button
              onClick={onAdd}
              className="rounded bg-[#007bff] px-5 py-2 text-sm font-bold text-white hover:bg-[#0069d9]"
            >
              Add Ad
            </button>
          </div>
          {adsLoading && <div className="mb-5 text-center font-bold text-[#007bff]">Loading Ads…</div>}
          {adsError && (
            <div className="mb-5 rounded border border-[#f5c6cb] bg-[#f8d7da] px-4 py-2 text-[#721c24]">
              {adsError}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {["Image", "Category", "Website URL", "Created", "Actions"].map((h, i) => (
                    <th
                      key={h}
                      className={`whitespace-nowrap border border-[#d2d6de] bg-[#f9fafc] px-4 py-3 font-bold ${i === 4 ? "text-center" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ads.length === 0 && !adsLoading && (
                  <tr>
                    <td colSpan={5} className="border border-[#d2d6de] px-4 py-10 text-center text-[#999]">
                      No ads yet for this shop.
                    </td>
                  </tr>
                )}
                {ads.map((ad) => (
                  <tr key={ad._id} className="hover:bg-[#f9fafc]">
                    <td className="border border-[#d2d6de] px-4 py-4">
                      {ad.imageUpload ? (
                        <img
                          src={
                            ad.imageUpload.startsWith("http")
                              ? ad.imageUpload
                              : `${API_URL}/${ad.imageUpload.replace(/^\.?\/?/, "")}`
                          }
                          alt={ad.category}
                          className="h-14 w-20 rounded border border-[#f1f5f9] bg-[#f3f4f6] object-cover"
                        />
                      ) : (
                        <span className="italic text-[#bbb]">No Image</span>
                      )}
                    </td>
                    <td className="border border-[#d2d6de] px-4 py-4">
                      <span className="rounded bg-[#f4f4f4] px-3 py-1 text-xs font-bold text-[#555]">
                        {ad.category}
                      </span>
                    </td>
                    <td className="border border-[#d2d6de] px-4 py-4">
                      <a
                        href={ad.websiteURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-[#007bff] underline"
                      >
                        {ad.websiteURL}
                      </a>
                    </td>
                    <td className="border border-[#d2d6de] px-4 py-4 text-[#777]">
                      {new Date(ad.createdAt).toLocaleString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="h-full border border-[#d2d6de] px-4 py-4 text-center">
                      <button
                        onClick={() => onEdit(ad)}
                        className="my-2 mr-2 rounded bg-[#17a2b8] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(ad._id)}
                        className="my-2 rounded bg-[#dc3545] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdFormModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  form: { category: string; websiteURL: string; imageUpload: File | null };
  handleFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  formMode: "CREATE" | "EDIT";
  imageInputRef: React.RefObject<HTMLInputElement>;
  adsLoading: boolean;
  adsError: string | null;
  onCancel: () => void;
}> = ({
  open,
  onClose,
  onSubmit,
  form,
  handleFormChange,
  formMode,
  imageInputRef,
  adsLoading,
  adsError,
  onCancel,
}) => {
  if (!open) return null;

  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="relative w-full max-w-[450px] rounded border border-[#d2d6de] bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#f4f4f4] px-6 py-4">
          <h3 className="text-[18px] font-normal text-[#444]">
            {formMode === "CREATE" ? "Add New Ad" : "Edit Ad"}
          </h3>
          <button type="button" aria-label="Close" onClick={onClose} className="text-2xl text-[#999] hover:text-[#555]">
            ×
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6">
          <div className="mb-4">
            <label className="mb-1 block text-[14px] font-bold text-[#333]">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleFormChange}
              required
              className="h-9 w-full rounded border border-[#d2d6de] px-3 outline-none"
            >
              <option value="">Select Category</option>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-[14px] font-bold text-[#333]">Website URL</label>
            <input
              type="url"
              name="websiteURL"
              value={form.websiteURL}
              onChange={handleFormChange}
              required
              placeholder="https://example.com"
              className="h-9 w-full rounded border border-[#d2d6de] px-3 outline-none"
            />
          </div>
          <div className="mb-5">
            <label className="mb-1 block text-[14px] font-bold text-[#333]">
              {formMode === "CREATE" ? "Ad Image" : "Change Ad Image (optional)"}
            </label>
            <input
              type="file"
              name="adsImage"
              accept="image/*"
              onChange={handleFormChange}
              ref={imageInputRef}
              required={formMode === "CREATE"}
              className="block w-full text-[14px]"
            />
            {form.imageUpload && (
              <span className="mt-1 block text-[13px] text-[#007bff]">{form.imageUpload.name}</span>
            )}
          </div>
          <div className="flex justify-center gap-3">
            <button
              type="submit"
              disabled={adsLoading}
              className="h-9 rounded bg-[#007bff] px-6 font-bold text-white hover:bg-[#0069d9] disabled:opacity-60"
            >
              {formMode === "CREATE" ? "Create Ad" : "Update Ad"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={adsLoading}
              className="h-9 rounded border border-[#d2d6de] bg-white px-5 font-bold text-[#555] hover:bg-[#f4f4f4]"
            >
              Cancel
            </button>
          </div>
          {adsError && (
            <div className="mt-4 rounded border border-[#f5c6cb] bg-[#f8d7da] px-4 py-2 text-center text-[#721c24]">
              {adsError}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

const Ads: React.FC = () => {
  const [owners, setOwners] = useState<AutoShopOwner[]>([]);
  const [ownersLoading, setOwnersLoading] = useState(false);
  const [ownersError, setOwnersError] = useState<string | null>(null);

  const [selectedOwnerForModal, setSelectedOwnerForModal] = useState<AutoShopOwner | null>(null);
  const [showOwnerAdsModal, setShowOwnerAdsModal] = useState(false);
  const [showAdFormModal, setShowAdFormModal] = useState(false);

  const [ads, setAds] = useState<Ad[]>([]);
  const [adsLoading, setAdsLoading] = useState(false);
  const [adsError, setAdsError] = useState<string | null>(null);

  const [form, setForm] = useState<{ category: string; websiteURL: string; imageUpload: File | null }>({
    category: "",
    websiteURL: "",
    imageUpload: null,
  });
  const [formMode, setFormMode] = useState<"CREATE" | "EDIT" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchOwners();
  }, []);

  const fetchOwners = async () => {
    setOwnersLoading(true);
    setOwnersError(null);
    try {
      const res = await axios.get(`${API_URL}/api/admin/autoshopowners`);
      setOwners(res.data.data || []);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setOwnersError(message || "Failed to fetch shop owners");
    } finally {
      setOwnersLoading(false);
    }
  };

  const fetchAds = async (owner: AutoShopOwner) => {
    setAdsLoading(true);
    setAdsError(null);
    setAds([]);
    try {
      const businessId = owner.businessProfile?._id;
      if (!businessId) {
        setAds([]);
        setAdsLoading(false);
        return;
      }
      const res = await axios.get(`${API_URL}/api/admin/business-profiles/${businessId}/ads`);
      setAds(res.data.data || []);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setAdsError(message || "Failed to fetch ads");
    } finally {
      setAdsLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (name === "adsImage") {
      setForm((prev) => ({ ...prev, imageUpload: files?.[0] ?? null }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setForm({ category: "", websiteURL: "", imageUpload: null });
    setFormMode(null);
    setEditId(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleOpenOwnerAdsModal = async (owner: AutoShopOwner) => {
    setSelectedOwnerForModal(owner);
    setShowOwnerAdsModal(true);
    setAds([]);
    setAdsError(null);
    setFormMode(null);
    resetForm();
    await fetchAds(owner);
  };

  const handleCloseOwnerAdsModal = () => {
    setShowOwnerAdsModal(false);
    setSelectedOwnerForModal(null);
    setAds([]);
    setFormMode(null);
    resetForm();
  };

  const handleOpenAddAd = () => {
    setFormMode("CREATE");
    resetForm();
    setShowAdFormModal(true);
  };

  const handleEdit = (ad: Ad) => {
    setFormMode("EDIT");
    setEditId(ad._id);
    setForm({ category: ad.category, websiteURL: ad.websiteURL, imageUpload: null });
    setShowAdFormModal(true);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleCloseAdFormModal = () => {
    setFormMode(null);
    setShowAdFormModal(false);
    resetForm();
  };

  const handleDelete = async (adId: string) => {
    if (!selectedOwnerForModal?.businessProfile?._id || !window.confirm("Delete this ad?")) return;
    setAdsLoading(true);
    setAdsError(null);
    try {
      await axios.delete(
        `${API_URL}/api/admin/business-profiles/${selectedOwnerForModal.businessProfile._id}/ads/${adId}`
      );
      await fetchAds(selectedOwnerForModal);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setAdsError(message || "Failed to delete ad");
    } finally {
      setAdsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedOwnerForModal?.businessProfile?._id) return;
    const businessId = selectedOwnerForModal.businessProfile._id;
    if (!form.category || !form.websiteURL || (formMode === "CREATE" && !form.imageUpload)) {
      setAdsError("All fields are required.");
      return;
    }
    setAdsLoading(true);
    setAdsError(null);
    try {
      const fd = new FormData();
      fd.append("category", form.category);
      fd.append("websiteURL", form.websiteURL);
      if (form.imageUpload) fd.append("adsImage", form.imageUpload);

      const headers = { "Content-Type": "multipart/form-data" };
      if (formMode === "CREATE") {
        await axios.post(`${API_URL}/api/admin/business-profiles/${businessId}/ads`, fd, { headers });
      } else if (formMode === "EDIT" && editId) {
        await axios.patch(`${API_URL}/api/admin/business-profiles/${businessId}/ads/${editId}`, fd, { headers });
      }
      handleCloseAdFormModal();
      await fetchAds(selectedOwnerForModal);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setAdsError(message || "Failed to save ad");
    } finally {
      setAdsLoading(false);
    }
  };

  const filteredOwners = owners.filter((o) => {
    const q = search.toLowerCase();
    return (
      o.name?.toLowerCase().includes(q) ||
      o.businessProfile?.businessName?.toLowerCase().includes(q) ||
      o.email?.toLowerCase().includes(q) ||
      o.phone?.includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredOwners.length / entriesPerPage));
  const paged = filteredOwners.slice((page - 1) * entriesPerPage, page * entriesPerPage);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === paged.length) setSelected(new Set());
    else setSelected(new Set(paged.map((o) => o._id)));
  };

  const handleToolbarViewAds = () => {
    if (selected.size !== 1) return;
    const owner = owners.find((o) => o._id === Array.from(selected)[0]);
    if (owner?.businessProfile?._id) handleOpenOwnerAdsModal(owner);
  };

  return (
    <>
      <OwnerAdsModal
        open={showOwnerAdsModal}
        onClose={handleCloseOwnerAdsModal}
        owner={selectedOwnerForModal}
        ads={ads}
        adsLoading={adsLoading}
        adsError={adsError}
        onAdd={handleOpenAddAd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <AdFormModal
        open={showAdFormModal}
        onClose={handleCloseAdFormModal}
        onSubmit={handleSubmit}
        form={form}
        handleFormChange={handleFormChange}
        formMode={formMode as "CREATE" | "EDIT"}
        imageInputRef={imageInputRef as React.RefObject<HTMLInputElement>}
        adsLoading={adsLoading}
        adsError={adsError}
        onCancel={handleCloseAdFormModal}
      />

      <AdminPage title="Manage Ads" noPanel>
        {ownersError && (
          <div className="mb-2 rounded border border-red-200 bg-red-100 px-3 py-2 text-xs text-red-800">
            {ownersError}
          </div>
        )}

        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              disabled={selected.size !== 1}
              onClick={handleToolbarViewAds}
              className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              View Ads
            </button>
            <button type="button" className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700">
              Shoot
            </button>
            <button type="button" className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700">
              Delete
            </button>
            <button type="button" className="bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark">
              Print
            </button>
          </div>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Live Search here"
              className="border border-gray-400 bg-white px-2 py-1 text-xs"
            />
            <button type="button" className="bg-gray-500 px-3 py-1 text-xs font-medium text-white hover:bg-gray-600">
              Search
            </button>
          </div>
        </div>

        <div className="mb-2 flex items-center gap-2 text-xs text-gray-700">
          <span>Show</span>
          <select
            value={entriesPerPage}
            onChange={(e) => {
              setEntriesPerPage(Number(e.target.value));
              setPage(1);
            }}
            className="border border-gray-400 px-1 py-0.5"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-ad-purple text-white">
                <th className="border border-ad-purple-dark px-2 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={paged.length > 0 && selected.size === paged.length}
                    onChange={toggleSelectAll}
                    className="accent-white"
                  />
                </th>
                <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Owner Name</th>
                <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Shop Name</th>
                <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Address / City</th>
                <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Phone</th>
                <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Status</th>
                <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {ownersLoading ? (
                <tr>
                  <td colSpan={7} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                    No owners found.
                  </td>
                </tr>
              ) : (
                paged.map((owner, idx) => {
                  const status = getOwnerStatus(owner);
                  const canSelect = !!owner.businessProfile?._id;
                  const address =
                    [owner.businessProfile?.businessAddress, owner.businessProfile?.city]
                      .filter(Boolean)
                      .join(", ") || "—";

                  return (
                    <tr key={owner._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                      <td className="border border-gray-300 px-2 py-2">
                        <input
                          type="checkbox"
                          checked={selected.has(owner._id)}
                          onChange={() => toggleSelect(owner._id)}
                          className="accent-ad-purple"
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2">{owner.name || "—"}</td>
                      <td className="border border-gray-300 px-3 py-2">
                        {canSelect ? (
                          <button
                            type="button"
                            onClick={() => handleOpenOwnerAdsModal(owner)}
                            className="text-blue-700 hover:underline"
                          >
                            {owner.businessProfile?.businessName}
                          </button>
                        ) : (
                          <span className="italic text-gray-400">No business profile</span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">{address}</td>
                      <td className="border border-gray-300 px-3 py-2">
                        {owner.countryCode ? `${owner.countryCode} ` : ""}
                        {owner.phone || "—"}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-bold"
                          style={{ background: `${status.color}1a`, color: status.color }}
                        >
                          <span
                            className="inline-block h-1.5 w-1.5 rounded-full"
                            style={{ background: status.color }}
                          />
                          {status.label}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        <button
                          type="button"
                          disabled={!canSelect}
                          title={
                            !canSelect
                              ? "This owner has no business profile — ads unavailable"
                              : "Show Ads"
                          }
                          onClick={() => canSelect && handleOpenOwnerAdsModal(owner)}
                          className="rounded bg-ad-green px-3 py-1 text-xs font-semibold text-white hover:bg-ad-green-dark disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                          View Ads
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`h-7 w-7 border text-xs font-medium ${
                  page === p
                    ? "border-ad-green bg-ad-green text-white"
                    : "border-gray-400 bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <Link to="#" className="text-sm text-blue-700 hover:underline">
            Deleted
          </Link>
        </div>
      </AdminPage>
    </>
  );
};

export default Ads;
