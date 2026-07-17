import { useState } from "react";
import AdminPage, { adminPageTitleClass } from "../../../components/admin/AdminPage";
import { TableEntriesSummary } from "../../../components/admin/AdminDataTable";
import { CompactField, CompactFormFooter, CompactFormPanel, compactInputClass } from "../../../components/admin/ContentPanel";
import { adminNotify } from "../../../utils/adminNotify";
import { printAdminTable } from "../../../utils/adminPrintTable";

type ItemType = "Goods" | "Service";
type ItemViewMode = "active" | "archived" | "deleted";

type ItemRow = {
  id: string;
  itemName: string;
  hsnCode: string;
  itemType: ItemType;
  description: string;
  unitCost: number | null;
  quantity: number;
  quantityUnit: string;
  gstPercent: number | null;
  openingStock: number | null;
  costWithGst: number | null;
  imageName: string;
  view: ItemViewMode;
};

type ItemFormDraft = {
  itemName: string;
  hsnCode: string;
  itemType: ItemType;
  description: string;
  unitCost: string;
  quantity: string;
  quantityUnit: string;
  gstPercent: string;
  openingStock: string;
  imageName: string;
};

const ITEM_TYPE_OPTIONS: ItemType[] = ["Goods", "Service"];
const QUANTITY_UNIT_OPTIONS = ["Nos", "Box", "Kg", "Litre", "Hrs", "Days"];

const SAMPLE_ITEMS: ItemRow[] = [
  { id: "item-1", itemName: "software", hsnCode: "", itemType: "Service", description: "software subscription for a day @1 cad", unitCost: 100, quantity: 1, quantityUnit: "Days", gstPercent: 13, openingStock: null, costWithGst: 113, imageName: "", view: "active" },
  { id: "item-2", itemName: "OIL CHANGE", hsnCode: "", itemType: "Goods", description: "OIL CHANGE - 4LT", unitCost: 12000, quantity: 1, quantityUnit: "Litre", gstPercent: 18, openingStock: null, costWithGst: 14160, imageName: "", view: "active" },
  { id: "item-3", itemName: "hhh", hsnCode: "", itemType: "Goods", description: "", unitCost: 100, quantity: 1, quantityUnit: "Nos", gstPercent: null, openingStock: null, costWithGst: null, imageName: "", view: "active" },
  { id: "item-4", itemName: "new", hsnCode: "", itemType: "Goods", description: "testing", unitCost: 85, quantity: 1, quantityUnit: "Nos", gstPercent: 18, openingStock: 85, costWithGst: 100.3, imageName: "", view: "active" },
  { id: "item-5", itemName: "dummy srv", hsnCode: "", itemType: "Service", description: "", unitCost: null, quantity: 1, quantityUnit: "Nos", gstPercent: null, openingStock: null, costWithGst: null, imageName: "", view: "active" },
  { id: "item-6", itemName: "domo service", hsnCode: "", itemType: "Service", description: "", unitCost: null, quantity: 1, quantityUnit: "Nos", gstPercent: null, openingStock: null, costWithGst: null, imageName: "", view: "active" },
  { id: "item-7", itemName: "MOTAKA", hsnCode: "", itemType: "Goods", description: "AAA", unitCost: 84.74, quantity: 1, quantityUnit: "Nos", gstPercent: 18, openingStock: -3, costWithGst: 100, imageName: "", view: "active" },
  { id: "item-8", itemName: "ABC XYZ", hsnCode: "", itemType: "Goods", description: "", unitCost: 99.9, quantity: 1, quantityUnit: "Nos", gstPercent: null, openingStock: null, costWithGst: null, imageName: "", view: "active" },
  { id: "item-9", itemName: "Dummy", hsnCode: "", itemType: "Goods", description: "", unitCost: null, quantity: 1, quantityUnit: "Nos", gstPercent: null, openingStock: 10, costWithGst: null, imageName: "", view: "active" },
  { id: "item-10", itemName: "ABC", hsnCode: "", itemType: "Goods", description: "Dummy Testing", unitCost: null, quantity: 1, quantityUnit: "Nos", gstPercent: null, openingStock: 12, costWithGst: null, imageName: "", view: "active" },
];

function emptyItemForm(): ItemFormDraft {
  return {
    itemName: "",
    hsnCode: "",
    itemType: "Goods",
    description: "",
    unitCost: "",
    quantity: "1",
    quantityUnit: "",
    gstPercent: "",
    openingStock: "",
    imageName: "",
  };
}

function fmtMoney(value: number) {
  return `${value % 1 === 0 ? value : value.toFixed(2)} CAD`;
}

