import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { adminNotify } from "../../../utils/adminNotify";
import { authHeaders } from "../../../api/client";
import AdminPage from "../../../components/admin/AdminPage";
import { TableEntriesSummary } from "../../../components/admin/AdminDataTable";
import { printAdminTable } from "../../../utils/adminPrintTable";

// ─── Types ──────────────────────────────────────────────────────────────────
type ShopType = "autoShop" | "tyreShop" | "carWash" | "towTruck";

type SubscriptionRecord = {
  days?: number;
  amount?: number;
  total?: number;
  purchasedOn?: string;
  invoiceNo?: string;
  paymentStatus?: "Paid" | "Pending" | "Failed";
  paymentMethod?: string;
};

type BusinessProfileType = {
  _id?: string;
  businessName?: string;
  businessAddress?: string;
  city?: string;
  businessPhone?: string;
  businessEmail?: string;
  subscriptions?: SubscriptionRecord[];
  [k: string]: any;
};

type AutoShopOwnerType = {
  _id: string;
  name: string;
  email?: string;
  city?: string;
  phone?: string;
  businessProfile?: BusinessProfileType | null;
  createdAt?: string;
  status?: string;
  isDisabled?: boolean;
  shopType?: ShopType[];
  [k: string]: any;
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const API = () => (import.meta.env.VITE_API_URL as string) || "";
function getToken(): Record<string, string> {
  return authHeaders();
}
function fmtDate(d?: string): string {
  if (!d) return "-";
  return new Date(d).toISOString().slice(0, 10);
}
function isOwnerDeleted(o: AutoShopOwnerType): boolean {
  const status = String(o.status ?? "").toLowerCase();
  return status === "deleted" || Boolean(o.isDeleted) || Boolean(o.deleted);
}
const SHOP_TYPE_OPTIONS: { value: ShopType; label: string }[] = [
  { value: "autoShop", label: "Auto Shop" },
  { value: "tyreShop", label: "Tyre Shop" },
  { value: "carWash", label: "Car Wash" },
  { value: "towTruck", label: "Tow Truck" },
];
function ownerShopTypes(owner: AutoShopOwnerType): ShopType[] {
  if (Array.isArray(owner.shopType)) {
    return owner.shopType.length > 0 ? owner.shopType : ["autoShop"];
  }
  if (typeof owner.shopType === "string" && owner.shopType) {
    return [owner.shopType as ShopType];
  }
  return ["autoShop"];
}
const DEFAULT_COUNTRY_CODE = "+1";
function formatPhone(phone?: string) {
  if (!phone) return "-";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
  }
  return phone;
}

/** "Opted" = has at least one Paid website-subscription purchase on record. */
function paidSubscriptions(owner: AutoShopOwnerType): SubscriptionRecord[] {
  const subs = owner.businessProfile?.subscriptions;
  if (!Array.isArray(subs)) return [];
  return subs.filter((s) => s.paymentStatus === "Paid");
}
function hasOptedWebsiteSubscription(owner: AutoShopOwnerType): boolean {
  return paidSubscriptions(owner).length > 0;
}
function latestPaidSubscription(owner: AutoShopOwnerType): SubscriptionRecord | null {
  const paid = paidSubscriptions(owner);
  if (!paid.length) return null;
  return [...paid].sort(
    (a, b) => new Date(b.purchasedOn || 0).getTime() - new Date(a.purchasedOn || 0).getTime()
  )[0];
}

// ─── Style constants (matches Auto Shop Owners table) ──────────────────────
const tdClass = "ad-td border border-gray-300 px-3 py-2 text-center text-sm text-gray-700";
const thClass = "ad-th border border-ad-purple-dark px-3 py-2 text-center font-medium whitespace-nowrap";

// ─── Column config ──────────────────────────────────────────────────────────
const OPTED_COLUMNS = [
  { key: "subscriptionDate", label: "Date" },
  { key: "Name", label: "Vendor" },
  { key: "city", label: "City" },
  { key: "invoice", label: "Invoice" },
  { key: "expiry", label: "Domain Expiry" },
  { key: "shopType", label: "User Type" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "status", label: "Status" },
];

