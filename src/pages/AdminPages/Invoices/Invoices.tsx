import { useMemo, useState } from "react";
import AdminPage, { adminPageTitleClass } from "../../../components/admin/AdminPage";
import { TableEntriesSummary } from "../../../components/admin/AdminDataTable";
import {
  CompactAutoGrowTextarea,
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  compactInputClass,
} from "../../../components/admin/ContentPanel";
import { adminNotify } from "../../../utils/adminNotify";
import { printAdminTable } from "../../../utils/adminPrintTable";

type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";
type InvoiceViewMode = "active" | "archived" | "deleted";

type InvoiceLineItem = {
  id: string;
  item: string;
  description: string;
  unitPrice: number;
  days: number;
  gstPercent: number;
};

type InvoiceRow = {
  id: string;
  invoiceNo: string;
  date: string;
  client: string;
  clientRemark: string;
  poNumber: string;
  lineItems: InvoiceLineItem[];
  bank: string;
  terms: string;
  roundOffEnabled: boolean;
  roundOffAmount: number;
  status: InvoiceStatus;
  view: InvoiceViewMode;
};

type LineItemDraft = {
  id: string;
  item: string;
  description: string;
  unitPrice: string;
  days: string;
  gstPercent: string;
};

const STATUS_LEGEND: { status: InvoiceStatus; description: string }[] = [
  { status: "Draft", description: "Invoice created, but you have not notified your client. Your client will not see this invoice." },
  { status: "Sent", description: "Your client has been notified about this invoice and can view it." },
  { status: "Paid", description: "Payment has been recorded against this invoice in full." },
  { status: "Overdue", description: "The invoice due date has passed and payment has not been recorded." },
];

const ITEM_OPTIONS = ["Labour", "Parts", "Diagnostic Fee", "Oil Change", "Tire Rotation", "Brake Service", "Towing Fee"];
const BANK_OPTIONS = ["HH", "Business Chequing", "Business Savings"];
const DEFAULT_TERMS =
  "Payment is due within 30 days of the invoice date. Late payments may be subject to a 2% monthly interest charge.";

const SAMPLE_INVOICES: InvoiceRow[] = [
  {
    id: "inv-25", invoiceNo: "00025", date: "2026-01-20", client: "FF", clientRemark: "", poNumber: "",
    lineItems: [{ id: "li-25", item: "Labour", description: "General service", unitPrice: 100, days: 1, gstPercent: 2.5 }],
    bank: "HH", terms: "", roundOffEnabled: false, roundOffAmount: 0, status: "Draft", view: "active",
  },
  {
    id: "inv-24", invoiceNo: "00024", date: "2025-10-12", client: "FF", clientRemark: "", poNumber: "",
    lineItems: [{ id: "li-24", item: "Parts", description: "Replacement parts", unitPrice: 160.74, days: 1, gstPercent: 18.01 }],
    bank: "HH", terms: "", roundOffEnabled: false, roundOffAmount: 0, status: "Draft", view: "active",
  },
  {
    id: "inv-23", invoiceNo: "00023", date: "2025-10-12", client: "4444", clientRemark: "", poNumber: "",
    lineItems: [{ id: "li-23", item: "Parts", description: "Replacement parts", unitPrice: 160.74, days: 1, gstPercent: 18.01 }],
    bank: "HH", terms: "", roundOffEnabled: false, roundOffAmount: 0, status: "Draft", view: "active",
  },
  {
    id: "inv-22", invoiceNo: "00022", date: "2025-09-02", client: "Roadside Auto", clientRemark: "", poNumber: "",
    lineItems: [{ id: "li-22", item: "Towing Fee", description: "Roadside assistance", unitPrice: 220, days: 1, gstPercent: 2.5 }],
    bank: "HH", terms: "", roundOffEnabled: false, roundOffAmount: 0, status: "Sent", view: "active",
  },
  {
    id: "inv-21", invoiceNo: "00021", date: "2025-08-15", client: "Maple Motors", clientRemark: "", poNumber: "",
    lineItems: [{ id: "li-21", item: "Brake Service", description: "Brake pad replacement", unitPrice: 340, days: 1, gstPercent: 2.5 }],
    bank: "HH", terms: "", roundOffEnabled: false, roundOffAmount: 0, status: "Paid", view: "active",
  },
];

