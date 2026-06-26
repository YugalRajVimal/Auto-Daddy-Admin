import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import CarOwnerAddEditForm, {
  type CarOwnerFormRecord,
} from "../../components/admin/CarOwnerAddEditForm";
import ShopPageShell from "../../components/shop/ShopPageShell";
import { ShopViewTransition } from "../../components/shop/ShopAnimated";
import { shopHeroCardBodyClass } from "../../components/shop/shopLayoutStyles";
import { ShopSidebarButton } from "../../components/shop/ShopSidebar";
import {
  ShopEmptyPanel,
  ShopErrorPanel,
  ShopListPanel,
  ShopListFooter,
  ShopLoadingPanel,
} from "../../components/shop/ShopPanels";
import { useAuth } from "../../auth";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { useShopCustomers } from "../../hooks/useShopCustomers";
import { searchCarOwners } from "../../lib/shopOwnerApi";
import { parseMyCustomers } from "../../lib/shopOwnerParsers";
import type { MyCustomer } from "../../types/shopOwner";

const PEOPLE_SECTIONS = [{ id: "customers", label: "My Customers", variant: "primary" as const }];

const PEOPLE_SEARCH_INPUT_ID = "shop-people-customer-search";

const PAGE_SIZE = 10;

function customerId(c: MyCustomer) {
  return c.carOwnerId ?? c.id ?? c._id ?? "";
}

function phoneDigits(phone?: string) {
  return (phone ?? "").replace(/\D/g, "");
}

