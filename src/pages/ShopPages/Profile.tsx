import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "react-toastify";
import DashboardPanelCard from "../../components/COMP";
import ShopPageShell from "../../components/shop/ShopPageShell";
import {
  ShopBusinessProfileEditor,
  ShopCarBrandAddEditor,
  ShopCarBrandList,
  ShopOpenHoursEditor,
  ShopPersonalProfileEditor,
  ShopServiceAddEditor,
  ShopServiceList,
  type ShopCarCompany,
} from "../../components/shop/forms/ShopProfileEditors";
import { shopAddNewButtonClass } from "../../components/shop/forms/ShopFormPage";
import { ShopReveal } from "../../components/shop/ShopAnimated";
import { ShopLoadingPanel } from "../../components/shop/ShopPanels";
import { shopHeroOnImageMutedTextClass } from "../../components/shop/shopLayoutStyles";
import { useAuth } from "../../auth";
import {
  addMyCarCompanies,
  fetchMainCarCompanies,
  fetchServiceCatalog,
  removeMyCarCompanies,
  updateServiceWeWorkWith,
} from "../../lib/shopOwnerMutations";
import { fetchMyServices } from "../../lib/shopOwnerApi";
import { parseMyServices } from "../../lib/shopOwnerParsers";
import {
  buildSelectedBrandIds,
  getCarBrandId,
  getCarBrandName,
  getSelectedCarBrands,
  isDummyCarBrandId,
  mergeCarBrandCatalog,
} from "../../lib/dummyCarBrands";
import {
  getInitialProfileServiceIds,
  getServiceId,
  getServiceName,
  isDummyServiceId,
  mergeServiceCatalog,
  parseServiceCatalog,
  resolveProfileSelectedServices,
} from "../../lib/dummyServices";
import { normalizeShopType } from "../../lib/shopTypes";
import type { ShopServiceCategory } from "../../types/shopOwner";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";

const PROFILE_SECTIONS = [
  { id: "personal", label: "Personal Profile", variant: "primary" as const },
  { id: "business", label: "Business Profile", variant: "primary" as const },
  { id: "open", label: "Shop is Open", variant: "primary" as const },
  { id: "brands", label: "Car Brand Specialist", variant: "primary" as const },
  { id: "services", label: "Operational Services", variant: "primary" as const },
];

const SECTION_TITLES: Record<string, string> = {
  personal: "Personal Profile",
  business: "Business Profile",
  open: "Shop is Open",
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

function AddNewButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={shopAddNewButtonClass}>
      + Add New
    </button>
  );
}