function emptyLineItem(): LineItemDraft {
  return { id: `li-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, item: "", description: "", unitPrice: "", days: "1", gstPercent: "5" };
}

const emptyInvoiceForm = () => ({
  invoiceNo: "",
  date: new Date().toISOString().slice(0, 10),
  client: "",
  clientRemark: "",
  poNumber: "",
  lineItems: [emptyLineItem(), emptyLineItem()],
  bank: "",
  terms: "",
  roundOffEnabled: true,
  roundOffAmount: "",
  status: "Draft" as InvoiceStatus,
});

function lineAmount(line: Pick<InvoiceLineItem, "unitPrice" | "days">) {
  return (line.unitPrice || 0) * (line.days || 0);
}
function lineGst(line: Pick<InvoiceLineItem, "unitPrice" | "days" | "gstPercent">) {
  return lineAmount(line) * ((line.gstPercent || 0) / 100);
}
function invoiceSubtotal(row: Pick<InvoiceRow, "lineItems">) {
  return row.lineItems.reduce((sum, l) => sum + lineAmount(l), 0);
}
function invoiceGst(row: Pick<InvoiceRow, "lineItems">) {
  return row.lineItems.reduce((sum, l) => sum + lineGst(l), 0);
}
function invoiceTotal(row: Pick<InvoiceRow, "lineItems" | "roundOffEnabled" | "roundOffAmount">) {
  const base = invoiceSubtotal(row) + invoiceGst(row);
  return row.roundOffEnabled ? base + (row.roundOffAmount || 0) : base;
}

function fmtMoney(value: number) {
  return `${value % 1 === 0 ? value : value.toFixed(2)} CAD`;
}

function formatInvoiceNo(code: string, seq: number) {
  return `${code}${String(seq).padStart(5, "0")}`;
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
  const [attempted, setAttempted] = useState(false);

  const [manageOpen, setManageOpen] = useState(false);
  const [invoiceCode, setInvoiceCode] = useState("");
  const [nextInvoiceSeq, setNextInvoiceSeq] = useState(26);
  const [manageForm, setManageForm] = useState({ invoiceCode: "", invoiceNumber: "26" });

  const clientOptions = useMemo(() => {
    const names = new Set(invoices.map((r) => r.client).filter(Boolean));
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [invoices]);

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

  const invoiceGrandTotal = filtered.reduce((sum, row) => sum + invoiceTotal(row), 0);

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
    setAttempted(false);
  };

  const openAdd = () => {
    resetForm();
    setForm((f) => ({ ...f, invoiceNo: formatInvoiceNo(invoiceCode, nextInvoiceSeq) }));
    setShowForm(true);
  };

  const openEdit = (row: InvoiceRow) => {
    setEditingId(row.id);
    setAttempted(false);
    setForm({
      invoiceNo: row.invoiceNo,
      date: row.date,
      client: row.client,
      clientRemark: row.clientRemark,
      poNumber: row.poNumber,
      lineItems: row.lineItems.length
        ? row.lineItems.map((l) => ({
            id: l.id,
            item: l.item,
            description: l.description,
            unitPrice: String(l.unitPrice),
            days: String(l.days),
            gstPercent: String(l.gstPercent),
          }))
        : [emptyLineItem(), emptyLineItem()],
      bank: row.bank,
      terms: row.terms,
      roundOffEnabled: row.roundOffEnabled,
      roundOffAmount: row.roundOffAmount ? String(row.roundOffAmount) : "",
      status: row.status,
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const addLine = () => {
    setForm((f) => ({ ...f, lineItems: [...f.lineItems, emptyLineItem()] }));
  };

  const removeLine = (id: string) => {
    setForm((f) => ({
      ...f,
      lineItems: f.lineItems.length > 1 ? f.lineItems.filter((l) => l.id !== id) : f.lineItems,
    }));
  };

  const updateLine = (id: string, patch: Partial<LineItemDraft>) => {
    setForm((f) => ({
      ...f,
      lineItems: f.lineItems.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));
  };

  const draftLineItems = (): InvoiceLineItem[] =>
    form.lineItems
      .filter((l) => l.item.trim() || l.description.trim() || l.unitPrice.trim())
      .map((l) => ({
        id: l.id,
        item: l.item.trim(),
        description: l.description.trim(),
        unitPrice: Number(l.unitPrice) || 0,
        days: Number(l.days) || 0,
        gstPercent: Number(l.gstPercent) || 0,
      }));

  const draftSubtotal = invoiceSubtotal({ lineItems: draftLineItems() });
  const draftGst = invoiceGst({ lineItems: draftLineItems() });
  const draftTotal = invoiceTotal({
    lineItems: draftLineItems(),
    roundOffEnabled: form.roundOffEnabled,
    roundOffAmount: Number(form.roundOffAmount) || 0,
  });

  const saveInvoice = (status: InvoiceStatus) => {
    setAttempted(true);
    if (!form.client.trim()) {
      adminNotify.error("Please select a client for this invoice.");
      return;
    }
    const lineItems = draftLineItems();

    if (editingId) {
      setInvoices((prev) =>
        prev.map((row) =>
          row.id === editingId
            ? {
                ...row,
                invoiceNo: form.invoiceNo.trim(),
                date: form.date,
                client: form.client.trim(),
                clientRemark: form.clientRemark.trim(),
                poNumber: form.poNumber.trim(),
                lineItems,
                bank: form.bank,
                terms: form.terms,
                roundOffEnabled: form.roundOffEnabled,
                roundOffAmount: Number(form.roundOffAmount) || 0,
                status,
              }
            : row
        )
      );
      adminNotify.success(status === "Sent" ? "Invoice updated and sent." : "Invoice updated.");
    } else {
      const newRow: InvoiceRow = {
        id: `inv-${Date.now()}`,
        invoiceNo: form.invoiceNo.trim(),
        date: form.date,
        client: form.client.trim(),
        clientRemark: form.clientRemark.trim(),
        poNumber: form.poNumber.trim(),
        lineItems,
        bank: form.bank,
        terms: form.terms,
        roundOffEnabled: form.roundOffEnabled,
        roundOffAmount: Number(form.roundOffAmount) || 0,
        status,
        view: "active",
      };
      setInvoices((prev) => [newRow, ...prev]);
      setNextInvoiceSeq((n) => n + 1);
      adminNotify.success(status === "Sent" ? "Invoice created and sent." : "Invoice saved as draft.");
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
    let seq = nextInvoiceSeq;
    const copies = toCopy.map((row, idx) => {
      const invoiceNo = formatInvoiceNo(invoiceCode, seq);
      seq += 1;
      return {
        ...row,
        id: `inv-${Date.now()}-${idx}`,
        invoiceNo,
        status: "Draft" as InvoiceStatus,
        view: "active" as InvoiceViewMode,
      };
    });
    setNextInvoiceSeq(seq);
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
        fmtMoney(invoiceSubtotal(row)),
        fmtMoney(invoiceGst(row)),
        fmtMoney(invoiceTotal(row)),
        row.status,
      ]),
    });
  };

  const openManage = () => {
    setManageForm({ invoiceCode, invoiceNumber: String(nextInvoiceSeq) });
    setManageOpen(true);
  };

  const handleManageSave = () => {
    const parsed = Number(manageForm.invoiceNumber);
    if (!manageForm.invoiceNumber.trim() || Number.isNaN(parsed)) {
      adminNotify.error("Invoice number is required.");
      return;
    }
    setInvoiceCode(manageForm.invoiceCode.trim());
    setNextInvoiceSeq(parsed);
    setManageOpen(false);
    adminNotify.success("Invoice settings updated.");
  };

  return (
    <AdminPage title="" noPanel>
      {showForm ? (
        <>
          <h1 className={`${adminPageTitleClass} mb-4`}>{editingId ? "Edit Invoice" : "New Invoice"}</h1>
          <CompactFormPanel
            footer={
              <div className="flex flex-wrap items-start gap-8 border-t border-ad-form-border bg-ad-form-bg px-4 py-4">
                <div>
                  <button
                    type="button"
                    onClick={() => saveInvoice("Draft")}
                    className="rounded bg-gray-500 px-6 py-2 text-sm font-bold text-white hover:bg-gray-600"
                  >
                    Save as Draft
                  </button>
                  <p className="mt-1.5 max-w-[220px] text-xs text-gray-600">
                    Save this invoice as a draft. Your client will not be able to view this invoice until it is sent.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => saveInvoice("Sent")}
                    className="rounded bg-ad-green px-6 py-2 text-sm font-bold text-white hover:bg-ad-green-dark"
                  >
                    Send by Email…
                  </button>
                  <p className="mt-1.5 max-w-[220px] text-xs text-gray-600">Email this invoice to your client.</p>
                </div>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="mt-2 text-xs font-medium text-blue-600 underline hover:text-blue-700"
                >
                  Cancel
                </button>
              </div>
            }
          >
            <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              <div className="space-y-4">
                <CompactField label="Client" required>
                  <div className="relative">
                    <select
                      value={form.client}
                      onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))}
                      className={compactInputClass}
                    >
                      <option value="">Select client</option>
                      {clientOptions.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                    {attempted && !form.client.trim() && (
                      <div className="absolute left-0 top-full z-10 mt-2 w-64 rounded border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs text-gray-700 shadow">
                        Please select a client for this invoice.
                      </div>
                    )}
                  </div>
                </CompactField>
                <CompactField label="Client Remark">
                  <input
                    type="text"
                    value={form.clientRemark}
                    onChange={(e) => setForm((f) => ({ ...f, clientRemark: e.target.value }))}
                    className={compactInputClass}
                  />
                </CompactField>
              </div>
              <div className="space-y-4">
                <CompactField label="Invoice Number">
                  <input
                    type="text"
                    value={form.invoiceNo}
                    onChange={(e) => setForm((f) => ({ ...f, invoiceNo: e.target.value }))}
                    className={compactInputClass}
                  />
                </CompactField>
                <CompactField label="Date of Issue" required>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className={compactInputClass}
                  />
                </CompactField>
                <CompactField label="PO Number">
                  <input
                    type="text"
                    value={form.poNumber}
                    onChange={(e) => setForm((f) => ({ ...f, poNumber: e.target.value }))}
                    className={compactInputClass}
                  />
                </CompactField>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto rounded border border-gray-300">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="bg-ad-purple text-white">
                    <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Item</th>
                    <th className="border border-ad-purple-dark px-3 py-2 text-left font-medium">Description</th>
                    <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Unit Price</th>
                    <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Days</th>
                    <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">GST (%)</th>
                    <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Amount</th>
                    <th className="border border-ad-purple-dark px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {form.lineItems.map((line) => (
                    <tr key={line.id} className="bg-white">
                      <td className="border border-gray-300 p-1">
                        <select
                          value={line.item}
                          onChange={(e) => updateLine(line.id, { item: e.target.value })}
                          className={compactInputClass}
                        >
                          <option value="">Select item</option>
                          {ITEM_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input
                          type="text"
                          value={line.description}
                          onChange={(e) => updateLine(line.id, { description: e.target.value })}
                          className={compactInputClass}
                        />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input
                          type="number"
                          value={line.unitPrice}
                          onChange={(e) => updateLine(line.id, { unitPrice: e.target.value })}
                          className={`${compactInputClass} text-right`}
                        />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input
                          type="number"
                          value={line.days}
                          onChange={(e) => updateLine(line.id, { days: e.target.value })}
                          className={`${compactInputClass} text-right`}
                        />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input
                          type="number"
                          value={line.gstPercent}
                          onChange={(e) => updateLine(line.id, { gstPercent: e.target.value })}
                          className={`${compactInputClass} text-right`}
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right">
                        {fmtMoney(lineAmount({ unitPrice: Number(line.unitPrice) || 0, days: Number(line.days) || 0 }))}
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeLine(line.id)}
                          disabled={form.lineItems.length <= 1}
                          className="font-bold text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Remove line"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={addLine}
              className="mt-3 rounded bg-gray-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-gray-700"
            >
              + Add Line
            </button>

            <div className="mt-6 flex justify-end">
              <div className="w-full max-w-sm rounded border border-gray-300">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2 text-sm">
                  <span>Subtotal</span>
                  <span>{fmtMoney(draftSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2 text-sm">
                  <span>GST</span>
                  <span>{fmtMoney(draftGst)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2 text-sm">
                  <label className="flex items-center gap-2 font-medium text-blue-700">
                    <input
                      type="checkbox"
                      checked={form.roundOffEnabled}
                      onChange={(e) => setForm((f) => ({ ...f, roundOffEnabled: e.target.checked }))}
                      className="accent-ad-green"
                    />
                    Round Off
                  </label>
                  <input
                    type="number"
                    value={form.roundOffAmount}
                    disabled={!form.roundOffEnabled}
                    onChange={(e) => setForm((f) => ({ ...f, roundOffAmount: e.target.value }))}
                    className="w-20 border border-gray-300 px-1.5 py-0.5 text-right text-sm disabled:bg-gray-100"
                  />
                </div>
                <div className="flex items-center justify-between bg-gray-100 px-4 py-2.5 text-sm font-bold">
                  <span>Invoice Total</span>
                  <span>{fmtMoney(draftTotal)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              <div>
                <CompactField label="Bank (Payment Transfer Information)">
                  <select
                    value={form.bank}
                    onChange={(e) => setForm((f) => ({ ...f, bank: e.target.value }))}
                    className={compactInputClass}
                  >
                    <option value="">Select bank</option>
                    {BANK_OPTIONS.map((bank) => (
                      <option key={bank} value={bank}>
                        {bank}
                      </option>
                    ))}
                  </select>
                </CompactField>
                <button
                  type="button"
                  onClick={() => adminNotify.info("Bank management coming soon.")}
                  className="mt-1.5 text-xs font-medium text-blue-700 underline hover:text-blue-800"
                >
                  Manage Banks
                </button>
              </div>
              <CompactField
                label={
                  <>
                    Terms (
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, terms: DEFAULT_TERMS }))}
                      className="font-medium text-blue-700 underline hover:text-blue-800"
                    >
                      Set Default Terms
                    </button>
                    )
                  </>
                }
              >
                <CompactAutoGrowTextarea
                  value={form.terms}
                  onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value }))}
                />
              </CompactField>
            </div>
          </CompactFormPanel>
        </>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-3 items-center gap-3">
            <h1 className={`${adminPageTitleClass} justify-self-start`}>Invoices</h1>
            <div className="relative justify-self-center">
              <button
                type="button"
                onClick={openManage}
                className="inline-flex items-center gap-1.5 rounded bg-gray-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
              >
                <span aria-hidden>⚙</span> Manage Invoice
              </button>
            </div>
            <button
              type="button"
              onClick={openAdd}
              className="shrink-0 justify-self-end rounded bg-ad-green px-4 py-2 text-sm font-bold text-white hover:bg-ad-green-dark"
            >
              + New Invoice
            </button>
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
                      <td className="border border-gray-300 px-3 py-2 text-center">{fmtMoney(invoiceSubtotal(row))}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{fmtMoney(invoiceGst(row))}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{fmtMoney(invoiceTotal(row))}</td>
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
            <TableEntriesSummary total={filtered.length} page={1} pageSize={entriesPerPage} />
            <span className="text-sm font-bold text-gray-800">
              Invoice Totals : {fmtMoney(invoiceGrandTotal)}
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

      {manageOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setManageOpen(false)}
        >
          <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <CompactFormPanel
              footer={<CompactFormFooter actionLabel="Update" onSave={handleManageSave} onCancel={() => setManageOpen(false)} />}
            >
              <div className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ad-green-dark">
                <span aria-hidden>⚙</span> Manage Invoice
              </div>
              <div className="space-y-4">
                <CompactField label="Invoice Code">
                  <input
                    type="text"
                    value={manageForm.invoiceCode}
                    onChange={(e) => setManageForm((f) => ({ ...f, invoiceCode: e.target.value }))}
                    className={compactInputClass}
                  />
                </CompactField>
                <CompactField label="Invoice Number" required>
                  <input
                    type="text"
                    value={manageForm.invoiceNumber}
                    onChange={(e) => setManageForm((f) => ({ ...f, invoiceNumber: e.target.value.replace(/\D/g, "") }))}
                    className={compactInputClass}
                  />
                </CompactField>
              </div>
            </CompactFormPanel>
          </div>
        </div>
      )}
    </AdminPage>
  );
}
