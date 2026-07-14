import { Outlet } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { PortalPageContent } from "../../components/admin/PortalPageContent";
import {
  DEFAULT_OWNER_PAGE_CHROME,
  useOwnerPageChromeContext,
} from "../../context/OwnerPageChromeContext";
import { ownerPortalContentPadClass } from "../../components/owner/ownerLayoutStyles";

export default function OwnerPageLayout() {
  const { chrome } = useOwnerPageChromeContext();

  const metaTitle = chrome.metaTitle ?? DEFAULT_OWNER_PAGE_CHROME.metaTitle!;
  const metaDescription = chrome.metaDescription ?? DEFAULT_OWNER_PAGE_CHROME.metaDescription!;

  return (
    <PortalPageContent className={`relative py-0 md:py-0 ${ownerPortalContentPadClass}`}>
      <PageMeta title={metaTitle} description={metaDescription} />
      <Outlet />
    </PortalPageContent>
  );
}