function fmtOptionalMoney(value: number | null) {
  return value == null ? "" : fmtMoney(value);
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export default function ItemsPage() {
  const [items, setItems] = useState<ItemRow[]>(SAMPLE_ITEMS);
  const [viewMode, setViewMode] = useState<ItemViewMode>("active");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyItemForm());
  const [attempted, setAttempted] = useState(false);

  const visible = items.filter((row) => row.view === viewMode);
  const filtered = visible.filter((row) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return row.itemName.toLowerCase().includes(q) || row.description.toLowerCase().includes(q);
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / entriesPerPage));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * entriesPerPage, safePage * entriesPerPage);

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

  const resetForm = () => {
    setForm(emptyItemForm());
    setEditingId(null);
    setAttempted(false);
  };

  const openAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (row: ItemRow) => {
    setEditingId(row.id);
    setAttempted(false);
    setForm({
      itemName: row.itemName,
      hsnCode: row.hsnCode,
      itemType: row.itemType,
      description: row.description,
      unitCost: row.unitCost != null ? String(row.unitCost) : "",
      quantity: String(row.quantity),
      quantityUnit: row.quantityUnit,
      gstPercent: row.gstPercent != null ? String(row.gstPercent) : "",
      openingStock: row.openingStock != null ? String(row.openingStock) : "",
      imageName: row.imageName,
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const saveItem = () => {
    setAttempted(true);
    if (!form.itemName.trim()) {
      adminNotify.error("Item name is required.");
      return;
    }
    const unitCost = form.unitCost.trim() ? Number(form.unitCost) : null;
    const gstPercent = form.gstPercent.trim() ? Number(form.gstPercent) : null;
    const openingStock = form.openingStock.trim() ? Number(form.openingStock) : null;
    const costWithGst = unitCost != null && gstPercent != null ? round2(unitCost * (1 + gstPercent / 100)) : null;

    if (editingId) {
      setItems((prev) =>
        prev.map((row) =>
          row.id === editingId
            ? {
                ...row,
                itemName: form.itemName.trim(),
                hsnCode: form.hsnCode.trim(),
                itemType: form.itemType,
                description: form.description.trim(),
                unitCost,
                quantity: Number(form.quantity) || 1,
                quantityUnit: form.quantityUnit,
                gstPercent,
                openingStock,
                costWithGst,
                imageName: form.imageName,
              }
            : row
        )
      );
      adminNotify.success("Item updated.");
    } else {
      const newRow: ItemRow = {
        id: `item-${Date.now()}`,
        itemName: form.itemName.trim(),
        hsnCode: form.hsnCode.trim(),
        itemType: form.itemType,
        description: form.description.trim(),
        unitCost,
        quantity: Number(form.quantity) || 1,
        quantityUnit: form.quantityUnit,
        gstPercent,
        openingStock,
        costWithGst,
        imageName: form.imageName,
        view: "active",
      };
      setItems((prev) => [newRow, ...prev]);
      adminNotify.success("Item saved.");
    }
    resetForm();
    setShowForm(false);
  };

  const withSelected = (mutate: (row: ItemRow) => ItemRow, successMsg: string) => {
    if (selected.size === 0) return;
    setItems((prev) => prev.map((row) => (selected.has(row.id) ? mutate(row) : row)));
    adminNotify.success(successMsg);
    setSelected(new Set());
  };

  const handleArchive = () => withSelected((row) => ({ ...row, view: "archived" }), "Item(s) archived.");
  const handleDelete = () => withSelected((row) => ({ ...row, view: "deleted" }), "Item(s) deleted.");
  const handleRestore = () => withSelected((row) => ({ ...row, view: "active" }), "Item(s) restored.");

  const switchView = (mode: ItemViewMode) => {
    setViewMode(mode);
    setSelected(new Set());
    setShowForm(false);
    setPage(1);
  };

  const handlePrint = () => {
    printAdminTable({
      title: viewMode === "active" ? "Items" : viewMode === "archived" ? "Archived Items" : "Deleted Items",
      headers: ["Item Name", "Description", "Total Stock", "Unit Cost", "GST(%)", "Cost with GST"],
      rows: filtered.map((row) => [
        row.itemName,
        row.description,
        row.openingStock != null ? String(row.openingStock) : "",
        fmtOptionalMoney(row.unitCost),
        row.gstPercent != null ? `${row.gstPercent}%` : "",
        fmtOptionalMoney(row.costWithGst),
      ]),
    });
  };

  return (
    <AdminPage title="" noPanel>
      {showForm ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          onClick={handleCancel}
        >
          <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <CompactFormPanel
              footer={
                <CompactFormFooter
                  message={editingId ? "You are updating an item." : "You are creating a new item."}
                  messageCenter
                  actionLabel="Save"
                  onSave={saveItem}
                  onCancel={handleCancel}
                />
              }
            >
              <h2 className="mb-1 text-base font-bold text-ad-green-dark">{editingId ? "Edit Item" : "New Item"}</h2>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <CompactField label="Item Name" required>
                  <input
                    type="text"
                    value={form.itemName}
                    onChange={(e) => setForm((f) => ({ ...f, itemName: e.target.value }))}
                    className={compactInputClass}
                  />
                  {attempted && !form.itemName.trim() && (
                    <p className="mt-1 text-xs text-red-600">Item name is required.</p>
                  )}
                </CompactField>
                <CompactField label="HSN Code">
                  <input
                    type="text"
                    value={form.hsnCode}
                    onChange={(e) => setForm((f) => ({ ...f, hsnCode: e.target.value }))}
                    className={compactInputClass}
                  />
                </CompactField>
                <CompactField label="Item Type">
                  <select
                    value={form.itemType}
                    onChange={(e) => setForm((f) => ({ ...f, itemType: e.target.value as ItemType }))}
                    className={compactInputClass}
                  >
                    {ITEM_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </CompactField>
                <CompactField label={'Description "shown on invoice / estimate"'}>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className={compactInputClass}
                  />
                </CompactField>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
                <CompactField label="Unit Cost (Sale)">
                  <input
                    type="number"
                    value={form.unitCost}
                    onChange={(e) => setForm((f) => ({ ...f, unitCost: e.target.value }))}
                    placeholder="Without GST"
                    className={compactInputClass}
                  />
                </CompactField>
                <CompactField label="Quantity (Sale)">
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      value={form.quantity}
                      onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                      className={compactInputClass}
                    />
                    <select
                      value={form.quantityUnit}
                      onChange={(e) => setForm((f) => ({ ...f, quantityUnit: e.target.value }))}
                      className={compactInputClass}
                    >
                      <option value="">Unit</option>
                      {QUANTITY_UNIT_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </CompactField>
                <CompactField label="GST(%)">
                  <input
                    type="number"
                    value={form.gstPercent}
                    onChange={(e) => setForm((f) => ({ ...f, gstPercent: e.target.value }))}
                    className={compactInputClass}
                  />
                </CompactField>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <CompactField label="Opening Stock">
                  <input
                    type="number"
                    value={form.openingStock}
                    onChange={(e) => setForm((f) => ({ ...f, openingStock: e.target.value }))}
                    className={compactInputClass}
                  />
                </CompactField>
                <CompactField label="Image">
                  <input
                    type="file"
                    onChange={(e) => setForm((f) => ({ ...f, imageName: e.target.files?.[0]?.name ?? "" }))}
                    className="block w-full text-sm text-gray-700 file:mr-3 file:rounded file:border-0 file:bg-gray-200 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-gray-300"
                  />
                </CompactField>
              </div>
            </CompactFormPanel>
          </div>
        </div>
      ) : null}

      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className={adminPageTitleClass}>Items</h1>
        <button
          type="button"
          onClick={openAdd}
          className="shrink-0 rounded bg-ad-green px-4 py-2 text-sm font-bold text-white hover:bg-ad-green-dark"
        >
          + New Item
        </button>
      </div>

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-gray-300 px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {viewMode === "active" ? (
            <>
              <button type="button" onClick={handleArchive} disabled={selected.size === 0} className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">Archive</button>
              <button type="button" onClick={handleDelete} disabled={selected.size === 0} className="bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50">Delete</button>
              <button type="button" onClick={handlePrint} className="bg-ad-green px-3 py-1 text-xs font-medium text-white hover:bg-ad-green-dark">Print</button>
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
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
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
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Item Name</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Description</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Total Stock</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Unit Cost</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">GST(%)</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Cost with GST</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium" />
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={8} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                  No items found.
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
                  <td className="border border-gray-300 px-3 py-2 text-left">
                    <button type="button" onClick={() => openEdit(row)} className="text-blue-700 hover:underline">
                      {row.itemName}
                    </button>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-left">{row.description}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{row.openingStock != null ? row.openingStock : ""}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{fmtOptionalMoney(row.unitCost)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{row.gstPercent != null ? `${row.gstPercent}%` : ""}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{fmtOptionalMoney(row.costWithGst)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <button type="button" onClick={() => openEdit(row)} className="text-blue-700 hover:text-blue-900" aria-label={`Edit item ${row.itemName}`}>
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
        <TableEntriesSummary total={filtered.length} page={page} pageSize={entriesPerPage} />
        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={`h-7 w-7 border text-xs font-medium ${
                safePage === p
                  ? "border-ad-green bg-ad-green text-white"
                  : "border-gray-400 bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
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
    </AdminPage>
  );
}
