import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import axios from "axios";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactFixedFieldWidth,
  compactInputClass,
} from "../../../components/admin/ContentPanel";

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

type AdsSection = "dealer" | "adds" | "invoices" | "payment";

type DealerAdRow = {
  id: string;
  shopName: string;
  phone: string;
  city: string;
  date: string;
  adds: number;
  invoice: number;
  daysLeft: number;
  sent: number;
  status: string;
  owner?: AutoShopOwner;
};

const CATEGORY_OPTIONS = [
  { label: "Deals", value: "Deals" },
  { label: "Ads", value: "Ads" },
  { label: "Calendor", value: "Calendor" },
];

const DEALER_HEADINGS = [
  { value: "all", label: "Select Heading" },
  { value: "shopName", label: "Shop Name" },
  { value: "phone", label: "Phone" },
  { value: "city", label: "City" },
  { value: "date", label: "Date" },
  { value: "adds", label: "Adds" },
  { value: "invoice", label: "Invoice" },
  { value: "daysLeft", label: "Days Left" },
  { value: "sent", label: "Sent" },
  { value: "status", label: "Status" },
];

const SECTION_TITLES: Record<AdsSection, string> = {
  dealer: "Dealer Adds",
  adds: "Adds",
  invoices: "Invoices",
  payment: "Payment",
};

const API_URL = import.meta.env.VITE_API_URL;

function formatDisplayDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function getOwnerStatus(owner: AutoShopOwner): { label: string; color: string } {
  if (owner.isDisabled) return { label: "Suspended", color: "#dc3545" };
  if (!owner.isProfileComplete) return { label: "Incomplete", color: "#ffc107" };
  if (!owner.businessProfile) return { label: "No Business", color: "#999" };
  return { label: "Active", color: "#28a745" };
}

function ownerToDealerRow(owner: AutoShopOwner, index: number): DealerAdRow {
  const status = getOwnerStatus(owner);
  return {
    id: owner._id,
    shopName: owner.businessProfile?.businessName || owner.name || "—",
    phone: `${owner.countryCode ? `${owner.countryCode} ` : ""}${owner.phone || "—"}`,
    city: owner.businessProfile?.city || "—",
    date: owner.createdAt ? formatDisplayDate(owner.createdAt) : "—",
    adds: (index % 7) + 1,
    invoice: 1000 + index,
    daysLeft: 30 - (index % 31),
    sent: index % 6,
    status: status.label,
    owner,
  };
}

function adImageUrl(imageUpload: string) {
  if (!imageUpload) return "";
  return imageUpload.startsWith("http")
    ? imageUpload
    : `${API_URL}/${imageUpload.replace(/^\.?\/?/, "")}`;
}

type AdsPageProps = {
  section?: AdsSection;
};

