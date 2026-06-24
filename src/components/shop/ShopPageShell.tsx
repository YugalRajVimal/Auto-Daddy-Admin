import type { ReactNode } from "react";
import PageMeta from "../common/PageMeta";
import { PortalPageContent } from "../admin/PortalPageContent";
import OwnerFaqsDialog from "../owner/OwnerFaqsDialog";
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
  faqsOpen?: boolean;
  onFaqsOpen?: () => void;
  onFaqsClose?: () => void;
  faqsHeading?: string;
  faqsDescription?: string;
  children: ReactNode;
  headerAction?: ReactNode;
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
  faqsOpen = false,
  onFaqsOpen,
  onFaqsClose,
  faqsHeading,
  faqsDescription,
  children,
  headerAction,
}: ShopPageShellProps) {
  return (
    <PortalPageContent className="flex flex-col px-3 py-3 sm:px-4 md:py-4 lg:px-6">
      <PageMeta title={metaTitle} description={metaDescription} />

      {title ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          <h1 className="text-base font-bold text-blue-700">{title}</h1>
          {headerAction}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-5">
        {sidebarItems.length > 0 || sidebarExtra || onFaqsOpen ? (
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
          >
            {sidebarExtra}
          </ShopSidebar>
        ) : null}

        {children}
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
