import { useCallback, useMemo, useState } from "react";
import ShopHeroPanel from "../../components/shop/ShopHeroPanel";
import ShopHomeAdsPanel from "../../components/shop/ShopHomeAdsPanel";
import ShopPageShell from "../../components/shop/ShopPageShell";
import { usePartsDealers, type PartsDealerCard } from "../../hooks/usePartsDealers";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";

export default function ShopHomePage() {
  const { thoughtOfTheDay, faqsHeading, faqsDescription, loading } = useShopOwnerPortal();
  const { dealers, loading: dealersLoading } = usePartsDealers();
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [selectedPartsDealer, setSelectedPartsDealer] = useState<PartsDealerCard | null>(null);

  const closeAdDetail = useCallback(() => {
    setSelectedPartsDealer(null);
  }, []);

  const handlePartsDealerSelect = useCallback((dealer: PartsDealerCard) => {
    setSelectedPartsDealer(dealer);
  }, []);

  const openFaqs = useCallback(() => setFaqsOpen(true), []);
  const closeFaqs = useCallback(() => setFaqsOpen(false), []);

  const sidebarExtra = useMemo(
    () => (
      <ShopHomeAdsPanel
        partsDealers={dealers}
        loading={dealersLoading}
        onPartsDealerSelect={handlePartsDealerSelect}
        detailOpen={selectedPartsDealer != null}
      />
    ),
    [dealers, dealersLoading, handlePartsDealerSelect, selectedPartsDealer],
  );

  return (
    <ShopPageShell
      pageHeading="Dashboard"
      metaTitle="Home | AutoDaddy"
      metaDescription="Auto shop owner home"
      sidebarExtra={sidebarExtra}
      heroCard={false}
      sidebarStretch
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
        onAdClose={closeAdDetail}
      />
    </ShopPageShell>
  );
}
