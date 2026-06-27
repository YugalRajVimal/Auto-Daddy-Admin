import { useCallback, useMemo, useState } from "react";
import ShopHeroPanel from "../../components/shop/ShopHeroPanel";
import ShopHomeAdsPanel from "../../components/shop/ShopHomeAdsPanel";
import ShopPageShell from "../../components/shop/ShopPageShell";
import { usePartsDealers, type PartsDealerCard } from "../../hooks/usePartsDealers";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import type { SalvageDeal } from "../../lib/dummySalvageDeals";

export default function ShopHomePage() {
  const { thoughtOfTheDay, faqsHeading, faqsDescription, loading } = useShopOwnerPortal();
  const { dealers, loading: dealersLoading } = usePartsDealers();
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [selectedPartsDealer, setSelectedPartsDealer] = useState<PartsDealerCard | null>(null);
  const [selectedSalvageDeal, setSelectedSalvageDeal] = useState<SalvageDeal | null>(null);

  const adDetailOpen = selectedPartsDealer != null || selectedSalvageDeal != null;

  const closeAdDetail = useCallback(() => {
    setSelectedPartsDealer(null);
    setSelectedSalvageDeal(null);
  }, []);

  const handlePartsDealerSelect = useCallback((dealer: PartsDealerCard) => {
    setSelectedSalvageDeal(null);
    setSelectedPartsDealer(dealer);
  }, []);

  const handleSalvageDealSelect = useCallback((deal: SalvageDeal) => {
    setSelectedPartsDealer(null);
    setSelectedSalvageDeal(deal);
  }, []);

  const openFaqs = useCallback(() => setFaqsOpen(true), []);
  const closeFaqs = useCallback(() => setFaqsOpen(false), []);

  const sidebarExtra = useMemo(
    () => (
      <ShopHomeAdsPanel
        partsDealers={dealers}
        loading={dealersLoading}
        onPartsDealerSelect={handlePartsDealerSelect}
        onSalvageDealSelect={handleSalvageDealSelect}
        detailOpen={adDetailOpen}
      />
    ),
    [dealers, dealersLoading, handlePartsDealerSelect, handleSalvageDealSelect, adDetailOpen],
  );

  return (
    <ShopPageShell
      pageHeading="Dashboard"
      metaTitle="Home | AutoDaddy"
      metaDescription="Auto shop owner home"
      sidebarExtra={sidebarExtra}
      heroCard={false}
      onFaqsOpen={openFaqs}
      onFaqsClose={closeFaqs}
      faqsOpen={faqsOpen}
      faqsHeading={faqsHeading}
      faqsDescription={faqsDescription}
    >
      <ShopHeroPanel
        thoughtOfTheDay={thoughtOfTheDay}
        loading={loading}
        partsDealer={selectedPartsDealer}
        salvageDeal={selectedSalvageDeal}
        onAdClose={closeAdDetail}
      />
    </ShopPageShell>
  );
}
