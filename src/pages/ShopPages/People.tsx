import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { FiEdit2 } from "react-icons/fi";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { getJson } from "../../api/mobileAuth";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactFixedFieldWidth,
} from "../../components/admin/ContentPanel";
import {
  ADMIN_PANEL_THEAD_ROW_CLASS,
  adminPanelRowClass,
  adminPanelTableClasses,
  type AdminPanelTableClasses,
} from "../../components/admin/adminPanelTableStyles";
import ShopPageShell from "../../components/shop/ShopPageShell";
import { ShopReveal } from "../../components/shop/ShopAnimated";
import { shopAddNewButtonClass } from "../../components/shop/forms/ShopFormPage";
import {
  shopCompactInputClass,
  shopCompactReadOnlyClass,
  shopProfileFormPanelClass,
} from "../../components/shop/shopLayoutStyles";
import { ShopListSkeleton } from "../../components/shop/ShopListSkeletons";
import {
  ShopErrorPanel,
  ShopListFooter,
} from "../../components/shop/ShopPanels";
import { useAuth } from "../../auth";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { useShopCustomers } from "../../hooks/useShopCustomers";
import { normalizeMediaUrl } from "../../lib/normalizeMediaUrl";
import {
  addCarOwnerToMyCustomers,
  apiMessage,
  onboardCarOwner,
  updateMyCustomer,
} from "../../lib/shopOwnerMutations";
import { searchCarOwners } from "../../lib/shopOwnerApi";
import { parseCitiesApiResponse } from "../../lib/carOwnerCities";
import { formatPhoneDisplay, formatPhoneLabel, phoneDigits } from "../../lib/phoneFormat";
import { parseMyCustomers } from "../../lib/shopOwnerParsers";
import type { CustomerVehicle, MyCustomer } from "../../types/shopOwner";

type PeopleSection = "customers" | "my-list" | "approval";

type DetailView =
  | { kind: "add-to-list"; customer: MyCustomer }
  | { kind: "customer-info"; customer: MyCustomer; vehicleIndex: number };

const PEOPLE_SECTIONS = [
  { id: "customers", label: "Customers", variant: "primary" as const },
  { id: "my-list", label: "My Customer List", variant: "primary" as const },
  { id: "approval", label: "Approval", variant: "primary" as const },
];

const SECTION_HEADINGS: Record<PeopleSection, string> = {
  customers: "Customers",
  "my-list": "My Customer List",
  approval: "Approval",
};

const PEOPLE_SEARCH_INPUT_ID = "shop-people-customer-search";
const PAGE_SIZE = 10;

const SHOP_TABLE_BASE = adminPanelTableClasses(true);
const SHOP_TABLE: AdminPanelTableClasses = {
  ...SHOP_TABLE_BASE,
  th: SHOP_TABLE_BASE.th.replace("px-2", "px-4"),
  thCheckbox: SHOP_TABLE_BASE.thCheckbox.replace("px-2", "px-4"),
  td: SHOP_TABLE_BASE.td.replace("px-2", "px-4"),
  tdCheckbox: SHOP_TABLE_BASE.tdCheckbox.replace("px-2", "px-4"),
};

const shopBulkButtonClass =
  "rounded border border-ad-purple bg-white px-3 py-1 text-xs font-bold text-ad-purple hover:bg-[#f5cce8] disabled:cursor-not-allowed disabled:opacity-60";

const SHOP_TABLE_CHECKBOX_CLASS = "h-3.5 w-3.5 accent-ad-purple";

function customerTableRowKey(customer: MyCustomer, index: number) {
  return customerId(customer) || `row-${index}`;
}

function vehicleTableRowKey(vehicle: CustomerVehicle, index: number) {
  return vehicle._id ?? vehicle.vId ?? `${vehicle.licensePlateNo ?? "vehicle"}-${index}`;
}

function AddNewButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={shopAddNewButtonClass}>
      + Add New
    </button>
  );
}

function PeopleSearchBar({
  value,
  onChange,
  inputId,
}: {
  value: string;
  onChange: (value: string) => void;
  inputId: string;
}) {
  return (
    <div className="flex min-h-9 shrink-0 flex-wrap items-center justify-end gap-2 border-b border-gray-300 bg-[#d1d5db] px-2 py-1.5 sm:gap-3">
      <label htmlFor={inputId} className="text-sm font-semibold text-gray-700">
        Search
      </label>
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[26px] w-full max-w-xs border border-gray-400 bg-white px-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none sm:max-w-sm"
      />
    </div>
  );
}

