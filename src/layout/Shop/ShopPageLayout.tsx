// import { useCallback, useMemo, useState } from "react";
// import { Outlet, useLocation } from "react-router";
// import PageMeta from "../../components/common/PageMeta";
// import { PortalPageContent } from "../../components/admin/PortalPageContent";
// import OwnerFaqsDialog from "../../components/owner/OwnerFaqsDialog";
// import { StickyFaqsButton } from "../../components/owner/OwnerFaqsButton";
// import ShopBusinessProfileCard from "../../components/shop/ShopBusinessProfileCard";
// import ShopHeroCardToolbar from "../../components/shop/ShopHeroCardToolbar";
// import ShopPrimaryNav from "../../components/shop/ShopPrimaryNav";
// import ShopProfileHeroPanel from "../../components/shop/ShopProfileHeroPanel";
// import {
//   shopHeroCardScrollBodyClass,
//   shopHeroCardScrollClass,
//   shopHeroCardScrollContentClass,
//   shopHeroCardScrollContentTopClass,
//   shopMainContentFillClass,
//   shopNavRowNavClass,
//   shopNavRowSlotClass,
//   shopPageBodyGridClass,
//   shopPortalBottomPaddingClass,
//   shopPortalHorizPaddingClass,
//   shopPortalTopPaddingClass,
// } from "../../components/shop/shopLayoutStyles";
// import ShopSidebar from "../../components/shop/ShopSidebar";
// import ShopSubscriptionInteractionLock from "../../components/shop/ShopSubscriptionInteractionLock";
// import { shopPrimaryNav } from "../../config/shopNav";
// import {
//   DEFAULT_SHOP_PAGE_CHROME,
//   useShopPageChromeContext,
// } from "../../context/ShopPageChromeContext";
// import { useShopSubscriptionGate } from "../../context/ShopSubscriptionGateContext";
// import { useShopOwnerFaqs } from "../../hooks/useOwnerPortal";
// import { useShopOwnerPortal } from "../../hooks/useShopPortal";
// import { shopFaqPageSlugFromPath } from "../../lib/shopFaqPageSlug";
// import { isShopPathAllowedWithoutSubscription } from "../../lib/shopSubscriptionAccess";

// export default function ShopPageLayout() {
//   const location = useLocation();
//   const { chrome } = useShopPageChromeContext();
//   const { faqsHeading, faqsDescription } = useShopOwnerPortal();
//   const pageSlug = useMemo(
//     () => shopFaqPageSlugFromPath(location.pathname),
//     [location.pathname],
//   );
//   const { items, loading } = useShopOwnerFaqs(pageSlug);
//   const { subscriptionLocked } = useShopSubscriptionGate();
//   const [localFaqsOpen, setLocalFaqsOpen] = useState(false);
//   const lockInteractions =
//     subscriptionLocked && !isShopPathAllowedWithoutSubscription(location.pathname);

//   const faqsOpen = chrome.faqsOpen === true || localFaqsOpen;
//   const openFaqs = useCallback(() => {
//     if (chrome.onFaqsOpen) chrome.onFaqsOpen();
//     else setLocalFaqsOpen(true);
//   }, [chrome.onFaqsOpen]);
//   const closeFaqs = useCallback(() => {
//     if (chrome.onFaqsClose) chrome.onFaqsClose();
//     setLocalFaqsOpen(false);
//   }, [chrome.onFaqsClose]);

//   const metaTitle = chrome.metaTitle ?? DEFAULT_SHOP_PAGE_CHROME.metaTitle!;
//   const metaDescription = chrome.metaDescription ?? DEFAULT_SHOP_PAGE_CHROME.metaDescription!;
//   const showBusinessCard = chrome.sidebarVariant === "business-card";
//   const useHeroCard = chrome.heroCard !== false;
//   const showSearch = chrome.searchPlaceholder != null;
//   const showToolbar = showSearch || chrome.headerAction || chrome.heroCardToolbarAlways;
//   // Remount page content on every route change so each page re-fetches fresh API data.
//   const pageOutlet = <Outlet key={location.pathname} />;

//   const sidebarCell = showBusinessCard ? (
//     <ShopBusinessProfileCard />
//   ) : (
//     <ShopSidebar
//       items={chrome.sidebarItems ?? []}
//       activeId={chrome.activeSidebarId}
//       onSelect={chrome.onSidebarSelect}
//       heading={chrome.sidebarHeading}
//       headingClassName={chrome.sidebarHeadingClassName}
//       footer={chrome.sidebarFooter}
//       loading={chrome.sidebarLoading}
//       skeletonCount={chrome.sidebarSkeletonCount}
//       shopStyle
//     >
//       {chrome.sidebarExtra}
//     </ShopSidebar>
//   );

