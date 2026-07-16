import { useState } from "react";
import AdminPage from "../../../components/admin/AdminPage";
import {
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

type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";
type InvoiceViewMode = "active" | "archived" | "deleted";

type InvoiceRow = {
  id: string;
  invoiceNo: string;
  date: string;
  client: string;
  subtotal: number;
  gst: number;
  status: InvoiceStatus;
  view: InvoiceViewMode;
};

const STATUS_OPTIONS: InvoiceStatus[] = ["Draft", "Sent", "Paid", "Overdue"];

const STATUS_LEGEND: { status: InvoiceStatus; description: string }[] = [
  { status: "Draft", description: "Invoice created, but you have not notified your client. Your client will not see this invoice." },
  { status: "Sent", description: "Your client has been notified about this invoice and can view it." },
  { status: "Paid", description: "Payment has been recorded against this invoice in full." },
  { status: "Overdue", description: "The invoice due date has passed and payment has not been recorded." },
];

const SAMPLE_INVOICES: InvoiceRow[] = [
  { id: "inv-25", invoiceNo: "00025", date: "2026-01-20", client: "FF", subtotal: 100, gst: 2.5, status: "Draft", view: "active" },
  { id: "inv-24", invoiceNo: "00024", date: "2025-10-12", client: "FF", subtotal: 160.74, gst: 28.94, status: "Draft", view: "active" },
  { id: "inv-23", invoiceNo: "00023", date: "2025-10-12", client: "4444", subtotal: 160.74, gst: 28.94, status: "Draft", view: "active" },
  { id: "inv-22", invoiceNo: "00022", date: "2025-09-02", client: "Roadside Auto", subtotal: 220, gst: 5.5, status: "Sent", view: "active" },
  { id: "inv-21", invoiceNo: "00021", date: "2025-08-15", client: "Maple Motors", subtotal: 340, gst: 8.5, status: "Paid", view: "active" },
];

const emptyInvoiceForm = () => ({
  invoiceNo: "",
  date: new Date().toISOString().slice(0, 10),
  client: "",
  subtotal: "",
  gst: "",
  status: "Draft" as InvoiceStatus,
});

function amountOf(row: Pick<InvoiceRow, "subtotal" | "gst">) {
  return row.subtotal + row.gst;
}

function fmtMoney(value: number) {
  return `${value % 1 === 0 ? value : value.toFixed(2)} CAD`;
}

function nextInvoiceNo(rows: InvoiceRow[]) {
  const max = rows.reduce((acc, r) => Math.max(acc, Number(r.invoiceNo) || 0), 0);
  return String(max + 1).padStart(5, "0");
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>(SAMPLE_INVOICES);
  const [viewMode, setViewMode] = useState<InvoiceViewMode>("active");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyInvoiceForm());
  const [manageOpen, setManageOpen] = useState(false);

  const visible = invoices.filter((row) => row.view === viewMode);
  const filtered = visible.filter((row) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      row.invoiceNo.toLowerCase().includes(q) ||
      row.client.toLowerCase().includes(q) ||
      row.status.toLowerCase().includes(q)
    );
  });
  const paged = filtered.slice(0, entriesPerPage);

  const invoiceTotal = filtered.reduce((sum, row) => sum + amountOf(row), 0);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (paged.length > 0 && selected.size === paged.length) setSelected(new Set());
    else setSelected(new Set(paged.map((row) => row.id)));
  };

  const switchView = (mode: InvoiceViewMode) => {
    setViewMode(mode);
    setSelected(new Set());
    setShowForm(false);
  };

  const resetForm = () => {
    setForm(emptyInvoiceForm());
    setEditingId(null);
  };

  const openAdd = () => {
    resetForm();
    setForm((f) => ({ ...f, invoiceNo: nextInvoiceNo(invoices) }));
    setShowForm(true);
  };

  const openEdit = (row: InvoiceRow) => {
    setEditingId(row.id);
    setForm({
      invoiceNo: row.invoiceNo,
      date: row.date,
      client: row.client,
      subtotal: String(row.subtotal),
      gst: String(row.gst),
      status: row.status,
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const handleSave = () => {
    if (!form.invoiceNo.trim() || !form.client.trim()) {
      adminNotify.error("Invoice number and client are required.");
      return;
    }
    const subtotal = Number(form.subtotal) || 0;
    const gst = Number(form.gst) || 0;

    if (editingId) {
      setInvoices((prev) =>
        prev.map((row) =>
          row.id === editingId
            ? { ...row, invoiceNo: form.invoiceNo.trim(), date: form.date, client: form.client.trim(), subtotal, gst, status: form.status }
            : row
        )
      );
      adminNotify.success("Invoice updated.");
    } else {
      const newRow: InvoiceRow = {
        id: `inv-${Date.now()}`,
        invoiceNo: form.invoiceNo.trim(),
        date: form.date,
        client: form.client.trim(),
        subtotal,
        gst,
        status: form.status,
        view: "active",
      };
      setInvoices((prev) => [newRow, ...prev]);
      adminNotify.success("Invoice created.");
    }
    resetForm();
    setShowForm(false);
  };

  const withSelected = (mutate: (row: InvoiceRow) => InvoiceRow, successMsg: string) => {
    if (selected.size === 0) return;
    setInvoices((prev) => prev.map((row) => (selected.has(row.id) ? mutate(row) : row)));
    adminNotify.success(successMsg);
    setSelected(new Set());
  };

  const handleArchive = () => withSelected((row) => ({ ...row, view: "archived" }), "Invoice(s) archived.");
  const handleDelete = () => withSelected((row) => ({ ...row, view: "deleted" }), "Invoice(s) deleted.");
  const handleMarkDraft = () => withSelected((row) => ({ ...row, status: "Draft" }), "Marked as Draft.");
  const handleSend = () => withSelected((row) => ({ ...row, status: "Sent" }), "Invoice(s) sent.");
  const handleEnterPayment = () => withSelected((row) => ({ ...row, status: "Paid" }), "Payment recorded.");

  const handleCopy = () => {
    if (selected.size === 0) return;
    const toCopy = invoices.filter((row) => selected.has(row.id));
    const copies = toCopy.map((row, idx) => ({
      ...row,
      id: `inv-${Date.now()}-${idx}`,
      invoiceNo: nextInvoiceNo(invoices.concat(toCopy)),
      status: "Draft" as InvoiceStatus,
      view: "active" as InvoiceViewMode,
    }));
    setInvoices((prev) => [...copies, ...prev]);
    adminNotify.success("Invoice(s) copied.");
    setSelected(new Set());
  };

  const handleRestore = () => withSelected((row) => ({ ...row, view: "active" }), "Invoice(s) restored.");

  const handlePrint = () => {
    printAdminTable({
      title: viewMode === "active" ? "Invoices" : viewMode === "archived" ? "Archived Invoices" : "Deleted Invoices",
      headers: ["Invoice", "Date", "Client", "Subtotal", "GST", "Amount", "Status"],
      rows: filtered.map((row) => [
        row.invoiceNo,
        row.date,
        row.client,
        fmtMoney(row.subtotal),
        fmtMoney(row.gst),
        fmtMoney(amountOf(row)),
        row.status,
      ]),
    });
  };

  return (
    <AdminPage
      title="Invoices"
      headerAction={
        !showForm ? (
          <button
            type="button"
            onClick={openAdd}
            className="shrink-0 rounded bg-ad-green px-4 py-2 text-sm font-bold text-white hover:bg-ad-green-dark"
          >
            + New Invoice
          </button>
        ) : undefined
      }
      between={
        showForm ? (
          <CompactFormPanel
            footer={
              <CompactFormFooter
                message={editingId ? "You are updating an 'Invoice'" : "You are creating an 'Invoice'"}
                messageCenter
                actionLabel={editingId ? "Update" : "Save"}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            }
          >
            <CompactFormRow className="items-start">
              <CompactField label="Invoice Number" required className={compactFixedFieldWidth}>
                <input
                  type="text"
                  value={form.invoiceNo}
                  onChange={(e) => setForm((f) => ({ ...f, invoiceNo: e.target.value }))}
                  className={compactInputClass}
                />
              </CompactField>
              <CompactField label="Date" required className={compactFixedFieldWidth}>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className={compactInputClass}
                />
              </CompactField>
              <CompactField label="Client" required className="min-w-[180px] flex-1">
                <input
                  type="text"
                  value={form.client}
                  onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))}
                  className={compactInputClass}
                />
              </CompactField>
              <CompactField label="Status" required className={compactFixedFieldWidth}>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as InvoiceStatus }))}
                  className={compactInputClass}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </CompactField>
            </CompactFormRow>
            <CompactFormRow className="items-start">
              <CompactField label="Subtotal" required className={compactFixedFieldWidth}>
                <input
                  type="number"
                  value={form.subtotal}
                  onChange={(e) => setForm((f) => ({ ...f, subtotal: e.target.value }))}
                  className={compactInputClass}
                />
              </CompactField>
              <CompactField label="GST" required className={compactFixedFieldWidth}>
                <input
                  type="number"
                  value={form.gst}
                  onChange={(e) => setForm((f) => ({ ...f, gst: e.target.value }))}
                  className={compactInputClass}
                />
              </CompactField>
              <CompactField label="Amount" className={compactFixedFieldWidth}>
                <div className={compactReadOnlyValueClass}>
                  {fmtMoney((Number(form.subtotal) || 0) + (Number(form.gst) || 0))}
                </div>
              </CompactField>
            </CompactFormRow>
          </CompactFormPanel>
        ) : undefined
      }
    >
      {!showForm && (
        <>
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setManageOpen((open) => !open)}
                className="inline-flex items-center gap-1.5 rounded bg-gray-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
              >
                <span aria-hidden>⚙</span> Manage Invoice
              </button>
              {manageOpen && (
                <div className="absolute left-0 z-10 mt-1 whitespace-nowrap rounded border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 shadow-lg">
                  Custom : Invoice Code &amp; Invoice Number
                </div>
              )}
            </div>
          </div>

          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
            <div className="flex flex-wrap gap-1">
              {viewMode === "active" ? (
                <>
                  <button type="button" onClick={handleArchive} disabled={selected.size === 0} className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">Archive</button>
                  <button type="button" onClick={handleDelete} disabled={selected.size === 0} className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">Delete</button>
                  <button type="button" onClick={handleCopy} disabled={selected.size === 0} className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">Copy</button>
                  <button type="button" onClick={handlePrint} className="bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark">Print</button>
                  <button type="button" onClick={handleSend} disabled={selected.size === 0} className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">Send</button>
                  <button type="button" onClick={handleEnterPayment} disabled={selected.size === 0} className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">Enter Payment</button>
                  <button type="button" onClick={handleMarkDraft} disabled={selected.size === 0} className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">Mark Draft</button>
                </>
              ) : (
                <>
                  <button type="button" onClick={handleRestore} disabled={selected.size === 0} className="bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark disabled:cursor-not-allowed disabled:opacity-50">Restore</button>
                  <button type="button" onClick={handlePrint} className="bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark">Print</button>
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Live search type here"
                className="border border-gray-400 bg-white px-2 py-1 text-xs"
              />
              <button type="button" className="bg-gray-500 px-3 py-1 text-xs font-medium text-white hover:bg-gray-600">
                Search
              </button>
            </div>
          </div>

          <div className="mb-2 flex items-center gap-2 text-xs text-gray-700">
            <span>Show</span>
            <select
              value={entriesPerPage}
              onChange={(e) => setEntriesPerPage(Number(e.target.value))}
              className="border border-gray-400 px-1 py-0.5"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-ad-purple text-white">
                  <th className="border border-ad-purple-dark px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={paged.length > 0 && selected.size === paged.length}
                      onChange={toggleSelectAll}
                      className="accent-white"
                    />
                  </th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Invoice</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Date</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Client</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Subtotal</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">GST</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Amount</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Status</th>
                  <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium" />
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                      No invoices found.
                    </td>
                  </tr>
                ) : (
                  paged.map((row, idx) => (
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
                        <button type="button" onClick={() => openEdit(row)} className="text-blue-700 hover:underline">
                          {row.invoiceNo}
                        </button>
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        {new Date(row.date).toLocaleDateString("en-CA", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{row.client}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{fmtMoney(row.subtotal)}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{fmtMoney(row.gst)}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{fmtMoney(amountOf(row))}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{row.status}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        <button type="button" onClick={() => openEdit(row)} className="text-blue-700 hover:text-blue-900" aria-label={`Edit invoice ${row.invoiceNo}`}>
                          ✎
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-bold text-gray-800">
              Invoice Totals : {fmtMoney(invoiceTotal)}
            </span>
            <div className="text-sm text-gray-700">
              <button
                type="button"
                onClick={() => switchView("active")}
                className={viewMode === "active" ? "font-semibold text-gray-900" : "text-blue-700 hover:underline"}
              >
                active
              </button>
              {" | "}
              <button
                type="button"
                onClick={() => switchView("archived")}
                className={viewMode === "archived" ? "font-semibold text-gray-900" : "text-blue-700 hover:underline"}
              >
                archived
              </button>
              {" | "}
              <button
                type="button"
                onClick={() => switchView("deleted")}
                className={viewMode === "deleted" ? "font-semibold text-gray-900" : "text-blue-700 hover:underline"}
              >
                deleted
              </button>
            </div>
          </div>

          <div className="mt-6 rounded border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <h2 className="mb-3 text-base font-bold text-gray-900">Invoice Status Legend</h2>
            <dl className="space-y-2">
              {STATUS_LEGEND.map(({ status, description }) => (
                <div key={status} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                  <dt className="w-20 shrink-0 font-bold text-gray-900">{status}</dt>
                  <dd className="text-sm text-gray-600">{description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </>
      )}
    </AdminPage>
  );
}
