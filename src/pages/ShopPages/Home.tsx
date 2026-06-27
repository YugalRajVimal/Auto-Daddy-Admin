import { useCallback, useMemo, useState } from "react";
import ShopHeroPanel from "../../components/shop/ShopHeroPanel";
import ShopHomeAdsPanel from "../../components/shop/ShopHomeAdsPanel";
import ShopHomeMenuButton from "../../components/shop/ShopHomeMenuButton";
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

  const sidebarHeader = useMemo(
    () => <ShopHomeMenuButton onClick={handleMenuClick} />,
    [handleMenuClick],
  );

  const sidebarExtra = useMemo(
    () => <ShopHomeAdsPanel partsDealers={dealers} loading={dealersLoading} detailOpen={menuOpen} />,
    [dealers, dealersLoading, menuOpen],
  );

  return (
    <ShopPageShell
      pageHeading="Dashboard"
      metaTitle="Home | AutoDaddy"
      metaDescription="Auto shop owner home"
      sidebarHeader={sidebarHeader}
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
