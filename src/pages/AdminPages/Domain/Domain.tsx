import { useEffect, useState } from "react";
import axios from "axios";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import {
  CompactAutoGrowTextarea,
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactFixedFieldWidth,
  compactInputClass,
  compactReadOnlyValueClass,
} from "../../../components/admin/ContentPanel";
import { adminNotify } from "../../../utils/adminNotify";
import { printAdminTable } from "../../../utils/adminPrintTable";

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

interface CarOwner {
  _id: string;
  name?: string;
  email?: string;
}

type DomainForm = {
  userName: string;
  userType: string;
  domain: string;
  expiry: string;
  provider: string;
  dns: string;
};

const EMPTY_DOMAIN_FORM: DomainForm = {
  userName: "",
  userType: "shopOwner",
  domain: "",
  expiry: "",
  provider: "",
  dns: "",
};

interface DomainEntry {
  _id: string;
  userName?: string;
  userType?: string;
  domain?: string;
  websiteURL?: string;
  expiry?: string;
  provider?: string;
  category?: string;
  dns?: string;
  imageUpload?: string;
  createdAt?: string;
  updatedAt?: string;
}

type DomainRow = {
  id: string;
  userType: string;
  userName: string;
  domain: string;
  expiry: string;
  expiryRaw: string;
  provider: string;
  providerLabel: string;
  dns: string;
  owner: AutoShopOwner;
};

const PAGE_TITLE = "Domain Manager";

const USER_TYPE_OPTIONS = [
  { value: "carOwner", label: "Car Owner" },
  { value: "shopOwner", label: "Shop Owner" },
];

const PROVIDER_OPTIONS = [
  { value: "godaddy", label: "GoDaddy" },
  { value: "namecheap", label: "Namecheap" },
  { value: "cloudflare", label: "Cloudflare" },
  { value: "google", label: "Google Domains" },
  { value: "other", label: "Other" },
];

const DOMAIN_HEADINGS = [
  { value: "all", label: "Select Heading" },
  { value: "userType", label: "User Type" },
  { value: "userName", label: "User Name" },
  { value: "domain", label: "Domain" },
  { value: "expiry", label: "Expiry" },
  { value: "providerLabel", label: "Provider" },
  { value: "dns", label: "DNS" },
];

const API_URL = import.meta.env.VITE_API_URL;

function formatDisplayDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function toDateInputValue(value?: string) {
  if (!value) return "";
  return value.slice(0, 10);
}

