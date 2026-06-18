import type { ReactNode } from "react";
import { ContentPanel } from "./ContentPanel";

type AdminPageProps = {
  title: string;
  children: ReactNode;
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
  panelTitle,
  action,
  footer,
  noPanel = false,
  narrowPanel = false,
}: AdminPageProps) {
  const panel = noPanel ? (
    children
  ) : (
    <ContentPanel title={panelTitle} action={action} footer={footer}>
      {children}
    </ContentPanel>
  );

  const showPageTitle = noPanel || !panelTitle;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-ad-app-bg py-4 md:py-5">
      <div className={narrowPanel ? "mx-auto w-full sm:w-[55%] sm:min-w-[320px]" : undefined}>
        {showPageTitle && (
          <h1 className="mb-4 text-xl font-bold text-ad-green md:text-2xl">{title}</h1>
        )}
        {panel}
      </div>
    </div>
  );
}
