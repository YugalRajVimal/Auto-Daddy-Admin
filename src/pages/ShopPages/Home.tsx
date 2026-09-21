import { useCallback, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import ShopHeroPanel from "../../components/shop/ShopHeroPanel";
import ShopHomeAdsPanel from "../../components/shop/ShopHomeAdsPanel";
import ShopInvoiceTemplateSettings from "../../components/shop/ShopInvoiceTemplateSettings";
import ShopOverviewPanel from "../../components/shop/ShopOverviewPanel";
import ShopPageShell from "../../components/shop/ShopPageShell";
import ShopWhatsNewPanel from "../../components/shop/ShopWhatsNewPanel";
import { ShopLinkCard } from "../../components/shop/shopUi";
import { usePartsDealers } from "../../hooks/usePartsDealers";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";

const HOME_SECTIONS = [
  { id: "dashboard", label: "Dash Board", variant: "primary" as const },
  { id: "settings", label: "Settings", variant: "primary" as const },
  { id: "overview", label: "Overview", variant: "primary" as const },
  { id: "whats-new", label: "What's New", variant: "primary" as const },
];

type HomeSection = "dashboard" | "settings" | "overview" | "whats-new";
type SettingsView = "list" | "invoice-templates";

const SECTION_HEADINGS: Record<HomeSection, string> = {
  dashboard: "Thought of the Day...",
  settings: "Settings",
  overview: "Overview",
  "whats-new": "What's New",
};

function isHomeSection(value: string | null): value is HomeSection {
  return HOME_SECTIONS.some((section) => section.id === value);
}

export default function ShopHomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { thoughtOfTheDay, faqsHeading, faqsDescription, loading } = useShopOwnerPortal();
  const { dealers, loading: dealersLoading } = usePartsDealers();
  const [faqsOpen, setFaqsOpen] = useState(false);

  const openFaqs = useCallback(() => setFaqsOpen(true), []);
  const closeFaqs = useCallback(() => setFaqsOpen(false), []);

  const sectionParam = searchParams.get("section");
  const section: HomeSection = isHomeSection(sectionParam) ? sectionParam : "dashboard";
  const settingsView: SettingsView =
    section === "settings" && searchParams.get("view") === "invoice-templates" ? "invoice-templates" : "list";

  const selectSection = useCallback(
    (id: string) => {
      setSearchParams(id === "dashboard" ? {} : { section: id }, { replace: true });
    },
    [setSearchParams],
  );

  const openInvoiceTemplates = () => {
    setSearchParams({ section: "settings", view: "invoice-templates" });
  };

  const sidebarExtra = useMemo(
    () => <ShopHomeAdsPanel partsDealers={dealers} loading={dealersLoading} />,
    [dealers, dealersLoading],
  );

  const inInvoiceTemplates = settingsView === "invoice-templates";

  const renderContent = () => {
    switch (section) {
      case "settings":
        if (inInvoiceTemplates) return <ShopInvoiceTemplateSettings />;
        return (
          <div className="flex flex-col gap-8 py-4">
            <ShopLinkCard title="Invoice Templates" onClick={openInvoiceTemplates} />
            <ShopLinkCard
              title="Website Templates"
              onClick={() => navigate("/shop/my-website?section=templates")}
            />
            <ShopLinkCard
              title="Subscription Model"
              onClick={() => navigate("/shop/my-website?section=subscription")}
            />
          </div>
        );
      case "overview":
        return <ShopOverviewPanel />;
      case "whats-new":
        return <ShopWhatsNewPanel />;
      default:
        return (
          <ShopHeroPanel thoughtOfTheDay={thoughtOfTheDay} loading={loading} />
        );
    }
  };

  return (
    <ShopPageShell
      pageHeading={inInvoiceTemplates ? "Invoice Templates" : SECTION_HEADINGS[section]}
      pageHeadingParent={inInvoiceTemplates ? "Settings" : undefined}
      metaTitle="Home | AutoDaddy"
      metaDescription="Auto shop owner home"
      sidebarItems={HOME_SECTIONS}
      activeSidebarId={section}
      onSidebarSelect={selectSection}
      sidebarExtra={sidebarExtra}
      heroCard={section !== "dashboard"}
      contentTopOffset
      onFaqsOpen={openFaqs}
      onFaqsClose={closeFaqs}
      faqsOpen={faqsOpen}
      faqsHeading={faqsHeading}
      faqsDescription={faqsDescription}
    >
      {renderContent()}
    </ShopPageShell>
  );
}