export default function Ads({ section = "dealer" }: AdsPageProps) {
  const [owners, setOwners] = useState<AutoShopOwner[]>([]);
  const [ownersLoading, setOwnersLoading] = useState(false);
  const [ownersError, setOwnersError] = useState<string | null>(null);

  const [activeOwner, setActiveOwner] = useState<AutoShopOwner | null>(null);
  const [viewingOwner, setViewingOwner] = useState<AutoShopOwner | null>(null);
  const [showForm, setShowForm] = useState(false);

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
  const [editExistingImage, setEditExistingImage] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const [search, setSearch] = useState("");
  const [heading, setHeading] = useState("all");
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (section === "dealer") fetchOwners();
  }, [section]);

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
    setEditExistingImage(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const openOwnerView = async (owner: AutoShopOwner) => {
    setActiveOwner(owner);
    setViewingOwner(owner);
    setShowForm(false);
    setAds([]);
    setAdsError(null);
    resetForm();
    await fetchAds(owner);
  };

  const closeOwnerView = () => {
    setViewingOwner(null);
    setActiveOwner(null);
    setAds([]);
    setShowForm(false);
    resetForm();
  };

  const openAddForm = (owner: AutoShopOwner) => {
    setActiveOwner(owner);
    setViewingOwner(null);
    setFormMode("CREATE");
    setForm({ category: "", websiteURL: "", imageUpload: null });
    setEditId(null);
    setEditExistingImage(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    setShowForm(true);
    setAdsError(null);
  };

  const openEditForm = (ad: Ad) => {
    setFormMode("EDIT");
    setEditId(ad._id);
    setEditExistingImage(ad.imageUpload || null);
    setForm({ category: ad.category, websiteURL: ad.websiteURL, imageUpload: null });
    if (imageInputRef.current) imageInputRef.current.value = "";
    setShowForm(true);
    setViewingOwner(null);
    setAdsError(null);
  };

  const handleCancelForm = () => {
    resetForm();
    setShowForm(false);
    if (activeOwner) setViewingOwner(activeOwner);
  };

  const handleDelete = async (adId: string) => {
    if (!activeOwner?.businessProfile?._id || !window.confirm("Delete this ad?")) return;
    setAdsLoading(true);
    setAdsError(null);
    try {
      await axios.delete(
        `${API_URL}/api/admin/business-profiles/${activeOwner.businessProfile._id}/ads/${adId}`
      );
      await fetchAds(activeOwner);
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

  const handleSave = async () => {
    if (!activeOwner?.businessProfile?._id || !formMode) return;
    const businessId = activeOwner.businessProfile._id;
    if (!form.category || !form.websiteURL || (formMode === "CREATE" && !form.imageUpload)) {
      setAdsError("All required fields must be filled.");
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
      resetForm();
      setShowForm(false);
      setViewingOwner(activeOwner);
      await fetchAds(activeOwner);
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

  const dealerRows: DealerAdRow[] = owners.map(ownerToDealerRow);

  const filteredDealerRows = dealerRows.filter((row) => {
    const q = search.toLowerCase();
    const matchesSearch =
      row.shopName.toLowerCase().includes(q) ||
      row.phone.includes(q) ||
      row.city.toLowerCase().includes(q) ||
      row.date.toLowerCase().includes(q) ||
      String(row.adds).includes(q) ||
      String(row.invoice).includes(q) ||
      String(row.daysLeft).includes(q) ||
      String(row.sent).includes(q) ||
      row.status.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (heading === "all" || !q) return true;

    const fieldValue = String(row[heading as keyof DealerAdRow] ?? "").toLowerCase();
    return fieldValue.includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filteredDealerRows.length / entriesPerPage));
  const pagedDealerRows = filteredDealerRows.slice((page - 1) * entriesPerPage, page * entriesPerPage);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === pagedDealerRows.length) setSelected(new Set());
    else setSelected(new Set(pagedDealerRows.map((r) => r.id)));
  };

  const openShopAds = (row: DealerAdRow) => {
    if (row.owner?.businessProfile?._id) openOwnerView(row.owner);
  };

  const handleAddNew = () => {
    if (selected.size !== 1) {
      window.alert("Select one shop to add ads.");
      return;
    }
    const row = dealerRows.find((r) => r.id === Array.from(selected)[0]);
    if (!row?.owner?.businessProfile?._id) {
      window.alert("Selected shop has no business profile.");
      return;
    }
    openAddForm(row.owner);
  };

  const readOnlyValueClass = `${compactInputClass} bg-gray-50 text-gray-800`;

  const ownerViewPanel =
    viewingOwner && !showForm ? (
      <CompactFormPanel
        footer={
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-ad-form-border bg-ad-form-required-bg px-3 py-2.5">
            <div className="flex justify-start">
              <button
                type="button"
                onClick={() => openAddForm(viewingOwner)}
                className="rounded bg-ad-green px-4 py-1 text-sm font-bold text-white hover:bg-ad-green-dark"
              >
                Add Ad
              </button>
            </div>
            <span className="text-center text-xs font-serif italic text-gray-800">
              You are viewing ads for &apos;{viewingOwner.businessProfile?.businessName || viewingOwner.name}&apos;
            </span>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={closeOwnerView}
                className="rounded border border-gray-400 bg-white px-4 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        }
      >
        <CompactFormRow className="w-full items-start">
          <CompactField label="Shop Name" className={compactFixedFieldWidth}>
            <div className={readOnlyValueClass}>
              {viewingOwner.businessProfile?.businessName || viewingOwner.name || "—"}
            </div>
          </CompactField>
          <CompactField label="Phone" className={compactFixedFieldWidth}>
            <div className={readOnlyValueClass}>
              {viewingOwner.countryCode ? `${viewingOwner.countryCode} ` : ""}
              {viewingOwner.phone || "—"}
            </div>
          </CompactField>
          <CompactField label="City" className={compactFixedFieldWidth}>
            <div className={readOnlyValueClass}>{viewingOwner.businessProfile?.city || "—"}</div>
          </CompactField>
          <CompactField label="Owner" className="min-w-0 flex-1">
            <div className={readOnlyValueClass}>{viewingOwner.name || "—"}</div>
          </CompactField>
        </CompactFormRow>

        {adsError && (
          <div className="mb-2 rounded border border-red-200 bg-red-100 px-3 py-2 text-xs text-red-800">
            {adsError}
          </div>
        )}

        <div className="mt-2 overflow-x-auto">
          {adsLoading ? (
            <p className="py-4 text-center text-sm text-gray-500">Loading ads…</p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-ad-purple text-white">
                  <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Image</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Category</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Website URL</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Created</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="border border-gray-300 px-3 py-6 text-center text-gray-500">
                      No ads yet for this shop.
                    </td>
                  </tr>
                ) : (
                  ads.map((ad, idx) => (
                    <tr key={ad._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                      <td className="border border-gray-300 px-3 py-2">
                        {ad.imageUpload ? (
                          <img
                            src={adImageUrl(ad.imageUpload)}
                            alt={ad.category}
                            className="h-12 w-16 rounded border border-gray-200 object-cover"
                          />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-3 py-2">{ad.category}</td>
                      <td className="border border-gray-300 px-3 py-2">
                        <a
                          href={ad.websiteURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 hover:underline"
                        >
                          {ad.websiteURL}
                        </a>
                      </td>
                      <td className="border border-gray-300 px-3 py-2">
                        {formatDisplayDate(ad.createdAt)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => openEditForm(ad)}
                          className="mr-2 text-blue-700 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(ad._id)}
                          className="text-red-700 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </CompactFormPanel>
    ) : undefined;

  const adFormPanel =
    showForm && formMode && activeOwner ? (
      <CompactFormPanel
        footer={
          <CompactFormFooter
            message={
              formMode === "CREATE"
                ? "You are creating an 'Ad'"
                : "You are editing an 'Ad'"
            }
            messageCenter
            actionLabel={adsLoading ? "Saving..." : "Save"}
            onSave={handleSave}
            onCancel={handleCancelForm}
          />
        }
      >
        {adsError && (
          <div className="mb-2 rounded border border-red-200 bg-red-100 px-3 py-2 text-xs text-red-800">
            {adsError}
          </div>
        )}
        <CompactFormRow className="w-full items-start">
          <CompactField label="Shop Name" className={compactFixedFieldWidth}>
            <div className={readOnlyValueClass}>
              {activeOwner.businessProfile?.businessName || activeOwner.name || "—"}
            </div>
          </CompactField>
          <CompactField label="Category" required className={compactFixedFieldWidth}>
            <select
              name="category"
              value={form.category}
              onChange={handleFormChange}
              className={compactInputClass}
            >
              <option value="">Select Category</option>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </CompactField>
          <CompactField label="Website URL" required className="min-w-0 flex-1">
            <input
              type="url"
              name="websiteURL"
              value={form.websiteURL}
              onChange={handleFormChange}
              placeholder="https://example.com"
              className={compactInputClass}
            />
          </CompactField>
        </CompactFormRow>
        <CompactFormRow className="items-start justify-start">
          <CompactField
            label={formMode === "CREATE" ? "Ad Image" : "Change Image (optional)"}
            required={formMode === "CREATE"}
            className={compactFixedFieldWidth}
          >
            <label className="inline-block cursor-pointer rounded border border-gray-400 bg-gray-200 px-3 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-300">
              {form.imageUpload?.name || "Upload File"}
              <input
                type="file"
                name="adsImage"
                accept="image/*"
                onChange={handleFormChange}
                ref={imageInputRef}
                className="hidden"
              />
            </label>
          </CompactField>
          {formMode === "EDIT" && editExistingImage && !form.imageUpload && (
            <CompactField label="Current Image" className={compactFixedFieldWidth}>
              <img
                src={adImageUrl(editExistingImage)}
                alt="Current ad"
                className="h-12 w-16 rounded border border-gray-200 object-cover"
              />
            </CompactField>
          )}
        </CompactFormRow>
      </CompactFormPanel>
    ) : undefined;

  const betweenPanel = ownerViewPanel ?? adFormPanel;

  const title = SECTION_TITLES[section];

  const toolbar = (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
      <div className="flex flex-wrap gap-1">
        <button type="button" className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700">
          Update
        </button>
        <button type="button" className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700">
          Send Notification
        </button>
        <button type="button" className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700">
          Whatsapp
        </button>
        <button type="button" className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700">
          Website
        </button>
        <button type="button" className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700">
          Delete
        </button>
        <button type="button" className="bg-ad-green px-3 py-1 text-xs font-medium text-black hover:bg-ad-green-dark">
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
        {section === "dealer" && (
          <select
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
            className="border border-gray-400 bg-gray-500 px-2 py-1 text-xs font-medium text-white"
          >
            {DEALER_HEADINGS.map((h) => (
              <option key={h.value} value={h.value}>
                {h.label}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );

  const entriesControl = (
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
  );

  const paginationFooter = (
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
  );

  const renderDealerTable = () => (
    <>
      {ownersError && (
        <div className="mb-2 rounded border border-red-200 bg-red-100 px-3 py-2 text-xs text-red-800">
          {ownersError}
        </div>
      )}
      {toolbar}
      {entriesControl}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-ad-purple text-white">
              <th className="border border-ad-purple-dark px-2 py-2 text-left">
                <input
                  type="checkbox"
                  checked={pagedDealerRows.length > 0 && selected.size === pagedDealerRows.length}
                  onChange={toggleSelectAll}
                  className="accent-white"
                />
              </th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Shop Name</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Phone</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">City</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Date</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Adds</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Invoice</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Days Left</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Sent</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {ownersLoading ? (
              <tr>
                <td colSpan={10} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : pagedDealerRows.length === 0 ? (
              <tr>
                <td colSpan={10} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                  No records found.
                </td>
              </tr>
            ) : (
              pagedDealerRows.map((row, idx) => {
                const canOpen = !!row.owner?.businessProfile?._id;
                return (
                  <tr key={row.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                    <td className="border border-gray-300 px-2 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(row.id)}
                        onChange={() => toggleSelect(row.id)}
                        className="accent-ad-purple"
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {canOpen ? (
                        <button
                          type="button"
                          onClick={() => openShopAds(row)}
                          className="text-blue-700 hover:underline"
                        >
                          {row.shopName}
                        </button>
                      ) : (
                        row.shopName
                      )}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">{row.phone}</td>
                    <td className="border border-gray-300 px-3 py-2">{row.city}</td>
                    <td className="border border-gray-300 px-3 py-2">{row.date}</td>
                    <td className="border border-gray-300 px-3 py-2">
                      {canOpen ? (
                        <button
                          type="button"
                          onClick={() => openShopAds(row)}
                          className="text-blue-700 underline hover:text-blue-900"
                        >
                          {row.adds}
                        </button>
                      ) : (
                        row.adds
                      )}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <button type="button" className="text-blue-700 underline hover:text-blue-900">
                        {row.invoice}
                      </button>
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <button type="button" className="text-blue-700 underline hover:text-blue-900">
                        {row.daysLeft}
                      </button>
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <button type="button" className="text-blue-700 underline hover:text-blue-900">
                        {row.sent}
                      </button>
                    </td>
                    <td className="border border-gray-300 px-3 py-2">{row.status}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {paginationFooter}
    </>
  );

  const renderPlaceholderSection = (message: string) => (
    <>
      {toolbar}
      {entriesControl}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-ad-purple text-white">
              <th className="border border-ad-purple-dark px-2 py-2 text-left">
                <input type="checkbox" disabled className="accent-white" />
              </th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Shop Name</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Phone</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">City</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Date</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Amount</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={7} className="border border-gray-300 px-3 py-8 text-center text-gray-500">
                {message}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-end">
        <Link to="#" className="text-sm text-blue-700 hover:underline">
          Deleted
        </Link>
      </div>
    </>
  );

  return (
    <AdminPage
      title={title}
      noPanel
      headerAction={
        section === "dealer" && !showForm && !viewingOwner ? (
          <AddNewButton onClick={handleAddNew} />
        ) : undefined
      }
      between={section === "dealer" ? betweenPanel : undefined}
    >
      {section === "dealer" && renderDealerTable()}
      {section === "adds" && renderPlaceholderSection("No adds records yet.")}
      {section === "invoices" && renderPlaceholderSection("No invoice records yet.")}
      {section === "payment" && renderPlaceholderSection("No payment records yet.")}
    </AdminPage>
  );
}
