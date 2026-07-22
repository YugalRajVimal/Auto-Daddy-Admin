
import { useEffect, useState } from "react";
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
import {
  bulkUpdateInvoices,
  copyInvoices,
  createInvoice,
  fetchAutoShopOwners,
  fetchBanks,
  fetchInvoices,
  fetchItems,
  InvoiceView,
  sendInvoiceById,
  updateInvoice,
} from "./api/invoicingApi";

import InvoiceViewModal from "./InvoiceViewModal";
// import { PaidStampToggle } from "./PaidStampToggle";

import { fetchInvoiceSettings, updateInvoiceSettings } from "./api/invoicingApi";

type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";

// Removed HSN Code, itemType, and opening Stock, and only allow unitType to be "Unit" or "Days"
type InvoiceLineItemApi = {
  ItemRefId: string;
  Item: string;
  Description: string;
  UnitPrice: number;
  Units: number;
  GSTPercent: number;
  Amount: number;
  UnitType: "Unit" | "Days";
  Image?: string; // Optional image URL or base64 string
};

type InvoiceRow = {
  _id: string;
  invoiceNumber: string;
  dateOfIssue: string;
  clientRefId: string;
  client: string;
  clientRemark: string;
  poNumber: string;
  items: InvoiceLineItemApi[];
  subtotal: number;
  gst: number;
  roundOff: number;
  invoiceTotal: number;
  bankRefId?: string;
  bankName: string;
  terms: string;
  status: InvoiceStatus;
  view: InvoiceView;
};

type LineItemDraft = {
  id: string;
  itemRefId: string;
  itemLabel: string;
  unitCost: number;
  description: string;
  unitPrice: string;
  units: string;
  gstPercent: string;
  unitType: "Unit" | "Days";
};

const DEFAULT_TERMS =
  "Payment is due within 30 days of the invoice date. Late payments may be subject to a 2% monthly interest charge.";

