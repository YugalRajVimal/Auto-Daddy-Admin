import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { adminNotify } from "../../../utils/adminNotify";
import { printAdminTable } from "../../../utils/adminPrintTable";
import { authHeaders } from "../../../api/client";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import { TableEntriesSummary } from "../../../components/admin/AdminDataTable";
import AdminSearchCard, {
  emptyAdminSearchValues,
  searchEquals,
  searchIncludes,
  type AdminSearchField,
} from "../../../components/admin/AdminSearchCard";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactInputClass,
} from "../../../components/admin/ContentPanel";

// ─── Types ────────────────────────────────────────────────────────────────────
type TeamMemberType = { _id: string; name: string; email?: string; phone?: string; designation?: string; photo?: string };
type IndividualService = { name: string; desc?: string; price?: number; _id: string };
type Service = { _id: string; name?: string; desc?: string; services?: IndividualService[];[k: string]: any };
type MyService = { service: Service; subServices?: { subService: string }[]; serviceName?: string; serviceId?: string;[k: string]: any };
type BusinessProfileType = {
  _id: string; Name?: string; businessAddress?: string; pincode?: string; city?: string;
  businessPhone?: string; businessEmail?: string; businessHSTNumber?: string; openHours?: string;
  openDays?: string[]; perDayOpenHours?: any[]; businessLogo?: string; myServices?: MyService[];
  myDeals?: any[]; teamMembers?: TeamMemberType[]; businessMapLocation?: any; isOpen?: boolean;
  rating?: number; reviewCount?: number; reviewDate?: string; websiteUrl?: string;
  createdAt?: string; updatedAt?: string; ads?: any[];[k: string]: any;
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
  createdAt?: string; updatedAt?: string; status?: string;[k: string]: any;
};
type ShopType = "autoShop" | "tyreShop" | "carWash" | "towTruck";
// Change shopType to support multiple shop types (array)
type AutoShopOwnerType = {
  _id: string;
  name: string;
  email?: string;
  city?: string;
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
  shopType?: ShopType[]; // CHANGED: shopType is now ShopType[]
};

// ─── Column Config ────────────────────────────────────────────────────────────
const ALL_COLUMNS = [
  { key: "date", label: "Date" },
  { key: "phone", label: "Phone" },
  { key: "Name", label: "Business Name" },
  { key: "shopType", label: "Shop Type" },
  { key: "city", label: "City" },
  { key: "customers", label: "No. of Customers" },
  { key: "dealsPosted", label: "Deals Posted" },
  { key: "email", label: "Email" },
];
const DEFAULT_VISIBLE = ["date", "phone", "Name", "shopType", "city", "customers", "dealsPosted", "email"];

