import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { toast } from "react-toastify";
import DashboardPanelCard from "../../components/COMP";
import ShopPageShell from "../../components/shop/ShopPageShell";
import {
  ShopBusinessProfileEditor,
  ShopOpenHoursEditor,
  ShopPersonalProfileEditor,
} from "../../components/shop/forms/ShopProfileEditors";
import { ShopLoadingPanel } from "../../components/shop/ShopPanels";
import { useAuth } from "../../auth";
import { addMyCarCompanies, fetchMainCarCompanies, removeMyCarCompanies } from "../../lib/shopOwnerMutations";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { useShopServices } from "../../hooks/useShopServices";

const PROFILE_SECTIONS = [
  { id: "personal", label: "Personal Profile", variant: "primary" as const },
  { id: "business", label: "Business Profile", variant: "primary" as const },
  { id: "open", label: "Opening Timings", variant: "primary" as const },
  { id: "brands", label: "Car Brands Specialist", variant: "primary" as const },
  { id: "services", label: "Operational Services", variant: "primary" as const },
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

type CarCompany = { _id?: string; id?: string; name?: string; companyName?: string };

function parseCompanies(payload: unknown): CarCompany[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const data = root.data;
  const arr = Array.isArray(data) ? data : Array.isArray(root.companies) ? root.companies : [];
  return arr as CarCompany[];
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

function AddNewButton({ to }: { to: string }) {
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
  const [carCompanies, setCarCompanies] = useState<CarCompany[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [savingBrand, setSavingBrand] = useState<string | null>(null);

  useEffect(() => {
    if (activeId !== "brands" || !token) return;
    setBrandsLoading(true);
    void fetchMainCarCompanies(token).then((res) => {
      if (res.ok) {
        const list = parseCompanies(res.data);
        setCarCompanies(list);
        const ids = list
          .filter((c) => (c as { selected?: boolean }).selected)
          .map((c) => String(c._id ?? c.id ?? ""));
        setSelectedBrands(new Set(ids.filter(Boolean)));
      }
      setBrandsLoading(false);
    });
  }, [activeId, token]);

  const toggleBrand = async (id: string, next: boolean) => {
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
              action={<AddNewButton to="/shop/profile/car-companies" />}
            />
            {brandsLoading ? (
              <ShopLoadingPanel className="min-h-[280px] lg:min-h-[320px]" />
            ) : carCompanies.length === 0 ? (
              <p className="text-center text-sm text-gray-600">No car brands available.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {carCompanies.map((company) => {
                  const id = String(company._id ?? company.id ?? "");
                  const name = company.name ?? company.companyName ?? "—";
                  const checked = selectedBrands.has(id);
                  return (
                    <DashboardPanelCard key={id} className="mb-0 aspect-square">
                      <label className="flex h-full cursor-pointer flex-col justify-between">
                        <span className="text-center text-xs font-semibold text-gray-800">{name}</span>
                        <span className="flex justify-end">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={savingBrand === id}
                            onChange={(e) => void toggleBrand(id, e.target.checked)}
                            className="h-4 w-4 accent-ad-purple"
                          />
                        </span>
                      </label>
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
              action={<AddNewButton to="/shop/profile/services-selection" />}
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
            <ProfileSectionHeader title={sectionTitle} action={<AddNewButton to="/shop/team/new" />} />
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
