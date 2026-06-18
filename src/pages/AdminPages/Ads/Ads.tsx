


import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import { AdminDataTable, tableCell } from "../../../components/admin/AdminDataTable";

// ---- Types ----
interface BusinessProfile {
  _id: string; businessName?: string; businessAddress?: string; city?: string; pincode?: string; businessPhone?: string;
}
interface AutoShopOwner {
  _id: string; name?: string; email?: string; phone?: string; countryCode?: string;
  isDisabled?: boolean; isProfileComplete?: boolean; businessProfile?: BusinessProfile | null; createdAt?: string;
}
interface Ad {
  _id: string; category: string; websiteURL: string; imageUpload: string; createdAt: string; updatedAt: string;
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

// ---- Modal for Viewing & Managing Ads for each Shop Owner ----
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
}> = ({
  open,
  onClose,
  owner,
  ads,
  adsLoading,
  adsError,
  onAdd,
  onEdit,
  onDelete,
}) => {
  if (!open || !owner) return null;

  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded border border-[#d2d6de] bg-white shadow-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#f4f4f4] px-6 py-4">
          <div>
            <span className="font-bold text-[#007bff] text-lg">
              {owner.businessProfile?.businessName || owner.name}
            </span>
            <span className="ml-3 text-[#777] text-sm">
              {owner.name}
              {owner.businessProfile?.businessAddress ? ` · ${owner.businessProfile.businessAddress}` : ""}
            </span>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="text-2xl text-[#999] hover:text-[#555]"
          >
            ×
          </button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-auto">
          <div className="flex justify-between mb-5">
            <h3 className="text-[18px] font-bold text-[#333]">Ads List</h3>
            <button
              onClick={onAdd}
              className="rounded bg-[#007bff] px-5 py-2 font-bold text-white hover:bg-[#0069d9] text-sm"
            >
              + Add Ad
            </button>
          </div>
          {adsLoading && (
            <div className="text-center text-[#007bff] font-bold mb-5">Loading Ads…</div>
          )}
          {adsError && (
            <div className="rounded border border-[#f5c6cb] bg-[#f8d7da] px-4 py-2 text-[#721c24] mb-5">
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
                      className={`border border-[#d2d6de] bg-[#f9fafc] px-4 py-3 font-bold whitespace-nowrap ${i === 4 ? "text-center" : "text-left"}`}
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
                          src={ad.imageUpload.startsWith("http") ? ad.imageUpload : `${API_URL}/${ad.imageUpload.replace(/^\.?\/?/, "")}`}
                          alt={ad.category}
                          className="h-14 w-20 rounded object-cover border border-[#f1f5f9] bg-[#f3f4f6]"
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
                      <a href={ad.websiteURL} target="_blank" rel="noopener noreferrer" className="text-[#007bff] underline break-all">
                        {ad.websiteURL}
                      </a>
                    </td>
                    <td className="border border-[#d2d6de] px-4 py-4 text-[#777]">
                      {new Date(ad.createdAt).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="border border-[#d2d6de] h-full px-4 py-4 text-center">
                      <button
                        onClick={() => onEdit(ad)}
                        className="mr-2 my-2 rounded bg-[#17a2b8] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(ad._id)}
                        className="rounded bg-[#dc3545] my-2 px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
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

// ---- Modal for Add/Edit Ad ----
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
}> = ({ open, onClose, onSubmit, form, handleFormChange, formMode, imageInputRef, adsLoading, adsError, onCancel }) => {
  if (!open) return null;

  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[450px] rounded border border-[#d2d6de] bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[#f4f4f4] px-6 py-4 flex items-center justify-between">
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
                <option key={opt.value} value={opt.value}>{opt.label}</option>
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


// ---- Main Component ----
const Ads: React.FC = () => {
  const [owners, setOwners] = useState<AutoShopOwner[]>([]);
  const [ownersLoading, setOwnersLoading] = useState(false);
  const [ownersError, setOwnersError] = useState<string | null>(null);

  // For modal handling:
  const [selectedOwnerForModal, setSelectedOwnerForModal] = useState<AutoShopOwner | null>(null);

  // For showing/hiding modals:
  const [showOwnerAdsModal, setShowOwnerAdsModal] = useState(false);
  const [showAdFormModal, setShowAdFormModal] = useState(false);

  // For ads list inside modal:
  const [ads, setAds] = useState<Ad[]>([]);
  const [adsLoading, setAdsLoading] = useState(false);
  const [adsError, setAdsError] = useState<string | null>(null);

  // For add/edit form:
  const [form, setForm] = useState<{ category: string; websiteURL: string; imageUpload: File | null }>({
    category: "", websiteURL: "", imageUpload: null,
  });
  const [formMode, setFormMode] = useState<"CREATE" | "EDIT" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // Owner filtering:
  const [ownerSearch, setOwnerSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleCols, setVisibleCols] = useState(["ownerName", "shopName", "address", "phone", "status"]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => { fetchOwners(); }, []);

  const fetchOwners = async () => {
    setOwnersLoading(true);
    setOwnersError(null);
    try {
      const res = await axios.get(`${API_URL}/api/admin/autoshopowners`);
      setOwners(res.data.data || []);
    } catch (err: any) {
      setOwnersError(err?.response?.data?.message || "Failed to fetch shop owners");
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
    } catch (err: any) {
      setAdsError(err?.response?.data?.message || "Failed to fetch ads");
    } finally {
      setAdsLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, files } = e.target as any;
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

  // Open owner ads modal and fetch ads for that owner
  const handleOpenOwnerAdsModal = async (owner: AutoShopOwner) => {
    setSelectedOwnerForModal(owner);
    setShowOwnerAdsModal(true);
    setAds([]);
    setAdsError(null);
    setFormMode(null);
    resetForm();
    await fetchAds(owner);
  };

  // Close owner ads modal and reset
  const handleCloseOwnerAdsModal = () => {
    setShowOwnerAdsModal(false);
    setSelectedOwnerForModal(null);
    setAds([]);
    setFormMode(null);
    resetForm();
  };

  // Open form modal for add
  const handleOpenAddAd = () => {
    setFormMode("CREATE");
    resetForm();
    setShowAdFormModal(true);
  };

  // Open form modal for edit
  const handleEdit = (ad: Ad) => {
    setFormMode("EDIT");
    setEditId(ad._id);
    setForm({ category: ad.category, websiteURL: ad.websiteURL, imageUpload: null });
    setShowAdFormModal(true);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  // Close ad form modal
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
      await axios.delete(`${API_URL}/api/admin/business-profiles/${selectedOwnerForModal.businessProfile._id}/ads/${adId}`);
      await fetchAds(selectedOwnerForModal);
    } catch (err: any) {
      setAdsError(err?.response?.data?.message || "Failed to delete ad");
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
    } catch (err: any) {
      setAdsError(err?.response?.data?.message || "Failed to save ad");
    } finally {
      setAdsLoading(false);
    }
  };

  const filteredOwners = owners.filter((o) => {
    const q = ownerSearch.toLowerCase();
    return (
      o.name?.toLowerCase().includes(q) ||
      o.businessProfile?.businessName?.toLowerCase().includes(q) ||
      o.email?.toLowerCase().includes(q) ||
      o.phone?.includes(q)
    );
  });

  const tableColumns = useMemo(
    () => [
      {
        key: "ownerName",
        label: "Owner Name",
        render: (owner: AutoShopOwner) =>
          tableCell(<span style={{ fontWeight: 500 }}>{owner.name || "—"}</span>),
        exportValue: (owner: AutoShopOwner) => owner.name || "—",
      },
      {
        key: "shopName",
        label: "Shop Name",
        render: (owner: AutoShopOwner) =>
          tableCell(
            owner.businessProfile?.businessName || (
              <span style={{ fontStyle: "italic", color: "#bbb" }}>No business profile</span>
            )
          ),
        exportValue: (owner: AutoShopOwner) => owner.businessProfile?.businessName || "—",
      },
      {
        key: "address",
        label: "Address / City",
        render: (owner: AutoShopOwner) =>
          tableCell(
            [owner.businessProfile?.businessAddress, owner.businessProfile?.city].filter(Boolean).join(", ") || "—",
            { maxWidth: 220 }
          ),
        exportValue: (owner: AutoShopOwner) =>
          [owner.businessProfile?.businessAddress, owner.businessProfile?.city].filter(Boolean).join(", ") || "—",
      },
      {
        key: "phone",
        label: "Phone",
        render: (owner: AutoShopOwner) =>
          tableCell(`${owner.countryCode ? `${owner.countryCode} ` : ""}${owner.phone || "—"}`),
        exportValue: (owner: AutoShopOwner) =>
          `${owner.countryCode ? `${owner.countryCode} ` : ""}${owner.phone || "—"}`,
      },
      {
        key: "status",
        label: "Status",
        render: (owner: AutoShopOwner) => {
          const status = getOwnerStatus(owner);
          return tableCell(
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                borderRadius: 999,
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 700,
                background: `${status.color}1a`,
                color: status.color,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: status.color }} />
              {status.label}
            </span>
          );
        },
        exportValue: (owner: AutoShopOwner) => getOwnerStatus(owner).label,
      },
    ],
    []
  );

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-white py-4 md:py-5 font-sans">
      {/* Heading */}
      <h1 className="mb-6 text-xl md:text-2xl font-bold text-ad-green mb-4">Manage Ads</h1>

      {/* ── SECTION 1: Owners ── */}
      <div className="mb-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="inline text-[18px] font-normal text-[#444]">Auto Shop Owners</h3>
            {!ownersLoading && (
              <span className="ml-2 text-[13px] text-[#999]">
                {filteredOwners.length} of {owners.length}
              </span>
            )}
          </div>
        </div>

        <AdminDataTable
          items={filteredOwners}
          columns={tableColumns}
          getRowId={(o) => o._id}
          loading={ownersLoading}
          error={ownersError}
          emptyMessage="No owners found."
          search={ownerSearch}
          onSearchChange={setOwnerSearch}
          searchPlaceholder="Search by name, shop or phone…"
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          currentPage={currentPage}
          onCurrentPageChange={setCurrentPage}
          visibleColumnKeys={visibleCols}
          onVisibleColumnKeysChange={setVisibleCols}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          exportFilename="ads-owners"
          totalBeforeFilter={owners.length}
          extraToolbarActions={[
            {
              label: "View Ads",
              color: "#10b981",
              minSelected: 1,
              maxSelected: 1,
              onClick: (ids) => {
                const owner = owners.find((o) => o._id === ids[0]);
                if (owner?.businessProfile?._id) handleOpenOwnerAdsModal(owner);
              },
            },
          ]}
          renderActions={(owner) => {
            const canSelect = !!owner.businessProfile?._id;
            return (
              <button
                disabled={!canSelect}
                title={
                  !canSelect
                    ? "This owner has no business profile — ads unavailable"
                    : "Show Ads"
                }
                onClick={() => canSelect && handleOpenOwnerAdsModal(owner)}
                type="button"
                style={{
                  borderRadius: 4,
                  padding: "4px 16px",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#fff",
                  border: "none",
                  cursor: canSelect ? "pointer" : "not-allowed",
                  background: canSelect ? "#10b981" : "#ddd",
                }}
              >
                View Ads
              </button>
            );
          }}
        />
      </div>

      {/* Owner Ads Modal */}
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

      {/* Ad Form Modal */}
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
    </div>
  );
};

export default Ads;