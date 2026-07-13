import type { ReactNode } from "react";
import AdminPage from "../admin/AdminPage";
import { ContentPanel } from "../admin/ContentPanel";
import type { OwnerPageChromeConfig } from "../../context/OwnerPageChromeContext";
import { useOwnerPageChrome } from "../../context/OwnerPageChromeContext";
import ShopSidebar from "../shop/ShopSidebar";
import { ownerPageSidebarFooterClass } from "./OwnerFaqsButton";
import { shopSidebarButtonStackClass } from "../shop/shopSidebarStyles";
import { ownerPageSidebarClass } from "./ownerLayoutStyles";

export {
  ownerPageAddFormSubtitleClass,
  ownerPageHeaderClass,
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
    <aside className={`${ownerPageSidebarClass} lg:!h-auto lg:!max-h-none ${className}`.trim()}>
      <div className={`min-h-0 flex-1 overflow-y-auto lg:pr-0.5 ${shopSidebarButtonStackClass}`}>
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
  /** Skip the green content panel (raw children under the page title). */
  noPanel?: boolean;
};

function hasSidebarContent(chrome: OwnerPageChromeConfig): boolean {
  if (chrome.customSidebar != null) return true;
  if ((chrome.sidebarItems?.length ?? 0) > 0) return true;
  if (chrome.sidebarExtra != null) return true;
  return false;
}

/** Admin-style page chrome under the owner menu: title row + green content panel. */
export default function OwnerPageShell({
  children,
  noPanel = false,
  ...chrome
}: OwnerPageShellProps) {
  useOwnerPageChrome(chrome);

  const title =
    chrome.pageHeading?.trim() ||
    chrome.title?.trim() ||
    "";

  const showSidebar = hasSidebarContent(chrome);
  const sidebar = showSidebar ? (
    chrome.customSidebar ?? (
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
    )
  ) : null;

  if (showSidebar && sidebar) {
    return (
      <AdminPage title={title} headerAction={chrome.headerAction} between={chrome.pageHeader} noPanel>
        <div className="grid min-h-0 gap-4 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]">
          <div className="min-w-0">{sidebar}</div>
          {noPanel ? (
            <div className="min-w-0">{children}</div>
          ) : (
            <ContentPanel className="min-w-0">{children}</ContentPanel>
          )}
        </div>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      title={title}
      headerAction={chrome.headerAction}
      between={chrome.pageHeader}
      noPanel={noPanel}
    >
      {children}
    </AdminPage>
  );
}
