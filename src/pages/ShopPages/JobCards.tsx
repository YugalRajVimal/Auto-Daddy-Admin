import { useEffect, useMemo, useRef, useState } from "react";
import { FiEdit2 } from "react-icons/fi";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import JobCardForm from "../../components/JobCard/JobCardForm";
import ShopJobCardEstimateView from "../../components/JobCard/ShopJobCardEstimateView";
import { pickJobNoFromListRow } from "../../components/JobCard/shopJobCardEstimate";
import {
  ADMIN_PANEL_THEAD_ROW_CLASS,
  adminPanelRowClass,
  adminPanelTableClasses,
  type AdminPanelTableClasses,
} from "../../components/admin/adminPanelTableStyles";
import { shopAddNewButtonClass } from "../../components/shop/forms/ShopFormPage";
import { ShopReveal } from "../../components/shop/ShopAnimated";
import ShopPageShell from "../../components/shop/ShopPageShell";
import { ShopListSkeleton } from "../../components/shop/ShopListSkeletons";
import { ShopErrorPanel, ShopListFooter } from "../../components/shop/ShopPanels";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { useShopJobCards } from "../../hooks/useShopJobCards";
import { useShopWallet } from "../../hooks/useShopWallet";
import { formatCurrencyAmount } from "../../lib/currency";
import { formatPhoneWithCountryCode } from "../../lib/phoneFormat";
import {
  deleteJobCard,
  markJobCardPaymentInvoice,
  resendJobCardNotification,
} from "../../lib/shopOwnerMutations";
import {
  isJobCardPending,
  jobCardStatusLabel,
  type JobCardListRow,
} from "../../lib/shopOwnerJobCards";
import { getWalletLedgerTab } from "../../lib/shopOwnerWallet";
import useAuth from "../../auth/useAuth";

type JobCardSection = "my-list" | "approvals" | "convert-invoice" | "paid";
type JobCardView = "list" | "form" | "detail";

const PAGE_SIZE = 10;
const JOB_CARDS_SEARCH_INPUT_ID = "shop-job-cards-search";

const JOB_CARD_SECTIONS = [
  { id: "my-list", label: "My Job Cards", variant: "primary" as const },
  { id: "approvals", label: "Approvals", variant: "primary" as const },
  { id: "convert-invoice", label: "Convert to Invoice", variant: "primary" as const },
  { id: "paid", label: "Paid Jobs", variant: "primary" as const },
];

const SECTION_HEADINGS: Record<JobCardSection, string> = {
  "my-list": "My Job Cards",
  approvals: "Approvals",
  "convert-invoice": "Convert to Invoice",
  paid: "Paid Jobs",
};