//   const scrollRegionClass = chrome.contentFillHeight
//     ? "no-scrollbar flex min-h-0 flex-1 flex-col overflow-hidden"
//     : shopHeroCardScrollClass;

//   const scrollBodyClass = chrome.contentFillHeight
//     ? "flex h-full min-h-0 flex-1 flex-col"
//     : shopHeroCardScrollBodyClass;

//   const scrollContentClass = chrome.contentFillHeight
//     ? `${shopHeroCardScrollContentTopClass} ${shopMainContentFillClass} h-full min-h-0`
//     : chrome.contentTopOffset
//       ? shopHeroCardScrollContentTopClass
//       : shopHeroCardScrollContentClass;

//   const pageContent = useHeroCard ? (
//     <ShopProfileHeroPanel
//       showBackgroundImage={chrome.heroBackgroundImage !== false}
//       flush={chrome.heroCardFlush === true}
//       transparent={chrome.heroCardTransparent === true}
//     >
//       <div className={`flex h-full min-h-0 w-full flex-col ${chrome.heroCardFlush ? "gap-1" : "gap-3"}`}>
//         {showToolbar ? (
//           <ShopHeroCardToolbar
//             searchInputId={chrome.searchInputId}
//             searchPlaceholder={chrome.searchPlaceholder}
//             searchValue={chrome.searchValue}
//             onSearchChange={chrome.onSearchChange}
//             headerAction={chrome.headerAction}
//             alwaysShow={chrome.heroCardToolbarAlways}
//           />
//         ) : null}
//         <div className={scrollRegionClass}>
//           <div className={scrollBodyClass}>
//             <div className={scrollContentClass}>
//               {pageOutlet}
//             </div>
//           </div>
//         </div>
//       </div>
//     </ShopProfileHeroPanel>
//   ) : (
//     pageOutlet
//   );

//   return (
//     <PortalPageContent
//       className={`flex min-h-0 flex-1 flex-col overflow-hidden ${shopPortalTopPaddingClass} ${shopPortalBottomPaddingClass} ${shopPortalHorizPaddingClass}`}
//     >
//       <PageMeta title={metaTitle} description={metaDescription} />

//       <div className={shopPageBodyGridClass}>
//         <div
//           className={`order-1 lg:col-start-1 lg:row-start-1 lg:self-center ${shopNavRowSlotClass}`}
//         >
//           {chrome.sidebarHeader ?? (
//             <span className="hidden lg:block lg:size-10" aria-hidden />
//           )}
//         </div>

//         <ShopPrimaryNav
//           homePath="/shop"
//           primaryNav={shopPrimaryNav}
//           className={`order-2 lg:order-1 lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:justify-self-stretch lg:self-center ${shopNavRowNavClass}`}
//         />

//         <ShopSubscriptionInteractionLock
//           active={lockInteractions}
//           className="order-3 min-h-0 lg:order-2 lg:col-start-1 lg:row-start-2 lg:self-start"
//         >
//           {sidebarCell}
//         </ShopSubscriptionInteractionLock>

//         <ShopSubscriptionInteractionLock
//           active={lockInteractions}
//           className="order-4 flex min-h-0 min-w-0 flex-col overflow-hidden lg:order-3 lg:col-start-2 lg:row-start-2"
//         >
//           {pageContent}
//         </ShopSubscriptionInteractionLock>
//       </div>

//       <StickyFaqsButton onClick={openFaqs} />
//       <OwnerFaqsDialog
//         open={faqsOpen}
//         onClose={closeFaqs}
//         heading={chrome.faqsHeading ?? faqsHeading}
//         description={chrome.faqsDescription ?? faqsDescription}
//         items={items}
//         loading={loading}
//       />
//     </PortalPageContent>
//   );
// }


