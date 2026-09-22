import { useCallback, useState } from "react";
import { Navigate, useSearchParams } from "react-router";
import ShopHeroPanel from "../../components/shop/ShopHeroPanel";
import ShopOverviewPanel from "../../components/shop/ShopOverviewPanel";
import ShopPageShell from "../../components/shop/ShopPageShell";
import ShopWhatsNewPanel from "../../components/shop/ShopWhatsNewPanel";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";

const HOME_SECTIONS = [
  { id: "dashboard", label: "Dash Board", variant: "primary" as const },
  { id: "overview", label: "Overview", variant: "primary" as const },
  { id: "whats-new", label: "What's New", variant: "primary" as const },
];

type HomeSection = "dashboard" | "overview" | "whats-new";

const SECTION_HEADINGS: Record<HomeSection, string> = {
  dashboard: "Thought of the Day...",
  overview: "Overview",
  "whats-new": "What's New",
};

/** Settings was removed from Home; Invoice Templates now lives under Profile. */
const INVOICE_TEMPLATES_PATH = "/shop/profile?section=invoice-templates";

function isHomeSection(value: string | null): value is HomeSection {
  return HOME_SECTIONS.some((section) => section.id === value);
}

export default function ShopHomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { thoughtOfTheDay, faqsHeading, faqsDescription, loading } = useShopOwnerPortal();
  const [faqsOpen, setFaqsOpen] = useState(false);

  const openFaqs = useCallback(() => setFaqsOpen(true), []);
  const closeFaqs = useCallback(() => setFaqsOpen(false), []);

  const sectionParam = searchParams.get("section");
  const section: HomeSection = isHomeSection(sectionParam) ? sectionParam : "dashboard";

  const selectSection = useCallback(
    (id: string) => {
      setSearchParams(id === "dashboard" ? {} : { section: id }, { replace: true });
    },
    [setSearchParams],
  );

  if (sectionParam === "settings" && searchParams.get("view") === "invoice-templates") {
    return <Navigate to={INVOICE_TEMPLATES_PATH} replace />;
  }

  const renderContent = () => {
    switch (section) {
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
      pageHeading={SECTION_HEADINGS[section]}
      metaTitle="Home | AutoDaddy"
      metaDescription="Auto shop owner home"
      sidebarItems={HOME_SECTIONS}
      activeSidebarId={section}
      onSidebarSelect={selectSection}
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