const AUTO_SHOP_SEARCH_FIELDS: AdminSearchField[] = [
  { key: "date", label: "Date", type: "date" },
  { key: "phone", label: "Phone" },
  { key: "Name", label: "Owner Name" },
  {
    key: "shopType",
    label: "Shop Type",
    type: "select",
    options: [
      { value: "Auto Shop", label: "Auto Shop" },
      { value: "Tyre Shop", label: "Tyre Shop" },
      { value: "Car Wash", label: "Car Wash" },
      { value: "Tow Truck", label: "Tow Truck" },
    ],
  },
  { key: "city", label: "City" },
  { key: "customers", label: "No. of Customers" },
  { key: "dealsPosted", label: "Deals Posted" },
  { key: "email", label: "Email" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const API = () => (import.meta.env.VITE_API_URL as string) || "";
const UPLOADS = () => (import.meta.env.VITE_UPLOADS_URL as string) || "";
function mediaUrl(path?: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${UPLOADS()}/${path.replace(/^\/+/, "")}`;
}
function fmtDate(d?: string): string {
  if (!d) return "-";
  return new Date(d).toISOString().slice(0, 10);
}
function getToken(): Record<string, string> {
  return authHeaders();
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

// Shop Type Options (labels match Web-Temp screen)
const SHOP_TYPE_OPTIONS: { value: ShopType; label: string }[] = [
  { value: "autoShop", label: "Auto Shop" },
  { value: "tyreShop", label: "Tyre Shop" },
  { value: "carWash", label: "Car Wash" },
  { value: "towTruck", label: "Tow Truck" },
];

const DEFAULT_SHOP_TYPE_FILTER: ShopType = "autoShop";

// Return array of ShopType. If owner.shopType is not array, normalize to array.
// Default to ['autoShop'] if undefined or empty.
function ownerShopTypes(owner: AutoShopOwnerType): ShopType[] {
  if (Array.isArray(owner.shopType)) {
    return owner.shopType.length > 0 ? owner.shopType : ["autoShop"];
  }
  if (typeof owner.shopType === "string" && owner.shopType) {
    return [owner.shopType as ShopType];
  }
  return ["autoShop"];
}

function ownerDealsList(owner: AutoShopOwnerType): DealType[] {
  if (Array.isArray(owner.deals) && owner.deals.length > 0) return owner.deals;
  if (Array.isArray(owner.businessProfile?.myDeals) && owner.businessProfile.myDeals.length > 0) {
    return owner.businessProfile.myDeals as DealType[];
  }
  return [];
}

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

// ─── ADD / EDIT MODAL ────────────────────────────────────────────────────────
function isEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()); }

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
const DealsModal: React.FC<{ owner: AutoShopOwnerType; onClose: () => void }> = ({ owner, onClose }) => {
  const deals = ownerDealsList(owner);
  return (
    <BaseModal isOpen wide onClose={onClose} title={`Deals — ${owner.name}`}>
      {!deals.length
        ? <p style={{ textAlign: "center", color: "#aaa" }}>No deals found.</p>
        : deals.map(deal => (
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
};

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

// ─── SEND NOTIFICATION MODAL ──────────────────────────────────────────────────
const SendNotifModal: React.FC<{ isOpen: boolean; onClose: () => void; ids: string[]; onDone: () => void }> = ({ isOpen, onClose, ids, onDone }) => {
  const [title, setTitle] = useState(""); const [body, setBody] = useState("");
  const [sending, setSending] = useState(false); const [err, setErr] = useState<string | null>(null); const [ok, setOk] = useState<string | null>(null);
  useEffect(() => { if (isOpen) { setTitle(""); setBody(""); setSending(false); setErr(null); setOk(null); } }, [isOpen]);
  if (!isOpen) return null;
  return (
    <BaseModal isOpen onClose={onClose} title="Send Custom Notification">
      <form onSubmit={async e => {
        e.preventDefault();
        if (!title.trim() || !body.trim()) {
          const msg = "Title and body required.";
          setErr(msg);
          adminNotify.error(msg);
          return;
        }
        setSending(true); setErr(null);
        try {
          const res = await axios.post(`${API()}/api/admin/notification/custom/send`, { userType: "autoshopowner", userIds: ids, title, message: body });
          if (res.data?.success) {
            adminNotify.success("Notification sent.");
            setOk("Sent!");
            setTimeout(() => { onClose(); onDone(); }, 900);
          } else {
            const msg = res.data?.message || "Failed.";
            setErr(msg);
            adminNotify.error(msg);
          }
        } catch (e: any) {
          const msg = e?.response?.data?.message || "Error.";
          setErr(msg);
          adminNotify.error(msg);
        } finally { setSending(false); }
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
  const colMap = autoShopOwnerPrintColMap();
  const cols = ALL_COLUMNS.filter(c => visibleCols.includes(c.key));
  const esc = (v: string) => /[,"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  const header = cols.map(c => esc(c.label)).join(",");
  const rows = owners.map(o => cols.map(c => esc(colMap[c.key]?.(o) ?? "-")).join(",")).join("\n");
  const blob = new Blob([header + "\n" + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `autoshop-owners-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function ownerCustomersCount(owner: AutoShopOwnerType): number {
  return owner.myCustomers?.length ?? 0;
}

function autoShopOwnerPrintColMap(): Record<string, (o: AutoShopOwnerType) => string> {
  return {
    phone: o => (o.phone ? `${DEFAULT_COUNTRY_CODE} ${o.phone}` : "-"),
    Name: o => o.businessProfile?.Name || "-",
    shopType: o => ownerShopTypes(o).map(st => SHOP_TYPE_OPTIONS.find(x => x.value === st)?.label || "-").join(", "),
    city: o => o.businessProfile?.city || "-",
    date: o => fmtDate(o.createdAt),
    customers: o => String(ownerCustomersCount(o)),
    dealsPosted: o => String(ownerDealsList(o).length),
    email: o => o.email || o.businessProfile?.businessEmail || "-",
  };
}

function printOwnersTable(owners: AutoShopOwnerType[], visibleCols: string[], title: string) {
  const colMap = autoShopOwnerPrintColMap();
  const cols = ALL_COLUMNS.filter((c) => visibleCols.includes(c.key));
  printAdminTable({
    title,
    headers: cols.map((c) => c.label),
    rows: owners.map((o) => cols.map((c) => colMap[c.key]?.(o) ?? "-")),
  });
}

// ─── STYLE CONSTANTS ──────────────────────────────────────────────────────────
const fieldErrorClass = "mt-0.5 text-[11px] font-semibold text-red-700";
type ProvinceCityOption = { name: string; status?: string };
type ProvinceWithCities = { cities?: ProvinceCityOption[] };
const tdClass = "border border-gray-300 px-3 py-2 text-center text-sm text-gray-700";
const thClass = "border border-ad-purple-dark px-3 py-2 text-center font-medium whitespace-nowrap";
const linkClass = "text-blue-700 hover:underline bg-transparent border-0 p-0 text-sm cursor-pointer font-medium";

const DEFAULT_COUNTRY_CODE = "+1";

const AutoShopAddEditForm: React.FC<{
  owner?: AutoShopOwnerType | null;
  onCancel: () => void;
  onSaved: () => void;
}> = ({ owner, onCancel, onSaved }) => {
  const isEdit = !!owner;
  const [Name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [shopType, setShopType] = useState<ShopType[]>(["autoShop"]);
  const [shopTypeOpen, setShopTypeOpen] = useState(false);
  const shopTypeRef = useRef<HTMLDivElement>(null);
  const [attempted, setAttempted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cityOptions, setCityOptions] = useState<string[]>([]);

  useEffect(() => {
    if (!shopTypeOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!shopTypeRef.current?.contains(e.target as Node)) setShopTypeOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [shopTypeOpen]);

  const toggleSelectedShopType = (value: ShopType) => {
    setShopType((prev) => {
      if (prev.includes(value)) {
        if (prev.length === 1) return prev;
        return prev.filter((type) => type !== value);
      }
      return [...prev, value];
    });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`${API()}/api/admin/provinces`, { headers: getToken() });
        if (cancelled) return;
        const provinces: ProvinceWithCities[] = res.data?.data || [];
        const names = new Set<string>();
        for (const province of provinces) {
          for (const c of province.cities || []) {
            if (!c.status || c.status === "Active") names.add(c.name);
          }
        }
        setCityOptions([...names].sort((a, b) => a.localeCompare(b)));
      } catch {
        if (!cancelled) setCityOptions([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const citySelectOptions = React.useMemo(() => {
    const names = new Set(cityOptions);
    if (city.trim()) names.add(city.trim());
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [cityOptions, city]);

  useEffect(() => {
    setAttempted(false);
    setApiError(null);
    if (isEdit && owner) {
      setName(owner.businessProfile?.Name || owner.name || "");
      setEmail(owner.email || "");
      setPhone(owner.phone || "");
      setCity(owner?.city || "");
      setAddress(owner.address || owner.businessProfile?.businessAddress || "");
      setZipCode(owner.pincode || owner.businessProfile?.pincode || "");
      setJoiningDate(fmtDate(owner.createdAt) !== "-" ? fmtDate(owner.createdAt) : "");
      setShopType(ownerShopTypes(owner));
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setCity("");
      setAddress("");
      setZipCode("");
      setJoiningDate(new Date().toISOString().slice(0, 10));
      setShopType(["autoShop"]);
    }
  }, [isEdit, owner]);

  function validate(): string | null {
    if (!Name.trim()) return "Owner name is required.";
    if (email.trim() && !isEmail(email)) return "Enter a valid email.";
    if (phone.replace(/\D/g, "").length !== 10) return "Phone must be 10 digits.";
    if (!shopType || shopType.length === 0) return "Shop type required.";
    return null;
  }

  async function handleSave() {
    setAttempted(true);
    const err = validate();
    if (err) {
      setApiError(err);
      adminNotify.error(err);
      return;
    }
    setApiError(null);
    const payload: Record<string, any> = {
      name: Name.trim(),
      Name: Name.trim(),
      email: email.trim(),
      countryCode: DEFAULT_COUNTRY_CODE,
      phone: phone.replace(/\D/g, ""),
      city: city.trim(),
      address: address.trim(),
      pincode: zipCode.trim(),
      role: "autoshopowner",
      shopType: shopType, // always send as array
    };
    if (joiningDate.trim()) payload.createdAt = joiningDate.trim();
    setSubmitting(true);
    try {
      console.log(shopType);
      if (isEdit && owner) {
        await axios.put(`${API()}/api/admin/autoshopowners/${owner._id}`, payload, { headers: getToken() });
      } else {
        await axios.post(`${API()}/api/admin/autoshopowners`, payload, { headers: getToken() });
      }
      adminNotify.success(isEdit ? "Auto shop owner updated." : "Auto shop owner added.");
      onSaved();
    } catch (saveErr: unknown) {
      const axErr = saveErr as { response?: { data?: { message?: string } } };
      const msg = axErr?.response?.data?.message || (isEdit ? "Could not update." : "Could not add.");
      setApiError(msg);
      adminNotify.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const formMessage = isEdit
    ? "You are updating an 'Auto Shop Owner'"
    : "You are creating an 'Auto Shop Owner'";

  return (
    <CompactFormPanel
      footer={
        <CompactFormFooter
          message={formMessage}
          messageCenter
          actionLabel={submitting ? (isEdit ? "Updating..." : "Saving...") : (isEdit ? "Update" : "Save")}
          onSave={handleSave}
          onCancel={onCancel}
        />
      }
    >
      {apiError && (
        <div className="mb-2 rounded border border-red-200 bg-red-100 px-3 py-2 text-xs text-red-800">
          {apiError}
        </div>
      )}
      <CompactFormRow columns={4} className="items-start">
        <CompactField label="Date">
          <input
            type="date"
            value={joiningDate}
            onChange={(e) => setJoiningDate(e.target.value)}
            className={compactInputClass}
          />
        </CompactField>
        <CompactField label="Phone" required>
          <input
            type="tel"
            value={phone
              .replace(/\D/g, "")
              .slice(0, 10)
              .replace(/(\d{3})(\d{3})(\d{0,4})/, (_m, p1, p2, p3) => {
                if (!p2) return p1;
                if (!p3) return `${p1} ${p2}`;
                return `${p1} ${p2} ${p3}`;
              })
            }
            onChange={e => {
              // Remove non-digits, format, but keep only 10 digits max
              const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
              setPhone(raw);
            }}
            className={compactInputClass}
            placeholder="xxx xxx xxxx"
          />
          {attempted && phone.replace(/\D/g, "").length !== 10 && (
            <p className={fieldErrorClass}>Must be 10 digits (format: xxx xxx xxxx)</p>
          )}
        </CompactField>
        <CompactField label="Business Name" required>
          <input
            type="text"
            value={Name}
            onChange={(e) => setName(e.target.value.slice(0, 60))}
            className={compactInputClass}
          />
          {attempted && !Name.trim() && <p className={fieldErrorClass}>Required</p>}
        </CompactField>
        <CompactField label="Shop Type" required>
          <div ref={shopTypeRef} className="relative min-w-0 w-full">
            <button
              type="button"
              onClick={() => setShopTypeOpen((open) => !open)}
              className={`${compactInputClass} flex w-full items-center justify-between text-left`}
              aria-expanded={shopTypeOpen}
              aria-haspopup="listbox"
            >
              <span className="truncate">
                {SHOP_TYPE_OPTIONS.filter((option) => shopType.includes(option.value))
                  .map((option) => option.label)
                  .join(", ") || "Select shop type"}
              </span>
              <span className="ml-2 shrink-0 text-[10px] text-gray-500">
                {shopTypeOpen ? "▲" : "▼"}
              </span>
            </button>
            {shopTypeOpen ? (
              <div className="absolute left-0 right-0 z-50 mt-0.5 overflow-hidden rounded border border-gray-400 bg-white shadow-lg">
                {SHOP_TYPE_OPTIONS.map((option) => {
                  const checked = shopType.includes(option.value);
                  const inputId = `autoshopowner-shop-type-${option.value}`;
                  return (
                    <label
                      key={option.value}
                      htmlFor={inputId}
                      className="flex cursor-pointer items-center gap-2 border-b border-gray-100 px-3 py-2 text-xs font-bold text-ad-green-dark last:border-b-0 hover:bg-gray-50"
                    >
                      <input
                        id={inputId}
                        type="checkbox"
                        checked={checked}
                        disabled={checked && shopType.length === 1}
                        onChange={() => toggleSelectedShopType(option.value)}
                        className="h-3.5 w-3.5 accent-ad-green"
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>
            ) : null}
          </div>
        </CompactField>
      </CompactFormRow>
      <CompactFormRow columns={4} className="items-start">
        <CompactField label="City">
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={compactInputClass}
          >
            <option value="">Select city</option>
            {citySelectOptions.map((cityName) => (
              <option key={cityName} value={cityName}>
                {cityName}
              </option>
            ))}
          </select>
        </CompactField>
        <CompactField label="Address">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value.slice(0, 120))}
            placeholder="Street / Area"
            className={compactInputClass}
          />
        </CompactField>
        <CompactField label="Zip Code">
          <input
            type="text"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10))}
            className={compactInputClass}
            placeholder="e.g. 110001 / 12345 / K1A0B1"
          />
          {attempted && !zipCode.trim() && <p className={fieldErrorClass}>Required</p>}

          {attempted && zipCode.trim() && (
            (() => {
              // US: 5 or 5+4 zip (12345 or 12345-6789)
              const usPattern = /^\d{5}(-\d{4})?$/;
              // Canada: ANA NAN (A-Z 1-9 A-Z 1-9 A-Z 1-9), spaces optional, no lower
              const caPattern = /^[A-Z]\d[A-Z][ ]?\d[A-Z]\d$/i;
              // India: 6 digit pincode
              const inPattern = /^\d{6}$/;

              if (
                !usPattern.test(zipCode) &&
                !caPattern.test(zipCode) &&
                !inPattern.test(zipCode)
              ) {
                return (
                  <p className={fieldErrorClass}>
                    Enter a valid Zip/Postal Code: e.g. 110001 (IN), 12345 or 12345-6789 (US), K1A0B1 (CA)
                  </p>
                );
              }
              return null;
            })()
          )}
        </CompactField>
  
        <CompactField label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className={compactInputClass}
          />
          {attempted && email.trim() && !isEmail(email) && (
            <p className={fieldErrorClass}>Enter a valid email</p>
          )}
        </CompactField>
      </CompactFormRow>
    </CompactFormPanel>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const AutoShopOwners: React.FC = () => {
  const [allOwners, setAllOwners] = useState<AutoShopOwnerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showSearchCard, setShowSearchCard] = useState(false);
  const [searchDraft, setSearchDraft] = useState(() => emptyAdminSearchValues(AUTO_SHOP_SEARCH_FIELDS));
  const [searchFilters, setSearchFilters] = useState(() => emptyAdminSearchValues(AUTO_SHOP_SEARCH_FIELDS));
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [visibleCols, setVisibleCols] = useState<string[]>(DEFAULT_VISIBLE);
  const [actionBusy, setActionBusy] = useState<Record<string, boolean>>({});
  const [shopTypeFilter, setShopTypeFilter] = useState<ShopType>(DEFAULT_SHOP_TYPE_FILTER);

  // ── View toggle: "active" shows active/suspended, "deleted" shows deleted ──
  const [viewMode, setViewMode] = useState<"active" | "deleted">("active");

  // Modals
  const [customersFor, setCustomersFor] = useState<AutoShopOwnerType | null>(null);
  const [dealsFor, setDealsFor] = useState<AutoShopOwnerType | null>(null);
  const [jobCardsFor, setJobCardsFor] = useState<AutoShopOwnerType | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingOwner, setEditingOwner] = useState<AutoShopOwnerType | null>(null);

  const fetchOwners = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await axios.get(`${API()}/api/admin/autoshopowners`, { headers: getToken() });
      if (res.data?.success && Array.isArray(res.data.data)) setAllOwners(res.data.data);
      else {
        const msg = "Failed to fetch auto shop owners";
        setError(msg);
        adminNotify.error(msg);
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Something went wrong";
      setError(msg);
      adminNotify.error(msg);
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOwners(); }, [fetchOwners]);

  // Split owners by deleted status
  const isOwnerDeleted = (o: AutoShopOwnerType): boolean => {
    const status = String((o as any).status ?? "").toLowerCase();
    return status === "deleted" || Boolean((o as any).isDeleted) || Boolean((o as any).deleted);
  };
  const activeOwners = allOwners.filter((o) => !isOwnerDeleted(o));
  const deletedOwners = allOwners.filter((o) => isOwnerDeleted(o));
  const displayOwners = viewMode === "deleted" ? deletedOwners : activeOwners;

  function selectShopType(type: ShopType) {
    setShopTypeFilter(type);
    setCurrentPage(1);
  }

  const openAdd = () => {
    setEditingOwner(null);
    setShowSearchCard(false);
    setShowForm(true);
  };

  const openEdit = (owner: AutoShopOwnerType) => {
    setEditingOwner(owner);
    setShowSearchCard(false);
    setShowForm(true);
  };

  const openSearchCard = () => {
    setShowForm(false);
    setEditingOwner(null);
    setSearchDraft({ ...searchFilters });
    setShowSearchCard((open) => !open);
  };

  const handleSearchCardSearch = () => {
    setSearchFilters({ ...searchDraft });
    setCurrentPage(1);
    setSelectedRows(new Set());
  };

  const handleSearchCardReset = () => {
    const empty = emptyAdminSearchValues(AUTO_SHOP_SEARCH_FIELDS);
    setSearchDraft(empty);
    setSearchFilters(empty);
    setCurrentPage(1);
    setSelectedRows(new Set());
  };

  const handleFormCancel = () => {
    setEditingOwner(null);
    setShowForm(false);
  };

  const handleFormSaved = () => {
    setEditingOwner(null);
    setShowForm(false);
    fetchOwners();
  };

  const filtered = displayOwners.filter(o => {
    const stArr = ownerShopTypes(o);
    if (!stArr.includes(shopTypeFilter)) return false;
    const q = search.toLowerCase();
    // For search, use the labels of all shopTypes, joined
    const shopTypeLabels = stArr.map(st => SHOP_TYPE_OPTIONS.find(x => x.value === st)?.label ?? "").join(", ");
    const phone = `${DEFAULT_COUNTRY_CODE} ${o.phone || ""}`;
    const Name = o.businessProfile?.Name || o.name || "";
    const city = o.businessProfile?.city || "";
    const customers = String(ownerCustomersCount(o));
    const dealsPosted = String(ownerDealsList(o).length);
    const live =
      !q ||
      (o.email || "").toLowerCase().includes(q) ||
      (o.phone || "").toLowerCase().includes(q) ||
      Name.toLowerCase().includes(q) ||
      city.toLowerCase().includes(q) ||
      (o.address || o.businessProfile?.businessAddress || "").toLowerCase().includes(q) ||
      (o.pincode || o.businessProfile?.pincode || "").toLowerCase().includes(q) ||
      stArr.some(st => st.toLowerCase().includes(q)) ||
      shopTypeLabels.toLowerCase().includes(q);
    if (!live) return false;
    return (
      searchIncludes(fmtDate(o.createdAt), searchFilters.date) &&
      searchIncludes(phone, searchFilters.phone) &&
      searchIncludes(Name, searchFilters.Name) &&
      // searchEquals: filter may provide only one label, but owner may have multiple shop type labels. Need to match any.
      (searchFilters.shopType
        ? shopTypeLabels.split(", ").some(label => searchEquals(label, searchFilters.shopType))
        : true) &&
      searchIncludes(city, searchFilters.city) &&
      searchIncludes(customers, searchFilters.customers) &&
      searchIncludes(dealsPosted, searchFilters.dealsPosted) &&
      searchIncludes(o.email || "", searchFilters.email)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selected = Array.from(selectedRows);
  const selCount = selected.length;
  const allPageSel = paginated.length > 0 && paginated.every(o => selectedRows.has(o._id));

  const handleToolbarPrint = () => {
    const colsForPrint = viewMode === "active" ? visibleCols : DEFAULT_VISIBLE;
    printOwnersTable(
      filtered,
      colsForPrint,
      viewMode === "deleted" ? "Deleted Auto Shop Owners" : "Auto Shop Owners"
    );
  };

  function toggleRow(id: string) {
    setSelectedRows(prev => { const c = new Set(prev); c.has(id) ? c.delete(id) : c.add(id); return c; });
  }

  async function toggleSuspend(ownerId: string, disable: boolean) {
    setActionBusy(prev => ({ ...prev, [ownerId]: true }));
    try {
      await axios.post(`${API()}/api/admin/autoshopowners/toggle-status`, { userId: ownerId, disable }, { headers: getToken() });
      await fetchOwners();
      adminNotify.success(disable ? "Auto shop owner set to inactive." : "Auto shop owner activated.");
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Error updating status.";
      adminNotify.error(msg);
    }
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
      adminNotify.success("Auto shop owner deleted.");
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Error deleting.";
      adminNotify.error(msg);
    }
    finally { setActionBusy(prev => ({ ...prev, [ownerId]: false })); }
  }

  async function reviveOwner(ownerId: string) {
    setActionBusy(prev => ({ ...prev, [ownerId]: true }));
    try {
      await axios.put(`${API()}/api/admin/autoshopowners/${ownerId}/revive`, {}, { headers: getToken() });
      await fetchOwners();
      adminNotify.success("Auto shop owner restored.");
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Error restoring.";
      adminNotify.error(msg);
    }
    finally { setActionBusy(prev => ({ ...prev, [ownerId]: false })); }
  }

  function renderCell(owner: AutoShopOwnerType, key: string) {
    switch (key) {
      case "date":
        return <td key={key} className={tdClass}>{fmtDate(owner.createdAt)}</td>;
      case "phone":
        function formatPhone(phone?: string) {
          if (!phone) return "-";
          // Remove all non-digits
          const digits = phone.replace(/\D/g, "");
          // Format as xxx xxx xxxx (assumes 10 digits)
          if (digits.length === 10) {
            return `${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6,10)}`;
          }
          // fallback for other lengths
          return phone;
        }
        return <td key={key} className={tdClass}>
          {owner.phone ? `${DEFAULT_COUNTRY_CODE} ` : ""}
          {formatPhone(owner.phone)}
        </td>;
      case "Name": {
        const label = owner.businessProfile?.Name || owner.name || "-";
        return (
          <td key={key} className={`${tdClass} text-center font-medium`}>
            {viewMode === "active" && label !== "-" ? (
              <button
                type="button"
                onClick={() => openEdit(owner)}
                className="cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold text-blue-700 hover:underline"
              >
                {label}
              </button>
            ) : (
              label
            )}
          </td>
        );
      }
      case "shopType": {
        const labels = ownerShopTypes(owner).map(st => SHOP_TYPE_OPTIONS.find(x => x.value === st)?.label || "-").join(", ");
        return (
          <td key={key} className={tdClass}>
            {labels}
          </td>
        );
      }
      case "city": {
        // Prefer city from businessProfile, fallback to top-level
        return <td key={key} className={tdClass}>{owner.businessProfile?.city || owner?.city || "-"}</td>;
      }
      case "customers": {
        const count = ownerCustomersCount(owner);
        return (
          <td key={key} className={tdClass}>
            {count > 0 ? (
              <button type="button" onClick={() => setCustomersFor(owner)} className={linkClass}>{count}</button>
            ) : (
              "0"
            )}
          </td>
        );
      }
      case "dealsPosted": {
        const count = ownerDealsList(owner).length;
        return (
          <td key={key} className={tdClass}>
            {count > 0 ? (
              <button type="button" onClick={() => setDealsFor(owner)} className={linkClass}>{count}</button>
            ) : (
              "0"
            )}
          </td>
        );
      }
      case "email":
        return <td key={key} className={tdClass}>{owner.email || owner.businessProfile?.businessEmail || "-"}</td>;
      default:
        return <td key={key} className={tdClass}>-</td>;
    }
  }

  const toolbarBtnClass = (disabled = false) =>
    `px-3 py-1 text-xs font-medium text-white whitespace-nowrap ${disabled ? "bg-gray-400 cursor-not-allowed" : "bg-gray-600 hover:bg-gray-700"}`;

  const visibleColumns = ALL_COLUMNS.filter((c) =>
    viewMode === "active" ? visibleCols.includes(c.key) : DEFAULT_VISIBLE.includes(c.key)
  );

  return (
    <>
      {customersFor && <CustomersModal owner={customersFor} onClose={() => setCustomersFor(null)} />}
      {dealsFor && <DealsModal owner={dealsFor} onClose={() => setDealsFor(null)} />}
      {jobCardsFor && <JobCardsModal owner={jobCardsFor} onClose={() => setJobCardsFor(null)} />}
      <SendNotifModal isOpen={notifOpen} onClose={() => setNotifOpen(false)} ids={selected} onDone={() => { }} />

      <AdminPage
        title={viewMode === "deleted" ? "Deleted Auto Shop Owners" : "Auto Shop Owners"}
        headerAction={
          viewMode === "active" && !showForm && !showSearchCard ? (
            <AddNewButton onClick={openAdd} />
          ) : undefined
        }
        between={
          showSearchCard ? (
            <AdminSearchCard
              fields={AUTO_SHOP_SEARCH_FIELDS}
              values={searchDraft}
              onChange={setSearchDraft}
              onSearch={handleSearchCardSearch}
              onReset={handleSearchCardReset}
              onClose={() => setShowSearchCard(false)}
            />
          ) : showForm ? (
            <AutoShopAddEditForm
              key={editingOwner?._id ?? "new"}
              owner={editingOwner}
              onCancel={handleFormCancel}
              onSaved={handleFormSaved}
            />
          ) : undefined
        }
      >
        {viewMode === "deleted" && (
          <div className="mb-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
            Showing deleted auto shop owners ({deletedOwners.length}) — select one and use Restore
          </div>
        )}

        <div className="mb-2 flex flex-wrap items-center gap-4 border-b border-gray-300 bg-gray-100 px-3 py-2">
          {SHOP_TYPE_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-xs font-bold text-ad-green-dark">
              <input
                type="radio"
                name="shopTypeFilter"
                checked={shopTypeFilter === option.value}
                onChange={() => selectShopType(option.value)}
                className="h-3.5 w-3.5 accent-ad-green"
              />
              {option.label}
            </label>
          ))}
        </div>

        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
          <div className="flex flex-wrap gap-1">
            {viewMode === "active" && (
              <>
                <button type="button" disabled={selCount === 0} onClick={() => setNotifOpen(true)} className={toolbarBtnClass(selCount === 0)}>
                  Send Notification
                </button>
                <button type="button" disabled={selCount === 0} className="bg-[#25d366] px-3 py-1 text-xs font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                  WhatsApp
                </button>
                <button type="button" disabled={selCount === 0} onClick={() => exportCsv(allOwners.filter(o => selectedRows.has(o._id)), visibleCols)} className={toolbarBtnClass(selCount === 0)}>
                  Export
                </button>
                <button type="button" disabled={selCount === 0} onClick={() => deleteOwner(selected[0])} className={toolbarBtnClass(selCount === 0)}>
                  Delete
                </button>
              </>
            )}
            {viewMode === "deleted" && (
              <button type="button" disabled={selCount === 0} onClick={() => reviveOwner(selected[0])} className={toolbarBtnClass(selCount === 0)}>
                Restore
              </button>
            )}
            <button type="button" onClick={handleToolbarPrint} className="bg-ad-green px-3 py-1 text-xs font-medium text-white whitespace-nowrap hover:bg-ad-green-dark">
              Print
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Live Search here"
              className="border border-gray-400 bg-white px-2 py-1 text-xs"
            />
            {selCount > 0 && <span className="text-xs font-semibold text-gray-600">{selCount} selected</span>}
            {viewMode === "active" && <ColSelector visible={visibleCols} onChange={setVisibleCols} />}
            <button
              type="button"
              onClick={openSearchCard}
              className={`px-3 py-1 text-xs font-medium text-white hover:bg-gray-600 ${
                showSearchCard ? "bg-gray-700" : "bg-gray-500"
              }`}
            >
              Filters
            </button>
          </div>
        </div>

        <div className="mb-2 flex items-center gap-2 text-xs text-gray-700">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            className="border border-gray-400 px-1 py-0.5"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span>entries</span>
        </div>

        {error && <div className="mb-2 rounded border border-red-200 bg-red-100 px-3 py-2 text-xs text-red-800">Error: {error}</div>}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-ad-purple text-white">
                <th className="border border-ad-purple-dark px-2 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={allPageSel}
                    onChange={(e) => {
                      setSelectedRows((prev) => {
                        const c = new Set(prev);
                        paginated.forEach((o) => (e.target.checked ? c.add(o._id) : c.delete(o._id)));
                        return c;
                      });
                    }}
                    className="accent-white"
                  />
                </th>
                {visibleColumns.map((c) => (
                  <th key={c.key} className={thClass}>{c.label}</th>
                ))}
                {viewMode === "active" && <th className={thClass}>Action</th>}
                {viewMode === "deleted" && <th className={thClass}>Restore</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={visibleColumns.length + 2} className="border border-gray-300 px-3 py-8 text-center text-gray-500">
                    Loading shop owners…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={visibleColumns.length + 2} className="border border-gray-300 px-3 py-8 text-center text-gray-500">
                    Unable to load auto shop owners.
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + 2} className="border border-gray-300 px-3 py-8 text-center text-gray-500">
                    {viewMode === "deleted" ? "No deleted auto shop owners." : "No auto shop owners found."}
                  </td>
                </tr>
              ) : (
                paginated.map((owner, idx) => {
                  const isSuspended = !!owner.isDisabled;
                  const busy = !!actionBusy[owner._id];
                  return (
                    <tr key={owner._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                      <td className="border border-gray-300 px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(owner._id)}
                          onChange={() => toggleRow(owner._id)}
                          className="accent-ad-purple"
                        />
                      </td>
                      {visibleColumns.map((c) => renderCell(owner, c.key))}
                      {viewMode === "active" && (
                        <td className={`${tdClass} text-center whitespace-nowrap`}>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => toggleSuspend(owner._id, !isSuspended)}
                              className="rounded px-2 py-0.5 text-xs font-semibold disabled:opacity-60"
                              style={{ background: isSuspended ? "#dff0d8" : "#fcf8e3", color: isSuspended ? "#3c763d" : "#8a6d3b" }}
                            >
                              {busy ? "…" : isSuspended ? "Enable" : "Suspend"}
                            </button>
                            {/* <button
                              type="button"
                              disabled={busy}
                              onClick={() => deleteOwner(owner._id)}
                              className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 disabled:opacity-60"
                            >
                              {busy ? "…" : "Delete"}
                            </button> */}
                          </div>
                        </td>
                      )}
                      {viewMode === "deleted" && (
                        <td className={tdClass}>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => reviveOwner(owner._id)}
                            className="rounded bg-ad-green px-2 py-0.5 text-xs font-semibold text-white disabled:opacity-60"
                          >
                            {busy ? "…" : "Restore"}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
            <TableEntriesSummary total={filtered.length} page={currentPage} pageSize={pageSize} />
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`h-7 w-7 border text-xs font-medium ${currentPage === p
                    ? "border-ad-green bg-ad-green text-white"
                    : "border-gray-400 bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setViewMode((v) => (v === "active" ? "deleted" : "active"));
                setSelectedRows(new Set());
                setSearch("");
                const empty = emptyAdminSearchValues(AUTO_SHOP_SEARCH_FIELDS);
                setSearchDraft(empty);
                setSearchFilters(empty);
                setShowSearchCard(false);
                setCurrentPage(1);
              }}
              className="text-sm text-blue-700 hover:underline"
            >
              {viewMode === "active" ? "Deleted" : "Active Owners"}
            </button>
          </div>
      </AdminPage>
    </>
  );
};

export default AutoShopOwners;