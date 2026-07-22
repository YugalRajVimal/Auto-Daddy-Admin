import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import JobCardForm from "../../components/JobCard/JobCardForm";
import ShopJobCardEstimateView, {
  type JobCardActionPreview,
} from "../../components/JobCard/ShopJobCardEstimateView";
import { pickJobNoFromListRow, resolveJobCardDisplayNo } from "../../components/JobCard/shopJobCardEstimate";
import {
  ADMIN_PANEL_THEAD_ROW_CLASS,
  adminPanelRowClass,
  adminPanelTableClasses,
  type AdminPanelTableClasses,
} from "../../components/admin/adminPanelTableStyles";
import { shopAddNewButtonClass } from "../../components/shop/forms/ShopFormPage";
import { ShopReveal } from "../../components/shop/ShopAnimated";
import ShopManageNumberingDialog, {
  type NumberingValues,
} from "../../components/shop/ShopManageNumberingDialog";
import ShopPageShell from "../../components/shop/ShopPageShell";
import { ShopSidebarButton } from "../../components/shop/ShopSidebar";
import { ShopListSkeleton } from "../../components/shop/ShopListSkeletons";
import { ShopErrorPanel, ShopListFooter } from "../../components/shop/ShopPanels";
import { shopSidebarButtonStackClass } from "../../components/shop/shopSidebarStyles";
import { shopTableToolbarClass } from "../../components/shop/shopLayoutStyles";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { useAutoshopJobCards } from "../../hooks/useAutoshopJobCards";
import { formatCurrencyAmount } from "../../lib/currency";
import { formatPhoneWithCountryCode } from "../../lib/phoneFormat";
import {
  apiMessageFromEnvelope,
  deleteAutoshopJobCard,
  fetchAutoshopJobCardNextNumber,
  fetchAutoshopJobCardPrefix,
  parseAutoshopJobCardNextNumber,
  parseAutoshopJobCardPrefix,
  sendAutoshopJobCardForApproval,
  updateAutoshopJobCardPrefix,
  updateAutoshopJobCardSeq,
} from "../../lib/autoshopownerJobCardsApi";
import { formatDisplayDate } from "../AdminPages/Accounts/accountData";
import {
  isJobCardApproved,
  isJobCardEditable,
  isEligibleForInvoiceConversion,
  jobCardStatusClass,
  jobCardStatusLabel,
  pickJobCardInvoiceNumber,
  pickJobCardNoForApi,
  parseJobCardsFromPagePayload,
  type JobCardListRow,
} from "../../lib/shopOwnerJobCards";
import useAuth from "../../auth/useAuth";

type JobCardSection = "my-list" | "approvals" | "convert-invoice" | "paid";
type JobCardView = "list" | "form" | "detail";

const PAGE_SIZE = 10;
const JOB_CARDS_SEARCH_INPUT_ID = "shop-job-cards-search";

const DEFAULT_ESTIMATE_NUMBERING: NumberingValues = { code: "", number: "1" };

const JOB_CARD_SECTIONS = [
  { id: "my-list", label: "My Job Cards", variant: "primary" as const },
  { id: "approvals", label: "Approvals", variant: "primary" as const },
  { id: "convert-invoice", label: "Converted to Invoice", variant: "primary" as const },
  { id: "paid", label: "Paid Jobs", variant: "primary" as const },
];

const SECTION_HEADINGS: Record<JobCardSection, string> = {
  "my-list": "My Job Cards",
  approvals: "Approvals",
  "convert-invoice": "Converted to Invoice",
  paid: "Paid Jobs",
};

const SHOP_TABLE_BASE = adminPanelTableClasses(true);
const SHOP_TABLE: AdminPanelTableClasses = {
  ...SHOP_TABLE_BASE,
  th: SHOP_TABLE_BASE.th.replace("px-2", "px-4"),
  thCheckbox: SHOP_TABLE_BASE.thCheckbox.replace("px-2", "px-4"),
  td: SHOP_TABLE_BASE.td.replace("px-2", "px-4"),
  tdCheckbox: SHOP_TABLE_BASE.tdCheckbox.replace("px-2", "px-4"),
};

