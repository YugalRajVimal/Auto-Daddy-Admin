import { Outlet } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { PortalPageContent } from "../../components/admin/PortalPageContent";
import ShopBusinessProfileCard from "../../components/shop/ShopBusinessProfileCard";
import ShopHeroCardToolbar from "../../components/shop/ShopHeroCardToolbar";
import ShopPrimaryNav from "../../components/shop/ShopPrimaryNav";
import ShopProfileHeroPanel from "../../components/shop/ShopProfileHeroPanel";
import {
  shopHeroCardScrollBodyClass,
  shopHeroCardScrollClass,
  shopHeroCardScrollContentClass,
  shopPortalHorizPaddingClass,
} from "../../components/shop/shopLayoutStyles";
import ShopSidebar from "../../components/shop/ShopSidebar";
import { shopPrimaryNav } from "../../config/shopNav";
import {
  DEFAULT_SHOP_PAGE_CHROME,
  useShopPageChromeContext,
} from "../../context/ShopPageChromeContext";

/** Row 1: [empty | nav]. Row 2: [sidebar | main content card]. */
export const shopPageBodyGridClass =
  "grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)] lg:items-stretch lg:gap-x-5 lg:gap-y-3 xl:grid-cols-[260px_minmax(0,1fr)]";

export default function ShopPageLayout() {
  const { chrome } = useShopPageChromeContext();

  const metaTitle = chrome.metaTitle ?? DEFAULT_SHOP_PAGE_CHROME.metaTitle!;
  const metaDescription = chrome.metaDescription ?? DEFAULT_SHOP_PAGE_CHROME.metaDescription!;
  const showBusinessCard = chrome.sidebarVariant === "business-card";
  const useHeroCard = chrome.heroCard !== false;
  const showSearch = chrome.searchPlaceholder != null;
  const showToolbar = showSearch || chrome.headerAction;

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
      className="lg:!h-auto lg:!max-h-none"
    >
      {chrome.sidebarExtra}
    </ShopSidebar>
  );

  const pageContent = useHeroCard ? (
    <ShopProfileHeroPanel>
      <div className="flex h-full min-h-0 w-full flex-col gap-3">
        {showToolbar ? (
          <ShopHeroCardToolbar
            searchInputId={chrome.searchInputId}
            searchPlaceholder={chrome.searchPlaceholder}
            searchValue={chrome.searchValue}
            onSearchChange={chrome.onSearchChange}
            headerAction={chrome.headerAction}
          />
        ) : null}
        <div className={shopHeroCardScrollClass}>
          <div className={shopHeroCardScrollBodyClass}>
            <div className={shopHeroCardScrollContentClass}>
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </ShopProfileHeroPanel>
  ) : (
    <Outlet />
  );

  return (
    <PortalPageContent
      className={`flex min-h-0 flex-1 flex-col overflow-hidden py-2 sm:py-3 md:py-4 ${shopPortalHorizPaddingClass}`}
    >
      <PageMeta title={metaTitle} description={metaDescription} />

      <div className={shopPageBodyGridClass}>
        <ShopPrimaryNav
          homePath="/shop"
          primaryNav={shopPrimaryNav}
          className="order-1 lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:justify-self-stretch"
        />

        <div className="order-2 lg:col-start-1 lg:row-start-2 lg:self-start">
          {sidebarCell}
        </div>

        <div className="order-3 flex min-h-0 min-w-0 flex-col overflow-hidden lg:col-start-2 lg:row-start-2">
          {pageContent}
        </div>
      </div>
    </PortalPageContent>
  );
}
