import type { ReactNode } from "react";
import { ContentPanel } from "./ContentPanel";

export const adminPageTitleClass = "text-xl font-bold text-ad-green md:text-2xl";

export const adminPageHeaderClass = "mb-3 flex items-center justify-between gap-3";

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
}: AdminPageProps) {
  const useInlineFlow = headerAction !== undefined || between !== undefined;

  const panel = noPanel || useInlineFlow ? (
    children
  ) : (
    <ContentPanel title={panelTitle} action={action} footer={footer}>
      {children}
    </ContentPanel>
  );

  const showPageTitle = noPanel || !panelTitle || useInlineFlow;

  return (
    <div className="bg-ad-app-bg py-4 md:py-5">
      <div className={narrowPanel ? "mx-auto w-full sm:w-[55%] sm:min-w-[320px]" : undefined}>
        {showPageTitle && (
          <div className={adminPageHeaderClass}>
            {onTitleClick ? (
              <button
                type="button"
                onClick={onTitleClick}
                className={`text-left ${adminPageTitleClass} hover:underline`}
              >
                {title}
              </button>
            ) : (
              <h1 className={adminPageTitleClass}>{title}</h1>
            )}
            {headerAction}
          </div>
        )}
        {between}
        {panel}
      </div>
    </div>
  );
}

export function AddNewButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded bg-ad-green px-4 py-2 text-sm font-bold text-white hover:bg-ad-green-dark"
    >
      Add New
    </button>
  );
}
