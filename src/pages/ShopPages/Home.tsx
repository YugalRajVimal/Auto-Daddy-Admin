import { useCallback, useEffect, useMemo, useState } from "react";
import ShopHeroPanel from "../../components/shop/ShopHeroPanel";
import ShopHomeAdsPanel from "../../components/shop/ShopHomeAdsPanel";
import ShopHomeMenuButton from "../../components/shop/ShopHomeMenuButton";
import ShopPageShell from "../../components/shop/ShopPageShell";
import { useAuth } from "../../auth";
import { getJson } from "../../api/mobileAuth";
import { usePartsDealers } from "../../hooks/usePartsDealers";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";

export default function ShopHomePage() {
  const { thoughtOfTheDay, faqsHeading, faqsDescription, loading } = useShopOwnerPortal();
  const { dealers, loading: dealersLoading } = usePartsDealers();
  const { token } = useAuth();
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [homeApiOutput, setHomeApiOutput] = useState<unknown>(null);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (!token) return;
    let cancelled = false;
    (async () => {
      const res = await getJson<unknown>("/api/autoshopowner/home", token);
      if (!cancelled) setHomeApiOutput(res);
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

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

      {import.meta.env.DEV ? (
        <details style={{ marginTop: 16 }}>
          <summary style={{ cursor: "pointer" }}>DEV: `/api/autoshopowner/home` output</summary>
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(homeApiOutput, null, 2)}</pre>
        </details>
      ) : null}
    </ShopPageShell>
  );
}
