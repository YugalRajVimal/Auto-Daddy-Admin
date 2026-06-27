import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { getJson } from "../../api/mobileAuth";
import {
  CompactField,
  CompactFormFooter,
  CompactFormPanel,
  CompactFormRow,
  compactFixedFieldWidth,
  compactInputClass,
} from "../../components/admin/ContentPanel";
import ShopPageShell from "../../components/shop/ShopPageShell";
import { ShopViewTransition } from "../../components/shop/ShopAnimated";
import { shopHeroCardBodyClass, shopHeroOpaqueSurfaceClass } from "../../components/shop/shopLayoutStyles";
import {
  ShopEmptyPanel,
  ShopErrorPanel,
  ShopListFooter,
  ShopListPanel,
  ShopLoadingPanel,
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
import { parseMyCustomers } from "../../lib/shopOwnerParsers";
import type { CustomerVehicle, MyCustomer } from "../../types/shopOwner";

type PeopleSection = "customers" | "add-new" | "my-list";

type DetailView =
  | { kind: "add-to-list"; customer: MyCustomer }
  | { kind: "customer-info"; customer: MyCustomer; vehicleIndex: number };

const PEOPLE_SECTIONS = [
  { id: "customers", label: "Customers", variant: "primary" as const },
  { id: "add-new", label: "Add New", variant: "primary" as const },
  { id: "my-list", label: "My Customer List", variant: "primary" as const },
];

const PEOPLE_SEARCH_INPUT_ID = "shop-people-customer-search";
const PAGE_SIZE = 10;

function customerId(c: MyCustomer) {
  return c.carOwnerId ?? c.id ?? c._id ?? "";
}

function phoneDigits(phone?: string) {
  return (phone ?? "").replace(/\D/g, "");
}

function displayPhone(phone?: string) {
  const digits = phoneDigits(phone);
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return (phone ?? "").trim() || "—";
}

function vehicleCount(customer: MyCustomer) {
  return customer.vehicles?.length ?? 0;
}

function vehicleLabel(v: CustomerVehicle) {
  const make = v.vehicleName?.trim() || "—";
  const model = v.model?.trim();
  return model ? `${make} - ${model}` : make;
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
    <div
      className={`mt-4 rounded-md border border-white/70 bg-white/95 px-4 py-3 text-center text-sm font-semibold text-blue-700 ${shopHeroOpaqueSurfaceClass}`}
    >
      {message}
    </div>
  );
}

function VehiclesColumn({
  count,
  onClick,
}: {
  count: number;
  onClick?: () => void;
}) {
  const body = (
    <>
      <p className="text-sm font-semibold text-[#008000]">Vehicles</p>
      <p className="text-lg font-bold text-blue-700 underline decoration-blue-700">{count}</p>
    </>
  );

  if (!onClick) {
    return <div className="shrink-0 text-right">{body}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded text-right hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008000]"
    >
      {body}
    </button>
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
  return (
    <div className="space-y-3">
      <article className="flex items-center justify-between gap-3 rounded-md border border-[#008000]/40 bg-[#ffe8d6]/95 px-4 py-3 sm:px-5 sm:py-4">
        <div className="min-w-0">
          <p className="text-base font-bold text-[#008000]">{customer.name ?? "—"}</p>
          <p className="text-sm font-semibold text-blue-700">{displayPhone(customer.phone)}</p>
        </div>
        {inMyList ? (
          <p className="shrink-0 text-center text-sm font-bold text-[#008000]">already added to my customers</p>
        ) : (
          <button
            type="button"
            onClick={onAdd}
            disabled={adding}
            className="shrink-0 text-sm font-bold text-ad-purple hover:underline disabled:opacity-60"
          >
            {adding ? "Adding…" : "+ Add"}
          </button>
        )}
        <VehiclesColumn count={vehicleCount(customer)} />
      </article>
      {!inMyList ? (
        <StatusBanner message="Customer is not in your customer List. Proceed to add button" />
      ) : null}
    </div>
  );
}

