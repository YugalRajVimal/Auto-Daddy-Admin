import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import DashboardPanelCard from "../../components/COMP";
import CarBrandLogo from "../../components/shop/CarBrandLogo";
import ShopPageShell from "../../components/shop/ShopPageShell";
import {
  ShopBusinessProfileEditor,
  ShopCarBrandAddEditor,
  ShopOpenHoursEditor,
  ShopPersonalProfileEditor,
  type ShopCarCompany,
} from "../../components/shop/forms/ShopProfileEditors";
import { ShopLoadingPanel } from "../../components/shop/ShopPanels";
import { useAuth } from "../../auth";
import { addMyCarCompanies, fetchMainCarCompanies, removeMyCarCompanies } from "../../lib/shopOwnerMutations";
import {
  buildSelectedBrandIds,
  getCarBrandId,
  getCarBrandName,
  getSelectedCarBrands,
  isDummyCarBrandId,
  mergeCarBrandCatalog,
} from "../../lib/dummyCarBrands";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { useShopServices } from "../../hooks/useShopServices";

const PROFILE_SECTIONS = [
  { id: "personal", label: "Personal Profile", variant: "primary" as const },
  { id: "business", label: "Business Profile", variant: "primary" as const },
  { id: "open", label: "Opening Timings", variant: "primary" as const },
  { id: "brands", label: "Car Brands", variant: "primary" as const },
  { id: "services", label: "My Services", variant: "primary" as const },
  { id: "team", label: "Team Members", variant: "primary" as const },
];

const SECTION_TITLES: Record<string, string> = {
  personal: "Personal Profile",
  business: "Business Profile",
  open: "Opening Timings",
  brands: "Car Brand Specialist",
  services: "Operational Services",
  team: "Team Members",
};

function parseCompanies(payload: unknown): ShopCarCompany[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const data = root.data;
  const arr = Array.isArray(data) ? data : Array.isArray(root.companies) ? root.companies : [];
  return arr as ShopCarCompany[];
}

function ProfileSectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="relative mb-4 flex min-h-[36px] items-center justify-end">
      <h2 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-center text-lg font-bold text-blue-700 md:text-xl">
        {title}
      </h2>
      {action}
    </div>
  );
}

function AddNewButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md bg-[#008000] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#006600]"
    >
      + Add New
    </button>
  );
}

function AddNewLink({ to }: { to: string }) {
  return (
    <Link
      to={to}
      className="rounded-md bg-[#008000] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#006600]"
    >
      + Add New
    </Link>
  );
}

