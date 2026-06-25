import type { ReactNode } from "react";
import PageMeta from "../common/PageMeta";
import { PortalPageContent } from "../admin/PortalPageContent";
import OwnerFaqsDialog from "./OwnerFaqsDialog";
import { OwnerFaqsButton, ownerPageSidebarFooterClass } from "./OwnerFaqsButton";

export const ownerPageTitleClass = "text-xl font-bold text-blue-700 md:text-2xl";

export const ownerPageHeaderClass = "mb-3 flex items-center justify-between gap-3";

export const ownerPageAddFormSubtitleClass =
  "text-center font-serif text-xl font-bold text-ad-grey-dark md:text-2xl";

export const ownerPageSectionTitleClass = ownerPageAddFormSubtitleClass;

export const ownerPageLayoutClass =
  "flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-5";

export const ownerPageSidebarClass =
  "relative flex w-full shrink-0 flex-col gap-3 overflow-visible lg:w-[220px] xl:w-[260px] lg:min-h-[calc(100vh-220px)]";

export const ownerPageMainClass = "min-w-0 flex-1";

type OwnerPageSidebarProps = {
  children: ReactNode;
  className?: string;
  onFaqsClick?: () => void;
  footer?: ReactNode;
};

export function OwnerPageSidebar({
  children,
  className = "",
  onFaqsClick,
  footer,
}: OwnerPageSidebarProps) {
  return (
    <aside className={`${ownerPageSidebarClass} ${className}`.trim()}>
      <div className="flex flex-col gap-3">{children}</div>
      {footer || onFaqsClick ? (
        <div className={ownerPageSidebarFooterClass}>
          {footer}
          {onFaqsClick ? <OwnerFaqsButton onClick={onFaqsClick} /> : null}
        </div>
      ) : null}
    </aside>
  );
}

type OwnerPageShellProps = {
  title?: string;
  titleClassName?: string;
  headerClassName?: string;
  metaTitle: string;
  metaDescription: string;
  headerAction?: ReactNode;
  children: ReactNode;
  faqsOpen?: boolean;
  onFaqsClose?: () => void;
  faqsHeading?: string;
  faqsDescription?: string;
};

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
      className="rounded border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-ad-purple hover:bg-gray-50"
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
      className={`w-full min-w-[140px] max-w-[220px] rounded-full border border-gray-300 bg-gray-100 px-4 py-1.5 text-sm text-gray-800 placeholder:text-gray-500 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 sm:min-w-[180px] ${className}`.trim()}
    />
  );
}

export default function OwnerPageShell({
  title,
  titleClassName,
  headerClassName,
  metaTitle,
  metaDescription,
  headerAction,
  children,
  faqsOpen = false,
  onFaqsClose,
  faqsHeading,
  faqsDescription,
}: OwnerPageShellProps) {
  return (
    <PortalPageContent className="flex flex-col px-3 py-3 sm:px-4 md:py-4 lg:px-6">
      <PageMeta title={metaTitle} description={metaDescription} />

      {title ? (
        <div className={`${ownerPageHeaderClass} ${headerClassName ?? ""}`.trim()}>
          <h1 className={`shrink-0 whitespace-nowrap ${titleClassName ?? ownerPageTitleClass}`}>
            {title}
          </h1>
          {headerAction}
        </div>
      ) : null}

      {children}

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
