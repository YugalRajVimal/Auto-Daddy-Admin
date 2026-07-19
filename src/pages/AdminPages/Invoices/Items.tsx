

import { useEffect, useState } from "react";
import AdminPage, { adminPageTitleClass } from "../../../components/admin/AdminPage";
import { TableEntriesSummary } from "../../../components/admin/AdminDataTable";
import { CompactField, CompactFormFooter, CompactFormPanel, compactInputClass } from "../../../components/admin/ContentPanel";
import { adminNotify } from "../../../utils/adminNotify";
import { printAdminTable } from "../../../utils/adminPrintTable";
import { bulkUpdateItems, createItem, fetchItems, ItemView, updateItem } from "./api/invoicingApi";

// Remove ItemType and HSN code from data model, and openingStock as well.
type ItemRow = {
  _id: string;
  itemName: string;
  description: string;
  unitCost: number | null;
  quantity: number;
  unitType: string;
  gstPercent: number | null;
  costWithGst: number | null;
  image: string;
  view: ItemView;
};

type ItemFormDraft = {
  itemName: string;
  description: string;
  unitCost: string;
  quantity: string;
  unitType: string;
  gstPercent: string;
};

const QUANTITY_UNIT_OPTIONS = ["Unit", "Days"];

// Adjust to wherever your server serves the Uploads folder from
const IMAGE_BASE_URL = "/Uploads/Items";

function emptyItemForm(): ItemFormDraft {
  return {
    itemName: "",
    description: "",
    unitCost: "",
    quantity: "1",
    unitType: "",
    gstPercent: "",
  };
}

function fmtOptionalMoney(value: number | null) {
  if (value == null) return "";
  return `${value % 1 === 0 ? value : value.toFixed(2)} CAD`;
}

export default function ItemsPage() {
  const [items, setItems] = useState<ItemRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ItemView>("active");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyItemForm());
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState<string>("");
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / entriesPerPage));

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await fetchItems({ view: viewMode, search, page, limit: entriesPerPage });
      setItems(res.items as ItemRow[]);
      setTotal(res.total);
    } catch (err: any) {
      adminNotify.error(err.message || "Failed to load items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, page, entriesPerPage]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      loadItems();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (items.length > 0 && selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((row) => row._id)));
  };

  const resetForm = () => {
    setForm(emptyItemForm());
    setImageFile(null);
    setExistingImage("");
    setEditingId(null);
    setAttempted(false);
  };

  const openAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (row: ItemRow) => {
    setEditingId(row._id);
    setAttempted(false);
    setImageFile(null);
    setExistingImage(row.image || "");
    setForm({
      itemName: row.itemName,
      description: row.description,
      unitCost: row.unitCost != null ? String(row.unitCost) : "",
      quantity: String(row.quantity),
      unitType: row.unitType,
      gstPercent: row.gstPercent != null ? String(row.gstPercent) : "",
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  const saveItem = async () => {
    setAttempted(true);
    if (!form.itemName.trim()) {
      adminNotify.error("Item name is required.");
      return;
    }
    if (!form.unitCost.trim()) {
      adminNotify.error("Unit cost is required.");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (editingId) {
        await updateItem(editingId, payload, imageFile);
        adminNotify.success("Item updated.");
      } else {
        await createItem(payload, imageFile);
        adminNotify.success("Item saved.");
      }
      resetForm();
      setShowForm(false);
      loadItems();
    } catch (err: any) {
      adminNotify.error(err.message || "Failed to save item.");
    } finally {
      setSaving(false);
    }
  };

  const runBulk = async (action: "archive" | "delete" | "restore", successMsg: string) => {
    if (selected.size === 0) return;
    try {
      await bulkUpdateItems([...selected], action);
      adminNotify.success(successMsg);
      setSelected(new Set());
      loadItems();
    } catch (err: any) {
      adminNotify.error(err.message || "Action failed.");
    }
  };

  const handleArchive = () => runBulk("archive", "Item(s) archived.");
  const handleDelete = () => runBulk("delete", "Item(s) deleted.");
  const handleRestore = () => runBulk("restore", "Item(s) restored.");

  const switchView = (mode: ItemView) => {
    setViewMode(mode);
    setSelected(new Set());
    setShowForm(false);
    setPage(1);
  };

  const handlePrint = () => {
    printAdminTable({
      title: viewMode === "active" ? "Items" : viewMode === "archived" ? "Archived Items" : "Deleted Items",
      headers: ["Item Name", "Description", "Quantity", "Unit Type", "Unit Cost", "GST(%)", "Cost with GST"],
      rows: items.map((row) => [
        row.itemName,
        row.description,
        row.quantity != null ? String(row.quantity) : "",
        row.unitType,
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
                  actionLabel={saving ? "Saving..." : "Save"}
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
                <CompactField label="Unit Cost (Sale)" required>
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
                      value={form.unitType}
                      onChange={(e) => setForm((f) => ({ ...f, unitType: e.target.value }))}
                      className={compactInputClass}
                    >
                      <option value="">Select</option>
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
                <CompactField label="Image">
                  {existingImage && !imageFile && (
                    <img
                      src={`${IMAGE_BASE_URL}/${existingImage}`}
                      alt="Current item"
                      className="mb-2 h-16 w-16 rounded object-cover"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
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
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Live search type here"
            className="border border-gray-400 bg-white px-2 py-1 text-xs"
          />
          <button type="button" onClick={() => { setPage(1); loadItems(); }} className="bg-gray-500 px-3 py-1 text-xs font-medium text-white hover:bg-gray-600">
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
                  checked={items.length > 0 && selected.size === items.length}
                  onChange={toggleSelectAll}
                  className="accent-white"
                />
              </th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Item Name</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Description</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Quantity</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Unit Type</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Unit Cost</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">GST(%)</th>
              <th className="border border-ad-purple-dark px-3 py-2 text-center font-medium">Cost with GST</th>
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
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={9} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                  No items found.
                </td>
              </tr>
            ) : (
              items.map((row, idx) => (
                <tr key={row._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                  <td className="border border-gray-300 px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selected.has(row._id)}
                      onChange={() => toggleSelect(row._id)}
                      className="accent-ad-purple"
                    />
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-left">
                    <button type="button" onClick={() => openEdit(row)} className="text-blue-700 hover:underline">
                      {row.itemName}
                    </button>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-left">{row.description}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{row.quantity != null ? row.quantity : ""}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">{row.unitType || ""}</td>
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
        <TableEntriesSummary total={total} page={page} pageSize={entriesPerPage} />
        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={`h-7 w-7 border text-xs font-medium ${
                page === p
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
