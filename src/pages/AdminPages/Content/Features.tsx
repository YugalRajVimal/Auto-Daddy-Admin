import { useEffect, useState } from "react";
import AttachImageCheckbox from "../../../components/admin/AttachImageCheckbox";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import ClipImageHover from "../../../components/admin/ClipImageHover";
import {
  CompactAutoGrowTextarea,
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactFixedFieldWidth,
  compactInputClass,
} from "../../../components/admin/ContentPanel";
import { adminNotify } from "../../../utils/adminNotify";
import { printAdminTable } from "../../../utils/adminPrintTable";

// Base API URL from env
const BASE =
  import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/admin/common`
    : "/api";

const USER_OPTIONS = [
  { value: "car-owner", label: "Car Owner" },
  { value: "mechanic", label: "Mechanic" },
  { value: "shop-owner", label: "Shop Owner" },
  { value: "associate", label: "Associate" },
  { value: "dealer", label: "Dealer" },
];

// Unique id type is now string or number to support _id string from BE
type FeatureRow = {
  id: number | string;
  date: string;
  user: string;
  feature: string;
  country: string;
  hasClip: boolean;
  imageUrl?: string | null;
};

const DEFAULT_FEATURE = "Describe the product feature and its benefits.";

type FeaturesPageProps = {
  initialShowForm?: boolean;
};

// Helper to get absolute URL if needed
function getAbsImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  // If already a full URL, return as is
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  // If imagePath starts with /, just prefix the origin
  if (imagePath.startsWith("/")) return window.location.origin + imagePath;
  // Else, relative path, prefix with "/"
  return window.location.origin + "/" + imagePath.replace(/^\/?/, "");
}

export default function FeaturesPage({ initialShowForm = false }: FeaturesPageProps) {
  const [features, setFeatures] = useState<FeatureRow[]>([]);
  const [selected, setSelected] = useState<Set<number | string>>(new Set());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showForm, setShowForm] = useState(initialShowForm);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [date, setDate] = useState("2026-06-16");
  const [country, setCountry] = useState("Canada");
  const [user, setUser] = useState("car-owner");
  const [feature, setFeature] = useState(DEFAULT_FEATURE);
  const [attachImage, setAttachImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // ------ Fetch features from API ------
  useEffect(() => {
    const fetchFeatures = async () => {
      setLoading(true);
      try {
        const qCountry = country ? `country=${encodeURIComponent(country)}` : "";
        const url = `${BASE}/product-features${qCountry ? `?${qCountry}` : ""}`;
        const res = await fetch(url, { method: "GET" });
        if (!res.ok) throw new Error("Failed to fetch features");
        const data = await res.json();
        // The API may return array of features with "_id" and "image"
        // image may be relative path: e.g. "Uploads/ProductFeatures/...filename"
        const rows: FeatureRow[] = Array.isArray(data)
          ? data.map((item: any) => ({
              id: item.id ?? item._id,
              date: item.date,
              user: item.role || item.user,
              feature: item.feature,
              country: item.country,
              // Prefer 'image' for new format, fallback for old
              imageUrl: getAbsImageUrl(
                item.image ||
                  item.featureImageUrl ||
                  item.imageUrl ||
                  null
              ),
              hasClip:
                !!(item.image || item.featureImageUrl || item.imageUrl),
            }))
          : [];
        setFeatures(rows);
      } catch (err: any) {
        adminNotify.error(err.message || "Failed to load features.");
      }
      setLoading(false);
    };
    fetchFeatures();
    // Only on mount or when country changes for demo parity (can tweak if needed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);

  const filtered = features.filter(
    (f) =>
      f.date?.toString().includes(search) ||
      f.user?.toLowerCase().includes(search.toLowerCase()) ||
      f.feature?.toLowerCase().includes(search.toLowerCase()) ||
      f.country?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / entriesPerPage));
  const paged = filtered.slice((page - 1) * entriesPerPage, page * entriesPerPage);

  const toggleSelect = (id: number | string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === paged.length) setSelected(new Set());
    else setSelected(new Set(paged.map((f) => f.id)));
  };

  const resetForm = () => {
    setDate("2026-06-16");
    setCountry("Canada");
    setUser("car-owner");
    setFeature(DEFAULT_FEATURE);
    setAttachImage(false);
    setImageFile(null);
    setEditingId(null);
  };

  const openAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (row: FeatureRow) => {
    setDate(row.date);
    setCountry(row.country);
    setUser(row.user);
    setFeature(row.feature);
    setAttachImage(!!row.imageUrl);
    setImageFile(null);
    setEditingId(row.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  // Handle create & update
  const handleSave = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("date", date);
      formData.append("country", country);
      formData.append("role", user); // called "role" in API
      formData.append("feature", feature);

      if (attachImage && imageFile) {
        formData.append("featureImage", imageFile);
      }

      let url = `${BASE}/product-features`;
      let method = "POST";
      if (editingId != null) {
        url = `${BASE}/product-features/${editingId}`;
        method = "PUT";
        // Only append fields user can update; already handled above
        // Image is optional in PUT
      }

      const res = await fetch(url, {
        method,
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(
          errText || (editingId != null ? "Update failed." : "Create failed.")
        );
      }

      adminNotify.success(
        editingId != null ? "Updated successfully." : "Saved successfully."
      );
      resetForm();
      setShowForm(false);

      // Refetch features after save (refreshing country triggers useEffect above)
      setCountry((prev) => prev);
    } catch (e: any) {
      adminNotify.error(e?.message || "Could not save product feature.");
    } finally {
      setLoading(false);
    }
  };

  // Handle multi-delete
  const handleDelete = async () => {
    if (selected.size === 0) return;
    setLoading(true);
    try {
      await Promise.all(
        Array.from(selected).map(async (id) => {
          const url = `${BASE}/product-features/${id}`;
          const res = await fetch(url, { method: "DELETE" });
          if (!res.ok) throw new Error("Delete failed");
        })
      );
      adminNotify.success("Deleted successfully.");
      setSelected(new Set());
      // Refetch
      setCountry((prev) => prev);
    } catch (err: any) {
      adminNotify.error(err?.message || "Failed to delete.");
    } finally {
      setLoading(false);
    }
  };

  const handleToolbarPrint = () => {
    printAdminTable({
      title: "Product Features",
      headers: ["Date", "Country", "User", "Feature", "Clip"],
      rows: filtered.map((featureRow) => [
        featureRow.date,
        featureRow.country,
        featureRow.user,
        featureRow.feature,
        featureRow.imageUrl ? "Yes" : "—",
      ]),
    });
  };

  return (
    <AdminPage
      title="Product Features"
      headerAction={!showForm ? <AddNewButton onClick={openAdd} /> : undefined}
      between={
        showForm ? (
          <CompactFormPanel
            footer={
              <CompactFormFooter
                message={
                  editingId != null
                    ? "You are editing a 'Product Feature'"
                    : "You are creating a 'Product Feature'"
                }
                messageCenter
                actionLabel={editingId != null ? "Update" : "Save"}
                onSave={loading ? undefined : handleSave}
                onCancel={loading ? undefined : handleCancel}
              />
        
            }
          >
            <CompactFormRow className="items-start">
              <CompactField label="Date" required className={compactFixedFieldWidth}>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={compactInputClass}
                  disabled={loading}
                />
              </CompactField>
              <CompactField label="Country" required className={compactFixedFieldWidth}>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={compactInputClass}
                  disabled={loading}
                >
                  <option value="Canada">Canada</option>
                  <option value="USA">USA</option>
                </select>
              </CompactField>
              <CompactField label="User" required className={compactFixedFieldWidth}>
                <select
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  className={compactInputClass}
                  disabled={loading}
                >
                  {USER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </CompactField>
              <CompactField label="Feature" required className="min-w-[200px] flex-1">
                <CompactAutoGrowTextarea
                  value={feature}
                  onChange={(e) => setFeature(e.target.value)}
                  disabled={loading}
                />
              </CompactField>
            </CompactFormRow>
            <CompactFormRow className="items-start justify-start">
              <AttachImageCheckbox
                checked={attachImage}
                onCheckedChange={setAttachImage}
                file={imageFile}
                onFileChange={setImageFile}
              />
        
            </CompactFormRow>
          </CompactFormPanel>
        ) : undefined
      }
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            disabled={selected.size === 0 || loading}
            onClick={handleDelete}
            className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={handleToolbarPrint}
            className="bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark"
          >
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
        {loading ? (
          <div className="p-4 text-center text-gray-600">Loading...</div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-ad-purple text-white">
                <th className="border border-ad-purple-dark px-2 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={paged.length > 0 && selected.size === paged.length}
                    onChange={toggleSelectAll}
                    className="accent-white"
                  />
                </th>
                <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Date</th>
                <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Country</th>
                <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">User</th>
                <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Feature</th>
                <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Clip</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((row, idx) => (
                <tr key={row.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                  <td className="border border-gray-300 px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggleSelect(row.id)}
                      className="accent-ad-purple"
                    />
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="text-blue-700 hover:underline"
                    >
                      {row.date?.slice(0, 10)}
                    </button>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{row.country}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    {USER_OPTIONS.find((o) => o.value === row.user)?.label ?? row.user}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{row.feature}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    {row.imageUrl ? (
                      <ClipImageHover
                        imageUrl={row.imageUrl}
                        alt={`Attachment for ${row.feature}`}
                      />
                    ) : (
                      <span className="text-gray-500">--</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
      </div>
    </AdminPage>
  );
}
