import { useCallback, useState } from "react";
import { Outlet, useLocation } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { PortalPageContent } from "../../components/admin/PortalPageContent";
import OwnerFaqsDialog from "../../components/owner/OwnerFaqsDialog";
import { StickyFaqsButton } from "../../components/owner/OwnerFaqsButton";
import ShopBusinessProfileCard from "../../components/shop/ShopBusinessProfileCard";
import ShopHeroCardToolbar from "../../components/shop/ShopHeroCardToolbar";
import ShopPrimaryNav from "../../components/shop/ShopPrimaryNav";
import ShopProfileHeroPanel from "../../components/shop/ShopProfileHeroPanel";
import {
  shopHeroCardScrollBodyClass,
  shopHeroCardScrollClass,
  shopHeroCardScrollContentClass,
  shopHeroCardScrollContentTopClass,
  shopMainContentFillClass,
  shopNavRowNavClass,
  shopNavRowSlotClass,
  shopPageBodyGridClass,
  shopPortalBottomPaddingClass,
  shopPortalHorizPaddingClass,
  shopPortalTopPaddingClass,
} from "../../components/shop/shopLayoutStyles";
import ShopSidebar from "../../components/shop/ShopSidebar";
import { shopPrimaryNav } from "../../config/shopNav";
import {
  DEFAULT_SHOP_PAGE_CHROME,
  useShopPageChromeContext,
} from "../../context/ShopPageChromeContext";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";

export default function ShopPageLayout() {
  const location = useLocation();
  const { chrome } = useShopPageChromeContext();
  const { faqsHeading, faqsDescription } = useShopOwnerPortal();
  const [localFaqsOpen, setLocalFaqsOpen] = useState(false);

  const faqsOpen = chrome.faqsOpen === true || localFaqsOpen;
  const openFaqs = useCallback(() => {
    if (chrome.onFaqsOpen) chrome.onFaqsOpen();
    else setLocalFaqsOpen(true);
  }, [chrome.onFaqsOpen]);
  const closeFaqs = useCallback(() => {
    if (chrome.onFaqsClose) chrome.onFaqsClose();
    setLocalFaqsOpen(false);
  }, [chrome.onFaqsClose]);

  const metaTitle = chrome.metaTitle ?? DEFAULT_SHOP_PAGE_CHROME.metaTitle!;
  const metaDescription = chrome.metaDescription ?? DEFAULT_SHOP_PAGE_CHROME.metaDescription!;
  const showBusinessCard = chrome.sidebarVariant === "business-card";
  const useHeroCard = chrome.heroCard !== false;
  const showSearch = chrome.searchPlaceholder != null;
  const showToolbar = showSearch || chrome.headerAction || chrome.heroCardToolbarAlways;
  // Remount page content on every route change so each page re-fetches fresh API data.
  const pageOutlet = <Outlet key={location.pathname} />;

  const sidebarCell = showBusinessCard ? (
    <ShopBusinessProfileCard />
  ) : (
    <ShopSidebar
      items={chrome.sidebarItems ?? []}
      activeId={chrome.activeSidebarId}
      onSelect={chrome.onSidebarSelect}
      heading={chrome.sidebarHeading}
      headingClassName={chrome.sidebarHeadingClassName}
      footer={chrome.sidebarFooter}
      loading={chrome.sidebarLoading}
      skeletonCount={chrome.sidebarSkeletonCount}
      shopStyle
    >
      {chrome.sidebarExtra}
    </ShopSidebar>
  );

  const scrollRegionClass = chrome.contentFillHeight
    ? "no-scrollbar flex min-h-0 flex-1 flex-col overflow-hidden"
    : shopHeroCardScrollClass;

  const scrollBodyClass = chrome.contentFillHeight
    ? "flex h-full min-h-0 flex-1 flex-col"
    : shopHeroCardScrollBodyClass;

  const scrollContentClass = chrome.contentFillHeight
    ? `${shopHeroCardScrollContentTopClass} ${shopMainContentFillClass} h-full min-h-0`
    : chrome.contentTopOffset
      ? shopHeroCardScrollContentTopClass
      : shopHeroCardScrollContentClass;

  const pageContent = useHeroCard ? (
    <ShopProfileHeroPanel
      showBackgroundImage={chrome.heroBackgroundImage !== false}
      flush={chrome.heroCardFlush === true}
      transparent={chrome.heroCardTransparent === true}
    >
      <div className={`flex h-full min-h-0 w-full flex-col ${chrome.heroCardFlush ? "gap-1" : "gap-3"}`}>
        {showToolbar ? (
          <ShopHeroCardToolbar
            searchInputId={chrome.searchInputId}
            searchPlaceholder={chrome.searchPlaceholder}
            searchValue={chrome.searchValue}
            onSearchChange={chrome.onSearchChange}
            headerAction={chrome.headerAction}
            alwaysShow={chrome.heroCardToolbarAlways}
          />
        ) : null}
        <div className={scrollRegionClass}>
          <div className={scrollBodyClass}>
            <div className={scrollContentClass}>
              {pageOutlet}
            </div>
          </div>
        </div>
      </div>
    </ShopProfileHeroPanel>
  ) : (
    pageOutlet
  );

  return (
    <PortalPageContent
      className={`flex min-h-0 flex-1 flex-col overflow-hidden ${shopPortalTopPaddingClass} ${shopPortalBottomPaddingClass} ${shopPortalHorizPaddingClass}`}
    >
      <PageMeta title={metaTitle} description={metaDescription} />

      <div className={shopPageBodyGridClass}>
        <div
          className={`order-1 lg:col-start-1 lg:row-start-1 lg:self-center ${shopNavRowSlotClass}`}
        >
          {chrome.sidebarHeader ?? (
            <span className="hidden lg:block lg:size-10" aria-hidden />
          )}
        </div>

        <ShopPrimaryNav
          homePath="/shop"
          primaryNav={shopPrimaryNav}
          className={`order-2 lg:order-1 lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:justify-self-stretch lg:self-center ${shopNavRowNavClass}`}
        />

        <div className="order-3 min-h-0 lg:order-2 lg:col-start-1 lg:row-start-2 lg:self-start">
          {sidebarCell}
        </div>

        <div className="order-4 flex min-h-0 min-w-0 flex-col overflow-hidden lg:order-3 lg:col-start-2 lg:row-start-2">
          {pageContent}
        </div>
      </div>

      <StickyFaqsButton onClick={openFaqs} />
      <OwnerFaqsDialog
        open={faqsOpen}
        onClose={closeFaqs}
        heading={chrome.faqsHeading ?? faqsHeading}
        description={chrome.faqsDescription ?? faqsDescription}
      />
    </PortalPageContent>
  );
}
