import { Outlet } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { PortalPageContent } from "../../components/admin/PortalPageContent";
import ShopBusinessProfileCard from "../../components/shop/ShopBusinessProfileCard";
import ShopPrimaryNav from "../../components/shop/ShopPrimaryNav";
import ShopSidebar from "../../components/shop/ShopSidebar";
import { shopPrimaryNav } from "../../config/shopNav";
import {
  DEFAULT_SHOP_PAGE_CHROME,
  useShopPageChromeContext,
} from "../../context/ShopPageChromeContext";

const SHOP_MAIN_SEARCH_CLASS =
  "w-full max-w-xs rounded-full border border-gray-300 bg-gray-100 px-4 py-2 text-sm text-gray-800 placeholder:text-gray-500 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 sm:max-w-sm";

/** Row 1: [empty | nav]. Row 2: [sidebar | toolbar + main content]. */
export const shopPageBodyGridClass =
  "grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-5 lg:gap-y-3 xl:grid-cols-[260px_minmax(0,1fr)]";

export default function ShopPageLayout() {
  const { chrome } = useShopPageChromeContext();

  const metaTitle = chrome.metaTitle ?? DEFAULT_SHOP_PAGE_CHROME.metaTitle!;
  const metaDescription = chrome.metaDescription ?? DEFAULT_SHOP_PAGE_CHROME.metaDescription!;
  const showBusinessCard = chrome.sidebarVariant === "business-card";
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
      shopStyle
      className="lg:!h-auto lg:!max-h-none"
    >
      {chrome.sidebarExtra}
    </ShopSidebar>
  );

  return (
    <PortalPageContent className="flex flex-col px-3 py-3 sm:px-4 md:py-4 lg:px-6">
      <PageMeta title={metaTitle} description={metaDescription} />

      <div className={shopPageBodyGridClass}>
        <ShopPrimaryNav
          homePath="/shop"
          primaryNav={shopPrimaryNav}
          className="order-1 lg:col-start-2 lg:row-start-1"
        />

        <div className="order-2 lg:col-start-1 lg:row-start-2 lg:self-start">
          {sidebarCell}
        </div>

        <div className="order-3 flex min-w-0 flex-col gap-2 lg:col-start-2 lg:row-start-2">
          {showToolbar ? (
            <div
              className={`flex flex-wrap items-center gap-3 ${
                showSearch && chrome.headerAction
                  ? "justify-between"
                  : chrome.headerAction
                    ? "justify-end"
                    : "justify-start"
              }`}
            >
              {showSearch ? (
                <input
                  id={chrome.searchInputId}
                  type="search"
                  value={chrome.searchValue ?? ""}
                  onChange={(e) => chrome.onSearchChange?.(e.target.value)}
                  placeholder={chrome.searchPlaceholder}
                  className={SHOP_MAIN_SEARCH_CLASS}
                />
              ) : null}
              {chrome.headerAction ? (
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  {chrome.headerAction}
                </div>
              ) : null}
            </div>
          ) : null}

          <Outlet />
        </div>
      </div>
    </PortalPageContent>
  );
}
