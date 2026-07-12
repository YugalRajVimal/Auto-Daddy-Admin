import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import axios from "axios";
import AdminPage, { AddNewButton } from "../../../components/admin/AdminPage";
import { AdminDeletedBanner, AdminDeletedToggle } from "../../../components/admin/AdminDeletedView";
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
import { useAdminDeletedView } from "../../../hooks/useAdminDeletedView";
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
  domainType: "new" | "existing";
  userName: string;
  userType: string;
  domain: string;
  expiry: string;
  provider: string;
  dns: string;
};

const EMPTY_DOMAIN_FORM: DomainForm = {
  domainType: "new",
  userName: "",
  userType: "shopOwner",
  domain: "",
  expiry: "",
  provider: "",
  dns: "",
};

interface DomainEntry {
  _id: string;
  userType?: string;
  userName?: string;
  domain?: string;
  expiry?: string;
  provider?: string;
  domainType?: "new" | "existing";
  dns?: string;
  owner?: {
    _id: string;
    name?: string;
    businessProfile?: BusinessProfile | null;
  } | null;
  createdAt?: string;
  updatedAt?: string;
  userId?: any; // changed from string to any to allow object as returned by API
}

type DomainRow = {
  id: string;
  userType: string;
  userName: string;
  domain: string;
  domainType: "new" | "existing";
  expiry: string;
  expiryRaw: string;
  provider: string;
  providerLabel: string;
  dns: string;
  userId?: string;
  owner?: AutoShopOwner | CarOwner | null;
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
  { value: "domainType", label: "Domain Type" },
  { value: "expiry", label: "Expiry" },
  { value: "providerLabel", label: "Provider" },
  { value: "dns", label: "DNS" },
];

const API_URL = import.meta.env.VITE_API_URL 

type WebsiteTemplate = {
  id: string;
  name: string;
  description?: string;
};

const WEBSITE_TEMPLATES: WebsiteTemplate[] = [
  { id: "template-1", name: "Template 1", description: "Clean hero + services + contact" },
  { id: "template-2", name: "Template 2", description: "Bold branding + gallery + reviews" },
  { id: "template-3", name: "Template 3", description: "Minimal one-page with CTA" },
];

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
  // API expects "shopOwner" / "carOwner", but /domains API uses "autoshopowner" / "carowner"
  if (value === "autoshopowner") return "Shop Owner";
  if (value === "carowner" || value === "carOwner") return "Car Owner";
  return USER_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function providerLabel(value: string) {
  const found = PROVIDER_OPTIONS.find(
    (o) => o.value.toLowerCase() === value?.toLowerCase()
  );
  return found?.label ?? value;
}

function ownerDisplayName(owner: AutoShopOwner | CarOwner | null | undefined) {
  // Only for viewing shopOwner (with businessProfile?) or carOwner
  if (!owner) return "—";
  //@ts-ignore
  if (owner.businessProfile?.businessName) return owner.businessProfile.businessName;
  // @ts-ignore
  if (owner.name) return owner.name;
  return "—";
}

// function getNameFromUserId(userId: any): string | undefined {
//   // If userId is an object and has "name", use it
//   if (userId && typeof userId === "object" && "name" in userId) return userId.name;
//   return undefined;
// }

function getIdFromUserId(userId: any): string | undefined {
  if (typeof userId === "string") return userId;
  if (userId && typeof userId === "object" && "_id" in userId) return userId._id;
  return undefined;
}

function domainTypeLabel(value: "new" | "existing") {
  return value === "new" ? "New" : "Existing";
}

function mapApiUserTypeToLocal(value: string): string {
  // Form wants "shopOwner"/"carOwner", API uses "autoshopowner"/"carowner"
  if (value === "autoshopowner") return "shopOwner";
  if (value === "carowner") return "carOwner";
  return value;
}

function mapLocalUserTypeToApi(value: string): string {
  if (value === "shopOwner") return "autoshopowner";
  if (value === "carOwner") return "carowner";
  return value;
}

