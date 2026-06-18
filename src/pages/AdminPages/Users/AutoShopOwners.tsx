import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

// ─── Types ────────────────────────────────────────────────────────────────────
type TeamMemberType = { _id: string; name: string; email?: string; phone?: string; designation?: string; photo?: string };
type IndividualService = { name: string; desc?: string; price?: number; _id: string };
type Service = { _id: string; name?: string; desc?: string; services?: IndividualService[]; [k: string]: any };
type MyService = { service: Service; subServices?: { subService: string }[]; serviceName?: string; serviceId?: string; [k: string]: any };
type BusinessProfileType = {
  _id: string; businessName?: string; businessAddress?: string; pincode?: string; city?: string;
  businessPhone?: string; businessEmail?: string; businessHSTNumber?: string; openHours?: string;
  openDays?: string[]; perDayOpenHours?: any[]; businessLogo?: string; myServices?: MyService[];
  myDeals?: any[]; teamMembers?: TeamMemberType[]; businessMapLocation?: any; isOpen?: boolean;
  rating?: number; reviewCount?: number; reviewDate?: string; websiteUrl?: string;
  createdAt?: string; updatedAt?: string; ads?: any[]; [k: string]: any;
};
type CustomerType = { _id: string; name?: string; email?: string; phone?: string };
type DealType = {
  _id: string; name?: string; description?: string; discountedPrice?: number;
  percentageDiscount?: number; dealEnabled?: boolean; dealType?: string; offerEndsOnDate?: string;
  couponCode?: string; startDate?: string; endDate?: string; additionalDetails?: string; dealImage?: string;
};
type JobCardType = {
  _id: string; jobNo?: string; business?: string; customerId?: string; vehicleId?: string;
  odometerReading?: number; issueDescription?: string; serviceType?: string; priorityLevel?: string;
  services?: any[]; additionalNotes?: string; vehiclePhotos?: string[];
  dealApplied?: { name?: string; percentageDiscount?: number; dealCode?: string };
  totalPayableAmount?: number; paymentStatus?: string; technicalRemarks?: string;
  createdAt?: string; updatedAt?: string; status?: string; [k: string]: any;
};
type ShopType = "autoShop" | "tyreShop" | "carWash" | "towTruck";
type AutoShopOwnerType = {
  _id: string;
  name: string;
  email?: string;
  countryCode?: string;
  phone?: string;
  pincode?: string;
  address?: string;
  isDisabled?: boolean;
  isProfileComplete?: boolean;
  isBusinessProfileCompleted?: boolean;
  businessProfile?: BusinessProfileType | null;
  myCustomers?: CustomerType[];
  createdAt?: string;
  deals?: DealType[];
  jobCards?: JobCardType[];
  status?: string;
  shopType?: ShopType; // ADDED shopType
};

// ─── Column Config ────────────────────────────────────────────────────────────
const ALL_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "shopName", label: "Shop Name" },
  { key: "shopType", label: "Shop Type" }, // ADDED Shop Type Column
  { key: "city", label: "City" },
  { key: "date", label: "Date" },
  { key: "customers", label: "Customers" },
  { key: "deals", label: "Deals" },
  { key: "jobCards", label: "Job Cards" },
  { key: "status", label: "Status" },
];
const DEFAULT_VISIBLE = ["name", "phone", "shopName", "shopType", "city", "date", "customers", "deals", "jobCards", "status"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const API = () => (import.meta.env.VITE_API_URL as string) || "";
const UPLOADS = () => (import.meta.env.VITE_UPLOADS_URL as string) || "";
const IMAGE_URL = () => (import.meta.env.VITE_IMAGE_URL as string) || "";
function mediaUrl(path?: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${UPLOADS()}/${path.replace(/^\/+/, "")}`;
}
function imgUrl(path?: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${IMAGE_URL()}/${path.replace(/^\/+/, "")}`;
}
function fmtDate(d?: string): string {
  if (!d) return "-";
  return new Date(d).toISOString().slice(0, 10);
}
function getToken(): Record<string, string> {
  const t = localStorage.getItem("admin-token");
  return t ? { Authorization: t } : {};
}
function getStatus(owner: AutoShopOwnerType): string {
  if (owner.status === "deleted") return "Deleted";
  if (owner.isDisabled) return "Suspended";
  if (owner.isProfileComplete && (owner.isBusinessProfileCompleted ?? owner.businessProfile)) return "Active";
  if (!owner.isProfileComplete) return "Incomplete";
  return "Unknown";
}
function getStatusColors(s: string): React.CSSProperties {
  if (s === "Active") return { background: "#dff0d8", color: "#3c763d", border: "1px solid #d6e9c6" };
  if (s === "Suspended") return { background: "#fcf8e3", color: "#8a6d3b", border: "1px solid #faebcc" };
  if (s === "Deleted") return { background: "#f2dede", color: "#a94442", border: "1px solid #ebccd1" };
  return { background: "#f2dede", color: "#a94442", border: "1px solid #ebccd1" };
}

// ─── Green Card Styles ────────────────────────────────────────────────────────
const GREEN_CARD: React.CSSProperties = {
  background: "#d4f5c4", border: "1px solid #b2e0a0", borderRadius: 14,
  padding: "18px 22px", marginBottom: 18, boxShadow: "3px 4px 0 #c0d8b0", position: "relative",
};
const GC_LABEL: React.CSSProperties = { color: "#555", fontWeight: 600, fontSize: 13, minWidth: 120 };
const GC_VAL: React.CSSProperties = { color: "#222", fontSize: 13 };
function GCRow({ label, value }: { label: string; value?: any }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 5 }}>
      <span style={GC_LABEL}>{label}</span>
      <span style={{ color: "#888", marginRight: 4 }}>:</span>
      <span style={GC_VAL}>{value ?? "-"}</span>
    </div>
  );
}

// ─── Shared input styles ──────────────────────────────────────────────────────
const iStyle: React.CSSProperties = {
  width: "100%", border: "1px solid #d2d6de", borderRadius: 3,
  padding: "7px 10px", fontSize: 13, outline: "none", boxSizing: "border-box", color: "#333", background: "#fff",
};
const lStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 700, marginBottom: 4,
  color: "#555", textTransform: "uppercase", letterSpacing: "0.04em",
};

// Shop Type Options
const SHOP_TYPE_OPTIONS: { value: ShopType; label: string }[] = [
  { value: "autoShop", label: "Auto Shop" },
  { value: "tyreShop", label: "Tyre Shop" },
  { value: "carWash", label: "Car Wash" },
  { value: "towTruck", label: "Tow Truck" },
];

