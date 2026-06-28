import { useEffect, useMemo, useState } from "react";
import { FiEdit2 } from "react-icons/fi";
import { motion } from "framer-motion";
import JobCardForm from "../../components/JobCard/JobCardForm";
import {
  ADMIN_PANEL_THEAD_ROW_CLASS,
  adminPanelRowClass,
  adminPanelTableClasses,
  type AdminPanelTableClasses,
} from "../../components/admin/adminPanelTableStyles";
import { shopAddNewButtonClass } from "../../components/shop/forms/ShopFormPage";
import ShopPageShell from "../../components/shop/ShopPageShell";
import { ShopListSkeleton } from "../../components/shop/ShopListSkeletons";
import { ShopErrorPanel, ShopListFooter } from "../../components/shop/ShopPanels";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { useShopJobCards } from "../../hooks/useShopJobCards";
import { formatCurrencyAmount } from "../../lib/currency";
import { formatPhoneLabel } from "../../lib/phoneFormat";
import useAuth from "../../auth/useAuth";
import type { JobCardListRow } from "../../lib/shopOwnerJobCards";

const PAGE_SIZE = 10;
const JOB_CARDS_SEARCH_INPUT_ID = "shop-job-cards-search";

const JOB_CARD_SECTIONS = [
  { id: "list", label: "Job Card List", variant: "primary" as const },
  { id: "create", label: "Create New Job Card", variant: "primary" as const },
];

const SHOP_TABLE_BASE = adminPanelTableClasses(true);
const SHOP_TABLE: AdminPanelTableClasses = {
  ...SHOP_TABLE_BASE,
  th: SHOP_TABLE_BASE.th.replace("px-2", "px-4"),
  thCheckbox: SHOP_TABLE_BASE.thCheckbox.replace("px-2", "px-4"),
  td: SHOP_TABLE_BASE.td.replace("px-2", "px-4"),
  tdCheckbox: SHOP_TABLE_BASE.tdCheckbox.replace("px-2", "px-4"),
};

const SHOP_TABLE_HEAD_TH_CLASS = `${SHOP_TABLE.th} h-9 py-0 align-middle`;
const SHOP_TABLE_BODY_TD_CLASS = `${SHOP_TABLE.td} h-9 py-0 align-middle whitespace-nowrap`;

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
  const formatted = formatCurrencyAmount(total, countryCode, { fallback: "—" });
  if (formatted === "—") return formatted;
  const match = /^([^\d]+)(.+)$/.exec(formatted);
  if (match) {
    return `${match[1].trim()} ${match[2].trim()}`;
  }
  return formatted;
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
  trailing,
}: {
  value: string;
  onChange: (value: string) => void;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-9 shrink-0 flex-wrap items-center justify-between gap-2 py-1.5 sm:gap-3">
      <div className="flex items-center gap-2" />
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

function JobCardListTable({
  rows,
  countryCode,
  onEdit,
}: {
  rows: JobCardListRow[];
  countryCode: string | null | undefined;
  onEdit: (jobCard: JobCardListRow) => void;
}) {
  const editHeadClass = `${SHOP_TABLE_HEAD_TH_CLASS} text-center`;

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
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Job No.</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Customer</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Phone</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Plate</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Total</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Date</th>
              <th className={editHeadClass}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((jc, index) => {
              const customerName = jc.customerName?.trim() || "—";
              return (
                <tr key={jc.id} className={adminPanelRowClass(index)}>
                  <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-blue-700`}>
                    {displayJobId(jc.jobNo)}
                  </td>
                  <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-blue-700`}>
                    {customerName}
                  </td>
                  <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-gray-800`}>
                    {formatPhoneLabel(jc.phone)}
                  </td>
                  <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-gray-800`}>
                    {jc.vehiclePlate?.trim() || "—"}
                  </td>
                  <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-gray-800`}>
                    {formatJobPrice(jc.total, countryCode)}
                  </td>
                  <td className={SHOP_TABLE_BODY_TD_CLASS}>{jc.date ?? "—"}</td>
                  <td className={`${SHOP_TABLE_BODY_TD_CLASS} text-center`}>
                    <button
                      type="button"
                      title={`Edit job ${displayJobId(jc.jobNo)}`}
                      aria-label={`Edit job ${displayJobId(jc.jobNo)}`}
                      onClick={() => onEdit(jc)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded text-blue-600 hover:text-ad-purple"
                    >
                      <FiEdit2 size={13} aria-hidden />
                    </button>
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
  const { session } = useAuth();
  const { faqsHeading, faqsDescription } = useShopOwnerPortal();
  const [search, setSearch] = useState("");
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"list" | "form">("list");
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editJobCardId, setEditJobCardId] = useState<string | null>(null);
  const { cards, loading, error, refresh } = useShopJobCards(search);

  const totalPages = Math.max(1, Math.ceil(cards.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paginatedList = useMemo(
    () => cards.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [cards, safePage],
  );

  const pageHeading =
    view === "form" && formMode === "add"
      ? "Create New Job Card"
      : view === "form" && formMode === "edit"
        ? "Edit Job Card"
        : "Job Card List";

  const activeSidebarId =
    view === "list" ? "list" : view === "form" && formMode === "add" ? "create" : null;

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

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
  };

  const selectSection = (id: string) => {
    if (id === "list") showList();
    else if (id === "create") openNewJobCard();
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
        {view === "form" ? (
          <JobCardForm
            active
            mode={formMode}
            jobCardId={editJobCardId}
            onCancel={showList}
            onSaved={() => void refresh()}
          />
        ) : (
          <>
            <JobCardsSearchBar
              value={search}
              onChange={setSearch}
              trailing={<AddNewButton onClick={openNewJobCard} />}
            />

            {loading ? (
              <ShopListSkeleton variant="profile-table" className="w-full" />
            ) : error ? (
              <ShopErrorPanel message={error} onRetry={() => void refresh()} />
            ) : cards.length === 0 ? (
              <p className="text-center text-sm text-gray-600">No job cards yet.</p>
            ) : (
              <>
                <JobCardListTable
                  rows={paginatedList}
                  countryCode={session?.meta?.countryCode}
                  onEdit={openJobCard}
                />

                <ShopListFooter className="text-sm font-semibold text-gray-600">
                  <p>{cards.length} Entries</p>
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
        )}
      </div>
    </ShopPageShell>
  );
}