import { useCallback, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router";
import { FiMaximize2, FiMinimize2 } from "react-icons/fi";
import PageMeta from "../../components/common/PageMeta";
import { PortalPageContent } from "../../components/admin/PortalPageContent";
import OwnerFaqsDialog from "../../components/owner/OwnerFaqsDialog";
import { StickyFaqsButton } from "../../components/owner/OwnerFaqsButton";
import ShopHeroCardToolbar from "../../components/shop/ShopHeroCardToolbar";
import ShopHomeAdsPanel from "../../components/shop/ShopHomeAdsPanel";
import ShopProfileHeroPanel from "../../components/shop/ShopProfileHeroPanel";
import {
  shopHeroCardScrollBodyClass,
  shopHeroCardScrollClass,
  shopHeroCardScrollContentClass,
  shopHeroCardScrollContentTopClass,
  shopMainContentFillClass,
  shopPortalBodyFullGridClass,
  shopPortalBodyGridClass,
  shopPortalBottomPaddingClass,
  shopPortalHorizPaddingClass,
  shopPortalTopPaddingClass,
} from "../../components/shop/shopLayoutStyles";
import {
  DEFAULT_SHOP_PAGE_CHROME,
  useShopPageChromeContext,
} from "../../context/ShopPageChromeContext";
import { useShopOwnerFaqs } from "../../hooks/useOwnerPortal";
import { useShopOwnerPortal } from "../../hooks/useShopPortal";
import { shopFaqPageSlugFromPath } from "../../lib/shopFaqPageSlug";

export default function ShopPageLayout() {
  const location = useLocation();
  const { chrome } = useShopPageChromeContext();
  const { faqsHeading, faqsDescription } = useShopOwnerPortal();
  const pageSlug = useMemo(
    () => shopFaqPageSlugFromPath(location.pathname),
    [location.pathname],
  );
  const { items, loading } = useShopOwnerFaqs(pageSlug);
  const [localFaqsOpen, setLocalFaqsOpen] = useState(false);
  const [heroExpanded, setHeroExpanded] = useState(false);

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
  const useHeroCard = chrome.heroCard !== false;
  const showSearch = chrome.searchPlaceholder != null;
  const showToolbar = showSearch || chrome.headerAction || chrome.heroCardToolbarAlways;
  const heading = chrome.pageHeading?.trim() || chrome.title?.trim() || "";
  const headingParent = chrome.pageHeadingParent?.trim();
  // Remount page content on every route change so each page re-fetches fresh API data.
  const pageOutlet = <Outlet key={location.pathname} />;

  // Every page shows the ads column unless the page opts out (Profile) or the hero card is expanded.
  const showLeftPanel = !chrome.hideAds && !heroExpanded;
  const leftPanel = chrome.sidebarExtra ?? <ShopHomeAdsPanel />;

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
    <ShopProfileHeroPanel flush={chrome.heroCardFlush === true}>
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
      className={`flex min-h-0 flex-1 flex-col overflow-hidden bg-transparent ${shopPortalTopPaddingClass} ${shopPortalBottomPaddingClass} ${shopPortalHorizPaddingClass}`}
    >
      <PageMeta title={metaTitle} description={metaDescription} />

      <div className={showLeftPanel ? shopPortalBodyGridClass : shopPortalBodyFullGridClass}>
        <div
          className={`flex min-h-9 min-w-0 items-end justify-between gap-3 pt-2 lg:row-start-1 ${
            showLeftPanel ? "lg:col-start-2" : "lg:col-start-1"
          }`}
        >
          <h1 className="flex min-w-0 items-end gap-1.5 truncate text-lg font-bold text-gray-700 lg:text-xl">
            {headingParent ? (
              <>
                <span className="shrink-0">{headingParent}</span>
                <span className="shrink-0 text-gray-400">-</span>
                <span className="truncate text-[#1f3aa0]">{heading}</span>
              </>
            ) : (
              <span className="truncate">{heading}</span>
            )}
          </h1>
          {!chrome.hideAds ? (
            <button
              type="button"
              onClick={() => setHeroExpanded((prev) => !prev)}
              aria-pressed={heroExpanded}
              title={heroExpanded ? "Collapse and show ads" : "Expand"}
              className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-ad-purple shadow-sm transition-colors hover:bg-purple-50 lg:inline-flex"
            >
              {heroExpanded ? <FiMinimize2 aria-hidden /> : <FiMaximize2 aria-hidden />}
              {heroExpanded ? "Collapse" : "Expand"}
            </button>
          ) : null}
        </div>

        {showLeftPanel ? (
          <div className="order-last min-h-0 lg:order-none lg:col-start-1 lg:row-start-2">
            {leftPanel}
          </div>
        ) : null}

        <div
          className={`flex min-h-0 min-w-0 flex-col overflow-hidden lg:row-start-2 ${
            showLeftPanel ? "lg:col-start-2" : "lg:col-start-1"
          }`}
        >
          {pageContent}
        </div>
      </div>

      <StickyFaqsButton onClick={openFaqs} />
      <OwnerFaqsDialog
        open={faqsOpen}
        onClose={closeFaqs}
        heading={chrome.faqsHeading ?? faqsHeading}
        description={chrome.faqsDescription ?? faqsDescription}
        items={items}
        loading={loading}
      />
    </PortalPageContent>
  );
}
