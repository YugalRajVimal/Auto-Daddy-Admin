import { useState } from "react";
import ShopHeroPanel from "../../components/shop/ShopHeroPanel";
import ShopHomeAdsPanel from "../../components/shop/ShopHomeAdsPanel";
import ShopPageShell from "../../components/shop/ShopPageShell";
import { usePartsDealers } from "../../hooks/usePartsDealers";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";

export default function ShopHomePage() {
  const { thoughtOfTheDay, faqsHeading, faqsDescription, loading } = useShopOwnerPortal();
  const { dealers, loading: dealersLoading } = usePartsDealers();
  const [faqsOpen, setFaqsOpen] = useState(false);

  return (
    <ShopPageShell
      pageHeading="Dashboard"
      metaTitle="Home | AutoDaddy"
      metaDescription="Auto shop owner home"
      sidebarExtra={
        <ShopHomeAdsPanel partsDealers={dealers} loading={dealersLoading} />
      }
      contentTopOffset={false}
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
