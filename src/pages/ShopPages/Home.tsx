import { useState } from "react";
import ShopDealerCarousel from "../../components/shop/ShopDealerCarousel";
import ShopHeroPanel from "../../components/shop/ShopHeroPanel";
import ShopPageShell from "../../components/shop/ShopPageShell";
import { usePartsDealers } from "../../hooks/usePartsDealers";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";

export default function ShopHomePage() {
  const { thoughtOfTheDay, faqsHeading, faqsDescription, loading } = useShopOwnerPortal();
  const { dealers, loading: dealersLoading } = usePartsDealers();
  const [faqsOpen, setFaqsOpen] = useState(false);

  return (
    <ShopPageShell
      metaTitle="Home | AutoDaddy"
      metaDescription="Auto shop owner home"
      sidebarHeading="Auto Parts dealer"
      sidebarExtra={
        <div className="mb-2">
          <ShopDealerCarousel dealers={dealers} loading={dealersLoading} />
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
