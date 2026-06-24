import { useCallback, useState } from "react";
import ShopHeroPanel from "../../components/shop/ShopHeroPanel";
import ShopHomeAdsPanel, { type ShopAdPhase } from "../../components/shop/ShopHomeAdsPanel";
import ShopPageShell from "../../components/shop/ShopPageShell";
import { usePartsDealers } from "../../hooks/usePartsDealers";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";

const SIDEBAR_HEADINGS: Record<ShopAdPhase, string> = {
  parts: "Auto Parts dealer",
  salvage: "Salvage Deals",
};

export default function ShopHomePage() {
  const { thoughtOfTheDay, faqsHeading, faqsDescription, loading } = useShopOwnerPortal();
  const { dealers, loading: dealersLoading } = usePartsDealers();
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [adPhase, setAdPhase] = useState<ShopAdPhase>("parts");

  const handlePhaseChange = useCallback((phase: ShopAdPhase) => {
    setAdPhase(phase);
  }, []);

  return (
    <ShopPageShell
      metaTitle="Home | AutoDaddy"
      metaDescription="Auto shop owner home"
      sidebarHeading={SIDEBAR_HEADINGS[adPhase]}
      sidebarExtra={
        <div className="mb-2">
          <ShopHomeAdsPanel
            partsDealers={dealers}
            loading={dealersLoading}
            onPhaseChange={handlePhaseChange}
          />
        </div>
      }
      onFaqsOpen={() => setFaqsOpen(true)}
      onFaqsClose={() => setFaqsOpen(false)}
      faqsOpen={faqsOpen}
      faqsHeading={faqsHeading}
      faqsDescription={faqsDescription}
    >
      <ShopHeroPanel thoughtOfTheDay={thoughtOfTheDay} loading={loading} />
    </ShopPageShell>
  );
}
