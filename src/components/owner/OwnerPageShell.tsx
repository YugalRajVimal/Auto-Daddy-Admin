import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import type { OwnerPageChromeConfig } from "../../context/OwnerPageChromeContext";
import { useOwnerPageChrome } from "../../context/OwnerPageChromeContext";
import { useOwnerNav } from "../../context/OwnerNavContext";
import { ShopSidebarButtonsSkeleton } from "../shop/ShopSidebar";
import OwnerUpdateOdometerFooter from "./OwnerUpdateOdometerFooter";
import { OwnerSideButton, OwnerTitleBar, ownerSideListClass } from "./ownerUi";
import { ownerPageSidebarFooterClass } from "./OwnerFaqsButton";
import { ownerSidebarButtonStackClass } from "../shop/shopSidebarStyles";
import {
  ownerPageSidebarClass,
  ownerPageSidebarPanelClass,
  ownerPortalGridClass,
} from "./ownerLayoutStyles";

export {
  ownerPageAddFormSubtitleClass,
  ownerPageHeaderClass,
  ownerPageIntroClass,
  ownerPageLayoutClass,
  ownerPageMainClass,
  ownerPageSectionTitleClass,
  ownerPageSidebarClass,
  ownerPageTitleClass,
} from "./ownerLayoutStyles";

type OwnerPageSidebarProps = {
  children?: ReactNode;
  className?: string;
  footer?: ReactNode;
};

export function OwnerPageSidebar({ children, className = "", footer }: OwnerPageSidebarProps) {
  return (
    <aside className={`${ownerPageSidebarClass} ${className}`.trim()}>
      <div className={`${ownerPageSidebarPanelClass} ${ownerSidebarButtonStackClass}`}>
        {children}
      </div>
      {footer ? <div className={ownerPageSidebarFooterClass}>{footer}</div> : null}
    </aside>
  );
}

export function OwnerPageRefreshButton({
  onClick,
  label = "Refresh",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded bg-ad-green px-4 py-2 text-sm font-bold text-white hover:bg-ad-green-dark"
    >
      {label}
    </button>
  );
}

export function OwnerPageSearchInput({
  value,
  onChange,
  placeholder,
  id,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
}) {
  return (
    <input
      id={id}
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full min-w-[140px] max-w-[220px] rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 placeholder:text-gray-500 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 sm:min-w-[180px] ${className}`.trim()}
    />
  );
}

type OwnerPageShellProps = OwnerPageChromeConfig & {
  children: ReactNode;
  /** Render children without the card body padding (page draws its own surfaces). */
  noPanel?: boolean;
};

const ODOMETER_PATH = "/owner/profile/vehicles";

/**
 * Owner page frame (mockup): vertical left panel with the tab's sections, the page's own
 * sidebar and the Update Odometer shortcut; main white card with a grey title bar.
 */
export default function OwnerPageShell({
  children,
  noPanel = false,
  ...chrome
}: OwnerPageShellProps) {
  useOwnerPageChrome(chrome);
  const { subItems, activeSubPath, onSubNavClick } = useOwnerNav();
  const navigate = useNavigate();
  const location = useLocation();

  const title = chrome.pageHeading?.trim() || chrome.title?.trim() || "";
  const placement = chrome.subNavPlacement ?? "before";

  const subNav =
    placement !== "hidden" && subItems.length > 0 ? (
      <div className={ownerSideListClass}>
        {subItems.map((item) => (
          <OwnerSideButton
            key={item.path}
            label={item.name}
            to={item.path}
            active={item.path === activeSubPath}
            onClick={(e) => onSubNavClick(item.path, e as React.MouseEvent<HTMLAnchorElement>)}
          />
        ))}
      </div>
    ) : null;

  const pageSidebar =
    chrome.customSidebar ??
    (chrome.sidebarLoading ? (
      <ShopSidebarButtonsSkeleton count={chrome.sidebarSkeletonCount ?? 3} ownerStyle />
    ) : (chrome.sidebarItems?.length ?? 0) > 0 ? (
      <div className={ownerSideListClass}>
        {chrome.sidebarHeading ? (
          <p className={chrome.sidebarHeadingClassName ?? "px-1 text-xs font-bold uppercase tracking-wide text-gray-500"}>
            {chrome.sidebarHeading}
          </p>
        ) : null}
        {chrome.sidebarItems!.map((item) => (
          <OwnerSideButton
            key={item.id}
            label={item.label}
            active={item.id === chrome.activeSidebarId}
            onClick={() => chrome.onSidebarSelect?.(item.id)}
          />
        ))}
      </div>
    ) : null);

  const odometerActive =
    location.pathname === ODOMETER_PATH &&
    (location.state as { vehicleSection?: string } | null)?.vehicleSection === "update-odometer";

  return (
    <div className="owner-page-body pb-6 pt-1">
      <div className={`${ownerPortalGridClass} lg:items-start`}>
        <aside className={`${ownerPageSidebarClass} gap-4 lg:sticky lg:top-3 lg:min-h-[calc(100vh-200px)]`}>
          <div className={ownerPageSidebarPanelClass}>
            {chrome.sidebarHeader}
            {placement === "before" ? subNav : null}
            {pageSidebar}
            {chrome.sidebarExtra}
            {placement === "after" && subNav ? (
              <div className="border-t border-dashed border-gray-300 pt-3">{subNav}</div>
            ) : null}
          </div>
          {chrome.sidebarFooter}
          {chrome.hideOdometerShortcut ? null : (
            <div className="mt-auto pt-2 lg:pt-6">
              <OwnerUpdateOdometerFooter
                active={odometerActive}
                onClick={() => navigate(ODOMETER_PATH, { state: { vehicleSection: "update-odometer" } })}
              />
            </div>
          )}
        </aside>

        <section className="flex min-h-[calc(100vh-200px)] min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.07)]">
          {title ? (
            <OwnerTitleBar
              title={title}
              onPrev={chrome.onTitlePrev}
              onNext={chrome.onTitleNext}
              right={chrome.headerAction}
            />
          ) : null}
          {chrome.pageHeader}
          <div className={`min-w-0 flex-1 ${noPanel ? "" : "p-3 sm:p-4 2xl:p-5"}`}>{children}</div>
        </section>
      </div>
    </div>
  );
}