function AddNewLink({ to }: { to: string }) {
  return (
    <Link to={to} className={shopAddNewButtonClass}>
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
    faqsHeading,
    faqsDescription,
    loading,
    refresh,
  } = useShopOwnerPortal();
  const [activeId, setActiveId] = useState("personal");
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [carCompanies, setCarCompanies] = useState<ShopCarCompany[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [savingBrand, setSavingBrand] = useState<string | null>(null);
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [usingDummyBrands, setUsingDummyBrands] = useState(false);
  const [fullServiceCatalog, setFullServiceCatalog] = useState<ShopServiceCategory[]>([]);
  const [myServices, setMyServices] = useState<ShopServiceCategory[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [servicesCatalogLoading, setServicesCatalogLoading] = useState(false);
  const [usingDummyServices, setUsingDummyServices] = useState(false);
  const [myServicesLoading, setMyServicesLoading] = useState(false);
  const [savingService, setSavingService] = useState<string | null>(null);
  const [showAddService, setShowAddService] = useState(false);
  const [showAddHours, setShowAddHours] = useState(false);

  const refreshMyServices = async () => {
    if (!token) return;
    const res = await fetchMyServices(token);
    const list = res.ok ? parseMyServices(res.data) : [];
    setMyServices(list);
    setUsingDummyServices(false);
    setSelectedServiceIds(
      list.length > 0 ? new Set(list.map((service) => getServiceId(service))) : new Set()
    );
  };

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

  useEffect(() => {
    if (activeId !== "services") return;

    const applyCatalog = (apiList: ShopServiceCategory[]) => {
      setFullServiceCatalog(mergeServiceCatalog(apiList));
      setServicesCatalogLoading(false);
    };

    setServicesCatalogLoading(true);
    if (!token) {
      applyCatalog([]);
      return;
    }

    void fetchServiceCatalog(token)
      .then((res) => {
        const apiList = res.ok ? parseServiceCatalog(res.data) : [];
        applyCatalog(apiList);
      })
      .catch(() => {
        applyCatalog([]);
      });
  }, [activeId, token]);

  useEffect(() => {
    if (activeId !== "services") {
      setShowAddService(false);
      setMyServicesLoading(false);
      return;
    }
    if (servicesCatalogLoading) return;

    const applyMyServices = (list: ShopServiceCategory[], allowDummy: boolean) => {
      setMyServices(list);
      if (list.length > 0) {
        setUsingDummyServices(false);
        setSelectedServiceIds(new Set(list.map((service) => getServiceId(service))));
      } else if (allowDummy) {
        setUsingDummyServices(true);
        setSelectedServiceIds(getInitialProfileServiceIds([]));
      } else {
        setUsingDummyServices(false);
        setSelectedServiceIds(new Set());
      }
      setMyServicesLoading(false);
    };

    if (!token) {
      applyMyServices([], true);
      return;
    }

    setMyServicesLoading(true);
    let cancelled = false;
    void fetchMyServices(token)
      .then((res) => {
        if (cancelled) return;
        applyMyServices(res.ok ? parseMyServices(res.data) : [], false);
      })
      .catch(() => {
        if (cancelled) return;
        applyMyServices([], false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeId, servicesCatalogLoading, token]);

  const selectedBrandList = getSelectedCarBrands(carCompanies, selectedBrands);
  const shopType = normalizeShopType(user?.shopType ?? business?.shopType);
  const selectedServiceList = useMemo(
    () => resolveProfileSelectedServices(fullServiceCatalog, myServices, selectedServiceIds),
    [fullServiceCatalog, myServices, selectedServiceIds]
  );

  useEffect(() => {
    setShowAddHours(false);
  }, [activeId]);

  const headerAction = useMemo(() => {
    switch (activeId) {
      case "brands":
        return showAddBrand ? undefined : (
          <AddNewButton onClick={() => setShowAddBrand(true)} />
        );
      case "services":
        return showAddService ? undefined : (
          <AddNewButton onClick={() => setShowAddService(true)} />
        );
      case "team":
        return <AddNewLink to="/shop/team/new" />;
      default:
        return undefined;
    }
  }, [activeId, showAddBrand, showAddService]);

  const removeBrand = async (company: ShopCarCompany) => {
    const id = getCarBrandId(company);
    const name = getCarBrandName(company);
    if (!window.confirm(`Remove ${name} from your car brands?`)) return;
    await toggleBrand(id, false);
  };

  const removeService = async (category: ShopServiceCategory) => {
    const id = getServiceId(category);
    const name = getServiceName(category);
    if (!window.confirm(`Remove ${name} from your services?`)) return;

    if (usingDummyServices || isDummyServiceId(id)) {
      setSelectedServiceIds((prev) => {
        const copy = new Set(prev);
        copy.delete(id);
        return copy;
      });
      return;
    }
    if (!token) return;
    setSavingService(id);
    try {
      const remaining = [...selectedServiceIds].filter((serviceId) => serviceId !== id);
      const res = await updateServiceWeWorkWith(token, remaining);
      if (!res.ok) {
        toast.error("Could not update.");
        return;
      }
      setSelectedServiceIds(new Set(remaining));
      void refreshMyServices();
    } finally {
      setSavingService(null);
    }
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
    if (loading) return <ShopLoadingPanel className="flex-1" variant="form" />;

    switch (activeId) {
      case "personal":
        return (
          <ShopPersonalProfileEditor
            user={user}
            city={business?.city}
            onSaved={() => void refresh()}
          />
        );
      case "business":
        return (
          <ShopBusinessProfileEditor
            business={business}
            zipCode={user?.pincode}
            shopType={user?.shopType ?? business?.shopType}
            onSaved={() => void refresh()}
          />
        );
      case "open":
        return (
          <div className="space-y-1">
            {!showAddHours ? (
              <div className="flex justify-end">
                <AddNewButton onClick={() => setShowAddHours(true)} />
              </div>
            ) : null}
            <ShopOpenHoursEditor
              perDayOpenHours={business?.perDayOpenHours}
              onSaved={() => void refresh()}
              showAddForm={showAddHours}
              onAddFormClose={() => setShowAddHours(false)}
            />
          </div>
        );
      case "brands":
        return (
          <>
            <ShopReveal show={showAddBrand && !brandsLoading} className="mb-4">
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
            </ShopReveal>
            {brandsLoading ? (
              <ShopLoadingPanel variant="brand-grid" />
            ) : selectedBrandList.length === 0 ? (
              <p className={`text-center text-sm ${shopHeroOnImageMutedTextClass}`}>
                No car brands added yet. Click &ldquo;+ Add New&rdquo; to add one.
              </p>
            ) : (
              <ShopCarBrandList
                brands={selectedBrandList}
                savingBrandId={savingBrand}
                onRemove={(company) => void removeBrand(company)}
              />
            )}
          </>
        );
      case "services":
        if (servicesCatalogLoading) {
          return <ShopLoadingPanel variant="operational-services" />;
        }
        return (
          <>
            <ShopReveal show={showAddService} className="mb-4">
              <ShopServiceAddEditor
                services={fullServiceCatalog}
                selectedIds={selectedServiceIds}
                shopType={shopType}
                onSaveService={(id) => {
                  if (usingDummyServices || isDummyServiceId(id)) {
                    setSelectedServiceIds((prev) => new Set([...prev, id]));
                    return true;
                  }
                  if (!isDummyServiceId(id)) return false;
                  setSelectedServiceIds((prev) => new Set([...prev, id]));
                  return true;
                }}
                onSaved={(id) => {
                  if (!usingDummyServices && !isDummyServiceId(id)) {
                    setSelectedServiceIds((prev) => new Set([...prev, id]));
                    void refreshMyServices();
                  }
                  setShowAddService(false);
                }}
                onClose={() => setShowAddService(false)}
              />
            </ShopReveal>
            {myServicesLoading ? (
              <ShopLoadingPanel variant="profile-table" className="mt-4" />
            ) : selectedServiceList.length === 0 ? (
              <p className={`text-center text-sm ${shopHeroOnImageMutedTextClass}`}>
                No services added yet. Click &ldquo;+ Add New&rdquo; to add one.
              </p>
            ) : (
              <ShopServiceList
                services={selectedServiceList}
                savingServiceId={savingService}
                onRemove={(category) => void removeService(category)}
              />
            )}
          </>
        );
      case "team":
        return (
          <>
            {teamMembers.length === 0 ? (
              <p className={`text-center text-sm ${shopHeroOnImageMutedTextClass}`}>No team members yet.</p>
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
              <Link to="/shop/team" className="text-sm font-semibold text-white underline hover:text-white/80">
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
      pageHeading={SECTION_TITLES[activeId] ?? "Profile"}
      metaTitle="Profile | AutoDaddy"
      metaDescription="Auto shop owner profile"
      sidebarVariant="nav"
      sidebarItems={PROFILE_SECTIONS}
      activeSidebarId={activeId}
      onSidebarSelect={setActiveId}
      headerAction={headerAction}
      heroBackgroundImage={activeId === "open" ? false : undefined}
      contentTopOffset={activeId === "open"}
      heroCardFlush={activeId === "open"}
      onFaqsOpen={() => setFaqsOpen(true)}
      onFaqsClose={() => setFaqsOpen(false)}
      faqsOpen={faqsOpen}
      faqsHeading={faqsHeading}
      faqsDescription={faqsDescription}
    >
      {renderContent()}
    </ShopPageShell>
  );
}
