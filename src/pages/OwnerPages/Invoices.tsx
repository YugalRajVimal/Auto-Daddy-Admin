import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { PortalPageContent } from "../../components/admin/PortalPageContent";
import PortalSidebarButton from "../../components/admin/PortalSidebarButton";
import OwnerFaqsDialog from "../../components/owner/OwnerFaqsDialog";
import { useAuth } from "../../auth";
import { useCarOwnerDashboard } from "../../hooks/useOwnerPortal";
import { useCarOwnerInvoices, type CarOwnerInvoiceRow, type InvoiceTab } from "../../hooks/useCarOwnerInvoices";
import { formatCurrencyAmount } from "../../lib/currency";

function formatInvoiceDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function InvoiceCard({
  row,
  countryCode,
}: {
  row: CarOwnerInvoiceRow;
  countryCode?: string;
}) {
  return (
    <article className="rounded-md bg-[#CCFFCC] px-4 py-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-gray-900">{row.shopName}</p>
          <p className="text-xs font-semibold text-gray-600">
            Job {row.jobNo}
            {row.plate ? ` · ${row.plate}` : ""}
          </p>
          {row.vehicle ? <p className="text-xs text-gray-600">{row.vehicle}</p> : null}
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-ad-purple">
            {formatCurrencyAmount(row.amount, countryCode)}
          </p>
          <p className="text-xs text-gray-600">{formatInvoiceDate(row.createdAt)}</p>
        </div>
      </div>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-gray-700">
        {row.paymentStatus || "Unpaid"}
        {row.paymentMethod ? ` · ${row.paymentMethod}` : ""}
      </p>
    </article>
  );
}

export default function OwnerInvoicesPage() {
  const { session } = useAuth();
  const countryCode = session?.meta?.countryCode;
  const { loading, error, refresh, paidInvoices, unpaidInvoices } = useCarOwnerInvoices();
  const { faqsHeading, faqsDescription } = useCarOwnerDashboard();

  const [tab, setTab] = useState<InvoiceTab>("paid");
  const [faqsOpen, setFaqsOpen] = useState(false);

  const visibleInvoices = tab === "paid" ? paidInvoices : unpaidInvoices;

  return (
    <PortalPageContent className="flex flex-col px-3 py-3 sm:px-4 md:py-4 lg:px-6">
      <PageMeta title="Invoices | AutoDaddy" description="Car owner invoices" />

      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="text-base font-bold text-blue-700">Invoices</h1>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-ad-purple hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-stretch">
        <aside className="flex w-full shrink-0 flex-col gap-3 lg:w-[220px] xl:w-[260px]">
          <PortalSidebarButton
            label="Paid Invoices"
            active={tab === "paid"}
            onClick={() => setTab("paid")}
          />
          <PortalSidebarButton
            label="Un-Paid Invoices"
            active={tab === "unpaid"}
            onClick={() => setTab("unpaid")}
          />
          <button
            type="button"
            onClick={() => setFaqsOpen(true)}
            className="mt-auto rounded-full border border-blue-600 bg-white/70 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-blue-600 transition-colors hover:bg-white"
          >
            FAQs
          </button>
        </aside>

        <div className="flex min-h-[420px] flex-1 flex-col">
          {loading ? (
            <div className="flex flex-1 items-center justify-center rounded-md border border-gray-200 bg-white">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
            </div>
          ) : error ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-md border border-gray-200 bg-white p-6 text-center">
              <p className="text-sm font-semibold text-gray-800">{error}</p>
              <button
                type="button"
                onClick={() => void refresh()}
                className="rounded-md bg-ad-purple px-4 py-2 text-sm font-semibold text-white"
              >
                Try again
              </button>
            </div>
          ) : visibleInvoices.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-md border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
              {tab === "paid" ? "No paid invoices yet." : "No unpaid invoices right now."}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {visibleInvoices.map((row) => (
                <InvoiceCard key={row.id} row={row} countryCode={countryCode} />
              ))}
            </div>
          )}
        </div>
      </div>

      <OwnerFaqsDialog
        open={faqsOpen}
        onClose={() => setFaqsOpen(false)}
        heading={faqsHeading}
        description={faqsDescription}
      />
    </PortalPageContent>
  );
}