function StripedCustomerRow({
  customer,
  index,
  onSelect,
}: {
  customer: MyCustomer;
  index: number;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center justify-between gap-4 px-4 py-3 text-left sm:px-6 ${index % 2 === 0 ? "bg-gray-100/90" : "bg-white/90"
        } ${shopHeroOpaqueSurfaceClass} hover:brightness-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008000]`}
    >
      <div className="min-w-0">
        <p className="text-base font-bold text-[#008000]">{customer.name ?? "—"}</p>
        {customer.phone ? (
          <span className="text-sm font-semibold text-blue-700">{displayPhone(customer.phone)}</span>
        ) : null}
      </div>
      <VehiclesColumn count={vehicleCount(customer)} />
    </button>
  );
}

function MyListCustomerCard({
  customer,
  onSelect,
}: {
  customer: MyCustomer;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center justify-between gap-4 rounded-md border border-[#008000] bg-[#d4fcd4] p-3 text-left sm:px-5 sm:py-4 hover:brightness-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008000]`}
    >
      <div className="min-w-0">
        <p className="text-base font-bold text-[#008000]">{customer.name ?? "—"}</p>
        {customer.phone ? (
          <span className="text-sm font-semibold text-blue-700">{displayPhone(customer.phone)}</span>
        ) : null}
      </div>
      <VehiclesColumn count={vehicleCount(customer)} />
    </button>
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

  return (
    <div className="w-full space-y-3">
      <article className="flex items-center justify-between gap-4 rounded-md border border-[#008000] bg-[#d4fcd4] px-4 py-3 sm:px-6 sm:py-4">
        <div className="min-w-0">
          <p className="text-base font-bold text-[#008000]">{customer.name ?? "—"}</p>
          <p className="text-sm font-semibold text-blue-700">{displayPhone(customer.phone)}</p>
        </div>
        <VehiclesColumn count={vehicleCount(customer)} />
      </article>

      {vehicles.length === 0 ? (
        <div
          className={`rounded-md px-4 py-3 text-center text-sm text-gray-600 ${shopHeroOpaqueSurfaceClass} bg-white/95`}
        >
          No vehicles on file.
        </div>
      ) : (
        vehicles.map((vehicle, index) => (
          <button
            key={vehicle._id ?? vehicle.vId ?? `${vehicle.licensePlateNo}-${index}`}
            type="button"
            onClick={() => onVehicleSelect(index)}
            className={`flex w-full items-center justify-between gap-4 rounded-md px-4 py-3 text-left sm:px-6 ${shopHeroOpaqueSurfaceClass} bg-white/95 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008000]`}
          >
            <span className="text-sm font-semibold text-gray-800">{vehicleLabel(vehicle)}</span>
            <span className="text-sm font-bold text-blue-700 underline">
              {vehicle.licensePlateNo?.trim() || "—"}
            </span>
          </button>
        ))
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
      className="w-full"
      footer={
        <CompactFormFooter
          message="* Add new customer in system."
          messageCenter
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
            className={compactInputClass}
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
          />
        </CompactField>
        <CompactField label="Phone" required className={compactFixedFieldWidth}>
          <input
            className={compactInputClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
          />
        </CompactField>
        <CompactField label="City" required className={compactFixedFieldWidth}>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={compactInputClass}
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
  const [name, setName] = useState(customer.name ?? "");
  const [phone, setPhone] = useState(customer.phone ?? "");
  const [city, setCity] = useState(customer.city ?? "");
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
      footer={
        <CompactFormFooter
          message="* Add customer in your customer list"
          messageCenter
          actionLabel={submitting ? "Adding…" : "+ Add"}
          onSave={() => void handleAdd()}
          onCancel={onCancel}
        />
      }
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="text-lg font-bold text-ad-green-dark">Add visible customer in your List</h2>
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
          <input className={`${compactInputClass} bg-gray-100`} value={name} readOnly />
        </CompactField>
        <CompactField label="Phone" className={compactFixedFieldWidth}>
          <input className={`${compactInputClass} bg-gray-100`} value={displayPhone(phone)} readOnly />
        </CompactField>
        <CompactField label="City" className={compactFixedFieldWidth}>
          <input className={`${compactInputClass} bg-gray-100`} value={city} readOnly />
        </CompactField>
        <CompactField label="Email" className={compactFixedFieldWidth}>
          <input
            className={compactInputClass}
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
    <div className="space-y-0 overflow-hidden rounded-md border border-[#008000] shadow-sm">
      <div className="relative bg-[#d4fcd4] px-4 py-4 sm:px-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-[#008000]">Customer info</h2>
          {profileSrc ? (
            <img src={profileSrc} alt="" className="h-14 w-14 rounded-sm border border-gray-300 object-cover" />
          ) : (
            <div className="h-14 w-14 rounded-sm border border-gray-300 bg-white" aria-hidden />
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Name", customer.name ?? "—"],
            ["Phone", displayPhone(customer.phone)],
            ["City", customer.city?.trim() || "—"],
            ["Email", customer.email?.trim() || "—"],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="mb-1 text-xs font-bold text-[#008000]">{label}</p>
              <div className="min-h-[30px] rounded border border-gray-400 bg-gray-100 px-2 py-1.5 text-sm">
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {vehicle ? (
        <div className="bg-white px-4 py-4 sm:px-6">
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
                  <p className="mb-1 text-xs font-bold text-[#008000]">{label}</p>
                  <div className="min-h-[30px] rounded border border-gray-400 bg-gray-100 px-2 py-1.5 text-sm">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={onGoToJobCard}
              className="rounded bg-[#008000] px-5 py-1.5 text-sm font-bold text-white hover:brightness-95"
            >
              Go to Job Card
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-sm font-semibold text-ad-purple hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function ShopPeoplePage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { faqsHeading, faqsDescription, city: shopCity } = useShopOwnerPortal();
  const [section, setSection] = useState<PeopleSection>("customers");
  const [search, setSearch] = useState("");
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [searchHits, setSearchHits] = useState<MyCustomer[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [selectedCustomerKey, setSelectedCustomerKey] = useState<string | null>(null);
  const [detailView, setDetailView] = useState<DetailView | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

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
  const showSearch = section !== "add-new" && !detailView;

  const listCustomers = useMemo(() => {
    if (section === "customers") {
      if (isDirectorySearch) return searchHits;
      return myCustomers;
    }
    if (section === "my-list") {
      const q = search.trim();
      if (!q) return myCustomers;
      return myCustomers.filter((customer) => matchesMyCustomerSearch(customer, q));
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
    if (!selectedCustomerKey || section !== "my-list") return null;
    for (let i = 0; i < listCustomers.length; i++) {
      const customer = listCustomers[i];
      if (customerRowKey(customer, String(i)) === selectedCustomerKey) {
        return customer;
      }
    }
    return null;
  }, [selectedCustomerKey, section, listCustomers, customerRowKey]);

  useEffect(() => {
    setPage(1);
  }, [search, section, detailView]);

  useEffect(() => {
    if (section === "customers") {
      setSelectedCustomerKey(null);
    }
  }, [search, section, page]);

  useEffect(() => {
    if (section !== "my-list") return;
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
  }, [search, section, listCustomers, customerRowKey]);

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
    setDetailView({ kind: "add-to-list", customer });
    setStatusMessage(null);
  };

  const handleAddToListSaved = async (message: string) => {
    setStatusMessage(message);
    setDetailView(null);
    toast.success("Customer added to your list.");
    await refresh();
    setSection("my-list");
  };

  const handleAddNewSaved = async (message: string) => {
    setStatusMessage(message);
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
        : "No customers yet."
      : "No customers in your list yet.";

  const viewKey = detailView
    ? detailView.kind === "add-to-list"
      ? `add-to-list-${customerId(detailView.customer)}`
      : `customer-info-${customerId(detailView.customer)}-${detailView.vehicleIndex}`
    : section;

  return (
    <ShopPageShell
      title="Customers"
      pageHeading="Customers"
      metaTitle="Customers | AutoDaddy"
      metaDescription="Auto shop customers"
      searchPlaceholder={showSearch ? "Search" : undefined}
      searchValue={search}
      onSearchChange={setSearch}
      searchInputId={PEOPLE_SEARCH_INPUT_ID}
      sidebarItems={PEOPLE_SECTIONS}
      activeSidebarId={detailView ? null : section}
      onSidebarSelect={selectSection}
      onFaqsOpen={() => setFaqsOpen(true)}
      onFaqsClose={() => setFaqsOpen(false)}
      faqsOpen={faqsOpen}
      faqsHeading={faqsHeading}
      faqsDescription={faqsDescription}
    >
      <ShopViewTransition viewKey={viewKey} className={shopHeroCardBodyClass}>
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
        ) : section === "add-new" ? (
          <div className="mx-auto flex w-full max-w-3xl flex-col">
            <AddNewCustomerForm
              defaultCity={shopCity}
              onCancel={() => selectSection("customers")}
              onSaved={(message) => void handleAddNewSaved(message)}
            />
            {statusMessage ? <StatusBanner message={statusMessage} /> : null}
          </div>
        ) : listLoading && !isDirectorySearch ? (
          <ShopLoadingPanel
            variant={section === "my-list" ? "customer-card" : "split-row"}
            count={5}
          />
        ) : listError && !isDirectorySearch ? (
          <ShopErrorPanel message={listError} onRetry={() => void refresh()} />
        ) : (
          <>
            {section === "customers" && isDirectorySearch && searching && searchHits.length === 0 ? (
              <ShopEmptyPanel message="Searching…" />
            ) : listCustomers.length === 0 ? (
              <ShopEmptyPanel message={emptyMessage} />
            ) : section === "customers" && selectedCustomer ? (
              <>
                <button
                  type="button"
                  onClick={() => setSelectedCustomerKey(null)}
                  className={`mb-3 w-full rounded-md px-3 py-1.5 text-left text-xs font-semibold text-ad-purple hover:underline ${shopHeroOpaqueSurfaceClass}`}
                >
                  ← Back to list
                </button>
                <CustomerAddPrompt
                  customer={selectedCustomer}
                  inMyList={isInMyList(selectedCustomer)}
                  adding={addingId === customerId(selectedCustomer)}
                  onAdd={() => handleAddExisting(selectedCustomer)}
                />
              </>
            ) : section === "my-list" && selectedMyListCustomer ? (
              <>
                <button
                  type="button"
                  onClick={() => setSelectedCustomerKey(null)}
                  className={`mb-3 w-full rounded-md px-3 py-1.5 text-left text-xs font-semibold text-ad-purple hover:underline ${shopHeroOpaqueSurfaceClass}`}
                >
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
            ) : (
              <>
                <ShopListPanel>
                  {paginatedCustomers.map((customer, index) => {
                    const id = customerId(customer);
                    const rowIndex = (safePage - 1) * PAGE_SIZE + index;
                    const rowKey = customerRowKey(customer, String(rowIndex));

                    if (section === "customers" && isDirectorySearch) {
                      return (
                        <button
                          key={rowKey}
                          type="button"
                          onClick={() => setSelectedCustomerKey(rowKey)}
                          className={`flex w-full items-center justify-between gap-4 rounded-md px-4 py-3 text-left sm:px-5 sm:py-4 bg-[#ffe8d6]/80 hover:bg-[#ffe8d6]/95 ${shopHeroOpaqueSurfaceClass} focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008000]`}
                        >
                          <div className="min-w-0">
                            <p className="text-base font-bold text-[#008000]">{customer.name ?? "—"}</p>
                            <p className="text-sm font-semibold text-blue-700">{displayPhone(customer.phone)}</p>
                          </div>
                          <VehiclesColumn count={vehicleCount(customer)} />
                        </button>
                      );
                    }

                    if (section === "my-list") {
                      const listKey = customerRowKey(customer, String(rowIndex));
                      return (
                        <MyListCustomerCard
                          key={listKey}
                          customer={customer}
                          onSelect={() => setSelectedCustomerKey(listKey)}
                        />
                      );
                    }

                    return (
                      <StripedCustomerRow
                        key={rowKey}
                        customer={customer}
                        index={rowIndex}
                        onSelect={() => setSelectedCustomerKey(rowKey)}
                      />
                    );
                  })}
                </ShopListPanel>

                <ShopListFooter>
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
                            className={`flex h-8 min-w-8 items-center justify-center rounded-sm px-2 text-sm font-bold ${isActive
                                ? "bg-gray-500 text-white"
                                : "border border-gray-400 bg-white/90 text-gray-700 hover:bg-gray-100"
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
      </ShopViewTransition>
    </ShopPageShell>
  );
}
