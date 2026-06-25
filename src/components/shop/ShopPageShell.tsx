import type { ReactNode } from "react";
import PageMeta from "../common/PageMeta";
import { PortalPageContent } from "../admin/PortalPageContent";
import OwnerFaqsDialog from "../owner/OwnerFaqsDialog";
import { ownerPageHeaderClass, ownerPageTitleClass } from "../owner/OwnerPageShell";
import ShopSidebar, { type ShopSidebarItem } from "./ShopSidebar";

type ShopPageShellProps = {
  title?: string;
  metaTitle: string;
  metaDescription: string;
  sidebarItems?: ShopSidebarItem[];
  activeSidebarId?: string | null;
  onSidebarSelect?: (id: string) => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  sidebarHeading?: string;
  sidebarHeadingClassName?: string;
  sidebarExtra?: ReactNode;
  sidebarFooter?: ReactNode;
  searchInputId?: string;
  faqsOpen?: boolean;
  onFaqsOpen?: () => void;
  onFaqsClose?: () => void;
  faqsHeading?: string;
  faqsDescription?: string;
  children: ReactNode;
  headerAction?: ReactNode;
  /** When false, main content starts flush with the sidebar top (e.g. home hero). Default true when sidebarHeading is set. */
  contentTopOffset?: boolean;
};

export default function ShopPageShell({
  title,
  metaTitle,
  metaDescription,
  sidebarItems = [],
  activeSidebarId,
  onSidebarSelect,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  sidebarHeading,
  sidebarHeadingClassName,
  sidebarExtra,
  sidebarFooter,
  searchInputId,
  faqsOpen = false,
  onFaqsOpen,
  onFaqsClose,
  faqsHeading,
  faqsDescription,
  children,
  headerAction,
  contentTopOffset,
}: ShopPageShellProps) {
  const applyContentTopOffset = contentTopOffset ?? Boolean(sidebarHeading);
  const showSidebar =
    sidebarItems.length > 0 ||
    sidebarExtra != null ||
    sidebarFooter != null ||
    sidebarHeading != null ||
    onFaqsOpen != null;
  return (
    <PortalPageContent className="flex flex-col px-3 py-3 sm:px-4 md:py-4 lg:px-6">
      <PageMeta title={metaTitle} description={metaDescription} />

      {title ? (
        <div className={ownerPageHeaderClass}>
          <h1 className={ownerPageTitleClass}>{title}</h1>
          {headerAction}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-5">
        {showSidebar ? (
          <ShopSidebar
            items={sidebarItems}
            activeId={activeSidebarId}
            onSelect={onSidebarSelect}
            searchPlaceholder={searchPlaceholder}
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            heading={sidebarHeading}
            headingClassName={sidebarHeadingClassName}
            onFaqsClick={onFaqsOpen}
            footer={sidebarFooter}
            searchInputId={searchInputId}
          >
            {sidebarExtra}
          </ShopSidebar>
        ) : null}

        <div className={`min-w-0 flex-1 ${applyContentTopOffset ? "lg:pt-12" : ""}`}>{children}</div>
      </div>

      {onFaqsClose ? (
        <OwnerFaqsDialog
          open={faqsOpen}
          onClose={onFaqsClose}
          heading={faqsHeading}
          description={faqsDescription}
        />
      ) : null}
    </PortalPageContent>
  );
}
