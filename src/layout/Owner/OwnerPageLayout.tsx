import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { PortalPageContent } from "../../components/admin/PortalPageContent";
import { useAuth } from "../../auth";
import { useCarOwnerOdometerReadings } from "../../hooks/useCarOwnerOdometerReadings";
import { useCarOwnerVehicles } from "../../hooks/useCarOwnerVehicles";
import OwnerUpdateOdometerFooter from "../../components/owner/OwnerUpdateOdometerFooter";
import OwnerUpdateOdometerPanel from "../../components/owner/OwnerUpdateOdometerPanel";
import ShopHeroCardToolbar from "../../components/shop/ShopHeroCardToolbar";
import ShopPrimaryNav from "../../components/shop/ShopPrimaryNav";
import ShopProfileHeroPanel from "../../components/shop/ShopProfileHeroPanel";
import ShopSidebar from "../../components/shop/ShopSidebar";
import { ownerNavPageHeadingClass } from "../../components/owner/ownerLayoutStyles";
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
import { ownerPrimaryNav } from "../../config/ownerNav";
import { getActivePrimaryItem } from "../../config/adminNav";
import {
  DEFAULT_OWNER_PAGE_CHROME,
  useOwnerPageChromeContext,
} from "../../context/OwnerPageChromeContext";
import { mergeVehiclesWithOdometerReadings } from "../../lib/carOwnerOdometer";

export default function OwnerPageLayout() {
  const { chrome } = useOwnerPageChromeContext();
  const location = useLocation();
  const { token } = useAuth();
  const { vehicles, loading: vehiclesLoading, error: vehiclesError, refresh: refreshVehicles } =
    useCarOwnerVehicles();
  const {
    readings,
    loading: readingsLoading,
    refresh: refreshReadings,
  } = useCarOwnerOdometerReadings();
  const [showOdometer, setShowOdometer] = useState(false);

  const vehiclesForOdometer = useMemo(
    () => mergeVehiclesWithOdometerReadings(vehicles, readings),
    [vehicles, readings]
  );

  const closeOdometer = useCallback(() => setShowOdometer(false), []);
  const toggleOdometer = useCallback(() => setShowOdometer((open) => !open), []);

  useEffect(() => {
    setShowOdometer(false);
  }, [location.pathname]);

  const refreshOdometerData = useCallback(() => {
    void refreshVehicles();
    void refreshReadings();
  }, [refreshReadings, refreshVehicles]);

  const mainNode = showOdometer ? (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={closeOdometer}
          className="rounded border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          aria-label="Close odometer"
        >
          Close
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <OwnerUpdateOdometerPanel
          vehicles={vehiclesForOdometer}
          loading={vehiclesLoading || readingsLoading}
          error={vehiclesError}
          token={token}
          onBack={closeOdometer}
          onSaved={refreshOdometerData}
        />
      </div>
    </div>
  ) : (
    <Outlet />
  );

  const activePrimary = getActivePrimaryItem(location.pathname, ownerPrimaryNav, "/owner");
  const pageHeading =
    chrome.pageHeading?.trim() ||
    chrome.title?.trim() ||
    activePrimary?.name ||
    "Dashboard";

  const metaTitle = chrome.metaTitle ?? DEFAULT_OWNER_PAGE_CHROME.metaTitle!;
  const metaDescription = chrome.metaDescription ?? DEFAULT_OWNER_PAGE_CHROME.metaDescription!;
  const useHeroCard = chrome.heroCard !== false;
  const showSearch = chrome.searchPlaceholder != null;
  const showToolbar = showSearch || chrome.headerAction || chrome.heroCardToolbarAlways;

  const sidebarCell = chrome.customSidebar ?? (
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

  const scrollRegionClass = chrome.contentFillHeight
    ? "no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto"
    : shopHeroCardScrollClass;

  const scrollBodyClass = chrome.contentFillHeight
    ? "flex min-h-0 flex-1 flex-col"
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
              {mainNode}
            </div>
          </div>
        </div>
      </div>
    </ShopProfileHeroPanel>
  ) : (
    mainNode
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
            <h1 className={`min-w-0 truncate ${ownerNavPageHeadingClass}`}>{pageHeading}</h1>
          )}
        </div>

        <ShopPrimaryNav
          homePath="/owner"
          primaryNav={ownerPrimaryNav}
          navLabel="Owner sections"
          className={`order-2 lg:order-1 lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:justify-self-stretch lg:self-center ${shopNavRowNavClass}`}
        />

        <div className="relative order-3 min-h-0 lg:order-2 lg:col-start-1 lg:row-start-2 lg:self-stretch">
          {sidebarCell}
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <div className="pointer-events-auto w-[110px]">
              <OwnerUpdateOdometerFooter onClick={toggleOdometer} active={showOdometer} />
            </div>
          </div>
        </div>

        <div className="order-4 flex min-h-0 min-w-0 flex-col overflow-hidden lg:order-3 lg:col-start-2 lg:row-start-2">
          {pageContent}
        </div>
      </div>
    </PortalPageContent>
  );
}
