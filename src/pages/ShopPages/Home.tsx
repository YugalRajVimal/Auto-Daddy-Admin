import { useCallback, useMemo, useState } from "react";
import ShopHeroPanel from "../../components/shop/ShopHeroPanel";
import ShopHomeAdsPanel from "../../components/shop/ShopHomeAdsPanel";
import ShopPageShell from "../../components/shop/ShopPageShell";
import { usePartsDealers } from "../../hooks/usePartsDealers";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";

export default function ShopHomePage() {
  const { thoughtOfTheDay, faqsHeading, faqsDescription, loading } = useShopOwnerPortal();
  const { dealers, loading: dealersLoading } = usePartsDealers();
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const handleMenuClick = useCallback(() => {
    setMenuOpen(true);
  }, []);

  const openFaqs = useCallback(() => setFaqsOpen(true), []);
  const closeFaqs = useCallback(() => setFaqsOpen(false), []);

  const sidebarExtra = useMemo(
    () => (
      <ShopHomeAdsPanel
        partsDealers={dealers}
        loading={dealersLoading}
        onMenuClick={handleMenuClick}
        detailOpen={menuOpen}
      />
    ),
    [dealers, dealersLoading, handleMenuClick, menuOpen],
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
        menuOpen={menuOpen}
        onMenuClose={closeMenu}
      />
    </ShopPageShell>
  );
}