const EMPTY_MESSAGES: Record<JobCardSection, string> = {
  "my-list": "No job cards yet.",
  approvals: "No job cards awaiting approval.",
  "convert-invoice": "No cash job cards to convert to invoice.",
  paid: "No paid job cards yet.",
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

function displayJobId(jobNo: string | undefined): string {
  const raw = (jobNo ?? "").trim().replace(/^#/, "");
  if (!raw) return "—";
  const stripped = raw.replace(/^job\s*#?\s*/i, "").trim();
  if (!stripped) return "—";
  if (/^j/i.test(stripped)) {
    return stripped.replace(/^j/i, "J ");
  }
  return `J ${stripped}`;
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
  const haystack = [row.customerName, row.phone, row.vehiclePlate, row.jobNo]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function usesJobCardApiSearch(section: JobCardSection): boolean {
  return section === "my-list" || section === "approvals";
}

function isConvertToInvoiceJob(row: JobCardListRow): boolean {
  const paymentStatus = (row.paymentStatus ?? "").trim().toLowerCase();
  if (paymentStatus === "paid") return false;
  if (row.unpaid === false) return false;
  return getWalletLedgerTab(row.raw) === "cash";
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
    <div className="flex min-h-9 shrink-0 flex-wrap items-center justify-between gap-2 py-1.5 sm:gap-3">
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
  onEdit,
  onView,
  selectedIds,
  onToggleRow,
  onTogglePage,
  showStatus = false,
}: {
  rows: JobCardListRow[];
  countryCode: string | null | undefined;
  onEdit: (jobCard: JobCardListRow) => void;
  onView: (jobCard: JobCardListRow) => void;
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onTogglePage: (ids: string[], checked: boolean) => void;
  showStatus?: boolean;
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
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Customer</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Phone</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Plate</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Total</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Date</th>
              <th className={editHeadClass}>{showStatus ? "Status" : "Actions"}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((jc, index) => {
              const customerName = jc.customerName?.trim() || "—";
              return (
                <tr key={jc.id} className={adminPanelRowClass(index)}>
                  <td className={SHOP_TABLE_BODY_TD_CHECKBOX_CLASS}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(jc.id)}
                      onChange={() => onToggleRow(jc.id)}
                      aria-label={`Select job ${displayJobId(jc.jobNo)}`}
                      className={SHOP_TABLE_CHECKBOX_CLASS}
                    />
                  </td>
                  <td className={SHOP_TABLE_BODY_TD_CLASS}>
                    <button
                      type="button"
                      onClick={() => onView(jc)}
                      className="font-semibold text-blue-700 underline hover:text-blue-800"
                    >
                      {displayJobId(jc.jobNo)}
                    </button>
                  </td>
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
                  <td className={SHOP_TABLE_BODY_TD_CLASS}>{jc.date ?? "—"}</td>
                  <td className={`${SHOP_TABLE_BODY_TD_CLASS} text-center`}>
                    {showStatus ? (
                      <span className="font-semibold text-blue-700">{jobCardStatusLabel(jc)}</span>
                    ) : (
                      <button
                        type="button"
                        title={`Edit job ${displayJobId(jc.jobNo)}`}
                        aria-label={`Edit job ${displayJobId(jc.jobNo)}`}
                        onClick={() => onEdit(jc)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded text-blue-600 hover:text-ad-purple"
                      >
                        <FiEdit2 size={13} aria-hidden />
                      </button>
                    )}
                  </td>
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
  const { session, token } = useAuth();
  const { faqsHeading, faqsDescription } = useShopOwnerPortal();
  const [section, setSection] = useState<JobCardSection>("my-list");
  const [search, setSearch] = useState("");
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<JobCardView>("list");
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editJobCardId, setEditJobCardId] = useState<string | null>(null);
  const [detailJobCardId, setDetailJobCardId] = useState<string | null>(null);
  const [detailListRow, setDetailListRow] = useState<JobCardListRow | null>(null);
  const [selectedJobCardIds, setSelectedJobCardIds] = useState<Set<string>>(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const {
    cards: jobCards,
    loading: jobCardsLoading,
    error: jobCardsError,
    refresh: refreshJobCards,
  } = useShopJobCards(usesJobCardApiSearch(section) ? search : "");
  const {
    paid,
    unpaid,
    loading: walletLoading,
    error: walletError,
    refresh: refreshWallet,
  } = useShopWallet();

  const listCards = useMemo(() => {
    const filterSearch = (rows: JobCardListRow[]) =>
      usesJobCardApiSearch(section)
        ? rows
        : search.trim()
          ? rows.filter((row) => matchesJobCardSearch(row, search))
          : rows;

    if (section === "my-list") {
      return filterSearch(jobCards);
    }
    if (section === "approvals") {
      return filterSearch(jobCards.filter(isJobCardPending));
    }
    if (section === "convert-invoice") {
      return filterSearch(unpaid.filter(isConvertToInvoiceJob));
    }
    return filterSearch(paid);
  }, [section, jobCards, paid, unpaid, search]);

  const loading =
    section === "my-list" || section === "approvals" ? jobCardsLoading : walletLoading;
  const error = section === "my-list" || section === "approvals" ? jobCardsError : walletError;

  const totalPages = Math.max(1, Math.ceil(listCards.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paginatedList = useMemo(
    () => listCards.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [listCards, safePage],
  );

  const pageHeading =
    view === "detail"
      ? "Job Card"
      : view === "form" && formMode === "add"
      ? "Create New Job Card"
      : view === "form" && formMode === "edit"
        ? "Edit Job Card"
        : SECTION_HEADINGS[section];

  const activeSidebarId = view === "list" ? section : null;

  const hasBulkSelection = selectedJobCardIds.size > 0;

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
    () => jobCardsMatchingSelection(selectedJobCardIds, listCards),
    [selectedJobCardIds, listCards],
  );

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
    if (!hasBulkSelection || bulkBusy) return;
    const count = selectedJobCards.length;
    if (!window.confirm(`Delete ${count} selected job card${count === 1 ? "" : "s"}?`)) return;
    await runBulkAction("Delete", async (row) => {
      const res = await deleteJobCard(token!, row.id);
      return res.ok;
    });
  };

  const handleBulkSend = async () => {
    await runBulkAction("Send", async (row) => {
      const res = await resendJobCardNotification(token!, row.id);
      return res.ok;
    });
  };

  const handleBulkConvertToInvoice = async () => {
    const eligible = selectedJobCards.filter(isConvertToInvoiceJob);
    if (eligible.length === 0) {
      toast.info("Selected job cards are not eligible to convert to invoice.");
      return;
    }
    if (!token || bulkBusy) return;
    setBulkBusy(true);
    let failed = 0;
    try {
      for (const row of eligible) {
        const res = await markJobCardPaymentInvoice(token, row.id);
        if (!res.ok) failed += 1;
      }
      await refresh();
      setSelectedJobCardIds(new Set());
      if (failed > 0) {
        toast.error(`Convert to invoice failed for ${failed} job card${failed === 1 ? "" : "s"}.`);
      } else {
        toast.success(
          `Converted ${eligible.length} job card${eligible.length === 1 ? "" : "s"} to invoice.`,
        );
      }
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkPrint = () => {
    if (!hasBulkSelection) return;
    window.print();
  };

  const refresh = () => {
    void refreshJobCards();
    void refreshWallet();
  };

  const openJobCardDetail = (jc: JobCardListRow) => {
    setDetailJobCardId(jc.id);
    setDetailListRow(jc);
    setView("detail");
  };

  const openJobCard = (jc: JobCardListRow) => {
    setFormMode("edit");
    setEditJobCardId(jc.id);
    setView("form");
  };

  const openNewJobCard = () => {
    setFormMode("add");
    setEditJobCardId(null);
    setView("form");
  };

  const showList = () => {
    setView("list");
    setEditJobCardId(null);
    setDetailJobCardId(null);
    setDetailListRow(null);
  };

  const handleJobCardSaved = (jobCardId?: string, jobCardNo?: string) => {
    void refresh();
    if (jobCardId) {
      setDetailJobCardId(jobCardId);
      setDetailListRow(
        jobCardNo?.trim()
          ? { id: jobCardId, raw: { jobNo: jobCardNo.trim() }, jobNo: jobCardNo.trim() }
          : { id: jobCardId, raw: {} },
      );
      setEditJobCardId(null);
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
    <ShopPageShell
      title="Job Cards"
      pageHeading={pageHeading}
      metaTitle="Job Cards | AutoDaddy"
      metaDescription="Auto shop job cards"
      sidebarVariant="nav"
      sidebarItems={JOB_CARD_SECTIONS}
      activeSidebarId={activeSidebarId}
      onSidebarSelect={selectSection}
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
        <ShopReveal show={view === "form"}>
          <JobCardForm
            active={view === "form"}
            mode={formMode}
            jobCardId={editJobCardId}
            onCancel={showList}
            onSaved={handleJobCardSaved}
          />
        </ShopReveal>

        <ShopReveal show={view === "detail" && detailJobCardId != null}>
          {detailJobCardId ? (
            <ShopJobCardEstimateView
              key={detailJobCardId}
              jobCardId={detailJobCardId}
              listRow={detailListRow}
              jobNoHint={detailListRow ? pickJobNoFromListRow(detailListRow) ?? null : null}
              onBack={showList}
            />
          ) : null}
        </ShopReveal>

        {view === "list" ? (
          <>
            <JobCardsSearchBar
              value={search}
              onChange={setSearch}
              leading={
                <>
                  <button
                    type="button"
                    onClick={() => void handleBulkDelete()}
                    disabled={!hasBulkSelection || bulkBusy}
                    className={SHOP_JOB_CARD_BULK_BUTTON_CLASS}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkPrint}
                    disabled={!hasBulkSelection || bulkBusy}
                    className={SHOP_JOB_CARD_BULK_BUTTON_CLASS}
                  >
                    Print
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleBulkSend()}
                    disabled={!hasBulkSelection || bulkBusy}
                    className={SHOP_JOB_CARD_BULK_BUTTON_CLASS}
                  >
                    Send
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleBulkConvertToInvoice()}
                    disabled={!hasBulkSelection || bulkBusy}
                    className={SHOP_JOB_CARD_BULK_BUTTON_CLASS}
                  >
                    Convert to Invoice
                  </button>
                </>
              }
              trailing={
                section === "my-list" ? <AddNewButton onClick={openNewJobCard} /> : null
              }
            />

            {loading ? (
              <ShopListSkeleton variant="profile-table" className="w-full" />
            ) : error ? (
              <ShopErrorPanel message={error} onRetry={() => void refresh()} />
            ) : listCards.length === 0 ? (
              <p className="text-center text-sm text-gray-600">{EMPTY_MESSAGES[section]}</p>
            ) : (
              <>
                <JobCardListTable
                  rows={paginatedList}
                  countryCode={session?.meta?.countryCode}
                  onEdit={openJobCard}
                  onView={openJobCardDetail}
                  selectedIds={selectedJobCardIds}
                  onToggleRow={toggleJobCardSelection}
                  onTogglePage={toggleJobCardPageSelection}
                  showStatus={section === "approvals"}
                />

                <ShopListFooter className="text-sm font-semibold text-gray-600">
                  <p>{listCards.length} Entries</p>
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
  );
}