function customerId(c: MyCustomer) {
  return c.carOwnerId ?? c.id ?? c._id ?? "";
}


function vehicleCount(customer: MyCustomer) {
  return customer.vehicles?.length ?? 0;
}

function vehicleLabel(v: CustomerVehicle) {
  const make = v.vehicleName?.trim() || "—";
  const model = v.model?.trim();
  return model ? `${make} - ${model}` : make;
}

function isPendingApproval(customer: MyCustomer): boolean {
  const status = (customer.status ?? customer.linkStatus ?? "").trim().toLowerCase();
  if (status.includes("pending") || status.includes("approval") || status === "sent") {
    return true;
  }
  if (status.includes("approved") || status === "active" || status.includes("linked")) {
    return false;
  }
  return !customer.linkedAt?.trim();
}

function matchesMyCustomerSearch(customer: MyCustomer, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    customer.name,
    customer.email,
    customer.phone,
    customer.city,
    customer.address,
    ...(customer.vehicles ?? []).flatMap((v) => [
      v.licensePlateNo,
      v.vehicleName,
      v.model,
      v.vinNo,
    ]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function customerProfileSrc(customer: MyCustomer): string | null {
  const raw =
    (customer as MyCustomer & { profilePhoto?: string; profileImage?: string }).profilePhoto ??
    (customer as MyCustomer & { profilePhoto?: string; profileImage?: string }).profileImage;
  return raw ? normalizeMediaUrl(raw) : null;
}

function StatusBanner({ message }: { message: string }) {
  return (
    <p className="mt-3 text-center text-sm font-semibold text-blue-700">{message}</p>
  );
}

function CustomerListTable({
  customers,
  onSelect,
  showCity = false,
  selectedIds,
  onToggleRow,
  onTogglePage,
}: {
  customers: MyCustomer[];
  onSelect: (customer: MyCustomer) => void;
  showCity?: boolean;
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onTogglePage: (ids: string[], checked: boolean) => void;
}) {
  const selectAllRef = useRef<HTMLInputElement>(null);
  const actionHeadClass = `${SHOP_TABLE.th} text-center`;
  const pageRowKeys = customers.map((customer, index) => customerTableRowKey(customer, index));
  const allPageSelected =
    customers.length > 0 && pageRowKeys.every((id) => selectedIds.has(id));
  const somePageSelected = pageRowKeys.some((id) => selectedIds.has(id));

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
              <th className={SHOP_TABLE.thCheckbox}>
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={(e) => onTogglePage(pageRowKeys, e.target.checked)}
                  aria-label="Select all customers on this page"
                  className={SHOP_TABLE_CHECKBOX_CLASS}
                />
              </th>
              <th className={SHOP_TABLE.th}>Name</th>
              <th className={SHOP_TABLE.th}>Phone</th>
              {showCity ? <th className={SHOP_TABLE.th}>City</th> : null}
              <th className={SHOP_TABLE.th}>Vehicles</th>
              <th className={actionHeadClass}>View</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer, index) => {
              const name = customer.name ?? "—";
              const rowKey = pageRowKeys[index];
              return (
                <tr key={rowKey} className={adminPanelRowClass(index)}>
                  <td className={SHOP_TABLE.tdCheckbox}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(rowKey)}
                      onChange={() => onToggleRow(rowKey)}
                      aria-label={`Select ${name}`}
                      className={SHOP_TABLE_CHECKBOX_CLASS}
                    />
                  </td>
                  <td className={`${SHOP_TABLE.td} font-semibold text-blue-700`}>{name}</td>
                  <td className={`${SHOP_TABLE.td} font-semibold text-gray-800`}>
                    {customer.phone ? formatPhoneLabel(customer.phone) : "—"}
                  </td>
                  {showCity ? (
                    <td className={SHOP_TABLE.td}>{customer.city?.trim() || "—"}</td>
                  ) : null}
                  <td className={`${SHOP_TABLE.td} font-semibold text-gray-800`}>
                    {vehicleCount(customer)}
                  </td>
                  <td className={`${SHOP_TABLE.td} text-center`}>
                    <button
                      type="button"
                      title={`View ${name}`}
                      aria-label={`View ${name}`}
                      onClick={() => onSelect(customer)}
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

function CustomerAddPrompt({
  customer,
  inMyList,
  adding,
  onAdd,
}: {
  customer: MyCustomer;
  inMyList: boolean;
  adding: boolean;
  onAdd: () => void;
}) {
  const [selected, setSelected] = useState(false);
  const name = customer.name ?? "—";

  return (
    <div className="space-y-3">
      <div className="shop-hero-surface overflow-hidden rounded border border-gray-300 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className={SHOP_TABLE.table}>
            <thead>
              <tr className={ADMIN_PANEL_THEAD_ROW_CLASS}>
                <th className={SHOP_TABLE.thCheckbox}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) => setSelected(e.target.checked)}
                    aria-label={`Select ${name}`}
                    className={SHOP_TABLE_CHECKBOX_CLASS}
                  />
                </th>
                <th className={SHOP_TABLE.th}>Name</th>
                <th className={SHOP_TABLE.th}>Phone</th>
                <th className={SHOP_TABLE.th}>Vehicles</th>
                <th className={`${SHOP_TABLE.th} text-center`}>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className={SHOP_TABLE.tdCheckbox}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) => setSelected(e.target.checked)}
                    aria-label={`Select ${name}`}
                    className={SHOP_TABLE_CHECKBOX_CLASS}
                  />
                </td>
                <td className={`${SHOP_TABLE.td} font-semibold text-blue-700`}>{name}</td>
                <td className={`${SHOP_TABLE.td} font-semibold text-gray-800`}>
                  {formatPhoneLabel(customer.phone)}
                </td>
                <td className={`${SHOP_TABLE.td} font-semibold text-gray-800`}>
                  {vehicleCount(customer)}
                </td>
                <td className={`${SHOP_TABLE.td} text-center`}>
                  {inMyList ? (
                    <span className="text-xs font-semibold text-ad-green-dark">In your list</span>
                  ) : (
                    <button
                      type="button"
                      onClick={onAdd}
                      disabled={adding}
                      className={`${shopBulkButtonClass} disabled:opacity-60`}
                    >
                      {adding ? "Adding…" : "+ Add"}
                    </button>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {!inMyList ? (
        <StatusBanner message="Customer is not in your customer list. Proceed to add button." />
      ) : null}
    </div>
  );
}

function MyListCustomerDetail({
  customer,
  onVehicleSelect,
}: {
  customer: MyCustomer;
  onVehicleSelect: (vehicleIndex: number) => void;
}) {
  const vehicles = customer.vehicles ?? [];
  const actionHeadClass = `${SHOP_TABLE.th} text-center`;
  const customerName = customer.name ?? "—";
  const [customerSelected, setCustomerSelected] = useState(false);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<Set<string>>(() => new Set());
  const vehicleSelectAllRef = useRef<HTMLInputElement>(null);
  const vehicleRowKeys = vehicles.map((vehicle, index) => vehicleTableRowKey(vehicle, index));
  const allVehiclesSelected =
    vehicles.length > 0 && vehicleRowKeys.every((id) => selectedVehicleIds.has(id));
  const someVehiclesSelected = vehicleRowKeys.some((id) => selectedVehicleIds.has(id));

  useEffect(() => {
    if (vehicleSelectAllRef.current) {
      vehicleSelectAllRef.current.indeterminate = someVehiclesSelected && !allVehiclesSelected;
    }
  }, [someVehiclesSelected, allVehiclesSelected]);

  const toggleVehicle = (id: string) => {
    setSelectedVehicleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVehicles = (checked: boolean) => {
    setSelectedVehicleIds((prev) => {
      const next = new Set(prev);
      for (const id of vehicleRowKeys) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <div className="shop-hero-surface overflow-hidden rounded border border-gray-300 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className={SHOP_TABLE.table}>
            <thead>
              <tr className={ADMIN_PANEL_THEAD_ROW_CLASS}>
                <th className={SHOP_TABLE.thCheckbox}>
                  <input
                    type="checkbox"
                    checked={customerSelected}
                    onChange={(e) => setCustomerSelected(e.target.checked)}
                    aria-label={`Select ${customerName}`}
                    className={SHOP_TABLE_CHECKBOX_CLASS}
                  />
                </th>
                <th className={SHOP_TABLE.th}>Name</th>
                <th className={SHOP_TABLE.th}>Phone</th>
                <th className={SHOP_TABLE.th}>City</th>
                <th className={SHOP_TABLE.th}>Vehicles</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className={SHOP_TABLE.tdCheckbox}>
                  <input
                    type="checkbox"
                    checked={customerSelected}
                    onChange={(e) => setCustomerSelected(e.target.checked)}
                    aria-label={`Select ${customerName}`}
                    className={SHOP_TABLE_CHECKBOX_CLASS}
                  />
                </td>
                <td className={`${SHOP_TABLE.td} font-semibold text-blue-700`}>{customerName}</td>
                <td className={`${SHOP_TABLE.td} font-semibold text-gray-800`}>
                  {formatPhoneLabel(customer.phone)}
                </td>
                <td className={SHOP_TABLE.td}>{customer.city?.trim() || "—"}</td>
                <td className={`${SHOP_TABLE.td} font-semibold text-gray-800`}>
                  {vehicleCount(customer)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {vehicles.length === 0 ? (
        <p className="text-center text-sm text-gray-600">No vehicles on file.</p>
      ) : (
        <motion.div
          layout
          transition={{ layout: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }}
          className="shop-hero-surface overflow-hidden rounded border border-gray-300 bg-white shadow-sm"
        >
          <div className="overflow-x-auto">
            <table className={SHOP_TABLE.table}>
              <thead>
                <tr className={ADMIN_PANEL_THEAD_ROW_CLASS}>
                  <th className={SHOP_TABLE.thCheckbox}>
                    <input
                      ref={vehicleSelectAllRef}
                      type="checkbox"
                      checked={allVehiclesSelected}
                      onChange={(e) => toggleAllVehicles(e.target.checked)}
                      aria-label="Select all vehicles"
                      className={SHOP_TABLE_CHECKBOX_CLASS}
                    />
                  </th>
                  <th className={SHOP_TABLE.th}>Vehicle</th>
                  <th className={SHOP_TABLE.th}>License Plate</th>
                  <th className={actionHeadClass}>View</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle, index) => {
                  const rowKey = vehicleRowKeys[index];
                  return (
                  <tr key={rowKey} className={adminPanelRowClass(index)}>
                    <td className={SHOP_TABLE.tdCheckbox}>
                      <input
                        type="checkbox"
                        checked={selectedVehicleIds.has(rowKey)}
                        onChange={() => toggleVehicle(rowKey)}
                        aria-label={`Select ${vehicleLabel(vehicle)}`}
                        className={SHOP_TABLE_CHECKBOX_CLASS}
                      />
                    </td>
                    <td className={`${SHOP_TABLE.td} font-semibold text-gray-800`}>
                      {vehicleLabel(vehicle)}
                    </td>
                    <td className={`${SHOP_TABLE.td} font-semibold text-blue-700`}>
                      {vehicle.licensePlateNo?.trim() || "—"}
                    </td>
                    <td className={`${SHOP_TABLE.td} text-center`}>
                      <button
                        type="button"
                        title="View vehicle details"
                        aria-label="View vehicle details"
                        onClick={() => onVehicleSelect(index)}
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
      )}
    </div>
  );
}

function AddNewCustomerForm({
  defaultCity,
  onCancel,
  onSaved,
}: {
  defaultCity: string;
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const { token, session } = useAuth();
  const countryCode = session?.meta?.countryCode ?? "+1";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState(defaultCity);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultCity) setCity((prev) => prev || defaultCity);
  }, [defaultCity]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void getJson<unknown>("/api/user/cities?page=1", token).then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setCityOptions(parseCitiesApiResponse(res.data).map((c) => c.name));
      } else {
        setCityOptions([]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const citySelectOptions = useMemo(() => {
    const names = new Set(cityOptions);
    if (defaultCity.trim()) names.add(defaultCity.trim());
    if (city.trim()) names.add(city.trim());
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [cityOptions, city, defaultCity]);

  const handleSave = async () => {
    if (!token) return;
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (phoneDigits(phone).length !== 10) {
      setError("Phone must be 10 digits.");
      return;
    }
    if (!city.trim()) {
      setError("City is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await onboardCarOwner(token, {
        name: name.trim(),
        email: "",
        countryCode,
        phone: phoneDigits(phone),
        pincode: "",
        address: "",
        city: city.trim(),
        role: "carowner",
        vehicles: [],
      });
      if (!res.ok) {
        setError(apiMessage(res.data) || "Could not add customer.");
        return;
      }
      const msg =
        apiMessage(res.data) ||
        "Notification sent for Verification. Pl. wait or contact with Customer.";
      onSaved(msg);
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CompactFormPanel
      className={`w-full ${shopProfileFormPanelClass}`}
      footer={
        <CompactFormFooter
          message="* Add new customer in system."
          actionLabel={submitting ? "Saving…" : "Save"}
          onSave={() => void handleSave()}
          onCancel={onCancel}
        />
      }
    >
      {error ? (
        <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
          {error}
        </div>
      ) : null}
      <CompactFormRow className="justify-center">
        <CompactField label="Name" required className={compactFixedFieldWidth}>
          <input
            className={shopCompactInputClass}
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
          />
        </CompactField>
        <CompactField label="Phone" required className={compactFixedFieldWidth}>
          <input
            className={shopCompactInputClass}
            value={formatPhoneDisplay(phone)}
            onChange={(e) => setPhone(phoneDigits(e.target.value))}
          />
        </CompactField>
        <CompactField label="City" required className={compactFixedFieldWidth}>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={shopCompactInputClass}
          >
            <option value="">Select city</option>
            {citySelectOptions.map((cityName) => (
              <option key={cityName} value={cityName}>
                {cityName}
              </option>
            ))}
          </select>
        </CompactField>
      </CompactFormRow>
    </CompactFormPanel>
  );
}

function AddToListForm({
  customer,
  onCancel,
  onSaved,
}: {
  customer: MyCustomer;
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const { token, session } = useAuth();
  const countryCode = session?.meta?.countryCode ?? "+1";
  const name = customer.name ?? "";
  const phone = customer.phone ?? "";
  const city = customer.city ?? "";
  const [email, setEmail] = useState(customer.email ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const profileSrc = customerProfileSrc(customer);
  const id = customerId(customer);

  const handleAdd = async () => {
    if (!token || !id) {
      setError("Missing customer id.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await updateMyCustomer(token, {
        carOwnerId: id,
        name: name.trim(),
        email: email.trim(),
        countryCode,
        phone: phoneDigits(phone),
        pincode: customer.pincode?.trim() ?? "",
        address: customer.address?.trim() ?? "",
        city: city.trim(),
        vehicles: (customer.vehicles ?? []).map((v) => ({
          ...(v.vId ?? v._id ? { vId: v.vId ?? v._id } : {}),
          licensePlateNo: v.licensePlateNo?.trim() ?? "",
          vinNo: v.vinNo?.trim(),
          vehicleName: v.vehicleName?.trim() ?? "",
          model: v.model?.trim() ?? "",
          year: v.year?.trim() ?? "",
          odometerReading: v.odometerReading?.trim(),
        })),
      });
      if (!res.ok) {
        setError(apiMessage(res.data) || "Could not update customer.");
        return;
      }

      const addRes = await addCarOwnerToMyCustomers(token, id);
      if (!addRes.ok) {
        setError(apiMessage(addRes.data) || "Could not add customer to your list.");
        return;
      }

      onSaved(
        apiMessage(addRes.data) ||
        "Notification sent for approval. Pl. wait or contact with Customer",
      );
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CompactFormPanel
      className={shopProfileFormPanelClass}
      footer={
        <CompactFormFooter
          message="* Add customer in your customer list"
          actionLabel={submitting ? "Adding…" : "+ Add"}
          onSave={() => void handleAdd()}
          onCancel={onCancel}
        />
      }
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="text-lg font-bold text-ad-green-dark">Add visible customer in your list</h2>
        {profileSrc ? (
          <img src={profileSrc} alt="" className="h-12 w-12 rounded-sm border border-gray-300 object-cover" />
        ) : (
          <div className="h-12 w-12 rounded-sm border border-gray-300 bg-gray-200" aria-hidden />
        )}
      </div>
      {error ? (
        <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
          {error}
        </div>
      ) : null}
      <div className="flex flex-wrap items-end gap-x-4 gap-y-4">
        <CompactField label="Name" className={compactFixedFieldWidth}>
          <input className={`${shopCompactInputClass} bg-gray-100`} value={name} readOnly />
        </CompactField>
        <CompactField label="Phone" className={compactFixedFieldWidth}>
          <input className={`${shopCompactInputClass} bg-gray-100`} value={formatPhoneLabel(phone)} readOnly />
        </CompactField>
        <CompactField label="City" className={compactFixedFieldWidth}>
          <input className={`${shopCompactInputClass} bg-gray-100`} value={city} readOnly />
        </CompactField>
        <CompactField label="Email" className={compactFixedFieldWidth}>
          <input
            className={shopCompactInputClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </CompactField>
      </div>
    </CompactFormPanel>
  );
}

function CustomerInfoView({
  customer,
  vehicleIndex,
  onCancel,
  onGoToJobCard,
}: {
  customer: MyCustomer;
  vehicleIndex: number;
  onCancel: () => void;
  onGoToJobCard: () => void;
}) {
  const vehicle = customer.vehicles?.[vehicleIndex];
  const profileSrc = customerProfileSrc(customer);

  return (
    <CompactFormPanel
      className={shopProfileFormPanelClass}
      showBottomBorder={false}
      footer={
        <CompactFormFooter
          message="* Customer and vehicle details."
          actionLabel="Go to Job Card"
          onSave={onGoToJobCard}
          onCancel={onCancel}
        />
      }
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="text-lg font-bold text-ad-green-dark">Customer info</h2>
        {profileSrc ? (
          <img src={profileSrc} alt="" className="h-14 w-14 rounded-sm border border-gray-300 object-cover" />
        ) : (
          <div className="h-14 w-14 rounded-sm border border-gray-300 bg-gray-200" aria-hidden />
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Name", customer.name ?? "—"],
          ["Phone", formatPhoneLabel(customer.phone)],
          ["City", customer.city?.trim() || "—"],
          ["Email", customer.email?.trim() || "—"],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="mb-1 text-xs font-bold text-ad-green-dark">{label}</p>
            <div className={shopCompactReadOnlyClass}>{value}</div>
          </div>
        ))}
      </div>

      {vehicle ? (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded border border-gray-300 bg-gray-50 text-xs font-bold uppercase text-gray-600">
              {(vehicle.vehicleName ?? "Car").slice(0, 3)}
            </div>
            <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Car Model", [vehicle.model, vehicle.year].filter(Boolean).join(" - ") || "—"],
                ["License Plate", vehicle.licensePlateNo?.trim() || "—"],
                ["VIN", vehicle.vinNo?.trim() || "—"],
                ["Current odo", vehicle.odometerReading?.trim() || "—"],
                ["Due service", vehicle.dueOdometerReading?.trim() || "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="mb-1 text-xs font-bold text-ad-green-dark">{label}</p>
                  <div className={shopCompactReadOnlyClass}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </CompactFormPanel>
  );
}

export default function ShopPeoplePage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { faqsHeading, faqsDescription, city: shopCity } = useShopOwnerPortal();
  const [section, setSection] = useState<PeopleSection>("customers");
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState("");
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [searchHits, setSearchHits] = useState<MyCustomer[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [selectedCustomerKey, setSelectedCustomerKey] = useState<string | null>(null);
  const [detailView, setDetailView] = useState<DetailView | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(() => new Set());

  const {
    customers: myCustomers,
    loading: listLoading,
    error: listError,
    refresh,
  } = useShopCustomers();

  const myIdSet = useMemo(() => {
    const ids = new Set<string>();
    for (const customer of myCustomers) {
      const id = customerId(customer);
      if (id) ids.add(id);
    }
    return ids;
  }, [myCustomers]);

  const isDirectorySearch = section === "customers" && search.trim().length > 0;
  const isListedSection = section === "my-list" || section === "approval";

  const listCustomers = useMemo(() => {
    if (section === "customers") {
      if (isDirectorySearch) return searchHits;
      return [];
    }
    if (section === "my-list") {
      const q = search.trim();
      const approved = myCustomers.filter((customer) => !isPendingApproval(customer));
      if (!q) return approved;
      return approved.filter((customer) => matchesMyCustomerSearch(customer, q));
    }
    if (section === "approval") {
      const q = search.trim();
      const pending = myCustomers.filter(isPendingApproval);
      if (!q) return pending;
      return pending.filter((customer) => matchesMyCustomerSearch(customer, q));
    }
    return [];
  }, [section, isDirectorySearch, searchHits, myCustomers, search]);

  const totalPages = Math.max(1, Math.ceil(listCustomers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedCustomers = useMemo(
    () => listCustomers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [listCustomers, safePage],
  );

  const customerRowKey = useCallback((customer: MyCustomer, fallback: string) => {
    return customerId(customer) || customer.name || fallback;
  }, []);

  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerKey || section !== "customers") return null;
    for (let i = 0; i < paginatedCustomers.length; i++) {
      const customer = paginatedCustomers[i];
      const rowIndex = (safePage - 1) * PAGE_SIZE + i;
      if (customerRowKey(customer, String(rowIndex)) === selectedCustomerKey) {
        return customer;
      }
    }
    return null;
  }, [selectedCustomerKey, section, paginatedCustomers, safePage, customerRowKey]);

  const selectedMyListCustomer = useMemo(() => {
    if (!selectedCustomerKey || !isListedSection) return null;
    for (let i = 0; i < listCustomers.length; i++) {
      const customer = listCustomers[i];
      if (customerRowKey(customer, String(i)) === selectedCustomerKey) {
        return customer;
      }
    }
    return null;
  }, [selectedCustomerKey, isListedSection, listCustomers, customerRowKey]);

  useEffect(() => {
    setPage(1);
  }, [search, section, detailView]);

  useEffect(() => {
    setSelectedCustomerIds(new Set());
  }, [search, section]);

  useEffect(() => {
    if (section === "customers") {
      setSelectedCustomerKey(null);
    }
  }, [search, section, page]);

  useEffect(() => {
    if (!isListedSection) return;
    const q = search.trim();
    if (!q) return;

    const digits = phoneDigits(q);
    if (digits.length === 10) {
      const match = listCustomers.find((c) => phoneDigits(c.phone) === digits);
      if (match) {
        const idx = listCustomers.indexOf(match);
        setSelectedCustomerKey(customerRowKey(match, String(idx)));
      }
      return;
    }
    if (listCustomers.length === 1) {
      setSelectedCustomerKey(customerRowKey(listCustomers[0], String(0)));
    }
  }, [search, isListedSection, listCustomers, customerRowKey]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    if (section !== "customers" || !search.trim() || !token) {
      setSearchHits([]);
      setSearching(false);
      return;
    }

    const handle = window.setTimeout(() => {
      void (async () => {
        setSearching(true);
        try {
          const res = await searchCarOwners(token, search.trim());
          if (!res.ok) {
            setSearchHits([]);
            return;
          }
          setSearchHits(parseMyCustomers(res.data));
        } catch {
          setSearchHits([]);
        } finally {
          setSearching(false);
        }
      })();
    }, 400);

    return () => window.clearTimeout(handle);
  }, [search, section, token]);

  const resetDetail = () => {
    setDetailView(null);
  };

  const selectSection = (id: string) => {
    const next = id as PeopleSection;
    setSection(next);
    setShowAddForm(false);
    setSearch("");
    setSearchHits([]);
    setStatusMessage(null);
    setSelectedCustomerKey(null);
    resetDetail();
  };

  const isInMyList = useCallback(
    (customer: MyCustomer) => {
      const id = customerId(customer);
      if (id && myIdSet.has(id)) return true;
      const digits = phoneDigits(customer.phone);
      if (digits.length === 10) {
        return myCustomers.some((c) => phoneDigits(c.phone) === digits);
      }
      return false;
    },
    [myCustomers, myIdSet],
  );

  const handleAddToListOpen = (customer: MyCustomer) => {
    setShowAddForm(false);
    setDetailView({ kind: "add-to-list", customer });
    setStatusMessage(null);
  };

  const handleAddToListSaved = async (message: string) => {
    setStatusMessage(message);
    setDetailView(null);
    toast.success("Customer added to your list.");
    await refresh();
    setSection("approval");
  };

  const handleAddNewSaved = async (message: string) => {
    setStatusMessage(message);
    setShowAddForm(false);
    toast.success("Customer saved.");
    await refresh();
  };

  const handleAddExisting = async (customer: MyCustomer) => {
    const id = customerId(customer);
    if (!id || !token) return;
    if (myIdSet.has(id)) {
      toast.info("Customer is already in your list.");
      return;
    }
    setAddingId(id);
    try {
      handleAddToListOpen(customer);
    } finally {
      setAddingId(null);
    }
  };

  const emptyMessage =
    section === "customers"
      ? isDirectorySearch
        ? searching
          ? "Searching…"
          : "No customers found."
        : "Search to find customers in the directory."
      : section === "approval"
        ? "No customers awaiting approval."
        : "No customers in your list yet.";

  const showList = !detailView;
  const showAddNewAction =
    section !== "approval" &&
    !detailView &&
    !showAddForm &&
    !selectedCustomer &&
    !selectedMyListCustomer;

  const handleTableSelect = (customer: MyCustomer) => {
    setShowAddForm(false);
    const idx = paginatedCustomers.indexOf(customer);
    const rowIndex = idx >= 0 ? (safePage - 1) * PAGE_SIZE + idx : 0;
    setSelectedCustomerKey(customerRowKey(customer, String(rowIndex)));
  };

  const toggleCustomerSelection = (id: string) => {
    setSelectedCustomerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCustomerPageSelection = (ids: string[], checked: boolean) => {
    setSelectedCustomerIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  return (
    <ShopPageShell
      title="Customers"
      pageHeading={SECTION_HEADINGS[section]}
      metaTitle="Customers | AutoDaddy"
      metaDescription="Auto shop customers"
      sidebarVariant="nav"
      sidebarItems={PEOPLE_SECTIONS}
      activeSidebarId={detailView ? null : section}
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
        {detailView?.kind === "add-to-list" ? (
          <>
            <AddToListForm
              customer={detailView.customer}
              onCancel={resetDetail}
              onSaved={(message) => void handleAddToListSaved(message)}
            />
            {statusMessage ? <StatusBanner message={statusMessage} /> : null}
          </>
        ) : detailView?.kind === "customer-info" ? (
          <CustomerInfoView
            customer={detailView.customer}
            vehicleIndex={detailView.vehicleIndex}
            onCancel={resetDetail}
            onGoToJobCard={() => navigate("/shop/job-cards")}
          />
        ) : showList ? (
          <>
            <PeopleSearchBar
              value={search}
              onChange={setSearch}
              inputId={PEOPLE_SEARCH_INPUT_ID}
            />

            {!showAddForm && showAddNewAction ? (
              <div className="flex min-h-[2rem] items-center justify-end gap-2">
                <AddNewButton onClick={() => setShowAddForm(true)} />
              </div>
            ) : null}

            <ShopReveal show={showAddForm}>
              <AddNewCustomerForm
                defaultCity={shopCity}
                onCancel={() => {
                  setShowAddForm(false);
                  setStatusMessage(null);
                }}
                onSaved={(message) => void handleAddNewSaved(message)}
              />
              {statusMessage && showAddForm ? <StatusBanner message={statusMessage} /> : null}
            </ShopReveal>

            {listLoading && isListedSection && !isDirectorySearch ? (
              <ShopListSkeleton variant="profile-table" className="w-full" />
            ) : listError && isListedSection && !isDirectorySearch ? (
              <ShopErrorPanel message={listError} onRetry={() => void refresh()} />
            ) : section === "customers" && isDirectorySearch && searching && searchHits.length === 0 ? (
              <p className="text-center text-sm text-gray-600">Searching…</p>
            ) : listCustomers.length === 0 && !showAddForm ? (
              <p className="text-center text-sm text-gray-600">{emptyMessage}</p>
            ) : section === "customers" && selectedCustomer ? (
              <>
                <button type="button" onClick={() => setSelectedCustomerKey(null)} className={shopBulkButtonClass}>
                  ← Back to list
                </button>
                <CustomerAddPrompt
                  customer={selectedCustomer}
                  inMyList={isInMyList(selectedCustomer)}
                  adding={addingId === customerId(selectedCustomer)}
                  onAdd={() => handleAddExisting(selectedCustomer)}
                />
              </>
            ) : isListedSection && selectedMyListCustomer ? (
              <>
                <button type="button" onClick={() => setSelectedCustomerKey(null)} className={shopBulkButtonClass}>
                  ← Back to list
                </button>
                <MyListCustomerDetail
                  customer={selectedMyListCustomer}
                  onVehicleSelect={(vehicleIndex) =>
                    setDetailView({
                      kind: "customer-info",
                      customer: selectedMyListCustomer,
                      vehicleIndex,
                    })
                  }
                />
              </>
            ) : listCustomers.length > 0 ? (
              <>
                <CustomerListTable
                  customers={paginatedCustomers}
                  onSelect={handleTableSelect}
                  showCity={isListedSection}
                  selectedIds={selectedCustomerIds}
                  onToggleRow={toggleCustomerSelection}
                  onTogglePage={toggleCustomerPageSelection}
                />

                <ShopListFooter className="text-sm font-semibold text-gray-600">
                  <p>{listCustomers.length} Entries</p>
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
            ) : null}
          </>
        ) : null}
      </div>
    </ShopPageShell>
  );
}