const NOT_OPTED_COLUMNS = [
  { key: "date", label: "Date" },
  { key: "Name", label: "Vendor" },
  { key: "city", label: "City" },
  { key: "shopType", label: "User Type" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "subscription", label: "Website Subscription" },
  { key: "status", label: "Status" },
];

function addDaysIso(iso?: string, days?: number): string {
  if (!iso || !days) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

type Mode = "opted" | "notOpted";

const RequestedWebsiteOwners: React.FC<{ mode: Mode }> = ({ mode }) => {
  const [allOwners, setAllOwners] = useState<AutoShopOwnerType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionBusy, setActionBusy] = useState<Record<string, boolean>>({});

  const fetchOwners = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Reuses the same admin endpoint the Auto Shop Owners page uses —
      // businessProfile (and its `subscriptions` array) already comes
      // populated on every record, so no new backend route is needed.
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOwners();
  }, [fetchOwners]);

  useEffect(() => {
    // Reset paging when switching between the Opted / Not Opted tabs.
    setCurrentPage(1);
    setSearch("");
  }, [mode]);

  const activeOwners = allOwners.filter((o) => !isOwnerDeleted(o));
  const bucketed = activeOwners.filter((o) =>
    mode === "opted" ? hasOptedWebsiteSubscription(o) : !hasOptedWebsiteSubscription(o)
  );

  const filtered = bucketed.filter((o) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const haystack = [
      o.businessProfile?.businessName,
      o.name,
      o.email,
      o.businessProfile?.businessEmail,
      o.phone,
      o.businessProfile?.city || o.city,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  async function toggleSuspend(ownerId: string, disable: boolean) {
    setActionBusy((p) => ({ ...p, [ownerId]: true }));
    try {
      await axios.post(
        `${API()}/api/admin/autoshopowners/toggle-status`,
        { userId: ownerId, disable },
        { headers: getToken() }
      );
      await fetchOwners();
    } catch (e: any) {
      adminNotify.error(e?.response?.data?.message || "Failed to update status");
    } finally {
      setActionBusy((p) => ({ ...p, [ownerId]: false }));
    }
  }

  const columns = mode === "opted" ? OPTED_COLUMNS : NOT_OPTED_COLUMNS;

  function renderCell(owner: AutoShopOwnerType, key: string) {
    switch (key) {
      case "date":
        return <td key={key} className={tdClass}>{fmtDate(owner.createdAt)}</td>;
      case "phone":
        return (
          <td key={key} className={tdClass}>
            {owner.phone ? `${DEFAULT_COUNTRY_CODE} ` : ""}
            {formatPhone(owner.phone)}
          </td>
        );
      case "Name":
        return (
          <td key={key} className={`${tdClass} font-medium`}>
            {owner.businessProfile?.businessName || "-"}
          </td>
        );
      case "shopType": {
        const labels = ownerShopTypes(owner)
          .map((st) => SHOP_TYPE_OPTIONS.find((x) => x.value === st)?.label || "-")
          .join(", ");
        return <td key={key} className={tdClass}>{labels}</td>;
      }
      case "city":
        return <td key={key} className={tdClass}>{owner.businessProfile?.city || owner.city || "-"}</td>;
      case "email":
        return <td key={key} className={tdClass}>{owner.email || owner.businessProfile?.businessEmail || "-"}</td>;
      case "subscription": {
        if (mode === "opted") {
          const latest = latestPaidSubscription(owner);
          return <td key={key} className={tdClass}>{fmtDate(latest?.purchasedOn)}</td>;
        }
        return (
          <td key={key} className={tdClass}>
            <span className="inline-block rounded-full border border-gray-300 bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
              Not Purchased
            </span>
          </td>
        );
      }
      case "invoice": {
        const latest = latestPaidSubscription(owner);
        return (
          <td key={key} className={tdClass}>
            {latest?.invoiceNo ? <span className="text-blue-700">{latest.invoiceNo}</span> : "-"}
          </td>
        );
      }
      case "subscriptionDate":
        return <td key={key} className={tdClass}>{fmtDate(latestPaidSubscription(owner)?.purchasedOn)}</td>;
      case "expiry": {
        const latest = latestPaidSubscription(owner);
        return <td key={key} className={tdClass}>{addDaysIso(latest?.purchasedOn, latest?.days)}</td>;
      }
      case "status":
        return <td key={key} className={tdClass}>{owner.isDisabled ? "Suspended" : "Active"}</td>;
      default:
        return <td key={key} className={tdClass}>-</td>;
    }
  }

  return (
    <AdminPage title="Website" noPanel>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2 ad-toolbar">
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() =>
              printAdminTable({
                title: mode === "opted" ? "Website — Opted" : "Website — Not Opted",
                headers: columns.map((c) => c.label),
                rows: filtered.map((o) =>
                  columns.map((c) => {
                    switch (c.key) {
                      case "date": return fmtDate(o.createdAt);
                      case "subscriptionDate": return fmtDate(latestPaidSubscription(o)?.purchasedOn);
                      case "Name": return o.businessProfile?.businessName || "-";
                      case "city": return o.businessProfile?.city || o.city || "-";
                      case "invoice": return latestPaidSubscription(o)?.invoiceNo || "-";
                      case "expiry": {
                        const l = latestPaidSubscription(o);
                        return addDaysIso(l?.purchasedOn, l?.days);
                      }
                      case "shopType": return ownerShopTypes(o).map((st) => SHOP_TYPE_OPTIONS.find((x) => x.value === st)?.label || "-").join(", ");
                      case "phone": return o.phone || "-";
                      case "email": return o.email || o.businessProfile?.businessEmail || "-";
                      case "subscription": return "Not Purchased";
                      case "status": return o.isDisabled ? "Suspended" : "Active";
                      default: return "-";
                    }
                  })
                ),
              })
            }
            className="bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark"
          >
            Print
          </button>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Live Search here"
          className="border border-gray-400 bg-white px-2 py-1 text-xs"
        />
      </div>

      <div className="mb-2 flex items-center gap-2 px-1 text-sm text-gray-600 ad-entries">
        <span>Show</span>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="border border-gray-400 px-1 py-0.5"
        >
          {[10, 25, 50, 100].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <span>entries</span>
      </div>

      {error && (
        <div className="mb-2 rounded border border-red-200 bg-red-100 px-3 py-2 text-xs text-red-800">
          Error: {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-ad-purple text-white ad-thead">
              {columns.map((c) => (
                <th key={c.key} className={thClass}>{c.label}</th>
              ))}
              <th className={thClass}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="ad-td border border-gray-300 px-3 py-8 text-center text-gray-500">
                  Loading shop owners…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={columns.length + 1} className="ad-td border border-gray-300 px-3 py-8 text-center text-gray-500">
                  Unable to load auto shop owners.
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="ad-td border border-gray-300 px-3 py-8 text-center text-gray-500">
                  {mode === "opted"
                    ? "No auto shop owners have purchased the website subscription yet."
                    : "Every auto shop owner has purchased the website subscription."}
                </td>
              </tr>
            ) : (
              paginated.map((owner, idx) => {
                const isSuspended = !!owner.isDisabled;
                const busy = !!actionBusy[owner._id];
                return (
                  <tr key={owner._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                    {columns.map((c) => renderCell(owner, c.key))}
                    <td className={`${tdClass} whitespace-nowrap`}>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => toggleSuspend(owner._id, !isSuspended)}
                        className="rounded px-2 py-0.5 text-xs font-semibold disabled:opacity-60"
                        style={{
                          background: isSuspended ? "#dff0d8" : "#fcf8e3",
                          color: isSuspended ? "#3c763d" : "#8a6d3b",
                        }}
                      >
                        {busy ? "…" : isSuspended ? "Enable" : "Suspend"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between ad-pager">
        <TableEntriesSummary total={filtered.length} page={currentPage} pageSize={pageSize} />
        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setCurrentPage(p)}
              className={`h-7 w-7 border text-xs font-medium ad-pg ${
                currentPage === p
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
};

export default RequestedWebsiteOwners;