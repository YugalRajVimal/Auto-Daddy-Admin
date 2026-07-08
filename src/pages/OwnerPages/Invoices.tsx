import { useCallback, useState } from "react";
import OwnerPageShell, { OwnerPageRefreshButton } from "../../components/owner/OwnerPageShell";
import { useAuth } from "../../auth";
import { useOwnerNavReset } from "../../hooks/useOwnerNavReset";
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

const INVOICE_SECTIONS = [
  { id: "paid", label: "Paid Invoices" },
  { id: "unpaid", label: "Un-Paid Invoices" },
] as const;

export default function OwnerInvoicesPage() {
  const { session } = useAuth();
  const countryCode = session?.meta?.countryCode;
  const { loading, error, refresh, paidInvoices, unpaidInvoices } = useCarOwnerInvoices();

  const [tab, setTab] = useState<InvoiceTab>(INVOICE_SECTIONS[0].id);

  const resetSidebar = useCallback(() => {
    setTab(INVOICE_SECTIONS[0].id);
  }, []);

  useOwnerNavReset(resetSidebar);

  const visibleInvoices = tab === "paid" ? paidInvoices : unpaidInvoices;

  return (
    <OwnerPageShell
      pageHeading={tab === "paid" ? "Paid Invoices" : "Un-Paid Invoices"}
      metaTitle="Invoices | AutoDaddy"
      metaDescription="Car owner invoices"
      headerAction={<OwnerPageRefreshButton onClick={() => void refresh()} />}
      sidebarItems={INVOICE_SECTIONS.map((item) => ({
        id: item.id,
        label: item.label,
        variant: "primary" as const,
      }))}
      activeSidebarId={tab}
      onSidebarSelect={(id) => setTab(id as InvoiceTab)}
      heroCardFlush
      contentTopOffset
    >
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-ad-purple" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
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
          <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-gray-600">
            {tab === "paid" ? "No paid invoices yet." : "No unpaid invoices right now."}
          </div>
        ) : (
          visibleInvoices.map((row) => (
            <InvoiceCard key={row.id} row={row} countryCode={countryCode} />
          ))
        )}
      </div>
    </OwnerPageShell>
  );
}