function userTypeLabel(value: string) {
  return USER_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function providerLabel(value: string) {
  return PROVIDER_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function ownerDisplayName(owner: AutoShopOwner) {
  return owner.businessProfile?.businessName || owner.name || "—";
}

function entryToDomainRow(entry: DomainEntry, owner: AutoShopOwner): DomainRow {
  const domain = entry.domain || entry.websiteURL || "";
  const provider = entry.provider || entry.category || "";
  const expiryRaw = entry.expiry || "";
  const dns = entry.dns || "";

  return {
    id: entry._id,
    userType: entry.userType || "shopOwner",
    userName: entry.userName || ownerDisplayName(owner),
    domain: domain || "—",
    expiry: expiryRaw ? formatDisplayDate(expiryRaw) : "—",
    expiryRaw,
    provider,
    providerLabel: provider ? providerLabel(provider) : "—",
    dns: dns || "—",
    owner,
  };
}

export default function Domain() {
  const [owners, setOwners] = useState<AutoShopOwner[]>([]);
  const [carOwners, setCarOwners] = useState<CarOwner[]>([]);
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [domainsLoading, setDomainsLoading] = useState(false);
  const [domainsError, setDomainsError] = useState<string | null>(null);

  const [activeOwner, setActiveOwner] = useState<AutoShopOwner | null>(null);
  const [viewingOwner, setViewingOwner] = useState<AutoShopOwner | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState<DomainForm>(EMPTY_DOMAIN_FORM);
  const [formMode, setFormMode] = useState<"CREATE" | "EDIT" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [heading, setHeading] = useState("all");
  const [page, setPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchOwners();
    fetchCarOwners();
  }, []);

  const fetchCarOwners = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/carowners`);
      setCarOwners(res.data.data || []);
    } catch {
      setCarOwners([]);
    }
  };

  const fetchAllDomains = async (ownerList: AutoShopOwner[]) => {
    const ownersWithProfile = ownerList.filter((o) => o.businessProfile?._id);
    const results = await Promise.all(
      ownersWithProfile.map(async (owner) => {
        const businessId = owner.businessProfile!._id;
        try {
          const res = await axios.get(
            `${API_URL}/api/admin/business-profiles/${businessId}/ads`
          );
          const entries: DomainEntry[] = res.data.data || [];
          return entries.map((entry) => entryToDomainRow(entry, owner));
        } catch {
          return [];
        }
      })
    );
    setDomains(results.flat());
  };

  const fetchOwners = async () => {
    setDomainsLoading(true);
    setDomainsError(null);
    try {
      const res = await axios.get(`${API_URL}/api/admin/autoshopowners`);
      const ownerList: AutoShopOwner[] = res.data.data || [];
      setOwners(ownerList);
      await fetchAllDomains(ownerList);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setDomainsError(message || "Failed to fetch shop owners");
    } finally {
      setDomainsLoading(false);
    }
  };

  const refreshDomains = async () => {
    await fetchAllDomains(owners);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm(EMPTY_DOMAIN_FORM);
    setFormMode(null);
    setEditId(null);
  };

  const openOwnerView = (owner: AutoShopOwner) => {
    setActiveOwner(owner);
    setViewingOwner(owner);
    setShowForm(false);
    resetForm();
  };

  const closeOwnerView = () => {
    setViewingOwner(null);
    setActiveOwner(null);
    setShowForm(false);
    resetForm();
  };

  const openAddForm = (owner?: AutoShopOwner) => {
    setActiveOwner(owner ?? null);
    setViewingOwner(null);
    setFormMode("CREATE");
    setForm({
      ...EMPTY_DOMAIN_FORM,
      userType: "shopOwner",
      userName: owner ? ownerDisplayName(owner) : "",
    });
    setEditId(null);
    setShowForm(true);
    setDomainsError(null);
  };

  const openEditForm = (row: DomainRow) => {
    setActiveOwner(row.owner);
    setFormMode("EDIT");
    setEditId(row.id);
    setForm({
      userName: row.userName === "—" ? ownerDisplayName(row.owner) : row.userName,
      userType: row.userType,
      domain: row.domain === "—" ? "" : row.domain,
      expiry: toDateInputValue(row.expiryRaw),
      provider: row.provider,
      dns: row.dns === "—" ? "" : row.dns,
    });
    setShowForm(true);
    setViewingOwner(null);
    setDomainsError(null);
  };

  const handleCancelForm = () => {
    resetForm();
    setShowForm(false);
    if (activeOwner) setViewingOwner(activeOwner);
  };

  const handleDelete = async (row: DomainRow) => {
    const businessId = row.owner.businessProfile?._id;
    if (!businessId || !window.confirm("Delete this domain entry?")) return;
    setDomainsLoading(true);
    setDomainsError(null);
    try {
      await axios.delete(
        `${API_URL}/api/admin/business-profiles/${businessId}/ads/${row.id}`
      );
      adminNotify.success("Domain entry deleted.");
      await refreshDomains();
      if (viewingOwner?._id === row.owner._id) {
        setViewingOwner(row.owner);
        setActiveOwner(row.owner);
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      const msg = message || "Failed to delete domain entry";
      setDomainsError(msg);
      adminNotify.error(msg);
    } finally {
      setDomainsLoading(false);
    }
  };

  const handleSave = async () => {
    const owner =
      activeOwner ??
      (form.userType === "shopOwner"
        ? owners.find((o) => ownerDisplayName(o) === form.userName)
        : null);
    if (!owner?.businessProfile?._id || !formMode) {
      let msg: string;
      if (form.userType === "carOwner") {
        msg = "Domain entries for car owners are not yet supported.";
      } else if (!form.userName) {
        msg = "Please select a user.";
      } else {
        msg = "Selected shop owner has no business profile.";
      }
      setDomainsError(msg);
      adminNotify.error(msg);
      return;
    }
    if (
      !form.userName ||
      !form.userType ||
      !form.domain ||
      !form.expiry ||
      !form.provider ||
      !form.dns
    ) {
      const msg = "All required fields must be filled.";
      setDomainsError(msg);
      adminNotify.error(msg);
      return;
    }

    const businessId = owner.businessProfile._id;
    setSaving(true);
    setDomainsError(null);
    try {
      const fd = new FormData();
      fd.append("userName", form.userName);
      fd.append("userType", form.userType);
      fd.append("domain", form.domain);
      fd.append("expiry", form.expiry);
      fd.append("provider", form.provider);
      fd.append("dns", form.dns);

      const headers = { "Content-Type": "multipart/form-data" };
      if (formMode === "CREATE") {
        await axios.post(`${API_URL}/api/admin/business-profiles/${businessId}/ads`, fd, {
          headers,
        });
        adminNotify.success("Domain entry created.");
      } else if (formMode === "EDIT" && editId) {
        await axios.patch(
          `${API_URL}/api/admin/business-profiles/${businessId}/ads/${editId}`,
          fd,
          { headers }
        );
        adminNotify.success("Domain entry updated.");
      }
      setActiveOwner(owner);
      resetForm();
      setShowForm(false);
      setViewingOwner(owner);
      await refreshDomains();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      const msg = message || "Failed to save domain entry";
      setDomainsError(msg);
      adminNotify.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const visibleDomains = viewingOwner
    ? domains.filter((row) => row.owner._id === viewingOwner._id)
    : domains;

  const filteredDomainRows = visibleDomains.filter((row) => {
    const q = search.toLowerCase();
    const matchesSearch =
      userTypeLabel(row.userType).toLowerCase().includes(q) ||
      row.userName.toLowerCase().includes(q) ||
      row.domain.toLowerCase().includes(q) ||
      row.expiry.toLowerCase().includes(q) ||
      row.providerLabel.toLowerCase().includes(q) ||
      row.dns.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (heading === "all" || !q) return true;

    const fieldValue = String(row[heading as keyof DomainRow] ?? "").toLowerCase();
    return fieldValue.includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filteredDomainRows.length / entriesPerPage));
  const pagedDomainRows = filteredDomainRows.slice(
    (page - 1) * entriesPerPage,
    page * entriesPerPage
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === pagedDomainRows.length) setSelected(new Set());
    else setSelected(new Set(pagedDomainRows.map((r) => r.id)));
  };

  const handleToolbarPrint = () => {
    printAdminTable({
      title: "Domain",
      headers: ["User Type", "User Name", "Domain", "Expiry", "Provider", "DNS"],
      rows: domains
        .filter((row) => selected.has(row.id))
        .map((row) => [
          userTypeLabel(row.userType),
          row.userName,
          row.domain,
          row.expiry,
          row.providerLabel,
          row.dns,
        ]),
    });
  };

  const handleAddNew = () => {
    openAddForm();
  };

  const userNameOptions =
    form.userType === "carOwner"
      ? carOwners.map((owner) => owner.name || "—").filter((name) => name !== "—")
      : owners.filter((o) => o.businessProfile?._id).map(ownerDisplayName);

  const renderDomainTableBody = (rows: DomainRow[], emptyMessage: string) => {
    if (domainsLoading) {
      return (
        <tr>
          <td colSpan={8} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
            Loading...
          </td>
        </tr>
      );
    }
    if (rows.length === 0) {
      return (
        <tr>
          <td colSpan={8} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
            {emptyMessage}
          </td>
        </tr>
      );
    }
    return rows.map((row, idx) => (
      <tr key={row.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
        <td className="border border-gray-300 px-2 py-2">
          <input
            type="checkbox"
            checked={selected.has(row.id)}
            onChange={() => toggleSelect(row.id)}
            className="accent-ad-purple"
          />
        </td>
        <td className="border border-gray-300 px-3 py-2">{userTypeLabel(row.userType)}</td>
        <td className="border border-gray-300 px-3 py-2">
          {!viewingOwner ? (
            <button
              type="button"
              onClick={() => openOwnerView(row.owner)}
              className="text-blue-700 hover:underline"
            >
              {row.userName}
            </button>
          ) : (
            row.userName
          )}
        </td>
        <td className="border border-gray-300 px-3 py-2">
          {row.domain !== "—" ? (
            <a
              href={row.domain.startsWith("http") ? row.domain : `https://${row.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 hover:underline"
            >
              {row.domain}
            </a>
          ) : (
            "—"
          )}
        </td>
        <td className="border border-gray-300 px-3 py-2">{row.expiry}</td>
        <td className="border border-gray-300 px-3 py-2">{row.providerLabel}</td>
        <td className="border border-gray-300 px-3 py-2 max-w-[200px] truncate" title={row.dns}>
          {row.dns}
        </td>
        <td className="border border-gray-300 px-3 py-2 text-center">
          <button
            type="button"
            onClick={() => openEditForm(row)}
            className="mr-2 text-blue-700 hover:underline"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row)}
            className="text-red-700 hover:underline"
          >
            Delete
          </button>
        </td>
      </tr>
    ));
  };

  const domainTableHead = (
    <thead>
      <tr className="bg-ad-purple text-white">
        <th className="border border-ad-purple-dark px-2 py-2 text-left">
          <input
            type="checkbox"
            checked={pagedDomainRows.length > 0 && selected.size === pagedDomainRows.length}
            onChange={toggleSelectAll}
            className="accent-white"
          />
        </th>
        <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">User Type</th>
        <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">User Name</th>
        <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Domain</th>
        <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Expiry</th>
        <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Provider</th>
        <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">DNS</th>
        <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Actions</th>
      </tr>
    </thead>
  );

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
                Add Domain
              </button>
            </div>
            <span className="text-center text-xs font-serif italic text-gray-800">
              You are viewing domains for &apos;
              {viewingOwner.businessProfile?.businessName || viewingOwner.name}&apos;
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
          <CompactField label="User Type" className={compactFixedFieldWidth}>
            <div className={compactReadOnlyValueClass}>Shop Owner</div>
          </CompactField>
          <CompactField label="User Name" className={compactFixedFieldWidth}>
            <div className={compactReadOnlyValueClass}>
              {viewingOwner.businessProfile?.businessName || viewingOwner.name || "—"}
            </div>
          </CompactField>
          <CompactField label="Phone" className={compactFixedFieldWidth}>
            <div className={compactReadOnlyValueClass}>
              {viewingOwner.countryCode ? `${viewingOwner.countryCode} ` : ""}
              {viewingOwner.phone || "—"}
            </div>
          </CompactField>
          <CompactField label="City" className="min-w-0 flex-1">
            <div className={compactReadOnlyValueClass}>{viewingOwner.businessProfile?.city || "—"}</div>
          </CompactField>
        </CompactFormRow>

        {domainsError && (
          <div className="mb-2 rounded border border-red-200 bg-red-100 px-3 py-2 text-xs text-red-800">
            {domainsError}
          </div>
        )}

        <div className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            {domainTableHead}
            <tbody>
              {renderDomainTableBody(
                pagedDomainRows,
                "No domains yet for this shop."
              )}
            </tbody>
          </table>
        </div>
      </CompactFormPanel>
    ) : undefined;

  const adFormPanel =
    showForm && formMode ? (
      <CompactFormPanel
        footer={
          <CompactFormFooter
            message={
              formMode === "CREATE"
                ? "You are creating a 'Domain' entry"
                : "You are editing a 'Domain' entry"
            }
            messageCenter
            actionLabel={
              saving
                ? (formMode === "EDIT" ? "Updating..." : "Saving...")
                : (formMode === "EDIT" ? "Update" : "Save")
            }
            onSave={handleSave}
            onCancel={handleCancelForm}
          />
        }
      >
        {domainsError && (
          <div className="mb-2 rounded border border-red-200 bg-red-100 px-3 py-2 text-xs text-red-800">
            {domainsError}
          </div>
        )}
        <CompactFormRow className="w-full items-start">
          <CompactField label="User Type" required className={compactFixedFieldWidth}>
            <select
              name="userType"
              value={form.userType}
              onChange={(e) => {
                const userType = e.target.value;
                setForm((prev) => ({ ...prev, userType, userName: "" }));
                setActiveOwner(null);
              }}
              className={compactInputClass}
            >
              {USER_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </CompactField>
          <CompactField label="User Name" required className={compactFixedFieldWidth}>
            <select
              name="userName"
              value={form.userName}
              onChange={(e) => {
                const userName = e.target.value;
                setForm((prev) => ({ ...prev, userName }));
                if (form.userType === "shopOwner") {
                  setActiveOwner(
                    owners.find((o) => ownerDisplayName(o) === userName) ?? null
                  );
                }
              }}
              className={compactInputClass}
            >
              <option value="">Select User</option>
              {userNameOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </CompactField>
          <CompactField label="Domain" required className={compactFixedFieldWidth}>
            <input
              type="text"
              name="domain"
              value={form.domain}
              onChange={handleFormChange}
              placeholder="example.com"
              className={compactInputClass}
            />
          </CompactField>
          <CompactField label="Expiry (Date)" required className={compactFixedFieldWidth}>
            <input
              type="date"
              name="expiry"
              value={form.expiry}
              onChange={handleFormChange}
              className={compactInputClass}
            />
          </CompactField>
          <CompactField label="Provider" required className={compactFixedFieldWidth}>
            <select
              name="provider"
              value={form.provider}
              onChange={handleFormChange}
              className={compactInputClass}
            >
              <option value="">Select Provider</option>
              {PROVIDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </CompactField>
          <CompactField label="DNS" required className="min-w-0 flex-1">
            <CompactAutoGrowTextarea
              name="dns"
              value={form.dns}
              onChange={handleFormChange}
              placeholder="A record, CNAME, nameservers, etc."
            />
          </CompactField>
        </CompactFormRow>
      </CompactFormPanel>
    ) : undefined;

  const betweenPanel = showForm ? adFormPanel : ownerViewPanel;

  const toolbar = (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
      <div className="flex flex-wrap gap-1">
        <button type="button" disabled={selected.size === 0} className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
          Send Notification
        </button>
        <button type="button" disabled={selected.size === 0} className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
          Whatsapp
        </button>
        <button type="button" disabled={selected.size === 0} className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
          Website
        </button>
        <button type="button" disabled={selected.size === 0} className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
          Delete
        </button>
        <button
          type="button"
          onClick={handleToolbarPrint}
          disabled={selected.size === 0}
          className="bg-ad-green px-3 py-1 text-xs font-medium text-black hover:bg-ad-green-dark disabled:cursor-not-allowed disabled:opacity-50"
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
        <select
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
          className="border border-gray-400 bg-gray-500 px-2 py-1 text-xs font-medium text-white"
        >
          {DOMAIN_HEADINGS.map((h) => (
            <option key={h.value} value={h.value}>
              {h.label}
            </option>
          ))}
        </select>
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
    </div>
  );

  const renderDomainTable = () => (
    <>
      {domainsError && !showForm && (
        <div className="mb-2 rounded border border-red-200 bg-red-100 px-3 py-2 text-xs text-red-800">
          {domainsError}
        </div>
      )}
      {toolbar}
      {entriesControl}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          {domainTableHead}
          <tbody>
            {renderDomainTableBody(pagedDomainRows, "No records found.")}
          </tbody>
        </table>
      </div>
      {paginationFooter}
    </>
  );

  return (
    <AdminPage
      title={PAGE_TITLE}
      noPanel
      onTitleClick={viewingOwner ? closeOwnerView : undefined}
      headerAction={
        !showForm && !viewingOwner ? <AddNewButton onClick={handleAddNew} /> : undefined
      }
      between={betweenPanel}
    >
      {!viewingOwner ? renderDomainTable() : null}
    </AdminPage>
  );
}
