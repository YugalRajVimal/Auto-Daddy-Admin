import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import { ContentPanel } from "./ContentPanel";

export const adminPageTitleClass = "text-center text-xl font-bold text-ad-green md:text-[26px] md:leading-tight";

/** Centered green title with the action button pinned to the right edge (md+). */
export const adminPageHeaderClass =
  "relative mb-4 flex flex-col items-center gap-2 md:min-h-[46px] md:justify-center";

type AdminPageProps = {
  title: string;
  children: ReactNode;
  /** Action control beside the page title (e.g. green "Add New" button) */
  headerAction?: ReactNode;
  /** When set, the page title becomes clickable (e.g. navigate back to a parent view). */
  onTitleClick?: () => void;
  /** Panel rendered between the title row and main content (e.g. inline add form) */
  between?: ReactNode;
  panelTitle?: string;
  action?: ReactNode;
  footer?: ReactNode;
  noPanel?: boolean;
  /** Constrain the green content panel to ~55% width, centered */
  narrowPanel?: boolean;
  /** Extra classes on the page root (e.g. denser owner padding). */
  className?: string;
  /** Extra classes on the title row (e.g. frosted owner page intro). */
  headerClassName?: string;
};

export default function AdminPage({
  title,
  children,
  headerAction,
  onTitleClick,
  between,
  panelTitle,
  action,
  footer,
  noPanel = false,
  narrowPanel = false,
  className = "",
  headerClassName = "",
}: AdminPageProps) {
  const useInlineFlow = headerAction !== undefined || between !== undefined;
  const neutralPanel = title.trim().toLowerCase().startsWith("deleted");

  const panel = noPanel || useInlineFlow ? (
    children
  ) : (
    <ContentPanel title={panelTitle} action={action} footer={footer} tone={neutralPanel ? "neutral" : "green"}>
      {children}
    </ContentPanel>
  );

  const showPageTitle = (noPanel || !panelTitle || useInlineFlow) && title.trim().length > 0;

  return (
    <div className={twMerge("bg-ad-app-bg py-4 md:py-5", className)}>
      <div className={narrowPanel ? "mx-auto w-full sm:w-[55%] sm:min-w-[320px]" : undefined}>
        {showPageTitle && (
          <div className={twMerge(adminPageHeaderClass, headerClassName)}>
            {onTitleClick ? (
              <button
                type="button"
                onClick={onTitleClick}
                className={`${adminPageTitleClass} hover:underline`}
              >
                {title}
              </button>
            ) : (
              <h1 className={adminPageTitleClass}>{title}</h1>
            )}
            {headerAction != null && (
              <div className="self-end md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2 md:self-auto">
                {headerAction}
              </div>
            )}
          </div>
        )}
        {between}
        {panel}
      </div>
    </div>
  );
}

export function AddNewButton({ onClick, label = "+ Add New" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 border border-ad-green-dark bg-ad-green px-4 py-1 text-base font-semibold text-white shadow-sm hover:bg-ad-green-dark md:px-6 md:text-[17px]"
    >
      {label}
    </button>
  );
}
