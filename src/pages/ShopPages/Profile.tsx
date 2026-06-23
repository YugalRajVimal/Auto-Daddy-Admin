import { useState } from "react";
import { Link } from "react-router";
import { ContentPanel } from "../../components/admin/ContentPanel";
import ShopPageShell from "../../components/shop/ShopPageShell";
import {
  ShopBusinessProfileEditor,
  ShopOpenHoursEditor,
  ShopPersonalProfileEditor,
} from "../../components/shop/forms/ShopProfileEditors";
import {
  ShopEmptyPanel,
  ShopLoadingPanel,
  ShopRefreshButton,
} from "../../components/shop/ShopPanels";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { useShopServices } from "../../hooks/useShopServices";

const PROFILE_SECTIONS = [
  { id: "personal", label: "Personal Profile", variant: "primary" as const },
  { id: "business", label: "Business Profile", variant: "primary" as const },
  { id: "open", label: "Shop is Open", variant: "primary" as const },
  { id: "brands", label: "Car Brands Specialist", variant: "primary" as const },
  { id: "services", label: "Operational Services", variant: "primary" as const },
  { id: "team", label: "Team Members", variant: "primary" as const },
  { id: "website", label: "My website", variant: "primary" as const },
  { id: "subscription", label: "Subscription", variant: "primary" as const },
  { id: "days-left", label: "Days Left", variant: "secondary" as const },
];

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value?.trim() || "—"}</p>
    </div>
  );
}

export default function ShopProfilePage() {
  const {
    user,
    business,
    teamMembers,
    daysLeft,
    subscriptions,
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

  const renderContent = () => {
    if (loading) return <ShopLoadingPanel />;

    switch (activeId) {
      case "personal":
        return (
          <ContentPanel title="Personal Profile" action={<ShopPersonalProfileEditor user={user} onSaved={() => void refresh()} />}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" value={user?.name} />
              <Field label="Phone" value={user?.phone} />
              <Field label="email" value={user?.email} />
              <Field label="Address" value={user?.address} />
              <Field label="Pincode" value={user?.pincode} />
            </div>
          </ContentPanel>
        );
      case "business":
        return (
          <ContentPanel title="Business Profile" action={<ShopBusinessProfileEditor business={business} onSaved={() => void refresh()} />}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Business Name" value={business?.businessName} />
              <Field label="Phone" value={business?.businessPhone} />
              <Field label="email" value={business?.email} />
              <Field label="City" value={business?.city} />
              <Field label="Address" value={business?.address} />
              <Field label="HST Number" value={business?.hstNumber} />
            </div>
          </ContentPanel>
        );
      case "open":
        return (
          <ContentPanel title="Shop is Open">
            {isBusinessActive != null ? (
              <label className="mb-4 flex items-center gap-3 text-sm font-semibold text-ad-purple">
                <input
                  type="checkbox"
                  checked={isBusinessActive}
                  disabled={updatingActive}
                  onChange={(e) => void setBusinessActive(e.target.checked)}
                  className="h-5 w-5 accent-ad-purple"
                />
                {isBusinessActive ? "Your shop is currently open" : "Your shop is currently closed"}
              </label>
            ) : null}
            <ShopOpenHoursEditor perDayOpenHours={business?.perDayOpenHours} onSaved={() => void refresh()} />
          </ContentPanel>
        );
      case "brands":
        return (
          <ContentPanel title="Car Brands Specialist">
            <p className="mb-3 text-sm text-gray-600">Select the car brands your shop specializes in.</p>
            <Link to="/shop/profile/car-companies" className="font-semibold text-ad-purple hover:underline">
              Manage car brands →
            </Link>
          </ContentPanel>
        );
      case "services":
        return servicesLoading ? (
          <ShopLoadingPanel />
        ) : (
          <ContentPanel title="Operational Services">
            <p className="mb-3 text-sm text-gray-600">
              <Link to="/shop/profile/services-selection" className="font-semibold text-ad-purple hover:underline">
                Select service categories →
              </Link>
              {" · "}
              <Link to="/shop/services" className="font-semibold text-ad-purple hover:underline">
                Manage sub-services →
              </Link>
            </p>
            {categories.length === 0 ? (
              <p className="text-sm text-gray-600">No services configured yet.</p>
            ) : (
              <ul className="space-y-3">
                {categories.map((cat) => (
                  <li key={cat.id} className="rounded-md border border-gray-200 bg-white p-3">
                    <p className="font-bold text-[#006600]">{cat.name ?? "Service"}</p>
                    {cat.subServices.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-sm text-gray-700">
                        {cat.subServices.map((sub) => (
                          <li key={sub.id ?? sub.name}>
                            {sub.name} — ${sub.price.toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-xs text-gray-500">No sub-services</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </ContentPanel>
        );
      case "team":
        return (
          <ContentPanel title="Team Members">
            <p className="mb-3">
              <Link to="/shop/team" className="font-semibold text-ad-purple hover:underline">
                Manage team →
              </Link>
            </p>
            {teamMembers.length === 0 ? (
              <p className="text-sm text-gray-600">No team members yet.</p>
            ) : (
              <ul className="space-y-2">
                {teamMembers.map((m) => (
                  <li
                    key={m._id ?? m.id ?? m.name}
                    className="flex items-center justify-between rounded-md bg-[#CCFFCC] px-4 py-3"
                  >
                    <div>
                      <p className="font-bold text-gray-900">{m.name}</p>
                      <p className="text-sm text-gray-600">{m.designation}</p>
                    </div>
                    <span className="text-xs font-semibold text-[#006600]">
                      {m.isActive === false ? "Inactive" : "Active"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </ContentPanel>
        );
      case "website":
        return (
          <ContentPanel title="My Website">
            <p className="text-sm text-gray-600">
              Website subscription and templates are managed via the website section. Contact support for domain setup.
            </p>
          </ContentPanel>
        );
      case "subscription":
      case "days-left":
        return (
          <ContentPanel title="Subscription">
            {daysLeft != null ? (
              <p className="text-3xl font-bold text-[#008000]">{daysLeft} days left</p>
            ) : (
              <p className="text-sm text-gray-600">No subscription data.</p>
            )}
            {subscriptions.length > 0 ? (
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                {subscriptions.map((s, i) => (
                  <li key={i}>
                    {s.planName ?? "Plan"} — {s.daysLeft ?? "—"} days
                  </li>
                ))}
              </ul>
            ) : null}
          </ContentPanel>
        );
      default:
        return <ShopEmptyPanel message="Section not found." />;
    }
  };

  return (
    <ShopPageShell
      metaTitle="Profile | AutoDaddy"
      metaDescription="Auto shop owner profile"
      sidebarItems={PROFILE_SECTIONS}
      activeSidebarId={activeId}
      onSidebarSelect={setActiveId}
      headerAction={<ShopRefreshButton onClick={() => void refresh()} />}
      onFaqsOpen={() => setFaqsOpen(true)}
      onFaqsClose={() => setFaqsOpen(false)}
      faqsOpen={faqsOpen}
      faqsHeading={faqsHeading}
      faqsDescription={faqsDescription}
    >
      <div className="flex min-h-[420px] flex-1 flex-col gap-4 lg:min-h-[calc(100vh-220px)]">{renderContent()}</div>
    </ShopPageShell>
  );
}
