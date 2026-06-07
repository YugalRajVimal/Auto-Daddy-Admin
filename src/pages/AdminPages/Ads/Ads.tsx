import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

// --- You can swap for your design system or UI library if needed ---

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



const Ads: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<{
    category: string;
    websiteURL: string;
    imageUpload: File | null;
  }>({
    category: "",
    websiteURL: "",
    imageUpload: null,
  });
  const [formMode, setFormMode] = useState<"CREATE" | "EDIT" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchAds();
    // eslint-disable-next-line
  }, []);

  const fetchAds = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/api/admin/ads`);
      setAds(res.data.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to fetch ads");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ category: "", websiteURL: "", imageUpload: null });
    setFormMode(null);
    setEditId(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, files } = e.target as any;
    if (name === "adsImage") {
      setForm((prev) => ({
        ...prev,
        imageUpload: files && files[0] ? files[0] : null,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCreate = () => {
    resetForm();
    setFormMode("CREATE");
  };

  const handleEdit = (ad: Ad) => {
    resetForm();
    setFormMode("EDIT");
    setEditId(ad._id);
    setForm({
      category: ad.category,
      websiteURL: ad.websiteURL,
      imageUpload: null,
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this ad?")) return;
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`${API_URL}/api/admin/ads/${id}`);
      fetchAds();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete ad");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      !form.category ||
      !form.websiteURL ||
      (formMode === "CREATE" && !form.imageUpload)
    ) {
      setError("All fields are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("category", form.category);
      formData.append("websiteURL", form.websiteURL);
      if (form.imageUpload) formData.append("adsImage", form.imageUpload);

      if (formMode === "CREATE") {
        await axios.post(`${API_URL}/api/admin/ads`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else if (formMode === "EDIT" && editId) {
        await axios.patch(`${API_URL}/api/admin/ads/${editId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      resetForm();
      fetchAds();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to submit form");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: 0,
        maxWidth: 980,
        margin: "40px auto",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 28,
        }}
      >
        <h1
          style={{
            fontWeight: 700,
            fontSize: "2.1rem",
            letterSpacing: "-0.03em",
            color: "#222",
          }}
        >
          Manage Ads
        </h1>
        <button
          onClick={handleCreate}
          style={{
            padding: "10px 26px",
            background:
              "linear-gradient(90deg,#3B82F6 0%,#6366F1 80%,#a855f7 100%)",
            color: "#fff",
            border: "none",
            borderRadius: 7,
            fontWeight: 600,
            fontSize: "1.06rem",
            boxShadow: "0 2px 8px 0 #0001",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
        >
          + Add Ad
        </button>
      </div>

      {(formMode === "CREATE" || formMode === "EDIT") && (
        <form
          onSubmit={handleSubmit}
          style={{
            border: "1.5px solid #e5e7eb",
            padding: 28,
            borderRadius: 13,
            margin: "26px 0 32px 0",
            background:
              "linear-gradient(90deg,rgba(243,244,246,1) 94%,rgba(232,240,255,0.30) 100%)",
            boxShadow: "0 4px 24px #6da0fa13",
            maxWidth: 460,
            marginLeft: 0,
          }}
        >
          {/* Category */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginBottom: 18,
            }}
          >
            <label
              htmlFor="category"
              style={{
                fontWeight: 500,
                fontSize: "1.08rem",
                marginBottom: 4,
                color: "#374151",
              }}
            >
              Category
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleFormChange}
              required
              className="modern-input"
              style={{
                padding: "9px 10px",
                fontSize: "1rem",
                border: "1.1px solid #d1d5db",
                borderRadius: 6,
                background: "#f9fafb",
                outline: "none",
              }}
            >
              <option value="">Select Category</option>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Website URL */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginBottom: 18,
            }}
          >
            <label
              htmlFor="websiteURL"
              style={{
                fontWeight: 500,
                fontSize: "1.08rem",
                marginBottom: 4,
                color: "#374151",
              }}
            >
              Website URL
            </label>
            <input
              type="url"
              name="websiteURL"
              value={form.websiteURL}
              onChange={handleFormChange}
              required
              placeholder="e.g. https://example.com"
              className="modern-input"
              style={{
                padding: "9px 10px",
                fontSize: "1rem",
                border: "1.1px solid #d1d5db",
                borderRadius: 6,
                background: "#f9fafb",
                outline: "none",
              }}
            />
          </div>

          {/* Image Upload */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginBottom: 22,
            }}
          >
            <label
              htmlFor="adsImage"
              style={{
                fontWeight: 500,
                fontSize: "1.08rem",
                marginBottom: 4,
                color: "#374151",
              }}
            >
              {formMode === "CREATE" ? "Ad Image" : "Change Ad Image (optional)"}
            </label>
            <input
              type="file"
              name="adsImage"
              accept="image/*"
              onChange={handleFormChange}
              ref={imageInputRef}
              style={{}}
              required={formMode === "CREATE"}
            />
            {form.imageUpload && (
              <span
                style={{
                  marginTop: 6,
                  fontSize: "0.99rem",
                  color: "#6366f1",
                }}
              >
                {form.imageUpload.name}
              </span>
            )}
          </div>

          {/* Actions */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 12,
              marginTop: 14,
            }}
          >
            <button
              type="submit"
              style={{
                background:
                  "linear-gradient(90deg,#2563eb 0%,#6366f1 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "8px 28px",
                fontWeight: 600,
                fontSize: "1rem",
                boxShadow: "0 1px 4px #0001",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.65 : 1,
                transition: "opacity 0.16s",
              }}
              disabled={loading}
            >
              {formMode === "CREATE" ? "Create Ad" : "Update Ad"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              style={{
                background: "#f3f4f6",
                color: "#374151",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                fontWeight: 500,
                padding: "8px 18px",
                fontSize: "1rem",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
          {error && (
            <div
              style={{
                color: "#dc2626",
                background: "#ffefef",
                padding: "9px 14px",
                borderRadius: 7,
                fontSize: "0.98rem",
                marginTop: 8,
                border: "1px solid #fecaca",
              }}
            >
              {error}
            </div>
          )}
        </form>
      )}

      {/* Loading spinner */}
      {loading && (
        <div
          style={{
            margin: "20px 0",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 500,
            color: "#6366f1",
            fontSize: "1.13rem",
          }}
        >
          <svg
            style={{ margin: "2px 6px 0 0" }}
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="spinner_4VdA"
              cx="12"
              cy="12"
              r="10"
              stroke="#6366f1"
              strokeWidth="4"
              opacity="0.3"
            />
            <path
              d="M22 12a10 10 0 0 0-10-10"
              stroke="#6366f1"
              strokeWidth="4"
              strokeLinecap="round"
              style={{
                transformOrigin: "center",
                animation: "spinner 0.8s linear infinite",
              }}
            ></path>
            <style>
              {`@keyframes spinner {100%{transform:rotate(360deg)}}`}
            </style>
          </svg>
          Loading...
        </div>
      )}

      {/* Alerts */}
      {error && !formMode && (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #fecaca",
            borderRadius: 7,
            color: "#dc2626",
            padding: "12px 16px",
            fontWeight: 500,
            marginBottom: 18,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 2px 12px #5a81fa15",
          marginTop: 12,
        }}
      >
        <table
          style={{
            borderCollapse: "separate",
            borderSpacing: 0,
            width: "100%",
            minWidth: 650,
            background: "#fff",
            fontSize: "1.02rem",
          }}
        >
          <thead>
            <tr
              style={{
                background:
                  "linear-gradient(90deg,#ddeafe 90%,#e0e7ff 100%)",
                color: "#2d2b67",
              }}
            >
              <th
                style={{
                  padding: "13px 8px",
                  fontWeight: 700,
                  letterSpacing: ".01em",
                  fontSize: "1rem",
                  textAlign: "left",
                  borderBottom: "2px solid #e0e7ff",
                }}
              >
                Image
              </th>
              <th
                style={{
                  padding: "13px 8px",
                  fontWeight: 700,
                  letterSpacing: ".01em",
                  fontSize: "1rem",
                  textAlign: "left",
                  borderBottom: "2px solid #e0e7ff",
                }}
              >
                Category
              </th>
              <th
                style={{
                  padding: "13px 8px",
                  fontWeight: 700,
                  letterSpacing: ".01em",
                  fontSize: "1rem",
                  textAlign: "left",
                  borderBottom: "2px solid #e0e7ff",
                }}
              >
                Website URL
              </th>
              <th
                style={{
                  padding: "13px 8px",
                  fontWeight: 700,
                  letterSpacing: ".01em",
                  fontSize: "1rem",
                  textAlign: "left",
                  borderBottom: "2px solid #e0e7ff",
                }}
              >
                Created
              </th>
              <th
                style={{
                  padding: "13px 8px",
                  fontWeight: 700,
                  letterSpacing: ".01em",
                  fontSize: "1rem",
                  textAlign: "center",
                  borderBottom: "2px solid #e0e7ff",
                  minWidth: 150,
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {ads.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    textAlign: "center",
                    color: "#888",
                    padding: "38px 0",
                    fontSize: "1.1rem",
                  }}
                >
                  No ads found.
                </td>
              </tr>
            )}
            {ads.map((ad) => (
              <tr
                key={ad._id}
                style={{
                  borderBottom: "1.5px solid #eef2f8",
                  background: "#fff",
                  transition: "background 0.13s",
                }}
                onMouseOver={e =>
                  (e.currentTarget.style.background = "#f3f4fb")
                }
                onMouseOut={e =>
                  (e.currentTarget.style.background = "#fff")
                }
              >
                <td style={{ padding: "12px 8px" }}>
                  {ad.imageUpload ? (
                    <img
                      src={
                        ad.imageUpload.startsWith("http")
                          ? ad.imageUpload
                          : `${API_URL}/` +
                            ad.imageUpload.replace(/^\.?\/?/, "")
                      }
                      alt={ad.category}
                      style={{
                        width: 82,
                        height: 60,
                        objectFit: "cover",
                        borderRadius: 11,
                        border: "1.6px solid #f1f5f9",
                        background: "#f3f4f6",
                        boxShadow: "0 1px 2px #0001",
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: ".98rem",
                        color: "#cbd5e1",
                        fontStyle: "italic",
                      }}
                    >
                      No Image
                    </span>
                  )}
                </td>
                <td style={{ padding: "12px 8px", minWidth: 95 }}>
                  <span
                    style={{
                      background: "#6366f120",
                      color: "#475569",
                      borderRadius: "6px",
                      fontWeight: 500,
                      padding: "3px 11px",
                      fontSize: ".99rem",
                    }}
                  >
                    {ad.category}
                  </span>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <a
                    href={ad.websiteURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#2563eb",
                      fontWeight: 500,
                      textDecoration: "underline dotted",
                      fontSize: "1.01rem",
                      wordBreak: "break-all",
                    }}
                  >
                    {ad.websiteURL}
                  </a>
                </td>
                <td style={{ padding: "12px 8px", fontSize: ".98rem" }}>
                  <span style={{ color: "#6b7280", fontWeight: 500 }}>
                    {new Date(ad.createdAt).toLocaleString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </td>
                <td
                  style={{
                    padding: "12px 8px",
                    textAlign: "center",
                    minWidth: 148,
                  }}
                >
                  <button
                    onClick={() => handleEdit(ad)}
                    style={{
                      padding: "7px 20px",
                      fontWeight: 600,
                      fontSize: ".97rem",
                      background: "linear-gradient(90deg,#38bdf8 10%,#818cf8 90%)",
                      color: "white",
                      border: "none",
                      borderRadius: 7,
                      boxShadow: "0 1px 5px #7289fa18",
                      marginRight: 7,
                      cursor: "pointer",
                      transition: "transform 0.08s",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(ad._id)}
                    style={{
                      padding: "7px 17px",
                      fontWeight: 600,
                      fontSize: ".97rem",
                      background: "linear-gradient(90deg,#ef4444 10%,#f87171 100%)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 7,
                      marginLeft: 2,
                      cursor: "pointer",
                      boxShadow: "0 1px 4px #f8717113",
                      transition: "transform 0.08s",
                    }}
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
  );
};

export default Ads;