// ─── BASE MODAL ───────────────────────────────────────────────────────────────
const BaseModal: React.FC<{
  isOpen: boolean; onClose: () => void; title: string;
  children: React.ReactNode; wide?: boolean; maxW?: string;
}> = ({ isOpen, onClose, title, children, wide, maxW }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "30px 10px" }}>
      <div style={{ background: "#fff", borderRadius: 4, width: maxW ?? (wide ? "min(980px,96vw)" : "min(720px,95vw)"), boxShadow: "0 5px 24px rgba(0,0,0,.35)", display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#9b308d", color: "#fff", padding: "11px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: "4px 4px 0 0", flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{title}</span>
          <button onClick={onClose} type="button" style={{ background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "20px 22px", overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
};

// ─── Open Days helper ─────────────────────────────────────────────────────────
function parseOpenDays(openDays?: string[]): string {
  if (!openDays || !openDays.length) return "-";
  if (openDays.length === 1 && typeof openDays[0] === "string" && openDays[0].trim().startsWith("[")) {
    try { return JSON.parse(openDays[0]).join(", "); } catch { return openDays.join(", "); }
  }
  return openDays.join(", ");
}

// ─── ADD / EDIT MODAL ────────────────────────────────────────────────────────
const CALLING_CODES = [
  { id: "CA", flag: "🇨🇦", code: "+1" }, { id: "US", flag: "🇺🇸", code: "+1" },
  { id: "GB", flag: "🇬🇧", code: "+44" }, { id: "IN", flag: "🇮🇳", code: "+91" },
  { id: "AU", flag: "🇦🇺", code: "+61" },
];
function isEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()); }

const AddEditModal: React.FC<{
  isOpen: boolean; onClose: () => void; onSaved: () => void;
  owner?: AutoShopOwnerType | null; mode: "add" | "edit";
}> = ({ isOpen, onClose, onSaved, owner, mode }) => {
  const isEdit = mode === "edit";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dialCode, setDialCode] = useState("+1");
  const [phone, setPhone] = useState("");
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");
  // SHOP TYPE handling
  const [shopType, setShopType] = useState<ShopType>("autoShop");
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setAttempted(false); setApiError(null);
    if (isEdit && owner) {
      setName(owner.name || ""); setEmail(owner.email || "");
      setDialCode(owner.countryCode || "+1"); setPhone(owner.phone || "");
      setPincode(owner.pincode || ""); setAddress(owner.address || "");
      setShopType((owner.shopType as ShopType) || "autoShop");
    } else {
      setName(""); setEmail(""); setDialCode("+1"); setPhone(""); setPincode(""); setAddress("");
      setShopType("autoShop");
    }
  }, [isOpen, isEdit, owner]);

  function validate(): string | null {
    if (!name.trim()) return "Name is required.";
    if (!email.trim() || !isEmail(email)) return "Valid email required.";
    if (phone.replace(/\D/g, "").length !== 10) return "Phone must be 10 digits.";
    if (!pincode.trim()) return "Zip / Postal code is required.";
    if (!shopType) return "Shop type required.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setAttempted(true);
    const err = validate(); if (err) { setApiError(err); return; }
    setApiError(null);
    const payload = {
      name: name.trim(), email: email.trim(), countryCode: dialCode,
      phone: phone.replace(/\D/g, ""), pincode: pincode.trim(),
      address: address.trim(), role: "autoshopowner",
      shopType,
    };
    setSubmitting(true);
    try {
      if (isEdit && owner) {
        await axios.put(`${API()}/api/admin/autoshopowners/${owner._id}`, payload, { headers: getToken() });
      } else {
        await axios.post(`${API()}/api/admin/autoshopowners`, payload, { headers: getToken() });
      }
      onSaved(); onClose();
    } catch (err: any) {
      setApiError(err?.response?.data?.message || (isEdit ? "Could not update." : "Could not add."));
    } finally { setSubmitting(false); }
  }

  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", background: "rgba(0,0,0,0.48)", overflowY: "auto", padding: "30px 12px" }}>
      <div style={{ background: "#fff", borderRadius: 4, width: "min(680px,96vw)", boxShadow: "0 8px 32px rgba(0,0,0,0.22)" }}>
        <div style={{ background: "#9b308d", color: "#fff", padding: "13px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: "4px 4px 0 0" }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{isEdit ? "✏️ Edit Auto Shop Owner" : "➕ Add Auto Shop Owner"}</span>
          <button onClick={onClose} disabled={submitting} type="button" style={{ background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: "22px 24px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#9b308d", borderBottom: "2px solid #9b308d", paddingBottom: 6, marginBottom: 18, textTransform: "uppercase" }}>Owner Information</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px" }}>
            <div>
              <label style={lStyle}>Full Name <span style={{ color: "#e73d3d" }}>*</span></label>
              <input style={iStyle} value={name} onChange={e => setName(e.target.value.slice(0, 40))} placeholder="Enter full name" maxLength={40} />
              {attempted && !name.trim() && <p style={{ color: "#c0392b", fontSize: 11, margin: "3px 0 0", fontWeight: 600 }}>Required</p>}
            </div>
            <div>
              <label style={lStyle}>Email Address <span style={{ color: "#e73d3d" }}>*</span></label>
              <input style={iStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter email" />
              {attempted && !isEmail(email) && <p style={{ color: "#c0392b", fontSize: 11, margin: "3px 0 0", fontWeight: 600 }}>Valid email required</p>}
            </div>
            <div>
              <label style={lStyle}>Phone Number <span style={{ color: "#e73d3d" }}>*</span></label>
              <div style={{ display: "flex", gap: 6 }}>
                <select value={dialCode} onChange={e => setDialCode(e.target.value)} style={{ ...iStyle, width: 100, flexShrink: 0 }}>
                  {CALLING_CODES.map(c => <option key={c.id + c.code} value={c.code}>{c.flag} {c.code}</option>)}
                </select>
                <input style={{ ...iStyle, flex: 1 }} type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit number" />
              </div>
              {attempted && phone.replace(/\D/g, "").length !== 10 && <p style={{ color: "#c0392b", fontSize: 11, margin: "3px 0 0", fontWeight: 600 }}>Must be 10 digits</p>}
            </div>
            <div>
              <label style={lStyle}>Zip / Postal Code <span style={{ color: "#e73d3d" }}>*</span></label>
              <input style={iStyle} value={pincode} onChange={e => setPincode(e.target.value.slice(0, 10))} placeholder="e.g. A1A 1A1" />
              {attempted && !pincode.trim() && <p style={{ color: "#c0392b", fontSize: 11, margin: "3px 0 0", fontWeight: 600 }}>Required</p>}
            </div>
            <div>
              <label style={lStyle}>Role</label>
              <div style={{ ...iStyle, background: "#f5f6f8", color: "#888", fontWeight: 600, cursor: "default" }}>autoshopowner</div>
            </div>
            {/* ADD SHOP TYPE */}
            <div>
              <label style={lStyle}>Shop Type <span style={{ color: "#e73d3d" }}>*</span></label>
              <select
                style={iStyle}
                value={shopType}
                onChange={e => setShopType(e.target.value as ShopType)}
              >
                {SHOP_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {attempted && !shopType && (
                <p style={{ color: "#c0392b", fontSize: 11, margin: "3px 0 0", fontWeight: 600 }}>Required</p>
              )}
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={lStyle}>Address</label>
              <textarea style={{ ...iStyle, minHeight: 60, resize: "vertical", fontFamily: "inherit" }} value={address} onChange={e => setAddress(e.target.value.slice(0, 100))} placeholder="Enter address (max 100 chars)" rows={2} maxLength={100} />
            </div>
          </div>
          {apiError && (
            <div style={{ marginTop: 12, padding: "9px 14px", background: "#fdf3f2", border: "1px solid #f5c6cb", borderRadius: 3, color: "#c0392b", fontSize: 13 }}>{apiError}</div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20, paddingTop: 16, borderTop: "1px solid #f4f4f4" }}>
            <button type="button" onClick={onClose} disabled={submitting} style={{ padding: "8px 22px", borderRadius: 3, border: "1px solid #d2d6de", background: "#fff", color: "#555", fontSize: 14, cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={submitting} style={{ padding: "8px 26px", borderRadius: 3, border: "none", background: submitting ? "#aaa" : "#00a65a", color: "#fff", fontSize: 14, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer" }}>
              {submitting ? "Saving…" : isEdit ? "Save Changes" : "Add Owner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── SHOP OVERVIEW CARD ───────────────────────────────────────────────────────
const ShopOverviewCard: React.FC<{ bp: BusinessProfileType }> = ({ bp }) => {
  const services: string[] = [];
  if (Array.isArray(bp.myServices)) {
    for (const ms of bp.myServices) {
      const n = ms.serviceName || ms.service?.name;
      if (n) services.push(n);
    }
  }
  if (!services.length) services.push(...["General Repair", "Oil Change", "Brake Service"]);
  const logoUrl = bp.businessLogo ? imgUrl(bp.businessLogo) : "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?q=80&w=400&auto=format&fit=crop";
  const openDays = parseOpenDays(bp.openDays);
  const directionsUrl = bp.businessMapLocation?.lat ? `https://www.google.com/maps/search/?api=1&query=${bp.businessMapLocation.lat},${bp.businessMapLocation.lng}` : "#";
  const webUrl = (bp.websiteUrl && bp.websiteUrl !== "#") ? bp.websiteUrl : bp.businessEmail ? `mailto:${bp.businessEmail}` : "#";
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.06)] mb-7">
      <div className="grid border-b border-slate-200" style={{ gridTemplateColumns: "minmax(0,1.15fr) minmax(0,0.72fr) minmax(0,0.72fr) minmax(0,1.65fr) minmax(52px,0.55fr)", minHeight: 48 }}>
        <div className="flex items-center justify-center border-r border-slate-200 bg-emerald-50 px-2 py-2 text-center text-[13px] font-bold text-emerald-800"><span className="truncate">📞 {bp.businessPhone || "-"}</span></div>
        <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center border-r border-slate-200 bg-sky-50 text-[13px] font-semibold text-blue-600 no-underline hover:bg-sky-100">Directions</a>
        <a href={webUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center border-r border-slate-200 bg-slate-50 text-[13px] font-semibold text-slate-700 no-underline hover:bg-slate-100">Website</a>
        <div className="flex min-w-0 items-center justify-between gap-2 border-r border-slate-200 bg-white px-3 py-2">
          <div className="flex shrink-0 items-center gap-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${bp.isOpen ? "bg-emerald-500" : "bg-red-500"}`} />
            <span className={`whitespace-nowrap text-[12px] font-semibold ${bp.isOpen ? "text-emerald-700" : "text-red-600"}`}>{bp.isOpen ? "OPEN NOW" : "CLOSED"}</span>
          </div>
          <div className="text-right text-[11px] leading-snug text-slate-500"><div>{openDays}</div><div className="whitespace-nowrap">{bp.openHours || "-"}</div></div>
        </div>
        <div className="flex items-center justify-center gap-1 bg-amber-50 text-[15px] font-bold text-slate-900"><span className="text-amber-500">★</span>{bp.rating ?? 4.8}</div>
      </div>
      <div className="grid items-start gap-5 p-5" style={{ gridTemplateColumns: "minmax(120px,150px) minmax(0,1.25fr) minmax(0,1.1fr) minmax(100px,118px)" }}>
        <img src={logoUrl} alt={bp.businessName} className="h-[108px] w-full rounded-lg object-cover" />
        <div className="min-w-0">
          <h2 className="mb-1.5 text-xl font-bold leading-tight text-slate-900">{bp.businessName || "-"}</h2>
          <p className="mb-3 text-[13px] leading-relaxed text-slate-600">{bp.businessAddress}<br />{bp.city}{bp.pincode && <>, {bp.pincode}</>}</p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">{bp.isOpen ? "Open" : "Closed"}</span>
            <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] text-blue-700">{openDays}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-600">{bp.openHours || "-"}</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="mb-2.5 text-[13px] font-bold text-slate-900">Services</p>
          <ul className="grid list-none gap-x-4 gap-y-1.5 p-0" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}>
            {services.slice(0, 6).map((s, i) => (
              <li key={i} className="flex min-w-0 items-start gap-1.5 text-[12px] leading-snug text-slate-600">
                <span className="mt-px shrink-0 font-bold text-emerald-500">✓</span>
                <span className="min-w-0">{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-3 text-center">
          <span className="text-[26px] font-bold leading-none text-slate-900">{bp.rating ?? 4.8}</span>
          <span className="mt-1 text-[13px] tracking-wide text-amber-500">★★★★★</span>
          <span className="mt-1.5 text-[11px] text-slate-500">{bp.reviewCount ?? 0} Reviews</span>
        </div>
      </div>
      <div className="grid items-center gap-2 bg-slate-900 px-4 py-2.5 text-[12px] text-white" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1.6fr) minmax(0,1fr)" }}>
        <span className="truncate font-medium">{bp.businessName}</span>
        <span className="truncate text-center text-slate-200">{bp.businessAddress} • {bp.city}</span>
        <span className="truncate text-right text-slate-200">{openDays} | {bp.openHours || "-"}</span>
      </div>
    </div>
  );
};

// ─── PROFILE MODAL ────────────────────────────────────────────────────────────
const ProfileModal: React.FC<{ owner: AutoShopOwnerType; onClose: () => void; onEdit: () => void }> = ({ owner, onClose, onEdit }) => {
  const bp = owner.businessProfile;
  const customers = owner.myCustomers ?? [];
  const deals = owner.deals ?? [];
  const cards = owner.jobCards ?? [];
  const logoSrc = bp?.businessLogo ? imgUrl(bp.businessLogo) : "";
  return (
    <BaseModal isOpen wide onClose={onClose} title={`Profile — ${owner.name}`} maxW="min(860px,96vw)">
      {bp && <ShopOverviewCard bp={bp} />}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, border: "1px solid #c8e6b0", borderRadius: 14, overflow: "hidden", marginTop: 8 }}>
        <div style={{ background: "#d4f5c4", padding: "22px 26px", borderRight: "1px solid #c8e6b0" }}>
          <GCRow label="Name" value={owner.name} />
          <GCRow label="E-mail" value={<a href={`mailto:${owner.email}`} style={{ color: "#0073b7" }}>{owner.email}</a>} />
          <GCRow label="Phone" value={`${owner.countryCode ?? ""} ${owner.phone ?? ""}`.trim() || undefined} />
          <GCRow label="Shop Name" value={bp?.businessName} />
          <GCRow label="City" value={bp?.city} />
          <GCRow label="Address" value={bp?.businessAddress} />
          <GCRow label="Zip Code" value={bp?.pincode} />
          <div style={{ margin: "10px 0 4px", display: "flex", gap: 8 }}>
            <span style={GC_LABEL}>Customers</span><span style={{ color: "#888", marginRight: 4 }}>:</span>
            <div>{customers.length > 0 ? customers.map(c => <div key={c._id} style={GC_VAL}>{c.name || c.email || "-"}</div>) : <span style={GC_VAL}>—</span>}</div>
          </div>
          <div style={{ margin: "10px 0 4px", display: "flex", gap: 8 }}>
            <span style={GC_LABEL}>Deals</span><span style={{ color: "#888", marginRight: 4 }}>:</span>
            <div>{deals.length > 0 ? deals.map(d => <div key={d._id} style={GC_VAL}>{d.name || d.dealType || "-"}</div>) : <span style={GC_VAL}>—</span>}</div>
          </div>
          <div style={{ margin: "10px 0 4px", display: "flex", gap: 8 }}>
            <span style={GC_LABEL}>Job Cards</span><span style={{ color: "#888", marginRight: 4 }}>:</span>
            <div>{cards.length > 0 ? cards.map(c => <div key={c._id} style={GC_VAL}># {c.jobNo || c._id.slice(-5)}</div>) : <span style={GC_VAL}>—</span>}</div>
          </div>
        </div>
        <div style={{ background: "#d4f5c4", padding: "22px 26px" }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Shop Account Info</div>
          <GCRow label="Mobile" value={owner.phone} />
          <GCRow label="Status" value={getStatus(owner)} />
          <GCRow label="Joining Date" value={fmtDate(owner.createdAt)} />
          <GCRow label="HST Number" value={bp?.businessHSTNumber} />
          <GCRow label="Email" value={bp?.businessEmail} />
          <div style={{ marginTop: 14 }}>
            <span style={GC_LABEL}>Shop Logo</span>
            <div style={{ display: "inline-flex", marginLeft: 18, border: "1px solid #bbb", background: "#fff", width: 120, height: 120, borderRadius: 6, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
              {logoSrc ? <img src={logoSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
            </div>
          </div>
          <div style={{ marginTop: 24 }}>
            <button type="button" onClick={onEdit} style={{ background: "#1a6e1a", color: "#fff", border: "none", borderRadius: 4, padding: "8px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Update</button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

// ─── CUSTOMERS MODAL ──────────────────────────────────────────────────────────
const CustomersModal: React.FC<{ owner: AutoShopOwnerType; onClose: () => void }> = ({ owner, onClose }) => (
  <BaseModal isOpen onClose={onClose} title={`Customers — ${owner.name}`} wide>
    {!owner.myCustomers?.length
      ? <p style={{ textAlign: "center", color: "#aaa" }}>No customers found.</p>
      : owner.myCustomers.map(c => (
        <div key={c._id} style={GREEN_CARD}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <GCRow label="Name" value={c.name} />
            <GCRow label="Email" value={c.email} />
            <GCRow label="Phone" value={c.phone} />
          </div>
        </div>
      ))}
  </BaseModal>
);

// ─── DEALS MODAL ─────────────────────────────────────────────────────────────
const DealsModal: React.FC<{ owner: AutoShopOwnerType; onClose: () => void }> = ({ owner, onClose }) => (
  <BaseModal isOpen wide onClose={onClose} title={`Deals — ${owner.name}`}>
    {!owner.deals?.length
      ? <p style={{ textAlign: "center", color: "#aaa" }}>No deals found.</p>
      : owner.deals.map(deal => (
        <div key={deal._id} style={GREEN_CARD}>
          <h3 style={{ fontFamily: "serif", fontWeight: 700, fontSize: 16, marginBottom: 10 }}>{deal.name || deal.dealType || "Deal"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <GCRow label="Type" value={deal.dealType} />
            <GCRow label="Description" value={deal.description} />
            <GCRow label="Discount" value={deal.discountedPrice != null ? `$${deal.discountedPrice}` : deal.percentageDiscount != null ? `${deal.percentageDiscount}%` : undefined} />
            <GCRow label="Coupon" value={deal.couponCode} />
            <GCRow label="Ends On" value={deal.offerEndsOnDate ? fmtDate(deal.offerEndsOnDate) : deal.endDate ? fmtDate(deal.endDate) : undefined} />
            <GCRow label="Status" value={deal.dealEnabled ? "Enabled" : "Disabled"} />
          </div>
          {deal.dealImage && <div style={{ marginTop: 10 }}><img src={mediaUrl(deal.dealImage)} alt="deal" style={{ maxWidth: 160, maxHeight: 90, objectFit: "cover", borderRadius: 6, border: "1px solid #b2e0a0" }} /></div>}
        </div>
      ))}
  </BaseModal>
);

// ─── JOB CARDS MODAL ─────────────────────────────────────────────────────────
const JobCardsModal: React.FC<{ owner: AutoShopOwnerType; onClose: () => void }> = ({ owner, onClose }) => {
  const [detailCard, setDetailCard] = useState<JobCardType | null>(null);
  const cards = owner.jobCards ?? [];
  if (detailCard) {
    return (
      <BaseModal isOpen wide onClose={() => setDetailCard(null)} title={`Job Card — ${detailCard.jobNo || detailCard._id}`}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {([
            ["Job No.", detailCard.jobNo], ["Date", fmtDate(detailCard.createdAt)],
            ["Service Type", detailCard.serviceType], ["Priority", detailCard.priorityLevel],
            ["Payment Status", detailCard.paymentStatus], ["Total", detailCard.totalPayableAmount != null ? `$${detailCard.totalPayableAmount}` : "-"],
            ["Issue", detailCard.issueDescription], ["Notes", detailCard.additionalNotes],
            ["Technical Remarks", detailCard.technicalRemarks],
            ["Deal", detailCard.dealApplied ? `${detailCard.dealApplied.name ?? ""} ${detailCard.dealApplied.dealCode ? `(${detailCard.dealApplied.dealCode})` : ""}` : "-"],
          ] as [string, any][]).map(([l, v]) => (
            <div key={l} style={{ borderBottom: "1px solid #f4f4f4", paddingBottom: 6, fontSize: 13 }}>
              <span style={{ fontWeight: 600 }}>{l}:</span> <span style={{ color: "#555" }}>{v || "-"}</span>
            </div>
          ))}
        </div>
        {Array.isArray(detailCard.vehiclePhotos) && detailCard.vehiclePhotos.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Vehicle Photos</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {detailCard.vehiclePhotos.map((p, i) => <img key={i} src={mediaUrl(p)} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 3, border: "1px solid #d2d6de" }} />)}
            </div>
          </div>
        )}
        <button type="button" onClick={() => setDetailCard(null)} style={{ padding: "7px 18px", borderRadius: 3, border: "1px solid #d2d6de", background: "#fff", color: "#444", fontSize: 13, cursor: "pointer" }}>← Back</button>
      </BaseModal>
    );
  }
  return (
    <BaseModal isOpen wide onClose={onClose} title={`Job Cards — ${owner.name}`}>
      {!cards.length
        ? <p style={{ textAlign: "center", color: "#aaa" }}>No job cards found.</p>
        : cards.map(card => (
          <div key={card._id} style={GREEN_CARD}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <GCRow label="Job Card No" value={card.jobNo ? `#${card.jobNo}` : undefined} />
              <GCRow label="Service type" value={card.serviceType} />
              <GCRow label="Created on" value={fmtDate(card.createdAt)} />
              <GCRow label="Status" value={card.paymentStatus} />
            </div>
            <button type="button" onClick={() => setDetailCard(card)} style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", fontSize: 26, color: "#1a8a1a", cursor: "pointer", lineHeight: 1 }}>+</button>
          </div>
        ))}
    </BaseModal>
  );
};

// ─── BUSINESS PROFILE MODAL ───────────────────────────────────────────────────
const BusinessProfileModal: React.FC<{ owner: AutoShopOwnerType; onClose: () => void }> = ({ owner, onClose }) => {
  const bp = owner.businessProfile;
  if (!bp) return (
    <BaseModal isOpen onClose={onClose} title="Business Profile">
      <p style={{ textAlign: "center", color: "#aaa" }}>No business profile found.</p>
    </BaseModal>
  );
  const serviceMap: Record<string, { service: Service; subServices: IndividualService[] }> = {};
  (bp.myServices ?? []).forEach((ms: MyService) => {
    const svc = ms.service; if (!svc?._id) return;
    if (!serviceMap[svc._id]) serviceMap[svc._id] = { service: svc, subServices: [] };
    const subIds = (ms.subServices ?? []).map(s => s.subService);
    if (Array.isArray(svc.services)) {
      const matched = subIds.length ? svc.services.filter(ss => subIds.includes(ss._id)) : svc.services;
      serviceMap[svc._id].subServices.push(...matched);
    }
  });
  return (
    <BaseModal isOpen wide onClose={onClose} title={`Business Profile — ${bp.businessName || "-"}`}>
      <ShopOverviewCard bp={bp} />
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, borderBottom: "2px solid #9b308d", paddingBottom: 6, color: "#9b308d", marginTop: 16 }}>Team Members</div>
      {Array.isArray(bp.teamMembers) && bp.teamMembers.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          {bp.teamMembers.map((tm: TeamMemberType) => (
            <div key={tm._id} style={GREEN_CARD}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ width: 50, height: 50, borderRadius: "50%", background: "#c8e6b0", border: "2px solid #1a6e1a", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {tm.photo ? <img src={imgUrl(tm.photo)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 18, color: "#1a6e1a" }}>👤</span>}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{tm.name}</div>
                  <div style={{ fontSize: 12, color: "#555" }}>{tm.designation || "-"}</div>
                  <div style={{ fontSize: 12, color: "#555" }}>{tm.email || ""} {tm.phone || ""}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : <div style={{ color: "#aaa", fontSize: 13, marginBottom: 20 }}>No team members.</div>}
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, borderBottom: "2px solid #9b308d", paddingBottom: 6, color: "#9b308d" }}>Services</div>
      {Object.keys(serviceMap).length > 0 ? (
        <div style={{ marginBottom: 20 }}>
          {Object.values(serviceMap).map(({ service, subServices }) => (
            <div key={service._id} style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "#333", marginBottom: 4 }}>{service.name || "-"}</div>
              {subServices.length > 0 && <ul style={{ paddingLeft: 18, margin: "0 0 4px", fontSize: 12, color: "#555" }}>{subServices.map(ss => <li key={ss._id}>{ss.name}{ss.desc ? ` — ${ss.desc}` : ""}</li>)}</ul>}
            </div>
          ))}
        </div>
      ) : <div style={{ color: "#aaa", fontSize: 13, marginBottom: 20 }}>No services listed.</div>}
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, borderBottom: "2px solid #9b308d", paddingBottom: 6, color: "#9b308d" }}>My Deals</div>
      {Array.isArray(bp.myDeals) && bp.myDeals.length > 0 ? (
        <div style={{ overflowX: "auto", marginBottom: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr>{["Name", "Type", "Discount", "Ends On"].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
            <tbody>
              {bp.myDeals.map((deal: any, i: number) => {
                if (typeof deal === "string") return <tr key={i}><td style={tdS} colSpan={4}>{deal}</td></tr>;
                return (
                  <tr key={deal._id ?? i}>
                    <td style={tdS}>{deal.name || "-"}</td>
                    <td style={tdS}>{deal.dealType || "-"}</td>
                    <td style={tdS}>{deal.discountedPrice != null ? `$${deal.discountedPrice}` : deal.percentageDiscount != null ? `${deal.percentageDiscount}%` : "-"}</td>
                    <td style={tdS}>{deal.offerEndsOnDate ? fmtDate(deal.offerEndsOnDate) : deal.endDate ? fmtDate(deal.endDate) : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : <div style={{ color: "#aaa", fontSize: 13 }}>No deals linked.</div>}
    </BaseModal>
  );
};

// ─── PRINT PAGE ───────────────────────────────────────────────────────────────
function printOwner(owner: AutoShopOwnerType) {
  const bp = owner.businessProfile;
  const customers = owner.myCustomers ?? [];
  const deals = owner.deals ?? [];
  const cards = owner.jobCards ?? [];
  const logoSrc = bp?.businessLogo ? imgUrl(bp.businessLogo) : "";
  const services: string[] = [];
  if (Array.isArray(bp?.myServices)) for (const ms of bp!.myServices!) { const n = ms.serviceName || ms.service?.name; if (n) services.push(n); }
  const row = (label: string, value: string) => `<tr><td style="font-weight:600;padding:4px 12px 4px 0;width:130px;vertical-align:top">${label}</td><td style="padding:4px 0;color:#333">: ${value || "—"}</td></tr>`;
  const custRows = customers.map(c => `<tr><td></td><td style="padding:2px 0">: ${c.name || ""} ${c.email ? `(${c.email})` : ""}</td></tr>`).join("");
  const dealRows = deals.map(d => `<tr><td></td><td style="padding:2px 0">: ${d.name || d.dealType || "-"}</td></tr>`).join("");
  const cardRows = cards.map(c => `<tr><td></td><td style="padding:2px 0">: # ${c.jobNo || c._id.slice(-5)}</td></tr>`).join("");
  const html = `<!DOCTYPE html><html><head><title>Print - ${owner.name}</title>
<style>body{font-family:sans-serif;padding:30px}h2{font-weight:700;margin-bottom:16px}
.card{background:#d4f5c4;border-radius:14px;padding:22px 28px;display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid #b2e0a0}
.left{border-right:1px solid #b2e0a0;padding-right:24px}.right{padding-left:24px}
table{border-collapse:collapse;font-size:14px}
.btn{background:#1a6e1a;color:#fff;border:none;border-radius:4px;padding:8px 24px;font-size:14px;font-weight:700;cursor:pointer;margin-right:8px}
.btn-xl{background:#0073b7}@media print{.noprint{display:none}}</style></head><body>
<h2>Print Page</h2>
<div class="card">
  <div class="left">
    <table>
      ${row("Name", owner.name)}${row("E-mail", owner.email ?? "")}${row("Phone", `${owner.countryCode ?? ""} ${owner.phone ?? ""}`.trim())}
      ${row("Shop Name", bp?.businessName ?? "")}${row("City", bp?.city ?? "")}${row("Address", bp?.businessAddress ?? "")}${row("Zip Code", bp?.pincode ?? "")}
      ${row("Status", getStatus(owner))}${row("HST No.", bp?.businessHSTNumber ?? "")}
      <tr><td style="font-weight:600;padding:4px 12px 4px 0;vertical-align:top">Services</td><td style="padding:4px 0">${services.join(", ") || "—"}</td></tr>
      <tr><td style="font-weight:600;padding:4px 12px 4px 0;vertical-align:top">Customers</td><td></td></tr>${custRows || `<tr><td></td><td>: —</td></tr>`}
      <tr><td style="font-weight:600;padding:4px 12px 4px 0;vertical-align:top">Deals</td><td></td></tr>${dealRows || `<tr><td></td><td>: —</td></tr>`}
      <tr><td style="font-weight:600;padding:4px 12px 4px 0;vertical-align:top">Job Cards</td><td></td></tr>${cardRows || `<tr><td></td><td>: —</td></tr>`}
    </table>
  </div>
  <div class="right">
    <div style="font-weight:700;font-size:16px;margin-bottom:14px">Shop Account Info</div>
    <table>${row("Mobile", owner.phone ?? "")}${row("Status", getStatus(owner))}${row("Joining Date", fmtDate(owner.createdAt))}${row("Email", bp?.businessEmail ?? "")}</table>
    <div style="margin-top:14px;font-weight:600;font-size:13px">Shop Logo :</div>
    <div style="margin-top:6px;background:#fff;border:1px solid #ccc;width:140px;height:140px;border-radius:6px;overflow:hidden;display:flex;align-items:center;justify-content:center">
      ${logoSrc ? `<img src="${logoSrc}" style="width:100%;height:100%;object-fit:cover"/>` : ""}
    </div>
    <div style="margin-top:24px" class="noprint">
      <button class="btn" onclick="window.print()">Print</button>
      <button class="btn btn-xl" onclick="exportXL()">Export XL</button>
    </div>
  </div>
</div>
<script>
function exportXL(){
  const d=${JSON.stringify({ Name:owner.name,Email:owner.email,Phone:`${owner.countryCode??""} ${owner.phone??""}`.trim(),ShopName:bp?.businessName,City:bp?.city,Address:bp?.businessAddress,Pincode:bp?.pincode,Status:getStatus(owner),Customers:customers.length,Deals:deals.length,JobCards:cards.length })};
  const rows=[Object.keys(d),Object.values(d)];
  const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(",")).join("\\n");
  const a=document.createElement("a");a.href="data:text/csv,"+encodeURIComponent(csv);a.download="autoshop-${owner.name.replace(/\s+/g,"-")}.csv";a.click();
}
</script></body></html>`;
  const w = window.open("", "_blank"); if (w) { w.document.write(html); w.document.close(); }
}

// ─── SEND NOTIFICATION MODAL ──────────────────────────────────────────────────
const SendNotifModal: React.FC<{ isOpen: boolean; onClose: () => void; ids: string[]; onDone: () => void }> = ({ isOpen, onClose, ids, onDone }) => {
  const [title, setTitle] = useState(""); const [body, setBody] = useState("");
  const [sending, setSending] = useState(false); const [err, setErr] = useState<string | null>(null); const [ok, setOk] = useState<string | null>(null);
  useEffect(() => { if (isOpen) { setTitle(""); setBody(""); setSending(false); setErr(null); setOk(null); } }, [isOpen]);
  if (!isOpen) return null;
  return (
    <BaseModal isOpen onClose={onClose} title="Send Custom Notification">
      <form onSubmit={async e => {
        e.preventDefault(); if (!title.trim() || !body.trim()) { setErr("Title and body required."); return; }
        setSending(true); setErr(null);
        try {
          const res = await axios.post(`${API()}/api/admin/notification/custom/send`, { userType: "autoshopowner", userIds: ids, title, message: body });
          if (res.data?.success) { setOk("Sent!"); setTimeout(() => { onClose(); onDone(); }, 900); }
          else setErr(res.data?.message || "Failed.");
        } catch (e: any) { setErr(e?.response?.data?.message || "Error."); } finally { setSending(false); }
      }}>
        <div style={{ marginBottom: 12 }}><label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Title *</label><input style={{ width: "100%", border: "1px solid #d2d6de", borderRadius: 3, padding: "7px 10px", fontSize: 14, outline: "none", boxSizing: "border-box" }} value={title} onChange={e => setTitle(e.target.value)} disabled={sending} placeholder="Notification title" /></div>
        <div style={{ marginBottom: 12 }}><label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Body *</label><textarea style={{ width: "100%", border: "1px solid #d2d6de", borderRadius: 3, padding: "7px 10px", fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box", minHeight: 80, fontFamily: "inherit" }} value={body} onChange={e => setBody(e.target.value)} rows={3} disabled={sending} placeholder="Notification message" /></div>
        <p style={{ fontSize: 13, color: "#2575c4", marginBottom: 10 }}>To: <strong>{ids.length} owner{ids.length !== 1 ? "s" : ""}</strong></p>
        {err && <div style={{ color: "#c0392b", fontSize: 13, marginBottom: 8, background: "#fdf3f2", border: "1px solid #f5c6cb", borderRadius: 3, padding: "7px 10px" }}>{err}</div>}
        {ok && <div style={{ color: "#27ae60", fontSize: 13, marginBottom: 8, background: "#f0fff4", border: "1px solid #c3e6cb", borderRadius: 3, padding: "7px 10px" }}>{ok}</div>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} disabled={sending} style={{ padding: "7px 18px", borderRadius: 3, border: "1px solid #d2d6de", background: "#fff", color: "#444", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          <button type="submit" disabled={sending} style={{ padding: "7px 20px", borderRadius: 3, border: "none", background: sending ? "#aaa" : "#00a65a", color: "#fff", fontSize: 13, fontWeight: 600, cursor: sending ? "not-allowed" : "pointer" }}>{sending ? "Sending…" : "Send"}</button>
        </div>
      </form>
    </BaseModal>
  );
};

// ─── COLUMN SELECTOR ─────────────────────────────────────────────────────────
const ColSelector: React.FC<{ visible: string[]; onChange: (v: string[]) => void }> = ({ visible, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  const toggle = (key: string) => onChange(visible.includes(key) ? visible.filter(k => k !== key) : [...visible, key]);
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{ padding: "6px 14px", background: "#555", color: "#fff", border: "none", borderRadius: 3, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
        Select Heading <span style={{ fontSize: 10 }}>▼</span>
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "110%", background: "#fff", border: "1px solid #d2d6de", borderRadius: 3, boxShadow: "0 3px 10px rgba(0,0,0,.15)", zIndex: 200, minWidth: 170, padding: "6px 0" }}>
          {ALL_COLUMNS.map(col => (
            <label key={col.key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13, color: "#333", userSelect: "none" }}>
              <input type="checkbox" checked={visible.includes(col.key)} onChange={() => toggle(col.key)} style={{ accentColor: "#0073b7", width: 14, height: 14, cursor: "pointer" }} />
              {col.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── EXPORT CSV ───────────────────────────────────────────────────────────────
function exportCsv(owners: AutoShopOwnerType[], visibleCols: string[]) {
  const colMap: Record<string, (o: AutoShopOwnerType) => string> = {
    name: o => o.name || "-",
    phone: o => `${o.countryCode ?? ""} ${o.phone ?? ""}`.trim() || "-",
    shopName: o => o.businessProfile?.businessName || "-",
    shopType: o => o.shopType ? SHOP_TYPE_OPTIONS.find(x => x.value === o.shopType)?.label || o.shopType : "-",
    city: o => o.businessProfile?.city || "-",
    date: o => fmtDate(o.createdAt),
    customers: o => String(o.myCustomers?.length ?? 0),
    deals: o => String(o.deals?.length ?? 0),
    jobCards: o => String(o.jobCards?.length ?? 0),
    status: o => getStatus(o),
  };
  const cols = ALL_COLUMNS.filter(c => visibleCols.includes(c.key));
  const esc = (v: string) => /[,"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  const header = cols.map(c => esc(c.label)).join(",");
  const rows = owners.map(o => cols.map(c => esc(colMap[c.key]?.(o) ?? "-")).join(",")).join("\n");
  const blob = new Blob([header + "\n" + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `autoshop-owners-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ─── STYLE CONSTANTS ──────────────────────────────────────────────────────────
const thS: React.CSSProperties = { border: "1px solid #d2d6de", background: "#f9fafc", padding: "9px 12px", textAlign: "left", fontWeight: 700, fontSize: 13, color: "#333", whiteSpace: "nowrap" };
const tdS: React.CSSProperties = { border: "1px solid #d2d6de", padding: "9px 12px", fontSize: 13, color: "#555", verticalAlign: "middle" };
const linkBtn: React.CSSProperties = { background: "none", border: "none", color: "#0073b7", cursor: "pointer", padding: 0, fontSize: 12, textDecoration: "underline", fontWeight: 500 };
const pageBtn = (active: boolean, disabled: boolean): React.CSSProperties => ({ border: "1px solid", borderColor: active ? "#0073b7" : "#ddd", background: active ? "#0073b7" : "#fff", color: active ? "#fff" : disabled ? "#bbb" : "#777", padding: "6px 13px", fontSize: 13, cursor: disabled ? "not-allowed" : "pointer", marginLeft: -1 });

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const AutoShopOwners: React.FC = () => {
  const [allOwners, setAllOwners] = useState<AutoShopOwnerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [visibleCols, setVisibleCols] = useState<string[]>(DEFAULT_VISIBLE);
  const [actionBusy, setActionBusy] = useState<Record<string, boolean>>({});

  // ── View toggle: "active" shows active/suspended, "deleted" shows deleted ──
  const [viewMode, setViewMode] = useState<"active" | "deleted">("active");

  // Modals
  const [profileFor, setProfileFor] = useState<AutoShopOwnerType | null>(null);
  const [businessFor, setBusinessFor] = useState<AutoShopOwnerType | null>(null);
  const [customersFor, setCustomersFor] = useState<AutoShopOwnerType | null>(null);
  const [dealsFor, setDealsFor] = useState<AutoShopOwnerType | null>(null);
  const [jobCardsFor, setJobCardsFor] = useState<AutoShopOwnerType | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [addEdit, setAddEdit] = useState<{ open: boolean; mode: "add" | "edit"; owner: AutoShopOwnerType | null }>({ open: false, mode: "add", owner: null });

  const fetchOwners = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await axios.get(`${API()}/api/admin/autoshopowners`, { headers: getToken() });
      if (res.data?.success && Array.isArray(res.data.data)) setAllOwners(res.data.data);
      else setError("Failed to fetch auto shop owners");
    } catch (e: any) { setError(e?.response?.data?.message || "Something went wrong"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOwners(); }, [fetchOwners]);

  // Split owners by deleted status
  const activeOwners = allOwners.filter(o => o.status !== "deleted");
  const deletedOwners = allOwners.filter(o => o.status === "deleted");
  const displayOwners = viewMode === "deleted" ? deletedOwners : activeOwners;

  const filtered = displayOwners.filter(o => {
    const q = search.toLowerCase();
    return (o.name || "").toLowerCase().includes(q)
      || (o.email || "").toLowerCase().includes(q)
      || (o.phone || "").toLowerCase().includes(q)
      || (o.businessProfile?.businessName || "").toLowerCase().includes(q)
      || (o.businessProfile?.city || "").toLowerCase().includes(q)
      || (o.shopType || "").toLowerCase().includes(q); // search on shopType as well
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selected = Array.from(selectedRows);
  const selCount = selected.length;
  const allPageSel = paginated.length > 0 && paginated.every(o => selectedRows.has(o._id));

  function toggleRow(id: string) {
    setSelectedRows(prev => { const c = new Set(prev); c.has(id) ? c.delete(id) : c.add(id); return c; });
  }

  async function toggleSuspend(ownerId: string, disable: boolean) {
    setActionBusy(prev => ({ ...prev, [ownerId]: true }));
    try {
      await axios.post(`${API()}/api/admin/autoshopowners/toggle-status`, { userId: ownerId, disable }, { headers: getToken() });
      await fetchOwners();
    } catch (e: any) { alert(e?.response?.data?.message || "Error updating status."); }
    finally { setActionBusy(prev => ({ ...prev, [ownerId]: false })); }
  }

  async function deleteOwner(ownerId: string) {
    if (!window.confirm("Delete this auto shop owner? They can be restore later.")) return;
    setActionBusy(prev => ({ ...prev, [ownerId]: true }));
    try {
      await axios.delete(`${API()}/api/admin/autoshopowners/${ownerId}`, { headers: getToken() });
      setAllOwners(prev => prev.map(o => o._id === ownerId ? { ...o, status: "deleted", isDisabled: true } : o));
      setSelectedRows(prev => { const c = new Set(prev); c.delete(ownerId); return c; });
      await fetchOwners();
    } catch (e: any) { alert(e?.response?.data?.message || "Error deleting."); }
    finally { setActionBusy(prev => ({ ...prev, [ownerId]: false })); }
  }

  async function reviveOwner(ownerId: string) {
    setActionBusy(prev => ({ ...prev, [ownerId]: true }));
    try {
      await axios.put(`${API()}/api/admin/autoshopowners/${ownerId}/revive`, {}, { headers: getToken() });
      await fetchOwners();
    } catch (e: any) { alert(e?.response?.data?.message || "Error restoring."); }
    finally { setActionBusy(prev => ({ ...prev, [ownerId]: false })); }
  }

  function renderCell(owner: AutoShopOwnerType, key: string) {
    switch (key) {
      case "name":
        return (
          <td key={key} style={{ ...tdS, fontWeight: 500 }}>
            <button type="button" onClick={() => setProfileFor(owner)} style={{ ...linkBtn, color: "#8a00d4", fontWeight: 600, fontSize: 13 }}>
              {owner.name}
            </button>
          </td>
        );
      case "phone":
        return <td key={key} style={tdS}>{owner.countryCode ? `${owner.countryCode} ` : ""}{owner.phone || "-"}</td>;
      case "shopName":
        return <td key={key} style={tdS}><button type="button" onClick={() => setBusinessFor(owner)} style={linkBtn}>{owner.businessProfile?.businessName || "-"}</button></td>;
      case "shopType":
        return (
          <td key={key} style={tdS}>
            {(owner.shopType && SHOP_TYPE_OPTIONS.find(x => x.value === owner.shopType)?.label) || "-"}
          </td>
        );
      case "city":
        return <td key={key} style={tdS}>{owner.businessProfile?.city || "-"}</td>;
      case "date":
        return <td key={key} style={tdS}>{fmtDate(owner.createdAt)}</td>;
      case "customers":
        return <td key={key} style={tdS}><button type="button" onClick={() => setCustomersFor(owner)} style={linkBtn}>{owner.myCustomers?.length ?? 0}</button></td>;
      case "deals":
        return <td key={key} style={tdS}><button type="button" onClick={() => setDealsFor(owner)} style={linkBtn}>{owner.deals?.length ?? 0}</button></td>;
      case "jobCards":
        return <td key={key} style={tdS}><button type="button" onClick={() => setJobCardsFor(owner)} style={linkBtn}>{owner.jobCards?.length ?? 0}</button></td>;
      case "status":
        return <td key={key} style={tdS}><span style={{ ...getStatusColors(getStatus(owner)), display: "inline-block", padding: "2px 10px", borderRadius: 3, fontSize: 12, fontWeight: 600 }}>{getStatus(owner)}</span></td>;
      default:
        return <td key={key} style={tdS}>-</td>;
    }
  }

  const tbBtn = (label: string, bg: string, onClick: () => void, disabled = false) => (
    <button type="button" onClick={onClick} disabled={disabled} style={{ padding: "6px 14px", borderRadius: 2, border: "1px solid rgba(0,0,0,0.2)", fontSize: 13, background: disabled ? "#bbb" : bg, color: "#fff", fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
      {label}
    </button>
  );

  return (
    <>
      {/* ── MODALS ── */}
      {/* unchanged, same as previous code for modals... */}
      {profileFor && (
        <ProfileModal
          owner={profileFor}
          onClose={() => setProfileFor(null)}
          onEdit={() => { setAddEdit({ open: true, mode: "edit", owner: profileFor }); setProfileFor(null); }}
        />
      )}
      {businessFor && <BusinessProfileModal owner={businessFor} onClose={() => setBusinessFor(null)} />}
      {customersFor && <CustomersModal owner={customersFor} onClose={() => setCustomersFor(null)} />}
      {dealsFor && <DealsModal owner={dealsFor} onClose={() => setDealsFor(null)} />}
      {jobCardsFor && <JobCardsModal owner={jobCardsFor} onClose={() => setJobCardsFor(null)} />}
      <SendNotifModal isOpen={notifOpen} onClose={() => setNotifOpen(false)} ids={selected} onDone={() => {}} />
      <AddEditModal
        isOpen={addEdit.open}
        onClose={() => setAddEdit(s => ({ ...s, open: false }))}
        onSaved={() => { setAddEdit(s => ({ ...s, open: false })); fetchOwners(); }}
        owner={addEdit.owner}
        mode={addEdit.mode}
      />

      {/* ── PAGE ── */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-ad-app-bg py-4 md:py-5 font-sans">
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2c8c2c", margin: 0 }}>Auto Shop Owners</h1>
          <button
            onClick={() => setAddEdit({ open: true, mode: "add", owner: null })}
            style={{ background: "#00a65a", color: "#fff", padding: "8px 18px", borderRadius: 4, border: "none", fontSize: 16, fontWeight: 600, cursor: "pointer" }}
          >
            + Add New
          </button>
        </div>

        <div className="mb-4" style={{ background: "#fff", border: "1px solid #d2d6de", borderRadius: 3, boxShadow: "0 1px 1px rgba(0,0,0,.1)" }}>
          {/* ── Toolbar ── */}
          <div style={{ padding: "8px 14px", background: "#d2d6de", borderBottom: "1px solid #bbb", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {viewMode === "active" ? (
              <>
                {tbBtn("✉ Send Notification", "#555", () => { if (!selCount) { alert("Select at least one."); return; } setNotifOpen(true); })}
                {tbBtn("WhatsApp", "#25d366", () => {})}
                {tbBtn("↓ Export XL", "#555", () => { if (!selCount) { alert("Select at least one."); return; } exportCsv(allOwners.filter(o => selectedRows.has(o._id)), visibleCols); })}
                {selCount === 1 && tbBtn("✏️ Update", "#0073b7", () => { const o = allOwners.find(x => x._id === selected[0]); if (o) setAddEdit({ open: true, mode: "edit", owner: o }); })}
                {selCount === 1 && tbBtn("🗑 Delete", "#e74c3c", () => deleteOwner(selected[0]))}
                {selCount === 1 && tbBtn("🖨 Print", "#00c0ef", () => { const o = allOwners.find(x => x._id === selected[0]); if (o) printOwner(o); })}
              </>
            ) : (
              <>
                {selCount === 1 && tbBtn("♻️ Restore Active", "#27ae60", () => reviveOwner(selected[0]))}
              </>
            )}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <input value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} style={{ height: 30, width: 170, border: "1px solid #bbb", borderRadius: 2, padding: "0 10px", fontSize: 13, outline: "none" }} placeholder="Live Search here" />
              {selCount > 0 && <span style={{ fontSize: 12, color: "#555", fontWeight: 600, whiteSpace: "nowrap" }}>{selCount} selected</span>}
              {viewMode === "active" && <ColSelector visible={visibleCols} onChange={setVisibleCols} />}
            </div>
          </div>

          {/* ── View Mode Banner ── */}
          {viewMode === "deleted" && (
            <div style={{ background: "#fdf3f2", borderBottom: "1px solid #f5c6cb", padding: "8px 20px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, color: "#a94442", fontWeight: 600 }}>🗑️ Showing Deleted Auto Shop Owners ({deletedOwners.length})</span>
              <span style={{ fontSize: 12, color: "#888" }}>— Select a deleted owner and click restore to set active</span>
            </div>
          )}

          {/* Card Body */}
          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "#333", marginBottom: 14 }}>
              <span>Show</span>
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} style={{ height: 32, border: "1px solid #d2d6de", borderRadius: 3, padding: "0 8px", fontSize: 14, outline: "none" }}>
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span>entries</span>
            </div>

            {loading && <div style={{ textAlign: "center", padding: "40px 0", color: "#888" }}>Loading shop owners…</div>}
            {error && <div style={{ textAlign: "center", padding: "30px 0", color: "#c0392b" }}>Error: {error}</div>}

            {!loading && !error && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr>
                      <th style={thS}>
                        <input type="checkbox" checked={allPageSel} onChange={e => {
                          setSelectedRows(prev => { const c = new Set(prev); paginated.forEach(o => e.target.checked ? c.add(o._id) : c.delete(o._id)); return c; });
                        }} />
                      </th>
                      {ALL_COLUMNS.filter(c => viewMode === "active" ? visibleCols.includes(c.key) : DEFAULT_VISIBLE.includes(c.key)).map(c => <th key={c.key} style={thS}>{c.label}</th>)}
                      {viewMode === "active" && <th style={thS}>Action</th>}
                      {viewMode === "deleted" && <th style={thS}>Restore Active</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 && (
                      <tr><td colSpan={visibleCols.length + 2} style={{ ...tdS, textAlign: "center", color: "#aaa", padding: "36px 0" }}>
                        {viewMode === "deleted" ? "No deleted auto shop owners." : "No auto shop owners found."}
                      </td></tr>
                    )}
                    {paginated.map(owner => {
                      const isSuspended = !!owner.isDisabled;
                      const busy = !!actionBusy[owner._id];
                      const cols = ALL_COLUMNS.filter(c => viewMode === "active" ? visibleCols.includes(c.key) : DEFAULT_VISIBLE.includes(c.key));
                      return (
                        <tr key={owner._id} style={{ background: selectedRows.has(owner._id) ? (viewMode === "deleted" ? "#fdf3f2" : "#f0f7ff") : undefined }}>
                          <td style={tdS}><input type="checkbox" checked={selectedRows.has(owner._id)} onChange={() => toggleRow(owner._id)} /></td>
                          {cols.map(c => renderCell(owner, c.key))}
                          {viewMode === "active" && (
                            <td style={{ ...tdS, whiteSpace: "nowrap" }}>
                              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                <button type="button" disabled={busy} onClick={() => toggleSuspend(owner._id, !isSuspended)} style={{ padding: "4px 10px", borderRadius: 3, border: "none", fontSize: 12, fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", background: isSuspended ? "#dff0d8" : "#fcf8e3", color: isSuspended ? "#3c763d" : "#8a6d3b", opacity: busy ? 0.6 : 1 }}>
                                  {busy ? "…" : isSuspended ? "Enable" : "Suspend"}
                                </button>
                                <button type="button" disabled={busy} onClick={() => deleteOwner(owner._id)} style={{ padding: "4px 10px", borderRadius: 3, border: "none", fontSize: 12, fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", background: "#f2dede", color: "#a94442", opacity: busy ? 0.6 : 1 }}>
                                  {busy ? "…" : "Delete"}
                                </button>
                              </div>
                            </td>
                          )}
                          {viewMode === "deleted" && (
                            <td style={tdS}>
                              <button type="button" disabled={busy} onClick={() => reviveOwner(owner._id)} style={{ padding: "4px 12px", borderRadius: 3, border: "none", background: busy ? "#aaa" : "#27ae60", color: "#fff", fontSize: 12, fontWeight: 600, cursor: busy ? "not-allowed" : "pointer" }}>
                                {busy ? "…" : "♻️ Restore Active"}
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && !error && (
              <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <p style={{ margin: 0, fontSize: 14, color: "#333" }}>
                  {filtered.length === 0 ? "No entries" : `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, filtered.length)} of ${filtered.length} entries${search ? ` (filtered from ${displayOwners.length} total)` : ""}`}
                </p>
                <div style={{ display: "flex" }}>
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={pageBtn(false, currentPage === 1)}>Previous</button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(pg => <button key={pg} onClick={() => setCurrentPage(pg)} style={pageBtn(pg === currentPage, false)}>{pg}</button>)}
                  {totalPages > 7 && <span style={{ padding: "6px 8px", fontSize: 13 }}>…</span>}
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={pageBtn(false, currentPage === totalPages)}>Next</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom Right Toggle Button ── */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, marginBottom: 40 }}>
          <button
            type="button"
            onClick={() => {
              setViewMode(v => v === "active" ? "deleted" : "active");
              setSelectedRows(new Set());
              setSearch("");
              setCurrentPage(1);
            }}
            style={{
              padding: "9px 22px", borderRadius: 4, border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer",
              background: viewMode === "active" ? "#e74c3c" : "#27ae60",
              color: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            {viewMode === "active"
              ? <>🗑️ Deleted <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: 10, padding: "1px 8px", fontSize: 12 }}>{deletedOwners.length}</span></>
              : <>✅ Active Owners</>
            }
          </button>
        </div>
      </div>
    </>
  );
};

export default AutoShopOwners;