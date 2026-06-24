import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import CarOwnerAddEditForm, {
  type CarOwnerFormRecord,
} from "../../components/admin/CarOwnerAddEditForm";
import ShopPageShell from "../../components/shop/ShopPageShell";
import {
  ShopEmptyPanel,
  ShopErrorPanel,
  ShopListPanel,
  ShopLoadingPanel,
} from "../../components/shop/ShopPanels";
import { useAuth } from "../../auth";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { useShopCustomers } from "../../hooks/useShopCustomers";
import { addCarOwnerToMyCustomers, apiMessage } from "../../lib/shopOwnerMutations";
import type { MyCustomer } from "../../types/shopOwner";

const PEOPLE_SECTIONS = [{ id: "customers", label: "My Customers", variant: "primary" as const }];

const PAGE_SIZE = 10;

function customerId(c: MyCustomer) {
  return c.carOwnerId ?? c.id ?? c._id ?? "";
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
  | { mode: "view"; customer: MyCustomer }
  | { mode: "edit"; customer: MyCustomer };

function CustomerCard({
  customer,
  isSearch,
  addingId,
  onAdd,
  onView,
}: {
  customer: MyCustomer;
  isSearch: boolean;
  addingId: string | null;
  onAdd: (c: MyCustomer) => void;
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
        {isSearch ? (
          <button
            type="button"
            className="mt-1 text-xs font-semibold text-[#008000] hover:underline disabled:opacity-50"
            disabled={addingId === id}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAdd(customer);
            }}
          >
            {addingId === id ? "Adding…" : "Add to my customers"}
          </button>
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

  if (isSearch || !id) {
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
  const [addingId, setAddingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const { customers, loading, error, refresh } = useShopCustomers(search);

  const isSearch = Boolean(search.trim());
  const totalPages = Math.max(1, Math.ceil(customers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const paginatedList = useMemo(
    () => customers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [customers, safePage],
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleAddExisting = async (c: MyCustomer) => {
    if (!token) return;
    const id = customerId(c);
    if (!id) return;
    setAddingId(id);
    try {
      const res = await addCarOwnerToMyCustomers(token, id);
      if (!res.ok) {
        toast.error(apiMessage(res.data) || "Could not add customer.");
        return;
      }
      toast.success(apiMessage(res.data) || "Customer added.");
      void refresh();
    } finally {
      setAddingId(null);
    }
  };

  const handleFormSaved = () => {
    const wasEdit = formState?.mode === "edit";
    setFormState(null);
    toast.success(wasEdit ? "Customer updated." : "Customer created.");
    void refresh();
  };

  return (
    <ShopPageShell
      metaTitle="People | AutoDaddy"
      metaDescription="Auto shop customers"
      sidebarItems={PEOPLE_SECTIONS}
      activeSidebarId="customers"
      searchPlaceholder="Search customer"
      searchValue={search}
      onSearchChange={setSearch}
      onFaqsOpen={() => setFaqsOpen(true)}
      onFaqsClose={() => setFaqsOpen(false)}
      faqsOpen={faqsOpen}
      faqsHeading={faqsHeading}
      faqsDescription={faqsDescription}
    >
      <div className="flex min-h-[420px] flex-1 flex-col lg:min-h-[calc(100vh-220px)]">
        {formState ? (
          <CarOwnerAddEditForm
            key={
              formState.mode === "add"
                ? "new-customer"
                : `${formState.mode}-customer-${customerId(formState.customer)}`
            }
            apiVariant="shop"
            owner={
              formState.mode === "add" ? undefined : customerToOwnerForm(formState.customer)
            }
            readOnly={formState.mode === "view"}
            onUpdate={
              formState.mode === "view"
                ? () => setFormState({ mode: "edit", customer: formState.customer })
                : undefined
            }
            onCancel={() => setFormState(null)}
            onSaved={handleFormSaved}
          />
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h1 className="font-serif text-2xl font-bold text-gray-600 md:text-3xl">My Customers</h1>
              <button
                type="button"
                onClick={() => setFormState({ mode: "add" })}
                className="shrink-0 rounded-md bg-[#008000] px-4 py-2 text-sm font-bold text-white hover:bg-[#006600]"
              >
                + Add New
              </button>
            </div>

            {loading ? (
              <ShopLoadingPanel className="min-h-0 flex-1" />
            ) : error ? (
              <ShopErrorPanel className="min-h-0 flex-1" message={error} onRetry={() => void refresh()} />
            ) : customers.length === 0 ? (
              <ShopEmptyPanel className="min-h-0 flex-1" message="No customers yet." />
            ) : (
              <>
                <ShopListPanel className="min-h-0 flex-1">
                  {paginatedList.map((c) => (
                    <CustomerCard
                      key={customerId(c) || c.name}
                      customer={c}
                      isSearch={isSearch}
                      addingId={addingId}
                      onAdd={(customer) => void handleAddExisting(customer)}
                      onView={(customer) => setFormState({ mode: "view", customer })}
                    />
                  ))}
                </ShopListPanel>

                <footer className="mt-3 flex items-center justify-between gap-3 pt-2">
                  <p className="text-sm font-semibold text-blue-700">{customers.length} Entries</p>
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
                </footer>
              </>
            )}
          </>
        )}
      </div>
    </ShopPageShell>
  );
}