function emptyLineItem(): LineItemDraft {
  return {
    id: `li-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    itemRefId: "",
    itemLabel: "",
    unitCost: 0,
    description: "",
    unitPrice: "",
    units: "1",
    gstPercent: "5",
    unitType: "Unit",
  };
}

const emptyInvoiceForm = () => ({
  invoiceNo: "",
  date: new Date().toISOString().slice(0, 10),
  clientRefId: "",
  clientRemark: "",
  poNumber: "",
  lineItems: [emptyLineItem(), emptyLineItem()],
  bankRefId: "",
  bankName: "",
  terms: "",
  roundOffEnabled: true,
  roundOffAmount: "",
  status: "Draft" as InvoiceStatus,
});

function lineAmount(unitPrice: number, units: number) {
  return (unitPrice || 0) * (units || 0);
}
function lineGst(unitPrice: number, units: number, gstPercent: number) {
  return lineAmount(unitPrice, units) * ((gstPercent || 0) / 100);
}
function invoiceSubtotal(items: InvoiceLineItemApi[]) {
  return items.reduce((sum, l) => sum + lineAmount(l.UnitPrice, l.Units), 0);
}
function invoiceGstTotal(items: InvoiceLineItemApi[]) {
  return items.reduce((sum, l) => sum + lineGst(l.UnitPrice, l.Units, l.GSTPercent), 0);
}

function fmtMoney(value: number) {
  return value % 1 === 0 ? String(value) : value.toFixed(2);
}

// Build the "PREFIX00001" style preview client-side so it's always correct,
// even if the backend's nextInvoiceNumberPreview field is unformatted.
function formatInvoiceNo(prefix: string, nextNumber: number, padLength: number) {
  const pad = padLength && padLength > 0 ? padLength : 5;
  return `${prefix || ""}${String(nextNumber).padStart(pad, "0")}`;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<InvoiceView>("active");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyInvoiceForm());
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingPreviewInvoice, setSendingPreviewInvoice] = useState(false);

  // Reference data for pickers
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [autoShopOwners, setAutoShopOwners] = useState<any[]>([]);

  const [manageOpen, setManageOpen] = useState(false);
  const [invoicePreview, setInvoicePreview] = useState(""); // formatted next number, e.g. "INV00001"
  const [manageForm, setManageForm] = useState({ invoicePrefix: "", nextNumber: "1", padLength: "5" });
  

  const [viewingInvoice, setViewingInvoice] = useState<InvoiceRow | null>(null);

  useEffect(() => {
    fetchInvoiceSettings()
      .then((res) => {
        const { invoicePrefix, nextNumber, padLength } = res.settings;
        setInvoicePreview(formatInvoiceNo(invoicePrefix, nextNumber, padLength));
        setManageForm({
          invoicePrefix,
          nextNumber: String(nextNumber),
          padLength: String(padLength),
        });
      })
      .catch((err) => adminNotify.error(err.message || "Failed to load invoice settings."));
  }, []);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetchInvoices({ view: viewMode, search, page: 1, limit: entriesPerPage });
      setInvoices(res.invoices as InvoiceRow[]);
      console.log(res.invoices);
      setTotal(res.total);
      setGrandTotal(res.grandTotal);
    } catch (err: any) {
      adminNotify.error(err.message || "Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, entriesPerPage]);

  useEffect(() => {
    const t = setTimeout(loadInvoices, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Load items (for the line-item picker) and banks once, when the form opens
  const loadReferenceData = async () => {
    try {
      const [itemsRes, banksRes, ownersRes] = await Promise.all([
        fetchItems({ view: "active", page: 1, limit: 200 }),
        fetchBanks(),
        fetchAutoShopOwners(),
      ]);
      setAvailableItems(itemsRes.items);
      setBanks(banksRes.banks);
      setAutoShopOwners(ownersRes.data || []);
    } catch (err: any) {
      adminNotify.error(err.message || "Failed to load items/banks/clients.");
    }
  };

  const paged = invoices; // server already paginates active-view fetch to entriesPerPage

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
    else setSelected(new Set(paged.map((row) => row._id)));
  };

  // This function now keeps track of deleted screen state for heading
  const [currentHeading, setCurrentHeading] = useState<string>("Invoices");
  const switchView = (mode: InvoiceView) => {
    setViewMode(mode);
    setSelected(new Set());
    setShowForm(false);

    // Update heading based on the view mode
    if (mode === "deleted") {
      setCurrentHeading("Deleted Invoices");
    } else if (mode === "archived") {
      setCurrentHeading("Archived Invoices");
    } else {
      setCurrentHeading("Invoices");
    }
  };

  const resetForm = () => {
    setForm(emptyInvoiceForm());
    setEditingId(null);
    setAttempted(false);
  };

  const openAdd = async () => {
    resetForm();
    await loadReferenceData();
    setForm((f) => ({ ...f, invoiceNo: invoicePreview }));
    setShowForm(true);
  };



  const openEdit = async (row: InvoiceRow) => {
    await loadReferenceData();
    setEditingId(row._id);
    setAttempted(false);
    setForm({
      invoiceNo: row.invoiceNumber,
      date: row.dateOfIssue.slice(0, 10),
      clientRefId: row.clientRefId || "",
      clientRemark: row.clientRemark,
      poNumber: row.poNumber,
      lineItems: row.items.length
        ? row.items.map((l) => ({
            id: l.ItemRefId + Math.random().toString(36).slice(2, 6),
            itemRefId: l.ItemRefId,
            itemLabel: l.Item,
            unitCost: l.UnitPrice,
            description: l.Description,
            unitPrice: String(l.UnitPrice),
            units: String(l.Units),
            gstPercent: String(l.GSTPercent),
            unitType: l.UnitType === "Days" ? "Days" : "Unit",
          }))
        : [emptyLineItem(), emptyLineItem()],
      bankRefId: row.bankRefId || "",
      bankName: row.bankName,
      terms: row.terms,
      roundOffEnabled: row.roundOff !== 0,
      roundOffAmount: row.roundOff ? String(row.roundOff) : "",
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

  // When an item is picked from the dropdown, prefill description/unitPrice/gst/unitType from the item record
  const handleItemPick = (lineId: string, itemId: string) => {
    const picked = availableItems.find((it) => it._id === itemId);
    if (!picked) {
      updateLine(lineId, { itemRefId: "", itemLabel: "" });
      return;
    }
    // Default unitType to "Unit" unless picked.unitType is "Days"
    updateLine(lineId, {
      itemRefId: picked._id,
      itemLabel: picked.itemName,
      unitCost: picked.unitCost,
      description: picked.description || "",
      unitPrice: picked.unitCost != null ? String(picked.unitCost) : "",
      gstPercent: picked.gstPercent != null ? String(picked.gstPercent) : "0",
      unitType: picked.unitType === "Days" ? "Days" : "Unit",
    });
  };

  const draftApiLineItems = (): InvoiceLineItemApi[] =>
    form.lineItems
      .filter((l) => l.itemRefId)
      .map((l) => ({
        ItemRefId: l.itemRefId,
        Item: l.itemLabel,
        Description: l.description,
        UnitPrice: Number(l.unitPrice) || 0,
        Units: Number(l.units) || 0,
        GSTPercent: Number(l.gstPercent) || 0,
        Amount: lineAmount(Number(l.unitPrice) || 0, Number(l.units) || 0),
        UnitType: l.unitType === "Days" ? "Days" : "Unit",
      }));

  const draftItems = draftApiLineItems();
  const draftSubtotal = invoiceSubtotal(draftItems);
  const draftGst = invoiceGstTotal(draftItems);
  const draftRoundOff = form.roundOffEnabled ? Number(form.roundOffAmount) || 0 : 0;
  const draftTotal = draftSubtotal + draftGst + draftRoundOff;

  const saveInvoice = async (status: InvoiceStatus) => {
    setAttempted(true);
    if (!form.clientRefId) {
      adminNotify.error("Please select a client for this invoice.");
      return;
    }
    const lineItems = draftApiLineItems();
    if (lineItems.length === 0) {
      adminNotify.error("Add at least one line item with a selected item.");
      return;
    }
    const finalStatus: InvoiceStatus = form.status === "Paid" ? "Paid" : status;

    const payload = {
      clientRefId: form.clientRefId,
      clientRemark: form.clientRemark.trim(),
      invoiceNumber: form.invoiceNo.trim(),
      dateOfIssue: form.date,
      poNumber: form.poNumber.trim(),
      lineItems: lineItems.map((l) => ({
        itemRefId: l.ItemRefId,
        description: l.Description,
        unitPrice: l.UnitPrice,
        units: l.Units,
        gstPercent: l.GSTPercent,
        unitType: l.UnitType,
      })),
      bankRefId: form.bankRefId || undefined,
      bankName: form.bankName,
      terms: form.terms,
      roundOffEnabled: form.roundOffEnabled,
      roundOffAmount: Number(form.roundOffAmount) || 0,
      status: finalStatus,
    };

    setSaving(true);
    try {
      let savedId = editingId || "";
      if (editingId) {
        const res = await updateInvoice(editingId, payload);
        savedId = res.invoice?._id || editingId;
        adminNotify.success(
          finalStatus === "Paid" ? "Invoice updated and marked paid." : finalStatus === "Sent" ? "Invoice updated and sent." : "Invoice updated."
        );
      } else {
        const res = await createInvoice(payload);
        savedId = res.invoice?._id || "";
        // Invoice numbering now lives server-side (AdminInvoiceSettings),
        // so re-fetch the freshly-incremented settings instead of bumping
        // local state — this keeps the UI correct even if another admin
        // created an invoice in between, or the manage-invoice settings
        // changed since this form was opened.
        try {
          const settingsRes = await fetchInvoiceSettings();
          const { invoicePrefix, nextNumber, padLength } = settingsRes.settings;
          setInvoicePreview(formatInvoiceNo(invoicePrefix, nextNumber, padLength));
          setManageForm({
            invoicePrefix,
            nextNumber: String(nextNumber),
            padLength: String(padLength),
          });
        } catch {
          // Non-fatal — the invoice itself saved fine, we just won't have
          // an up-to-date "next number" preview until the page reloads.
        }
        adminNotify.success(
          finalStatus === "Paid" ? "Invoice created and marked paid." : finalStatus === "Sent" ? "Invoice created and sent." : "Invoice saved as draft."
        );
      }

      // For Drafts, open the invoice preview straight away with the data
      // that was just submitted, instead of only returning to the list.
      if (finalStatus === "Draft") {
        const clientName = autoShopOwners.find((o) => o._id === form.clientRefId)?.name || "";
        setViewingInvoice({
          _id: savedId,
          invoiceNumber: payload.invoiceNumber,
          dateOfIssue: payload.dateOfIssue,
          clientRefId: payload.clientRefId,
          client: clientName,
          clientRemark: payload.clientRemark,
          poNumber: payload.poNumber,
          items: lineItems,
          subtotal: draftSubtotal,
          gst: draftGst,
          roundOff: draftRoundOff,
          invoiceTotal: draftTotal,
          bankRefId: payload.bankRefId,
          bankName: payload.bankName,
          terms: payload.terms,
          status: finalStatus,
          view: "active",
        });
      }

      resetForm();
      setShowForm(false);
      loadInvoices();
    } catch (err: any) {
      adminNotify.error(err.message || "Failed to save invoice.");
    } finally {
      setSaving(false);
    }
  };

  const runBulk = async (
    action: "archive" | "delete" | "restore" | "send" | "markPaid" | "markDraft",
    successMsg: string
  ) => {
    if (selected.size === 0) return;
    try {
      await bulkUpdateInvoices([...selected], action);
      adminNotify.success(successMsg);
      setSelected(new Set());
      loadInvoices();
    } catch (err: any) {
      adminNotify.error(err.message || "Action failed.");
    }
  };

  const handleArchive = () => runBulk("archive", "Invoice(s) archived.");
  const handleDelete = () => runBulk("delete", "Invoice(s) deleted. Stock has been restored.");
  const handleMarkDraft = () => runBulk("markDraft", "Marked as Draft.");
  const handleSend = () => runBulk("send", "Invoice(s) sent.");
  const handleEnterPayment = () => runBulk("markPaid", "Payment recorded.");
  const handleRestore = () => runBulk("restore", "Invoice(s) restored.");

  const handleCopy = async () => {
    if (selected.size === 0) return;
    try {
      const ids = [...selected];

      // Numbering now lives server-side (AdminInvoiceSettings) instead of
      // local invoiceCode/nextInvoiceSeq state, so pull the current prefix
      // and starting sequence fresh before generating the batch of numbers
      // — this avoids handing out numbers that drift from what "Manage
      // Invoice" last saved.
      const settingsRes = await fetchInvoiceSettings();
      const { invoicePrefix, nextNumber, padLength } = settingsRes.settings;

      let seq = nextNumber;
      const nextInvoiceNumbers = ids.map(() => {
        const no = formatInvoiceNo(invoicePrefix, seq, padLength);
        seq += 1;
        return no;
      });

      await copyInvoices(ids, nextInvoiceNumbers);

      // Reserve the numbers we just handed out by advancing nextNumber past
      // them, so the next invoice created (copy or new) doesn't collide.
      const updatedSettingsRes = await updateInvoiceSettings({ nextNumber: seq });
      setInvoicePreview(
        formatInvoiceNo(
          updatedSettingsRes.settings.invoicePrefix,
          updatedSettingsRes.settings.nextNumber,
          updatedSettingsRes.settings.padLength
        )
      );

      adminNotify.success("Invoice(s) copied.");
      setSelected(new Set());
      loadInvoices();
    } catch (err: any) {
      adminNotify.error(err.message || "Failed to copy invoice(s).");
    }
  };

  const handlePrint = () => {
    printAdminTable({
      title: viewMode === "active" ? "Invoices" : viewMode === "archived" ? "Archived Invoices" : "Deleted Invoices",
      headers: ["Invoice", "Date", "Client", "Subtotal", "GST", "Amount", "Status"],
      rows: invoices.map((row) => [
        row.invoiceNumber,
        row.dateOfIssue.slice(0, 10),
        row.client,
        fmtMoney(row.subtotal),
        fmtMoney(row.gst),
        fmtMoney(row.invoiceTotal),
        row.status,
      ]),
    });
  };
  const openManage = () => setManageOpen(true); 

  const handleManageSave = async () => {
    const parsedNext = Number(manageForm.nextNumber);
    const parsedPad = Number(manageForm.padLength);
    if (!manageForm.nextNumber.trim() || Number.isNaN(parsedNext) || parsedNext < 1) {
      adminNotify.error("Invoice number is required.");
      return;
    }
    try {
      const res = await updateInvoiceSettings({
        invoicePrefix: manageForm.invoicePrefix.trim(),
        nextNumber: parsedNext,
        padLength: parsedPad || 5,
      });
      setInvoicePreview(
        formatInvoiceNo(res.settings.invoicePrefix, res.settings.nextNumber, res.settings.padLength)
      );
      setManageOpen(false);
      adminNotify.success("Invoice settings updated.");
    } catch (err: any) {
      adminNotify.error(err.message || "Failed to update invoice settings.");
    }
  };

  const handleSendFromPreview = async () => {
    if (!viewingInvoice || !viewingInvoice._id) {
      adminNotify.error("Cannot send: invoice id missing.");
      return;
    }
    setSendingPreviewInvoice(true);
    try {
      await sendInvoiceById(viewingInvoice._id);
      adminNotify.success("Invoice sent.");
      setViewingInvoice(null);
      loadInvoices();
    } catch (err: any) {
      adminNotify.error(err.message || "Failed to send invoice.");
    } finally {
      setSendingPreviewInvoice(false);
    }
  };

  return (
    <AdminPage title="" noPanel>
      {showForm ? (
        <>
          <h1 className={`${adminPageTitleClass} mb-4`}>{editingId ? "Edit Invoice" : "New Invoice"}</h1>
          <CompactFormPanel
            footer={
              <div className="flex flex-wrap items-start justify-center gap-8 border-t border-ad-form-border bg-ad-form-bg px-4 py-4">
                <div>
                  <button
                    type="button"
                    onClick={() => saveInvoice("Draft")}
                    disabled={saving}
                    className="rounded bg-gray-500 px-6 py-2 text-sm font-bold text-white hover:bg-gray-600 disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save as Draft"}
                  </button>
                  <p className="mt-1.5 max-w-[220px] text-xs text-gray-600">
                    Save this invoice as a draft. Your client will not be able to view this invoice until it is sent.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => saveInvoice("Sent")}
                    disabled={saving}
                    className="rounded bg-ad-green px-6 py-2 text-sm font-bold text-white hover:bg-ad-green-dark disabled:opacity-60"
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
            <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-[1fr_auto_1fr]">
              <div className="w-full space-y-4 sm:w-1/2">
                <CompactField label="Client" required>
                  <div className="relative">
                    <select
                      value={form.clientRefId}
                      onChange={(e) => setForm((f) => ({ ...f, clientRefId: e.target.value }))}
                      className={compactInputClass}
                    >
                      <option value="">Select client</option>
                      {autoShopOwners.map((owner) => (
                        <option key={owner._id} value={owner._id}>
                          {owner.name} {owner.businessProfile?.businessName ? `— ${owner.businessProfile.businessName}` : ""}
                        </option>
                      ))}
                    </select>
                    {attempted && !form.clientRefId && (
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
              <div className="flex items-center justify-center sm:px-4">
          

              {/* <PaidStampToggle
                paid={form.status === "Paid"}
                onToggle={() => setForm((f) => ({ ...f, status: f.status === "Paid" ? "Draft" : "Paid" }))}
              /> */}

              </div>
        
              <div className="w-full space-y-4 sm:ml-auto sm:mr-8 sm:w-1/2">
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
              <div className="overflow-x-auto rounded-lg border border-gray-300 bg-white shadow">
                <table className="min-w-[900px] w-full border-collapse text-sm">
                  <colgroup>
                    <col className="w-[22%]" />
                    <col className="w-[32%]" />
                    <col className="w-[12%]" />
                    <col className="w-[10%]" />
                    <col className="w-[8%]" />
                    <col className="w-[8%]" />
                    <col className="w-[10%]" />
                    <col style={{ width: "36px" }} /> {/* X icon column */}
                  </colgroup>
                  <thead>
                    <tr className="bg-ad-purple text-white">
                      <th className="border-b border-ad-purple-dark px-3 py-3 text-left font-semibold">Item</th>
                      <th className="border-b border-ad-purple-dark px-3 py-3 text-left font-semibold">Description</th>
                      <th className="border-b border-ad-purple-dark px-3 py-3 text-center font-semibold">Unit Type</th>
                      <th className="border-b border-ad-purple-dark px-3 py-3 text-center font-semibold">Unit Price</th>
                      <th className="border-b border-ad-purple-dark px-3 py-3 text-center font-semibold">Units</th>
                      <th className="border-b border-ad-purple-dark px-3 py-3 text-center font-semibold">GST (%)</th>
                      <th className="border-b border-ad-purple-dark px-3 py-3 text-center font-semibold">Amount</th>
                      <th className="border-b border-ad-purple-dark px-3 py-3 text-center font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.lineItems.map((line, idx) => (
                      <tr
                        key={line.id}
                        className={`
                          ${idx % 2 === 0 ? "bg-gray-50" : "bg-white"}
                          transition-colors hover:bg-indigo-50
                        `}
                      >
                        <td className="border-t border-gray-200 px-2 py-2 align-middle">
                          <select
                            value={line.itemRefId}
                            onChange={(e) => handleItemPick(line.id, e.target.value)}
                            className={`${compactInputClass} w-full min-w-[130px]`}
                          >
                            <option value="">Select item</option>
                            {availableItems.map((it) => (
                              <option key={it._id} value={it._id}>
                                {it.itemName}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="border-t border-gray-200 px-2 py-2 align-middle">
                          <input
                            type="text"
                            value={line.description}
                            onChange={(e) => updateLine(line.id, { description: e.target.value })}
                            className={`${compactInputClass} w-full`}
                            placeholder="Item description"
                          />
                        </td>
                        <td className="border-t border-gray-200 px-2 py-2 text-center align-middle">
                          <select
                            value={line.unitType}
                            onChange={(e) => updateLine(line.id, { unitType: e.target.value as "Unit" | "Days" })}
                            className={`${compactInputClass} w-full`}
                          >
                            <option value="Unit">Unit</option>
                            <option value="Days">Days</option>
                          </select>
                        </td>
                        <td className="border-t border-gray-200 px-2 py-2 text-right align-middle">
                          <input
                            type="number"
                            value={line.unitPrice}
                            onChange={(e) => updateLine(line.id, { unitPrice: e.target.value })}
                            className={`${compactInputClass} w-full text-right`}
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="border-t border-gray-200 px-2 py-2 text-right align-middle">
                          <input
                            type="number"
                            value={line.units}
                            onChange={(e) => updateLine(line.id, { units: e.target.value })}
                            className={`${compactInputClass} w-full text-right`}
                            min="0"
                            step="1"
                            placeholder="0"
                          />
                        </td>
                        <td className="border-t border-gray-200 px-2 py-2 text-right align-middle">
                          <input
                            type="number"
                            value={line.gstPercent}
                            onChange={(e) => updateLine(line.id, { gstPercent: e.target.value })}
                            className={`${compactInputClass} w-full text-right`}
                            min="0"
                            step="0.1"
                            placeholder="0"
                          />
                        </td>
                        <td className="border-t border-gray-200 px-4 py-2 text-right align-middle tabular-nums bg-gray-50 font-semibold">
                          {fmtMoney(lineAmount(Number(line.unitPrice) || 0, Number(line.units) || 0))}
                        </td>
                        <td className="border-t border-gray-200 px-1 py-2 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => removeLine(line.id)}
                            disabled={form.lineItems.length <= 1}
                            className="inline-flex items-center justify-center rounded-full p-1 font-bold text-base text-red-600 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-30"
                            aria-label="Remove line"
                            tabIndex={0}
                          >
                            <span aria-hidden>✕</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
     
            </div>
            <button
              type="button"
              onClick={addLine}
              className="mt-3 rounded bg-gray-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-gray-700"
            >
              + Add Line
            </button>

            <div className="mt-6 mr-8 flex justify-end">
              <div className="w-full max-w-sm rounded border border-gray-300">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2 text-sm">
                  <span>Subtotal</span>
                  <span className="w-24 text-right tabular-nums">{fmtMoney(draftSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2 text-sm">
                  <span>GST</span>
                  <span className="w-24 text-right tabular-nums">{fmtMoney(draftGst)}</span>
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
                    className="w-24 border border-gray-300 px-1.5 py-0.5 text-right text-sm tabular-nums disabled:bg-gray-100"
                  />
                </div>
                <div className="flex items-center justify-between bg-gray-100 px-4 py-2.5 text-sm font-bold">
                  <span>Invoice Total</span>
                  <span className="w-24 text-right tabular-nums">{fmtMoney(draftTotal)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              <div className="w-full max-w-sm">
                <CompactField label="Bank (Payment Transfer Information)">
                  <select
                    value={form.bankRefId}
                    onChange={(e) => {
                      const bank = banks.find((b) => b._id === e.target.value);
                      setForm((f) => ({ ...f, bankRefId: e.target.value, bankName: bank?.BankName || "" }));
                    }}
                    className={compactInputClass}
                  >
                    <option value="">Select bank</option>
                    {banks.map((bank) => (
                      <option key={bank._id} value={bank._id}>
                        {bank.BankName}
                      </option>
                    ))}
                  </select>
                </CompactField>
              </div>
              <CompactField
                className="w-full max-w-sm sm:mr-8 sm:justify-self-end"
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
            {/* Use currentHeading state for heading */}
            <h1 className={`${adminPageTitleClass} justify-self-start`}>{currentHeading}</h1>
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
              <button type="button" onClick={loadInvoices} className="bg-gray-500 px-3 py-1 text-xs font-medium text-white hover:bg-gray-600">
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
                {loading ? (
                  <tr>
                    <td colSpan={9} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                      No invoices found.
                    </td>
                  </tr>
                ) : (
                  paged.map((row, idx) => (
                    <tr key={row._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                      <td className="border border-gray-300 px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={selected.has(row._id)}
                          onChange={() => toggleSelect(row._id)}
                          className="accent-ad-purple"
                        />
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => setViewingInvoice(row)}
                          // Show red color if deleted view is open
                          className={
                            viewMode === "deleted"
                              ? "text-red-600 font-bold hover:text-red-800 underline"
                              : "text-blue-700 hover:underline"
                          }
                        >
                          {row.invoiceNumber}
                        </button>
                        {/* {viewMode === "deleted" && (
                          <div className="text-xs text-red-500 mt-0.5">{row._id}</div>
                        )} */}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        {new Date(row.dateOfIssue).toLocaleDateString("en-CA", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{row.client}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{fmtMoney(row.subtotal)}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{fmtMoney(row.gst)}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{fmtMoney(row.invoiceTotal)}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{row.status}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="text-blue-700 hover:text-blue-900"
                          aria-label={`Edit invoice ${row.invoiceNumber}`}
                        >
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
            <TableEntriesSummary total={total} page={1} pageSize={entriesPerPage} />
            <span className="text-sm font-bold text-gray-800">Invoice Totals : {fmtMoney(grandTotal)}</span>
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
              <CompactField label="Invoice Prefix">
                  <input
                    type="text"
                    value={manageForm.invoicePrefix}
                    onChange={(e) => setManageForm((f) => ({ ...f, invoicePrefix: e.target.value }))}
                    className={compactInputClass}
                  />
                </CompactField>
                <CompactField label="Next Invoice Number" required>
                  <input
                    type="text"
                    value={manageForm.nextNumber}
                    onChange={(e) => setManageForm((f) => ({ ...f, nextNumber: e.target.value.replace(/\D/g, "") }))}
                    className={compactInputClass}
                  />
                </CompactField>
              </div>
            </CompactFormPanel>
          </div>
        </div>
      )}

{viewingInvoice && (
  <InvoiceViewModal
    invoice={viewingInvoice}
    templateId="default" // swap in your actual template id source
    onClose={() => setViewingInvoice(null)}
    onEdit={() => {
      const rowToEdit = viewingInvoice;
      setViewingInvoice(null);
      openEdit(rowToEdit);
    }}
    onSend={handleSendFromPreview}
    sending={sendingPreviewInvoice}
  />
)}
    </AdminPage>
  );
}