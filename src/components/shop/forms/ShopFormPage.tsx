import type { ReactNode } from "react";
import { Link } from "react-router";
import PageMeta from "../../common/PageMeta";
import { PortalPageContent } from "../../admin/PortalPageContent";
import { ownerPageHeaderClass, ownerPageTitleClass } from "../../owner/OwnerPageShell";

export function ShopFormPage({
  title,
  metaTitle,
  backTo,
  children,
}: {
  title: string;
  metaTitle: string;
  backTo: string;
  children: ReactNode;
}) {
  return (
    <PortalPageContent className="px-3 py-3 sm:px-4 md:py-4 lg:px-6">
      <PageMeta title={metaTitle} description={title} />
      <div className={ownerPageHeaderClass}>
        <h1 className={ownerPageTitleClass}>{title}</h1>
        <Link
          to={backTo}
          className="rounded border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-ad-purple hover:bg-gray-50"
        >
          Back
        </Link>
      </div>
      {children}
    </PortalPageContent>
  );
}

export const shopSaveButtonClass =
  "rounded-md bg-ad-purple px-5 py-2 text-sm font-semibold text-white hover:bg-ad-purple-dark disabled:opacity-60";

export const shopCancelButtonClass =
  "rounded-md border border-gray-300 bg-white px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50";