const SHOP_TABLE_HEAD_TH_CLASS = `${SHOP_TABLE.th} h-9 py-0 align-middle`;
const SHOP_TABLE_HEAD_TH_CHECKBOX_CLASS = `${SHOP_TABLE.thCheckbox} h-9 py-0 align-middle`;
const SHOP_TABLE_BODY_TD_CLASS = `${SHOP_TABLE.td} h-9 py-0 align-middle whitespace-nowrap`;
const SHOP_TABLE_BODY_TD_CHECKBOX_CLASS = `${SHOP_TABLE.tdCheckbox} h-9 py-0 align-middle`;
const SHOP_TABLE_CHECKBOX_CLASS = "h-3.5 w-3.5 accent-ad-purple";

const SHOP_JOB_CARD_BULK_BUTTON_CLASS =
  "rounded border border-ad-purple bg-white px-3 py-1 text-xs font-bold text-ad-purple hover:bg-[#f5cce8] disabled:cursor-not-allowed disabled:opacity-60";

const SHOP_JOB_CARD_EDIT_BUTTON_CLASS =
  "rounded border border-ad-purple bg-white px-2 py-0.5 text-xs font-bold text-ad-purple hover:bg-[#f5cce8]";

function displayJobId(row: JobCardListRow, prefix?: string): string {
  return resolveJobCardDisplayNo(row, null, prefix);
}

function formatJobPrice(
  total: number | string | undefined,
  countryCode: string | null | undefined,
): string {
  return formatCurrencyAmount(total, countryCode, { fallback: "—", includeSign: false });
}

function matchesJobCardSearch(row: JobCardListRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [row.customerName, row.phone, row.vehiclePlate, row.jobNo, row.invoiceNumber]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function usesJobCardApiSearch(section: JobCardSection): boolean {
  return section === "my-list";
}

/** Customer-approved, unpaid job cards that can be marked paid by cash. */
function isEligibleForCashPayment(row: JobCardListRow): boolean {
  return isEligibleForInvoiceConversion(row);
}

function AddNewButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={shopAddNewButtonClass}>
      + Add New
    </button>
  );
}

function JobCardsSearchBar({
  value,
  onChange,
  leading,
  trailing,
}: {
  value: string;
  onChange: (value: string) => void;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className={shopTableToolbarClass}>
      <div className="flex flex-wrap items-center gap-2">{leading}</div>
      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <input
          id={JOB_CARDS_SEARCH_INPUT_ID}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search"
          aria-label="Search"
          className="h-[26px] min-w-[9rem] border border-gray-400 bg-white px-2 text-sm text-gray-800 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
        />
        {trailing}
      </div>
    </div>
  );
}

function jobCardsMatchingSelection(
  selectedIds: Set<string>,
  cards: JobCardListRow[],
): JobCardListRow[] {
  return cards.filter((row) => selectedIds.has(row.id));
}