export default function ShopProfilePage() {
  const { token } = useAuth();
  const {
    user,
    business,
    teamMembers,
    isBusinessActive,
    updatingActive,
    setBusinessActive,
    faqsHeading,
    faqsDescription,
    loading,
    refresh,
  } = useShopOwnerPortal();
  const { categories, loading: servicesLoading } = useShopServices();
  const [activeId, setActiveId] = useState("personal");
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [carCompanies, setCarCompanies] = useState<ShopCarCompany[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [savingBrand, setSavingBrand] = useState<string | null>(null);
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [usingDummyBrands, setUsingDummyBrands] = useState(false);

  useEffect(() => {
    if (activeId !== "brands") return;

    const applyCatalog = (apiList: ShopCarCompany[]) => {
      const catalog = mergeCarBrandCatalog(apiList);
      const apiSelectedIds = apiList
        .filter((c) => (c as { selected?: boolean }).selected)
        .map((c) => getCarBrandId(c))
        .filter(Boolean);

      setCarCompanies(catalog);
      setSelectedBrands(buildSelectedBrandIds(catalog, apiSelectedIds));
      setUsingDummyBrands(apiList.length === 0);
      setBrandsLoading(false);
    };

    setBrandsLoading(true);
    if (!token) {
      applyCatalog([]);
      return;
    }

    void fetchMainCarCompanies(token).then((res) => {
      const apiList = res.ok ? parseCompanies(res.data) : [];
      applyCatalog(apiList);
    });
  }, [activeId, token]);

  const selectedBrandList = getSelectedCarBrands(carCompanies, selectedBrands);

  const removeBrand = async (company: ShopCarCompany) => {
    const id = getCarBrandId(company);
    const name = getCarBrandName(company);
    if (!window.confirm(`Remove ${name} from your car brands?`)) return;
    await toggleBrand(id, false);
  };

  const toggleBrand = async (id: string, next: boolean) => {
    if (!next && isDummyCarBrandId(id)) {
      setSelectedBrands((prev) => {
        const copy = new Set(prev);
        copy.delete(id);
        return copy;
      });
      return;
    }
    if (usingDummyBrands || isDummyCarBrandId(id)) {
      setSavingBrand(id);
      setSelectedBrands((prev) => {
        const copy = new Set(prev);
        if (next) copy.add(id);
        else copy.delete(id);
        return copy;
      });
      setSavingBrand(null);
      return;
    }
    if (!token) return;
    setSavingBrand(id);
    try {
      const res = next ? await addMyCarCompanies(token, [id]) : await removeMyCarCompanies(token, [id]);
      if (!res.ok) {
        toast.error("Could not update.");
        return;
      }
      setSelectedBrands((prev) => {
        const copy = new Set(prev);
        if (next) copy.add(id);
        else copy.delete(id);
        return copy;
      });
      void refresh();
    } finally {
      setSavingBrand(null);
    }
  };

  const renderContent = () => {
    if (loading) return <ShopLoadingPanel />;

    const sectionTitle = SECTION_TITLES[activeId] ?? "Profile";

    switch (activeId) {
      case "personal":
        return (
          <>
            <ProfileSectionHeader title={sectionTitle} />
            <ShopPersonalProfileEditor
              user={user}
              city={business?.city}
              onSaved={() => void refresh()}
            />
          </>
        );
      case "business":
        return (
          <>
            <ProfileSectionHeader title={sectionTitle} />
            <ShopBusinessProfileEditor
              business={business}
              zipCode={user?.pincode}
              onSaved={() => void refresh()}
            />
          </>
        );
      case "open":
        return (
          <>
            <ProfileSectionHeader title={sectionTitle} />
            <ShopOpenHoursEditor
              perDayOpenHours={business?.perDayOpenHours}
              isBusinessActive={isBusinessActive}
              updatingActive={updatingActive}
              onActiveChange={(next) => void setBusinessActive(next)}
              onSaved={() => void refresh()}
            />
          </>
        );
      case "brands":
        return (
          <>
            <ProfileSectionHeader
              title={sectionTitle}
              action={<AddNewButton onClick={() => setShowAddBrand((open) => !open)} />}
            />
            {showAddBrand && !brandsLoading ? (
              <ShopCarBrandAddEditor
                companies={carCompanies}
                selectedIds={selectedBrands}
                onSaveBrand={
                  usingDummyBrands
                    ? (id) => {
                        setSelectedBrands((prev) => new Set([...prev, id]));
                        return true;
                      }
                    : (id) => {
                        if (!isDummyCarBrandId(id)) return false;
                        setSelectedBrands((prev) => new Set([...prev, id]));
                        return true;
                      }
                }
                onSaved={(id) => {
                  if (!usingDummyBrands) {
                    setSelectedBrands((prev) => new Set([...prev, id]));
                    void refresh();
                  }
                  setShowAddBrand(false);
                }}
                onClose={() => setShowAddBrand(false)}
              />
            ) : null}
            {brandsLoading ? (
              <ShopLoadingPanel className="min-h-[280px] lg:min-h-[320px]" />
            ) : selectedBrandList.length === 0 ? (
              <p className="text-center text-sm text-gray-600">
                No car brands added yet. Click &ldquo;+ Add New&rdquo; to add one.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {selectedBrandList.map((company) => {
                    const id = getCarBrandId(company);
                    const name = company.name ?? company.companyName ?? "—";
                    return (
                      <DashboardPanelCard key={id} className="relative mb-0 aspect-square">
                        <div className="flex h-full flex-col justify-between">
                          <span className="text-center text-xs font-semibold text-gray-800">{name}</span>
                          <div className="flex flex-1 items-center justify-center rounded border border-gray-100 bg-white py-2">
                            <CarBrandLogo company={company} className="max-h-12 max-w-full object-contain" />
                          </div>
                          <button
                            type="button"
                            title={`Remove ${name}`}
                            aria-label={`Remove ${name}`}
                            disabled={savingBrand === id}
                            onClick={() => void removeBrand(company)}
                            className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                          >
                            <FiX size={14} />
                          </button>
                        </div>
                      </DashboardPanelCard>
                    );
                  })}
              </div>
            )}
          </>
        );
      case "services":
        return servicesLoading ? (
          <ShopLoadingPanel />
        ) : (
          <>
            <ProfileSectionHeader
              title={sectionTitle}
              action={<AddNewLink to="/shop/profile/services-selection" />}
            />
            {categories.length === 0 ? (
              <p className="text-center text-sm text-gray-600">No services configured yet.</p>
            ) : (
              <ul className="space-y-3">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <DashboardPanelCard className="mb-0">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 shrink-0 rounded border border-gray-300 bg-gray-100" />
                        <p className="min-w-0 flex-1 text-sm font-bold text-[#006600]">
                          {cat.name ?? "Service"}
                        </p>
                        <input
                          type="checkbox"
                          checked
                          readOnly
                          className="h-4 w-4 shrink-0 accent-ad-purple"
                          aria-label={`${cat.name ?? "Service"} selected`}
                        />
                      </div>
                    </DashboardPanelCard>
                  </li>
                ))}
              </ul>
            )}
          </>
        );
      case "team":
        return (
          <>
            <ProfileSectionHeader title={sectionTitle} action={<AddNewLink to="/shop/team/new" />} />
            {teamMembers.length === 0 ? (
              <p className="text-center text-sm text-gray-600">No team members yet.</p>
            ) : (
              <ul className="space-y-3">
                {teamMembers.map((member) => (
                  <li key={member._id ?? member.id ?? member.name}>
                    <DashboardPanelCard className="mb-0">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-gray-900">{member.name}</p>
                          <p className="text-sm text-gray-600">{member.designation}</p>
                        </div>
                        <span className="text-xs font-semibold text-[#006600]">
                          {member.isActive === false ? "Inactive" : "Active"}
                        </span>
                      </div>
                    </DashboardPanelCard>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-center">
              <Link to="/shop/team" className="text-sm font-semibold text-ad-purple hover:underline">
                Manage team →
              </Link>
            </p>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <ShopPageShell
      metaTitle="Profile | AutoDaddy"
      metaDescription="Auto shop owner profile"
      sidebarItems={PROFILE_SECTIONS}
      activeSidebarId={activeId}
      onSidebarSelect={setActiveId}
      sidebarHeading="Profile"
      sidebarHeadingClassName="font-serif text-2xl text-gray-600 md:text-3xl"
      onFaqsOpen={() => setFaqsOpen(true)}
      onFaqsClose={() => setFaqsOpen(false)}
      faqsOpen={faqsOpen}
      faqsHeading={faqsHeading}
      faqsDescription={faqsDescription}
    >
      <div className="min-w-0 flex-1 lg:min-h-[calc(100vh-220px)]">{renderContent()}</div>
    </ShopPageShell>
  );
}