function findCustomerByPhone(customers: MyCustomer[], digits: string): MyCustomer | undefined {
  if (digits.length !== 10) return undefined;
  return customers.find((c) => phoneDigits(c.phone) === digits);
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

function customerToOwnerForm(customer: MyCustomer): CarOwnerFormRecord {
  const id = customerId(customer);
  return {
    _id: id,
    name: customer.name ?? "",
    email: customer.email,
    phone: customer.phone,
    pincode: customer.pincode,
    address: customer.address,
    city: customer.city,
    createdAt: customer.createdAt,
    myVehicles: (customer.vehicles ?? []).map((v) => ({
      _id: v._id ?? v.vId ?? "",
      licensePlateNo: v.licensePlateNo,
      vinNo: v.vinNo,
      year: v.year,
      odometerReading: v.odometerReading,
      dueOdometerReading: v.dueOdometerReading,
      make: v.vehicleName ? { name: v.vehicleName, model: v.model ?? "" } : undefined,
    })),
  };
}

type CustomerFormState =
  | { mode: "add" }
  | { mode: "edit"; customer: MyCustomer }
  | { mode: "search"; intent: "find" | "vehicles" };

function CustomerCard({
  customer,
  onView,
}: {
  customer: MyCustomer;
  onView: (c: MyCustomer) => void;
}) {
  const id = customerId(customer);

  const body = (
    <article className="flex items-center gap-4 rounded-md border border-[#008000] bg-[#d4fcd4] p-3 sm:px-5 sm:py-4">
      <div
        className="h-16 w-16 shrink-0 rounded-sm border border-gray-300 bg-white"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-base font-bold text-[#008000]">{customer.name ?? "—"}</p>
        {customer.phone ? (
          <a
            href={`tel:${customer.phone.replace(/\s/g, "")}`}
            className="text-sm font-semibold text-blue-700 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {customer.phone}
          </a>
        ) : null}
      </div>
      {customer.recentJobCard?.date ? (
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold text-[#008000]">Recent Visited</p>
          <p className="text-sm font-bold text-blue-700">{customer.recentJobCard.date}</p>
        </div>
      ) : null}
    </article>
  );

  if (!id) {
    return body;
  }

  return (
    <button
      type="button"
      onClick={() => onView(customer)}
      className="block w-full rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#008000]"
    >
      {body}
    </button>
  );
}

export default function ShopPeoplePage() {
  const { token } = useAuth();
  const { faqsHeading, faqsDescription } = useShopOwnerPortal();
  const [search, setSearch] = useState("");
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [formState, setFormState] = useState<CustomerFormState | null>(null);
  const [page, setPage] = useState(1);
  const {
    customers: myCustomers,
    loading: listLoading,
    error: listError,
    refresh,
  } = useShopCustomers();

  const customers = useMemo(() => {
    const q = search.trim();
    if (!q) return myCustomers;
    return myCustomers.filter((customer) => matchesMyCustomerSearch(customer, q));
  }, [myCustomers, search]);
  const totalPages = Math.max(1, Math.ceil(customers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paginatedCustomers = useMemo(
    () => customers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [customers, safePage],
  );

  const lookupCustomerForForm = useCallback(
    async (digits: string): Promise<CarOwnerFormRecord | null> => {
      const local = findCustomerByPhone(myCustomers, digits);
      if (local) return customerToOwnerForm(local);
      if (!token) return null;
      try {
        const res = await searchCarOwners(token, digits);
        if (!res.ok) return null;
        const results = parseMyCustomers(res.data);
        const match = results.find((c) => phoneDigits(c.phone) === digits);
        return match ? customerToOwnerForm(match) : null;
      } catch {
        return null;
      }
    },
    [myCustomers, token],
  );

  useEffect(() => {
    setPage(1);
  }, [search, formState]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleFormSaved = async () => {
    const mode = formState?.mode;
    setFormState(null);
    if (mode === "edit") {
      toast.success("Customer updated.");
    } else if (mode === "search") {
      toast.success("Customer saved.");
    } else {
      toast.success("Customer saved.");
    }
    await refresh();
  };

  const showMyCustomers = () => {
    setSearch("");
    setFormState(null);
  };

  const showFindCustomer = () => {
    setFormState({ mode: "search", intent: "find" });
  };

  const showVehicles = () => {
    setFormState({ mode: "search", intent: "vehicles" });
  };

  const openAddCustomer = () => {
    setFormState({ mode: "add" });
  };

  const emptyMessage = search.trim() ? "No customers found." : "No customers yet.";
  const isSearchForm = formState?.mode === "search";

  return (
    <ShopPageShell
      title="My Customers"
      metaTitle="People | AutoDaddy"
      metaDescription="Auto shop customers"
      searchPlaceholder="Search my customers"
      searchValue={search}
      onSearchChange={setSearch}
      searchInputId={PEOPLE_SEARCH_INPUT_ID}
      sidebarItems={PEOPLE_SECTIONS}
      activeSidebarId={isSearchForm || formState ? null : "customers"}
      onSidebarSelect={() => showMyCustomers()}
      sidebarFooter={
        <div className="flex flex-col gap-3">
          <ShopSidebarButton label="Add New Customer" onClick={openAddCustomer} />
          <ShopSidebarButton
            label="Find Customer"
            active={isSearchForm && formState.intent === "find"}
            onClick={showFindCustomer}
          />
          <ShopSidebarButton
            label="Vehicles"
            active={isSearchForm && formState.intent === "vehicles"}
            onClick={showVehicles}
          />
        </div>
      }
      onFaqsOpen={() => setFaqsOpen(true)}
      onFaqsClose={() => setFaqsOpen(false)}
      faqsOpen={faqsOpen}
      faqsHeading={faqsHeading}
      faqsDescription={faqsDescription}
    >
      <ShopViewTransition
        viewKey={
          formState
            ? formState.mode === "add"
              ? "add-customer"
              : formState.mode === "search"
                ? `search-${formState.intent}`
                : `edit-${customerId(formState.customer)}`
            : "list"
        }
        className={shopHeroCardBodyClass}
      >
        {formState ? (
          <CarOwnerAddEditForm
            key={
              formState.mode === "add"
                ? "new-customer"
                : formState.mode === "search"
                  ? `search-customer-${formState.intent}`
                  : `edit-customer-${customerId(formState.customer)}`
            }
            apiVariant="shop"
            owner={
              formState.mode === "add" || formState.mode === "search"
                ? undefined
                : customerToOwnerForm(formState.customer)
            }
            phoneLookup={formState.mode === "search" || formState.mode === "add"}
            phoneLookupLockFields={formState.mode === "search"}
            vehiclesByPhone={formState.mode === "search" && formState.intent === "vehicles"}
            onLookupCustomer={
              formState.mode === "search" || formState.mode === "add"
                ? lookupCustomerForForm
                : undefined
            }
            onCancel={() => setFormState(null)}
            onSaved={() => void handleFormSaved()}
          />
        ) : (
          <>
            {listLoading ? (
              <ShopLoadingPanel variant="customer-card" count={5} />
            ) : listError ? (
              <ShopErrorPanel message={listError} onRetry={() => void refresh()} />
            ) : customers.length === 0 ? (
              <ShopEmptyPanel message={emptyMessage} />
            ) : (
              <>
                <ShopListPanel>
                  {paginatedCustomers.map((c) => (
                    <CustomerCard
                      key={customerId(c) || c.name}
                      customer={c}
                      onView={(customer) => setFormState({ mode: "edit", customer })}
                    />
                  ))}
                </ShopListPanel>

                <ShopListFooter>
                  <p>{customers.length} Entries</p>
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
                                ? "bg-[#008000] text-white"
                                : "border border-[#008000] bg-white text-[#008000] hover:bg-[#d4fcd4]"
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