function JobCardListTable({
  rows,
  countryCode,
  jobCardPrefix,
  onEdit,
  onView,
  selectedIds,
  onToggleRow,
  onTogglePage,
  showStatusColumn = false,
  showInvoiceColumn = false,
  showActions = true,
}: {
  rows: JobCardListRow[];
  countryCode: string | null | undefined;
  jobCardPrefix?: string;
  onEdit: (jobCard: JobCardListRow) => void;
  onView: (jobCard: JobCardListRow) => void;
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onTogglePage: (ids: string[], checked: boolean) => void;
  showStatusColumn?: boolean;
  showInvoiceColumn?: boolean;
  showActions?: boolean;
}) {
  const selectAllRef = useRef<HTMLInputElement>(null);
  const editHeadClass = `${SHOP_TABLE_HEAD_TH_CLASS} text-center`;
  const pageRowIds = rows.map((row) => row.id);
  const allPageSelected = rows.length > 0 && pageRowIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageRowIds.some((id) => selectedIds.has(id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = somePageSelected && !allPageSelected;
    }
  }, [somePageSelected, allPageSelected]);

  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
      className="shop-hero-surface overflow-hidden rounded border border-gray-300 bg-white shadow-sm"
    >
      <div className="overflow-x-auto">
        <table className={SHOP_TABLE.table}>
          <thead>
            <tr className={ADMIN_PANEL_THEAD_ROW_CLASS}>
              <th className={SHOP_TABLE_HEAD_TH_CHECKBOX_CLASS}>
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={(e) => onTogglePage(pageRowIds, e.target.checked)}
                  aria-label="Select all job cards on this page"
                  className={SHOP_TABLE_CHECKBOX_CLASS}
                />
              </th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Job No.</th>
              {showInvoiceColumn ? (
                <th className={SHOP_TABLE_HEAD_TH_CLASS}>Invoice No.</th>
              ) : null}
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Customer</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Phone</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Plate</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Total</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Date</th>
              {showStatusColumn ? (
                <th className={SHOP_TABLE_HEAD_TH_CLASS}>Status</th>
              ) : null}
              {showActions ? <th className={editHeadClass}>Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((jc, index) => {
              const customerName = jc.customerName?.trim() || "—";
              const invoiceNo = pickJobCardInvoiceNumber(jc);
              const jobIdLabel = displayJobId(jc, jobCardPrefix);
              return (
                <tr key={jc.id} className={adminPanelRowClass(index)}>
                  <td className={SHOP_TABLE_BODY_TD_CHECKBOX_CLASS}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(jc.id)}
                      onChange={() => onToggleRow(jc.id)}
                      aria-label={`Select job ${jobIdLabel}`}
                      className={SHOP_TABLE_CHECKBOX_CLASS}
                    />
                  </td>
                  <td className={SHOP_TABLE_BODY_TD_CLASS}>
                    <button
                      type="button"
                      onClick={() => onView(jc)}
                      className="font-semibold text-blue-700 underline hover:text-blue-800"
                      title={`View ${jobIdLabel}`}
                      aria-label={`View ${jobIdLabel}`}
                    >
                      {jobIdLabel}
                    </button>
                  </td>
                  {showInvoiceColumn ? (
                    <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-gray-800`}>
                      {invoiceNo || "—"}
                    </td>
                  ) : null}
                  <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-blue-700`}>
                    {customerName}
                  </td>
                  <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-gray-800`}>
                    {formatPhoneWithCountryCode(
                      jc.phone,
                      jc.phoneCountryCode ?? countryCode,
                    )}
                  </td>
                  <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-gray-800`}>
                    {jc.vehiclePlate?.trim() || "—"}
                  </td>
                  <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-gray-800`}>
                    {formatJobPrice(jc.total, countryCode)}
                  </td>
                  <td className={SHOP_TABLE_BODY_TD_CLASS}>
                    {jc.date ? formatDisplayDate(jc.date) : "—"}
                  </td>
                  {showStatusColumn ? (
                    <td className={SHOP_TABLE_BODY_TD_CLASS}>
                      <span className={`font-semibold ${jobCardStatusClass(jc)}`}>
                        {jobCardStatusLabel(jc)}
                      </span>
                    </td>
                  ) : null}
                  {showActions ? (
                    <td className={`${SHOP_TABLE_BODY_TD_CLASS} text-center`}>
                      {isJobCardEditable(jc) ? (
                        <button
                          type="button"
                          onClick={() => onEdit(jc)}
                          className={SHOP_JOB_CARD_EDIT_BUTTON_CLASS}
                        >
                          Edit
                        </button>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

export default function ShopJobCardsPage() {
  const { token } = useAuth();
  const { faqsHeading, faqsDescription, business } = useShopOwnerPortal();
  const [section, setSection] = useState<JobCardSection>("my-list");
  const [search, setSearch] = useState("");
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<JobCardView>("list");
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editJobCardId, setEditJobCardId] = useState<string | null>(null);
  const [editJobCardNo, setEditJobCardNo] = useState<string | null>(null);
  const [editListRow, setEditListRow] = useState<JobCardListRow | null>(null);
  const [detailJobCardId, setDetailJobCardId] = useState<string | null>(null);
  const [detailListRow, setDetailListRow] = useState<JobCardListRow | null>(null);
  const [actionPreviewMode, setActionPreviewMode] = useState<JobCardActionPreview | null>(null);
  const [selectedJobCardIds, setSelectedJobCardIds] = useState<Set<string>>(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [manageEstimatesOpen, setManageEstimatesOpen] = useState(false);
  const [estimateNumbering, setEstimateNumbering] = useState<NumberingValues>({
    ...DEFAULT_ESTIMATE_NUMBERING,
  });
  const [estimatePrefixLoading, setEstimatePrefixLoading] = useState(false);
  const [jobCardPrefix, setJobCardPrefix] = useState("");
  const {
    cards: listCards,
    loading,
    error,
    refresh,
  } = useAutoshopJobCards(section, usesJobCardApiSearch(section) ? search : "");

  useEffect(() => {
    if (!token) {
      setJobCardPrefix("");
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetchAutoshopJobCardPrefix(token);
        if (cancelled || !res.ok) return;
        const prefix = parseAutoshopJobCardPrefix(res.data);
        if (prefix) setJobCardPrefix(prefix);
      } catch {
        /* table falls back until prefix is available */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const filteredListCards = useMemo(() => {
    if (usesJobCardApiSearch(section) || !search.trim()) return listCards;
    return listCards.filter((row) => matchesJobCardSearch(row, search));
  }, [listCards, search, section]);

  const totalPages = Math.max(1, Math.ceil(filteredListCards.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paginatedList = useMemo(
    () => filteredListCards.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredListCards, safePage],
  );

  const pageHeading =
    view === "detail"
      ? actionPreviewMode === "invoice"
        ? "Invoice Preview"
        : actionPreviewMode === "cash"
          ? "Paid by Cash Preview"
          : "Job Card"
      : view === "form" && formMode === "add"
      ? "Create New Job Card"
      : view === "form" && formMode === "edit"
        ? "Edit Job Card"
        : SECTION_HEADINGS[section];

  const activeSidebarId =
    formMode === "add" && view === "form" ? "my-list" : section;

  const hasBulkSelection = selectedJobCardIds.size > 0;

  const sidebarFooter = useMemo(
    () => (
      <div className={`mt-4 ${shopSidebarButtonStackClass}`}>
        <ShopSidebarButton
          label="Manage Estimates"
          onClick={() => setManageEstimatesOpen(true)}
        />
      </div>
    ),
    [],
  );

  useEffect(() => {
    if (!manageEstimatesOpen || !token) return;
    let cancelled = false;
    setEstimatePrefixLoading(true);
    void (async () => {
      try {
        const [prefixRes, nextRes] = await Promise.all([
          fetchAutoshopJobCardPrefix(token),
          fetchAutoshopJobCardNextNumber(token),
        ]);
        if (cancelled) return;
        if (!prefixRes.ok && !nextRes.ok) {
          toast.error(
            apiMessageFromEnvelope(prefixRes.data) ||
              apiMessageFromEnvelope(nextRes.data) ||
              "Could not load estimate numbering.",
          );
          return;
        }
        const fromNext = nextRes.ok
          ? parseAutoshopJobCardNextNumber(nextRes.data)
          : { nextNumber: DEFAULT_ESTIMATE_NUMBERING.number, prefix: "" };
        const prefix = prefixRes.ok
          ? parseAutoshopJobCardPrefix(prefixRes.data) || fromNext.prefix
          : fromNext.prefix;
        setEstimateNumbering({
          code: prefix,
          number: fromNext.nextNumber || DEFAULT_ESTIMATE_NUMBERING.number,
        });
        if (prefix) setJobCardPrefix(prefix);
      } catch {
        if (!cancelled) toast.error("Could not load estimate numbering.");
      } finally {
        if (!cancelled) setEstimatePrefixLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [manageEstimatesOpen, token]);

  const saveEstimatePrefix = async (values: NumberingValues): Promise<boolean> => {
    if (!token) {
      toast.error("Sign in to update estimate numbering.");
      return false;
    }
    const businessProfileId = (business?._id ?? business?.id ?? "").trim();
    if (!businessProfileId) {
      toast.error("Business profile not loaded. Try again in a moment.");
      return false;
    }
    const prefix = values.code.trim();
    const newSeq = Number.parseInt(values.number.trim(), 10);
    if (!Number.isInteger(newSeq) || newSeq < 1) {
      toast.error("Estimate Number must be a positive whole number.");
      return false;
    }

    const [prefixRes, seqRes] = await Promise.all([
      updateAutoshopJobCardPrefix(token, prefix),
      updateAutoshopJobCardSeq(token, { businessProfileId, newSeq }),
    ]);
    if (!prefixRes.ok) {
      toast.error(apiMessageFromEnvelope(prefixRes.data) || "Could not update estimate code.");
      return false;
    }
    if (!seqRes.ok) {
      toast.error(apiMessageFromEnvelope(seqRes.data) || "Could not update estimate number.");
      return false;
    }

    const parsedNext = parseAutoshopJobCardNextNumber(seqRes.data);
    const next = {
      code: prefix || parsedNext.prefix,
      number: parsedNext.nextNumber || String(newSeq),
    };
    setEstimateNumbering(next);
    if (next.code) setJobCardPrefix(next.code);
    return true;
  };

  useEffect(() => {
    setPage(1);
  }, [search, section]);

  useEffect(() => {
    setSelectedJobCardIds(new Set());
  }, [search, section, page]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const toggleJobCardSelection = (id: string) => {
    setSelectedJobCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleJobCardPageSelection = (ids: string[], checked: boolean) => {
    setSelectedJobCardIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  const selectedJobCards = useMemo(
    () => jobCardsMatchingSelection(selectedJobCardIds, filteredListCards),
    [selectedJobCardIds, filteredListCards],
  );

  const deletableSelectedJobCards = useMemo(
    () => selectedJobCards.filter((row) => !isJobCardApproved(row)),
    [selectedJobCards],
  );

  const canBulkDelete = hasBulkSelection && deletableSelectedJobCards.length > 0;

  const convertibleSelectedJobCards = useMemo(
    () => selectedJobCards.filter(isEligibleForInvoiceConversion),
    [selectedJobCards],
  );

  const cashPayableSelectedJobCards = useMemo(
    () => selectedJobCards.filter(isEligibleForCashPayment),
    [selectedJobCards],
  );

  const canBulkConvertToInvoice = convertibleSelectedJobCards.length > 0;
  const canBulkPaidByCash = cashPayableSelectedJobCards.length > 0;

  const showConvertToInvoiceButton = section !== "paid" && section !== "convert-invoice";
  const showPaidByCashButton = section === "approvals" || section === "my-list";
  const showDeleteButton = section === "my-list";

  const runBulkAction = async (
    label: string,
    action: (row: JobCardListRow) => Promise<boolean>,
  ) => {
    if (!hasBulkSelection || bulkBusy || !token) return;
    const rows = selectedJobCards;
    if (rows.length === 0) return;

    setBulkBusy(true);
    let failed = 0;
    try {
      for (const row of rows) {
        const ok = await action(row);
        if (!ok) failed += 1;
      }
      await refresh();
      setSelectedJobCardIds(new Set());
      if (failed > 0) {
        toast.error(`${label} failed for ${failed} job card${failed === 1 ? "" : "s"}.`);
      } else {
        toast.success(`${label} completed for ${rows.length} job card${rows.length === 1 ? "" : "s"}.`);
      }
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!canBulkDelete || bulkBusy) return;
    const rows = deletableSelectedJobCards;
    const skipped = selectedJobCards.length - rows.length;
    const count = rows.length;
    const confirmMessage =
      skipped > 0
        ? `Delete ${count} selected job card${count === 1 ? "" : "s"}? (${skipped} approved job card${skipped === 1 ? "" : "s"} will be skipped.)`
        : `Delete ${count} selected job card${count === 1 ? "" : "s"}?`;
    if (!window.confirm(confirmMessage)) return;

    setBulkBusy(true);
    let failed = 0;
    try {
      for (const row of rows) {
        const jobCardNo = pickJobCardNoForApi(row);
        if (!jobCardNo) {
          failed += 1;
          continue;
        }
        const res = await deleteAutoshopJobCard(token!, jobCardNo);
        if (!res.ok) failed += 1;
      }
      await refresh();
      setSelectedJobCardIds(new Set());
      if (failed > 0) {
        toast.error(`Delete failed for ${failed} job card${failed === 1 ? "" : "s"}.`);
      } else if (skipped > 0) {
        toast.success(
          `Deleted ${count} job card${count === 1 ? "" : "s"}. Approved job cards were not deleted.`,
        );
      } else {
        toast.success(`Deleted ${count} job card${count === 1 ? "" : "s"}.`);
      }
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkSend = async () => {
    await runBulkAction("Send", async (row) => {
      const jobCardNo = pickJobCardNoForApi(row);
      if (!jobCardNo) return false;
      const res = await sendAutoshopJobCardForApproval(token!, jobCardNo);
      return res.ok;
    });
  };

  const handleBulkConvertToInvoice = () => {
    const eligible = convertibleSelectedJobCards;
    if (eligible.length === 0) {
      toast.info("Only approved, unpaid job cards can be converted to invoice.");
      return;
    }
    if (eligible.length > 1) {
      toast.info("Select one job card to preview the invoice before converting.");
      return;
    }
    const row = eligible[0];
    setDetailJobCardId(row.id);
    setDetailListRow(row);
    setActionPreviewMode("invoice");
    setView("detail");
  };

  const handleBulkPaidByCash = () => {
    const eligible = cashPayableSelectedJobCards;
    if (eligible.length === 0) {
      toast.info("Only approved, unpaid job cards can be marked paid by cash.");
      return;
    }
    if (eligible.length > 1) {
      toast.info("Select one job card to preview before marking as paid by cash.");
      return;
    }
    const row = eligible[0];
    setDetailJobCardId(row.id);
    setDetailListRow(row);
    setActionPreviewMode("cash");
    setView("detail");
  };

  const refreshLists = () => {
    void refresh();
  };

  const openJobCardDetail = (jc: JobCardListRow) => {
    setDetailJobCardId(jc.id);
    setDetailListRow(jc);
    setActionPreviewMode(null);
    setView("detail");
  };

  const openJobCard = (jc: JobCardListRow) => {
    if (!isJobCardEditable(jc)) {
      toast.info("This job card cannot be edited.");
      return;
    }
    setFormMode("edit");
    setEditJobCardId(jc.id);
    setEditJobCardNo(pickJobCardNoForApi(jc));
    setEditListRow(jc);
    setView("form");
  };

  const openJobCardFromPreview = (jc: JobCardListRow) => {
    setFormMode("edit");
    setEditJobCardId(jc.id);
    setEditJobCardNo(pickJobCardNoForApi(jc));
    setEditListRow(jc);
    setActionPreviewMode(null);
    setDetailJobCardId(null);
    setDetailListRow(null);
    setView("form");
  };

  const openNewJobCard = () => {
    setSection("my-list");
    setFormMode("add");
    setEditJobCardId(null);
    setEditJobCardNo(null);
    setEditListRow(null);
    setView("form");
  };

  const showList = () => {
    setView("list");
    setEditJobCardId(null);
    setEditJobCardNo(null);
    setEditListRow(null);
    setDetailJobCardId(null);
    setDetailListRow(null);
    setActionPreviewMode(null);
  };

  const handleJobCardSaved = (
    jobCardId?: string,
    jobCardNo?: string,
    jobRecord?: Record<string, unknown>,
  ) => {
    void refreshLists();
    if (jobCardId) {
      setDetailJobCardId(jobCardId);
      const rows = jobRecord
        ? parseJobCardsFromPagePayload({ success: true, data: [jobRecord] })
        : [];
      const row: JobCardListRow =
        rows[0] ??
        (jobCardNo?.trim()
          ? { id: jobCardId, raw: jobRecord ?? { jobNo: jobCardNo.trim() }, jobNo: jobCardNo.trim() }
          : { id: jobCardId, raw: jobRecord ?? {} });
      setDetailListRow(row);
      setEditJobCardId(null);
      setEditJobCardNo(null);
      setEditListRow(null);
      setActionPreviewMode(null);
      setView("detail");
      return;
    }
    showList();
  };

  const selectSection = (id: string) => {
    if (id === "my-list" || id === "approvals" || id === "convert-invoice" || id === "paid") {
      setSection(id);
      showList();
    }
  };

  return (
    <>
      <ShopPageShell
        title="Job Cards"
        pageHeading={pageHeading}
        metaTitle="Job Cards | AutoDaddy"
        metaDescription="Auto shop job cards"
        sidebarVariant="nav"
        sidebarItems={JOB_CARD_SECTIONS}
        activeSidebarId={activeSidebarId}
        onSidebarSelect={selectSection}
        sidebarFooter={sidebarFooter}
        heroBackgroundImage={false}
        contentTopOffset
        heroCardFlush
        onFaqsOpen={() => setFaqsOpen(true)}
        onFaqsClose={() => setFaqsOpen(false)}
        faqsOpen={faqsOpen}
        faqsHeading={faqsHeading}
        faqsDescription={faqsDescription}
      >
      <div className="space-y-1">
        <ShopReveal show={view === "form"} clipOverflow={false}>
          <div className="space-y-2">
            <div className="flex items-center">
              <button
                type="button"
                onClick={showList}
                className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                aria-label="Back to job cards"
              >
                {"<<"}
              </button>
            </div>
            <JobCardForm
              active={view === "form"}
              mode={formMode}
              jobCardId={editJobCardId}
              jobCardNo={editJobCardNo}
              initialJobRecord={
                editListRow?.raw && typeof editListRow.raw === "object"
                  ? (editListRow.raw as Record<string, unknown>)
                  : null
              }
              onCancel={showList}
              onSaved={handleJobCardSaved}
            />
          </div>
        </ShopReveal>

        <ShopReveal show={view === "detail" && detailJobCardId != null}>
          {detailJobCardId ? (
            <ShopJobCardEstimateView
              key={detailJobCardId}
              jobCardId={detailJobCardId}
              listRow={detailListRow}
              jobNoHint={detailListRow ? pickJobNoFromListRow(detailListRow) ?? null : null}
              initialActionPreview={actionPreviewMode}
              onBack={showList}
              onEdit={detailListRow ? () => openJobCardFromPreview(detailListRow) : undefined}
              onActionPreviewChange={setActionPreviewMode}
              onConverted={() => {
                setActionPreviewMode(null);
                setSelectedJobCardIds(new Set());
                void refreshLists();
              }}
              onCashPaid={() => {
                setActionPreviewMode(null);
                setSelectedJobCardIds(new Set());
                void refreshLists();
              }}
            />
          ) : null}
        </ShopReveal>

        {view === "list" ? (
          <>
            <JobCardsSearchBar
              value={search}
              onChange={setSearch}
              leading={
                hasBulkSelection ? (
                  <>
                    {showDeleteButton ? (
                      <button
                        type="button"
                        onClick={() => void handleBulkDelete()}
                        disabled={!canBulkDelete || bulkBusy}
                        className={SHOP_JOB_CARD_BULK_BUTTON_CLASS}
                      >
                        Delete
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void handleBulkSend()}
                      disabled={bulkBusy}
                      className={SHOP_JOB_CARD_BULK_BUTTON_CLASS}
                    >
                      Send
                    </button>
                    {showPaidByCashButton && canBulkPaidByCash ? (
                      <button
                        type="button"
                        onClick={handleBulkPaidByCash}
                        disabled={bulkBusy}
                        className={SHOP_JOB_CARD_BULK_BUTTON_CLASS}
                      >
                        Paid by Cash
                      </button>
                    ) : null}
                    {showConvertToInvoiceButton && canBulkConvertToInvoice ? (
                      <button
                        type="button"
                        onClick={handleBulkConvertToInvoice}
                        disabled={bulkBusy}
                        className={SHOP_JOB_CARD_BULK_BUTTON_CLASS}
                      >
                        Convert to Invoice
                      </button>
                    ) : null}
                  </>
                ) : null
              }
              trailing={
                section === "my-list" ? <AddNewButton onClick={openNewJobCard} /> : null
              }
            />

            {loading ? (
              <ShopListSkeleton variant="profile-table" className="w-full" />
            ) : error ? (
              <ShopErrorPanel message={error} onRetry={() => void refreshLists()} />
            ) : (
              <>
                <JobCardListTable
                  rows={paginatedList}
                  countryCode="+1"
                  jobCardPrefix={jobCardPrefix}
                  onEdit={openJobCard}
                  onView={openJobCardDetail}
                  selectedIds={selectedJobCardIds}
                  onToggleRow={toggleJobCardSelection}
                  onTogglePage={toggleJobCardPageSelection}
                  showStatusColumn
                  showInvoiceColumn={section === "convert-invoice"}
                  showActions={section !== "approvals" && section !== "paid"}
                />

                <ShopListFooter>
                  <p>{filteredListCards.length} Entries</p>
                  {totalPages > 1 ? (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => {
                        const isActive = pageNumber === safePage;
                        return (
                          <button
                            key={pageNumber}
                            type="button"
                            onClick={() => setPage(pageNumber)}
                            className={`flex h-8 min-w-8 items-center justify-center rounded-sm px-2 text-sm font-bold ${
                              isActive
                                ? "bg-gray-500 text-white"
                                : "border border-gray-400 bg-white text-gray-700 hover:bg-gray-100"
                            }`}
                            aria-current={isActive ? "page" : undefined}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </ShopListFooter>
              </>
            )}
          </>
        ) : null}
      </div>
      </ShopPageShell>

      <ShopManageNumberingDialog
        open={manageEstimatesOpen}
        kind="estimate"
        initial={estimateNumbering}
        loading={estimatePrefixLoading}
        onClose={() => setManageEstimatesOpen(false)}
        onSave={saveEstimatePrefix}
      />
    </>
  );
}
