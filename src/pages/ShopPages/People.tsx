import { useState } from "react";
import { Link } from "react-router";
import { toast } from "react-toastify";
import ShopPageShell from "../../components/shop/ShopPageShell";
import {
  ShopEmptyPanel,
  ShopErrorPanel,
  ShopGreenRow,
  ShopListPanel,
  ShopLoadingPanel,
  ShopRefreshButton,
} from "../../components/shop/ShopPanels";
import { useAuth } from "../../auth";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { useShopCustomers } from "../../hooks/useShopCustomers";
import {
  addCarOwnerToMyCustomers,
  apiMessage,
  removeCarOwnerFromMyCustomers,
} from "../../lib/shopOwnerMutations";
import type { MyCustomer } from "../../types/shopOwner";

const PEOPLE_SECTIONS = [
  { id: "customers", label: "My Customers", variant: "primary" as const },
  { id: "visited", label: "Visited", variant: "secondary" as const },
];

function customerId(c: MyCustomer) {
  return c.carOwnerId ?? c.id ?? c._id ?? "";
}

export default function ShopPeoplePage() {
  const { token } = useAuth();
  const { faqsHeading, faqsDescription } = useShopOwnerPortal();
  const [activeId, setActiveId] = useState("customers");
  const [search, setSearch] = useState("");
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const { customers, loading, error, refresh } = useShopCustomers(search);

  const visited = customers.filter((c) => c.recentJobCard?.date);
  const list = activeId === "visited" ? visited : customers;
  const isSearch = Boolean(search.trim());

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

  const handleRemove = async (c: MyCustomer) => {
    if (!token) return;
    const id = customerId(c);
    if (!id || !window.confirm(`Remove ${c.name ?? "this customer"} from your list?`)) return;
    setRemovingId(id);
    try {
      const res = await removeCarOwnerFromMyCustomers(token, id);
      if (!res.ok) {
        toast.error(apiMessage(res.data) || "Could not remove customer.");
        return;
      }
      toast.success("Customer removed.");
      void refresh();
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <ShopPageShell
      title="People"
      metaTitle="People | AutoDaddy"
      metaDescription="Auto shop customers"
      sidebarItems={PEOPLE_SECTIONS}
      activeSidebarId={activeId}
      onSidebarSelect={setActiveId}
      searchPlaceholder="Search customer"
      searchValue={search}
      onSearchChange={setSearch}
      headerAction={
        <div className="flex items-center gap-2">
          <Link
            to="/shop/people/new"
            className="rounded-md bg-[#008000] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#006600]"
          >
            + Add
          </Link>
          <ShopRefreshButton onClick={() => void refresh()} />
        </div>
      }
      onFaqsOpen={() => setFaqsOpen(true)}
      onFaqsClose={() => setFaqsOpen(false)}
      faqsOpen={faqsOpen}
      faqsHeading={faqsHeading}
      faqsDescription={faqsDescription}
    >
      {loading ? (
        <ShopLoadingPanel />
      ) : error ? (
        <ShopErrorPanel message={error} onRetry={() => void refresh()} />
      ) : list.length === 0 ? (
        <ShopEmptyPanel message={activeId === "visited" ? "No visited customers yet." : "No customers yet."} />
      ) : (
        <ShopListPanel>
          {list.map((c) => {
            const id = customerId(c);
            const vehicles = c.vehicles ?? [];
            const vehicleLabel =
              vehicles.length > 0
                ? vehicles.map((v) => v.licensePlateNo ?? v.vehicleName).filter(Boolean).join(", ")
                : undefined;
            return (
              <ShopGreenRow
                key={id || c.name}
                left={<p className="text-sm font-bold leading-tight text-white">{c.city ?? "Customer"}</p>}
                center={
                  <div>
                    <p className="text-sm font-bold text-gray-900">{c.name ?? "—"}</p>
                    {c.phone ? (
                      <a
                        href={`tel:${c.phone.replace(/\s/g, "")}`}
                        className="text-sm font-semibold text-blue-700 hover:underline"
                      >
                        {c.phone}
                      </a>
                    ) : null}
                    {vehicleLabel ? <p className="text-xs text-gray-600">{vehicleLabel}</p> : null}
                    <div className="mt-1 flex flex-wrap gap-2">
                      {isSearch ? (
                        <button
                          type="button"
                          className="text-xs font-semibold text-[#008000] hover:underline disabled:opacity-50"
                          disabled={addingId === id}
                          onClick={() => void handleAddExisting(c)}
                        >
                          {addingId === id ? "Adding…" : "Add to my customers"}
                        </button>
                      ) : (
                        <>
                          <Link
                            to={`/shop/people/${id}/edit`}
                            state={{ customer: c }}
                            className="text-xs font-semibold text-ad-purple hover:underline"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                            disabled={removingId === id}
                            onClick={() => void handleRemove(c)}
                          >
                            {removingId === id ? "Removing…" : "Remove"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                }
                right={
                  c.recentJobCard?.date ? (
                    <div className="text-right">
                      <p className="text-xs font-semibold text-[#008000]">Last visit</p>
                      <p className="text-sm font-bold text-blue-700">{c.recentJobCard.date}</p>
                    </div>
                  ) : null
                }
              />
            );
          })}
        </ShopListPanel>
      )}
    </ShopPageShell>
  );
}
