import type { ReactNode } from "react";
import { ContentPanel } from "./ContentPanel";

type AdminPageProps = {
  title: string;
  children: ReactNode;
  panelTitle?: string;
  action?: ReactNode;
  footer?: ReactNode;
  noPanel?: boolean;
};

export default function AdminPage({
  title,
  children,
  panelTitle,
  action,
  footer,
  noPanel = false,
}: AdminPageProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-white px-6 py-4 md:px-12 md:py-5 lg:px-16">
      <h1 className="mb-4 text-xl font-bold text-ad-green md:text-2xl">{title}</h1>
      {noPanel ? (
        children
      ) : (
        <ContentPanel title={panelTitle} action={action} footer={footer}>
          {children}
        </ContentPanel>
      )}
    </div>
  );
}