// --- Rewrite of entryToDomainRow to show user name correctly based on domain.userId object or id ---
function entryToDomainRow(
  entry: DomainEntry,
  owner?: AutoShopOwner | CarOwner
): DomainRow {
  const domain = entry.domain || "";
  const provider = entry.provider || "";
  const expiryRaw = entry.expiry || "";
  const dns = entry.dns || "";
  const domainType = entry.domainType === "new" ? "new" : "existing";
  // const userType = mapApiUserTypeToLocal(entry.userType ?? "");
  
  // Compute userName from entry
  let userName: string = "—"; // fallback

  // 1. Prefer entry.userName if set and not empty/empty-like
  if (entry.userName && entry.userName !== "—") {
    userName = entry.userName;
  }
  // 2. If entry.userId is an object and has name, use name
  else if (entry.userId && typeof entry.userId === "object" && "name" in entry.userId && entry.userId.name) {
    userName = entry.userId.name;
  }
  // 3. If userId is a string: try lookup from owners as fallback
  else if (
    entry.userType &&
    ((entry.userType === "autoshopowner" && Array.isArray(owner)) ||
      entry.userType === "carowner")
  ) {
    // If owner prop supplied, fallback to ownerDisplayName(owner)
    if (owner) {
      userName = ownerDisplayName(owner);
    }
  }
  // 4. If no owner prop, just use ownerDisplayName as final fallback
  else if (owner) {
    userName = ownerDisplayName(owner);
  }

  // Pick correct userId string for per-row matching, even if entry.userId is an object
  // Get userId as string (for all table logic)
  let domainRowUserId: string | undefined = getIdFromUserId(entry.userId);

  return {
    id: entry._id,
    userType: entry.userType || "",
    userName: userName || "—",
    domain: domain || "—",
    domainType,
    expiry: expiryRaw ? formatDisplayDate(expiryRaw) : "—",
    expiryRaw,
    provider,
    providerLabel: provider ? providerLabel(provider) : "—",
    dns: dns || "—",
    userId: domainRowUserId,
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
  const [activeCarOwner, setActiveCarOwner] = useState<CarOwner | null>(null);
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

  const [websiteTemplateOpen, setWebsiteTemplateOpen] = useState(false);
  const [activeWebsiteTemplateId, setActiveWebsiteTemplateId] = useState<string>("");

  const resetTableControls = () => {
    setPage(1);
    setSelected(new Set());
    setSearch("");
  };

  const { viewMode, isDeletedView, toggleViewMode, deletedStash, stashDeleted, restoreStashed } =
    useAdminDeletedView<DomainRow>({
      onToggle: resetTableControls,
      storageKey: "admin_deleted_view:domain",
    });

  useEffect(() => {
    fetchOwners();
    fetchCarOwners();
    fetchAllDomains();
    // eslint-disable-next-line
  }, []);

  // --- 1. Fetch all owners ---
  const fetchOwners = async () => {
    // This is legacy from old code: just for selecting user in form/view, not using /domains API
    try {
      const res = await axios.get(`${API_URL}/api/admin/autoshopowners`);
      setOwners(res.data.data || []);
    } catch {
      setOwners([]);
    }
  };

  // --- 2. Fetch car owners for dropdown ---
  const fetchCarOwners = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/carowners`);
      setCarOwners(res.data.data || []);
    } catch {
      setCarOwners([]);
    }
  };

  // --- 3. Fetch all domains ----------
  async function fetchAllDomains() {
    setDomainsLoading(true);
    setDomainsError(null);
    try {
      const res = await axios.get(`${API_URL}/api/admin/domains`);
      const entries: DomainEntry[] = res.data?.data || [];

      setDomains(
        entries.map((entry) => {
          // Try to assign an owner ref for display
          let owner: AutoShopOwner | CarOwner | undefined = undefined;
          // Fix for userId as object in domain entry
          let rowUserId = getIdFromUserId(entry.userId);
          if (entry.userType === "autoshopowner") {
            owner = owners.find(
              (o) =>
                o._id === rowUserId ||
                o.businessProfile?._id === rowUserId
            );
          } else if (entry.userType === "carowner") {
            owner = carOwners.find((o) => o._id === rowUserId);
          }
          return entryToDomainRow(entry, owner);
        })
      );
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as any).response?.data?.message
          : undefined;
      setDomainsError(msg || "Failed to fetch domains");
    } finally {
      setDomainsLoading(false);
    }
  }

  // --- 4. Refresh for table actions
  const refreshDomains = async () => {
    await fetchAllDomains();
  };

  // --- 5. Form change handler ---
  const handleFormChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // --- 6. Reset ---
  const resetForm = () => {
    setForm(EMPTY_DOMAIN_FORM);
    setFormMode(null);
    setEditId(null);
    setActiveOwner(null);
    setActiveCarOwner(null);
  };

  // --- 7. Row Actions: Open add/view/edit forms ---
  const openOwnerView = (owner: AutoShopOwner) => {
    setActiveOwner(owner);
    setActiveCarOwner(null);
    setViewingOwner(owner);
    setShowForm(false);
    resetForm();
  };

  const closeOwnerView = () => {
    setViewingOwner(null);
    setActiveOwner(null);
    setActiveCarOwner(null);
    setShowForm(false);
    resetForm();
  };

  const openAddForm = (owner?: AutoShopOwner, carOwner?: CarOwner) => {
    setActiveOwner(owner ?? null);
    setActiveCarOwner(carOwner ?? null);
    setViewingOwner(null);
    setFormMode("CREATE");
    setForm({
      ...EMPTY_DOMAIN_FORM,
      userType: owner
        ? "shopOwner"
        : carOwner
        ? "carOwner"
        : "shopOwner",
      userName: owner
        ? ownerDisplayName(owner)
        : carOwner
        ? ownerDisplayName(carOwner)
        : "",
    });
    setEditId(null);
    setShowForm(true);
    setDomainsError(null);
  };

  const openEditForm = (row: DomainRow) => {
    // Find main row+owner (from _id/userId)
    let foundOwner: AutoShopOwner | CarOwner | null = null;
    if (row.userType === "autoshopowner" || row.userType === "shopOwner") {
      foundOwner = owners.find((o) => o._id === row.userId) ?? null;
    } else if (row.userType === "carowner" || row.userType === "carOwner") {
      foundOwner = carOwners.find((o) => o._id === row.userId) ?? null;
    }
    setActiveOwner(foundOwner && "businessProfile" in foundOwner ? foundOwner : null);
    setActiveCarOwner(foundOwner && "businessProfile" in foundOwner ? null : foundOwner as any);
    setFormMode("EDIT");
    setEditId(row.id);
    setForm({
      domainType: row.domainType,
      userName: row.userName === "—" ? ownerDisplayName(foundOwner) : row.userName,
      userType: mapApiUserTypeToLocal(row.userType),
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

  // --- 8. Delete single domain ---
  const handleDelete = async (row: DomainRow) => {
    if (!row.id || !window.confirm("Delete this domain entry?")) return;
    setDomainsLoading(true);
    setDomainsError(null);
    try {
      await axios.delete(`${API_URL}/api/admin/domains/${row.id}`);
      stashDeleted(row);
      adminNotify.success("Domain entry deleted.");
      await refreshDomains();
      // If viewing owner, try to keep pane open
      if (viewingOwner?._id === row.userId) {
        setViewingOwner(viewingOwner); // Keep open
        setActiveOwner(viewingOwner);
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as any).response?.data?.message
          : undefined;
      setDomainsError(msg || "Failed to delete domain entry");
      adminNotify.error(msg || "Failed to delete domain entry");
    } finally {
      setDomainsLoading(false);
    }
  };

  const handleToolbarDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} selected domain(s)?`)) return;
    const toDelete = domains.filter((row) => selected.has(row.id));
    setDomainsLoading(true);
    setDomainsError(null);
    try {
      await Promise.all(
        toDelete.map((row) => axios.delete(`${API_URL}/api/admin/domains/${row.id}`))
      );
      stashDeleted(toDelete);
      adminNotify.success("Selected domain(s) deleted.");
      setSelected(new Set());
      await refreshDomains();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as any).response?.data?.message
          : undefined;
      setDomainsError(msg || "Failed to delete domain entry");
      adminNotify.error(msg || "Failed to delete domain entry");
    } finally {
      setDomainsLoading(false);
    }
  };

  const handleRestore = async () => {
    if (selected.size === 0) return;
    const toRestore = deletedStash.filter((row) => selected.has(row.id));
    if (toRestore.length === 0) return;
    if (!window.confirm(`Restore ${toRestore.length} domain(s)?`)) return;
    setDomainsLoading(true);
    setDomainsError(null);
    try {
      for (const row of toRestore) {
        const userTypeApi = mapLocalUserTypeToApi(mapApiUserTypeToLocal(row.userType));
        const userId = row.userId;
        if (!userId || row.domain === "—") continue;
        await axios.post(
          `${API_URL}/api/admin/domains`,
          {
            userType: userTypeApi,
            userId,
            domain: row.domain,
            domainType: row.domainType,
            expiry: row.expiryRaw || row.expiry,
            provider: row.providerLabel !== "—" ? row.providerLabel : row.provider,
            dns: row.dns === "—" ? "" : row.dns,
          },
          { headers: { "Content-Type": "application/json" } }
        );
      }
      restoreStashed((item) => selected.has(item.id));
      setSelected(new Set());
      adminNotify.success("Domain(s) restored.");
      await refreshDomains();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as any).response?.data?.message
          : undefined;
      setDomainsError(msg || "Failed to restore domain entry");
      adminNotify.error(msg || "Failed to restore domain entry");
    } finally {
      setDomainsLoading(false);
    }
  };

  // --- 9. Add/edit domain ---
  const handleSave = async () => {
    // Map to API POST body for /domains
    // Need: userType ("autoshopowner'/'carowner'), userId, domain, domainType, expiry, provider, dns
    let userTypeApi = mapLocalUserTypeToApi(form.userType);
    let userId: string | null = null;

    if (userTypeApi === "autoshopowner") {
      const owner =
        activeOwner ?? owners.find((o) => ownerDisplayName(o) === form.userName) ?? null;
      // Try by businessProfile, fallback to _id
      if (owner?.businessProfile?._id) userId = owner.businessProfile._id;
      else if (owner?._id) userId = owner._id;
      else userId = null;
      if (!userId) {
        setDomainsError("Shop owner/user not found or does not have a business profile.");
        adminNotify.error("Shop owner/user not found or does not have a business profile.");
        return;
      }
    } else if (userTypeApi === "carowner") {
      const carOwner = activeCarOwner ?? carOwners.find((o) => ownerDisplayName(o) === form.userName) ?? null;
      if (carOwner?._id) userId = carOwner._id;
      else {
        setDomainsError("Selected car owner not found.");
        adminNotify.error("Selected car owner not found.");
        return;
      }
    } else {
      setDomainsError("Invalid user type.");
      adminNotify.error("Invalid user type.");
      return;
    }

    if (
      !form.userName ||
      !userTypeApi ||
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

    setSaving(true);
    setDomainsError(null);
    try {
      if (formMode === "CREATE") {
        await axios.post(
          `${API_URL}/api/admin/domains`,
          {
            userType: userTypeApi,
            userId: userId,
            domain: form.domain,
            domainType: form.domainType,
            expiry: form.expiry,
            provider: providerLabel(form.provider),
            dns: form.dns,
          },
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        adminNotify.success("Domain entry created.");
      } else if (formMode === "EDIT" && editId) {
        await axios.patch(
          `${API_URL}/api/admin/domains/${editId}`,
          {
            expiry: form.expiry,
            provider: providerLabel(form.provider),
            dns: form.dns,
          },
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        adminNotify.success("Domain entry updated.");
      }
      resetForm();
      setShowForm(false);
      setViewingOwner(activeOwner ?? null);
      await refreshDomains();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as any).response?.data?.message
          : undefined;
      setDomainsError(msg || "Failed to save domain entry");
      adminNotify.error(msg || "Failed to save domain entry");
    } finally {
      setSaving(false);
    }
  };

  // --- 10. Table display logic ---
  const sourceDomains = isDeletedView ? deletedStash : domains;

  const visibleDomains = viewingOwner
    ? sourceDomains.filter(
        (row) =>
          row.userId === viewingOwner.businessProfile?._id ||
          row.userId === viewingOwner._id
      )
    : sourceDomains;

  const filteredDomainRows = visibleDomains.filter((row) => {
    const q = search.toLowerCase();
    const matchesSearch =
      userTypeLabel(row.userType).toLowerCase().includes(q) ||
      row.userName.toLowerCase().includes(q) ||
      row.domain.toLowerCase().includes(q) ||
      domainTypeLabel(row.domainType).toLowerCase().includes(q) ||
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
      title: isDeletedView ? "Deleted Domain" : "Domain",
      headers: [
        "User Type",
        "User Name",
        "Domain",
        "Domain Type",
        "Expiry",
        "Provider",
        "DNS",
      ],
      rows: filteredDomainRows.map((row) => [
        userTypeLabel(row.userType),
        row.userName,
        row.domain,
        domainTypeLabel(row.domainType),
        row.expiry,
        row.providerLabel,
        row.dns,
      ]),
    });
  };

  const selectedRows = useMemo(
    () => sourceDomains.filter((row) => selected.has(row.id)),
    [sourceDomains, selected]
  );

  const openWebsiteTemplates = () => {
    if (selected.size === 0) return;
    setDomainsError(null);
    setActiveWebsiteTemplateId(WEBSITE_TEMPLATES[0]?.id ?? "");
    setWebsiteTemplateOpen(true);
  };

  const closeWebsiteTemplates = () => {
    setWebsiteTemplateOpen(false);
  };

  const applyWebsiteTemplate = () => {
    const template = WEBSITE_TEMPLATES.find((t) => t.id === activeWebsiteTemplateId);
    if (!template) return;
    adminNotify.success(`Selected "${template.name}" for ${selected.size} domain row(s).`);
    setWebsiteTemplateOpen(false);
  };

  const handleAddNew = () => {
    openAddForm();
  };

  // --- 11. User options for form select
  const userNameOptions =
    form.userType === "carOwner"
      ? carOwners.map((owner) => owner.name || "—").filter((name) => name !== "—")
      : owners
          .filter((o) => o.businessProfile?._id)
          .map(ownerDisplayName);

  // --- 12. Table body renderer ---
  const renderDomainTableBody = (rows: DomainRow[], emptyMessage: string) => {
    if (domainsLoading) {
      return (
        <tr>
          <td colSpan={9} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
            Loading...
          </td>
        </tr>
      );
    }
    if (rows.length === 0) {
      return (
        <tr>
          <td colSpan={9} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
            {emptyMessage}
          </td>
        </tr>
      );
    }
    return rows.map((row, idx) => (
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
          {userTypeLabel(row.userType)}
        </td>
        <td className="border border-gray-300 px-3 py-2 text-center">
          {!viewingOwner ? (
            <button
              type="button"
              onClick={() =>
                row.userType === "autoshopowner" || row.userType === "shopOwner"
                  ? openOwnerView(
                      owners.find(
                        (o) =>
                          o.businessProfile?._id === row.userId ||
                          o._id === row.userId
                      ) ?? row.owner as any
                    )
                  : undefined
              }
              className="text-blue-700 hover:underline"
              disabled={row.userType !== "autoshopowner" && row.userType !== "shopOwner"}
            >
              {row.userName}
            </button>
          ) : (
            row.userName
          )}
        </td>
        <td className="border border-gray-300 px-3 py-2 text-center">
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
        <td className="border border-gray-300 px-3 py-2 text-center">
          {domainTypeLabel(row.domainType)}
        </td>
        <td className="border border-gray-300 px-3 py-2 text-center">{row.expiry}</td>
        <td className="border border-gray-300 px-3 py-2 text-center">{row.providerLabel}</td>
        <td className="border border-gray-300 px-3 py-2 text-center max-w-[200px] truncate" title={row.dns}>
          {row.dns}
        </td>
        <td className="border border-gray-300 px-3 py-2 text-center">
          {!isDeletedView ? (
            <>
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
            </>
          ) : (
            "—"
          )}
        </td>
      </tr>
    ));
  };

  // --- 13. Table Head ---
  const domainTableHead = (
    <thead>
      <tr className="bg-ad-purple text-white">
        <th className="border border-ad-purple-dark px-2 py-2 text-center">
          <input
            type="checkbox"
            checked={pagedDomainRows.length > 0 && selected.size === pagedDomainRows.length}
            onChange={toggleSelectAll}
            className="accent-white"
          />
        </th>
        <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">
          User Type
        </th>
        <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">
          User Name
        </th>
        <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">
          Domain
        </th>
        <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">
          Domain Type
        </th>
        <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">
          Expiry
        </th>
        <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">
          Provider
        </th>
        <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">
          DNS
        </th>
        <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">
          Actions
        </th>
      </tr>
    </thead>
  );

  // --- 14. Owner panel (shop owner) ---
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
              {viewingOwner.businessProfile?.businessName || viewingOwner.name}
              &apos;
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
              {viewingOwner.businessProfile?.businessName ||
                viewingOwner.name ||
                "—"}
            </div>
          </CompactField>
          <CompactField label="Phone" className={compactFixedFieldWidth}>
            <div className={compactReadOnlyValueClass}>
              {viewingOwner.countryCode ? `${viewingOwner.countryCode} ` : ""}
              {viewingOwner.phone || "—"}
            </div>
          </CompactField>
          <CompactField label="City" className="min-w-0 flex-1">
            <div className={compactReadOnlyValueClass}>
              {viewingOwner.businessProfile?.city || "—"}
            </div>
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

  // --- 15. Form panel ---
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
                ? formMode === "EDIT"
                  ? "Updating..."
                  : "Saving..."
                : formMode === "EDIT"
                ? "Update"
                : "Save"
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
        <CompactFormRow className="w-full items-start" columns={4}>
          <CompactField label="User Type" required className="w-full min-w-0">
            <select
              name="userType"
              value={form.userType}
              onChange={(e) => {
                const userType = e.target.value;
                setForm((prev) => ({ ...prev, userType, userName: "" }));
                setActiveOwner(null);
                setActiveCarOwner(null);
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
          <CompactField label="User Name" required className="w-full min-w-0">
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
                  setActiveCarOwner(null);
                } else if (form.userType === "carOwner") {
                  setActiveCarOwner(
                    carOwners.find((o) => ownerDisplayName(o) === userName) ?? null
                  );
                  setActiveOwner(null);
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
          <CompactField label="Domain" required className="w-full min-w-0">
            <input
              type="text"
              name="domain"
              value={form.domain}
              onChange={handleFormChange}
              placeholder="example.com"
              className={compactInputClass}
            />
          </CompactField>
          <CompactField
            label="Domain Type"
            required
            className="w-full min-w-0"
            labelClassName="text-center"
          >
            <div className="flex h-[30px] w-full items-center justify-center gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-800">
                <input
                  type="radio"
                  name="domainType"
                  value="new"
                  checked={form.domainType === "new"}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      domainType: e.target.value as DomainForm["domainType"],
                    }))
                  }
                  className="accent-ad-purple"
                />
                New
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-800">
                <input
                  type="radio"
                  name="domainType"
                  value="existing"
                  checked={form.domainType === "existing"}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      domainType: e.target.value as DomainForm["domainType"],
                    }))
                  }
                  className="accent-ad-purple"
                />
                Existing
              </label>
            </div>
          </CompactField>
        </CompactFormRow>
        <CompactFormRow className="w-full items-start" columns={4}>
          <CompactField label="Expiry (Date)" required className="w-full min-w-0">
            <input
              type="date"
              name="expiry"
              value={form.expiry}
              onChange={handleFormChange}
              className={compactInputClass}
            />
          </CompactField>
          <CompactField label="Provider" required className="w-full min-w-0">
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
          <CompactField label="DNS" required className="w-full min-w-0">
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

  // --- 16. Toolbar, table, pagination ---
  const toolbar = (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
      <div className="flex flex-wrap gap-1">
        {!isDeletedView ? (
          <>
            <button
              type="button"
              disabled={selected.size === 0}
              className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send Notification
            </button>
            <button
              type="button"
              disabled={selected.size === 0}
              className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Whatsapp
            </button>
            <button
              type="button"
              onClick={openWebsiteTemplates}
              disabled={selected.size === 0}
              className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Website
            </button>
            <button
              type="button"
              onClick={handleToolbarDelete}
              disabled={selected.size === 0}
              className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Delete
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleRestore}
            disabled={selected.size === 0}
            className="bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            Restore
          </button>
        )}
        <button
          type="button"
          onClick={handleToolbarPrint}
          className="bg-ad-green px-3 py-1 text-xs font-medium text-black hover:bg-ad-green-dark"
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

  // --- 17. Website modal
  const websiteTemplatesModal = websiteTemplateOpen ? (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto bg-black/40 px-3 py-10">
      <div className="w-full max-w-2xl rounded-md bg-white shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
        <div className="flex items-center justify-between rounded-t-md bg-ad-purple px-4 py-3 text-white">
          <div className="text-sm font-bold">Select website template</div>
          <button
            type="button"
            onClick={closeWebsiteTemplates}
            className="text-2xl leading-none text-white/90 hover:text-white"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="space-y-3 px-4 py-4">
          <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
            Applying to <span className="font-semibold">{selected.size}</span> selected row(s).
            {selectedRows.length > 0 ? (
              <span className="ml-1 text-gray-500">
                ({selectedRows.slice(0, 3).map((r) => r.userName).join(", ")}
                {selectedRows.length > 3 ? ` +${selectedRows.length - 3} more` : ""})
              </span>
            ) : null}
          </div>

          <div className="space-y-2">
            {WEBSITE_TEMPLATES.map((tpl) => (
              <label
                key={tpl.id}
                className={`flex cursor-pointer items-start gap-3 rounded border px-3 py-2 text-sm ${
                  activeWebsiteTemplateId === tpl.id
                    ? "border-ad-purple bg-purple-50"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="websiteTemplate"
                  checked={activeWebsiteTemplateId === tpl.id}
                  onChange={() => setActiveWebsiteTemplateId(tpl.id)}
                  className="mt-1 accent-ad-purple"
                />
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900">{tpl.name}</div>
                  {tpl.description ? (
                    <div className="text-xs text-gray-600">{tpl.description}</div>
                  ) : null}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 rounded-b-md border-t border-gray-200 bg-white px-4 py-3">
          <button
            type="button"
            onClick={closeWebsiteTemplates}
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={applyWebsiteTemplate}
            disabled={!activeWebsiteTemplateId}
            className="rounded bg-ad-green px-3 py-1.5 text-xs font-bold text-white hover:bg-ad-green-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            Apply Template
          </button>
        </div>
      </div>
    </div>
  ) : null;

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
      <AdminDeletedToggle
        viewMode={viewMode}
        onToggle={toggleViewMode}
        activeLabel="Active Domains"
      />
    </div>
  );

  const renderDomainTable = () => (
    <>
      {isDeletedView && (
        <AdminDeletedBanner count={deletedStash.length} entityLabel="domains" />
      )}
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
            {renderDomainTableBody(
              pagedDomainRows,
              isDeletedView ? "No deleted domains found." : "No records found."
            )}
          </tbody>
        </table>
      </div>
      {paginationFooter}
    </>
  );

  return (
    <AdminPage
      title={isDeletedView ? `Deleted ${PAGE_TITLE}` : PAGE_TITLE}
      noPanel
      onTitleClick={viewingOwner ? closeOwnerView : undefined}
      headerAction={
        !showForm && !viewingOwner && !isDeletedView ? <AddNewButton onClick={handleAddNew} /> : undefined
      }
      between={betweenPanel}
    >
      {websiteTemplatesModal}
      {!viewingOwner ? renderDomainTable() : null}
    </AdminPage>
  );
}
