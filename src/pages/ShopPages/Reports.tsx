import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ADMIN_PANEL_THEAD_ROW_CLASS,
  adminPanelRowClass,
  adminPanelTableClasses,
  type AdminPanelTableClasses,
} from "../../components/admin/adminPanelTableStyles";
import ShopPageShell from "../../components/shop/ShopPageShell";
import { ShopListSkeleton } from "../../components/shop/ShopListSkeletons";
import { ShopErrorPanel, ShopListFooter, ShopRefreshButton } from "../../components/shop/ShopPanels";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { useShopPayments } from "../../hooks/useShopPayments";

const PAGE_SIZE = 10;
const REPORTS_SEARCH_INPUT_ID = "shop-reports-search";

type ReportSection = "ticket-raised" | "resolved";

const REPORT_SECTIONS = [
  { id: "ticket-raised", label: "Ticket Raised", variant: "primary" as const },
  { id: "resolved", label: "Resolved", variant: "primary" as const },
];

const SECTION_HEADINGS: Record<ReportSection, string> = {
  "ticket-raised": "Ticket Raised",
  resolved: "Resolved",
};

const EMPTY_MESSAGES: Record<ReportSection, string> = {
  "ticket-raised": "No open payment records.",
  resolved: "No resolved payment records.",
};

const SHOP_TABLE_BASE = adminPanelTableClasses(true);
const SHOP_TABLE: AdminPanelTableClasses = {
  ...SHOP_TABLE_BASE,
  th: SHOP_TABLE_BASE.th.replace("px-2", "px-4"),
  td: SHOP_TABLE_BASE.td.replace("px-2", "px-4"),
};

const SHOP_TABLE_HEAD_TH_CLASS = `${SHOP_TABLE.th} h-9 py-0 align-middle`;
const SHOP_TABLE_BODY_TD_CLASS = `${SHOP_TABLE.td} h-9 py-0 align-middle whitespace-nowrap`;

function pickField(row: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return "—";
}

function rowId(row: Record<string, unknown>, index: number): string {
  const id = pickField(row, ["_id", "id"]);
  return id !== "—" ? id : `row-${index}`;
}

function isResolvedRow(row: Record<string, unknown>): boolean {
  const status = pickField(row, ["status", "paymentStatus", "state"]).toLowerCase();
  return status.includes("paid") || status.includes("complete") || status.includes("resolved");
}

function matchesReportSearch(row: Record<string, unknown>, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    pickField(row, ["type", "category", "paymentMethod"]),
    pickField(row, ["description", "title", "customerName", "name"]),
    pickField(row, ["date", "createdAt", "paymentDate"]),
    pickField(row, ["amount", "total", "price"]),
    pickField(row, ["status", "paymentStatus", "state"]),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function ReportsSearchBar({
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
      <div className="flex flex-wrap items-center gap-2" />
      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <input
          id={REPORTS_SEARCH_INPUT_ID}
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

function ReportsListTable({ rows }: { rows: Record<string, unknown>[] }) {
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
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Type</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Description</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Date</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Amount</th>
              <th className={SHOP_TABLE_HEAD_TH_CLASS}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={rowId(row, index)} className={adminPanelRowClass(index)}>
                <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-blue-700`}>
                  {pickField(row, ["type", "category", "paymentMethod"])}
                </td>
                <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-gray-800`}>
                  {pickField(row, ["description", "title", "customerName", "name"])}
                </td>
                <td className={SHOP_TABLE_BODY_TD_CLASS}>
                  {pickField(row, ["date", "createdAt", "paymentDate"])}
                </td>
                <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-gray-800`}>
                  {pickField(row, ["amount", "total", "price"])}
                </td>
                <td className={`${SHOP_TABLE_BODY_TD_CLASS} font-semibold text-blue-700`}>
                  {pickField(row, ["status", "paymentStatus", "state"])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

export default function ShopReportsPage() {
  const { faqsHeading, faqsDescription } = useShopOwnerPortal();
  const [activeId, setActiveId] = useState<ReportSection>("ticket-raised");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [faqsOpen, setFaqsOpen] = useState(false);
  const { rows, loading, error, refresh } = useShopPayments();

  const filtered = useMemo(() => {
    const sectionRows = rows.filter((row) =>
      activeId === "resolved" ? isResolvedRow(row) : !isResolvedRow(row),
    );
    return search.trim()
      ? sectionRows.filter((row) => matchesReportSearch(row, search))
      : sectionRows;
  }, [rows, activeId, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paginatedList = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );

  useEffect(() => {
    setPage(1);
  }, [search, activeId]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <ShopPageShell
      title="Reports"
      pageHeading={SECTION_HEADINGS[activeId]}
      metaTitle="Reports | AutoDaddy"
      metaDescription="Auto shop reports and payments"
      sidebarVariant="nav"
      sidebarItems={REPORT_SECTIONS}
      activeSidebarId={activeId}
      onSidebarSelect={(id) => setActiveId(id as ReportSection)}
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
        <ReportsSearchBar
          value={search}
          onChange={setSearch}
          trailing={<ShopRefreshButton onClick={() => void refresh()} />}
        />

        {loading ? (
          <ShopListSkeleton variant="profile-table" className="w-full" />
        ) : error ? (
          <ShopErrorPanel message={error} onRetry={() => void refresh()} />
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-gray-600">{EMPTY_MESSAGES[activeId]}</p>
        ) : (
          <>
            <ReportsListTable rows={paginatedList} />

            <ShopListFooter className="text-sm font-semibold text-gray-600">
              <p>{filtered.length} Entries</p>
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
      </div>
    </ShopPageShell>
  );
}
