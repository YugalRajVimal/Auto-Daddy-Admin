import { useCallback, useState } from "react";
import { Outlet } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { PortalPageContent } from "../../components/admin/PortalPageContent";
import OwnerFaqsDialog from "../../components/owner/OwnerFaqsDialog";
import { StickyFaqsButton } from "../../components/owner/OwnerFaqsButton";
import {
  DEFAULT_OWNER_PAGE_CHROME,
  useOwnerPageChromeContext,
} from "../../context/OwnerPageChromeContext";
import { ownerPortalContentPadClass } from "../../components/owner/ownerLayoutStyles";
import { useCarOwnerFaqs } from "../../hooks/useOwnerPortal";

export default function OwnerPageLayout() {
  const { chrome } = useOwnerPageChromeContext();
  const { items, loading, faqsHeading } = useCarOwnerFaqs("carowner");
  const [faqsOpen, setFaqsOpen] = useState(false);

  const openFaqs = useCallback(() => setFaqsOpen(true), []);
  const closeFaqs = useCallback(() => setFaqsOpen(false), []);

  const metaTitle = chrome.metaTitle ?? DEFAULT_OWNER_PAGE_CHROME.metaTitle!;
  const metaDescription = chrome.metaDescription ?? DEFAULT_OWNER_PAGE_CHROME.metaDescription!;

  return (
    <PortalPageContent className={`relative py-0 md:py-0 ${ownerPortalContentPadClass}`}>
      <PageMeta title={metaTitle} description={metaDescription} />
      <Outlet />
      <StickyFaqsButton onClick={openFaqs} />
      <OwnerFaqsDialog
        open={faqsOpen}
        onClose={closeFaqs}
        heading={chrome.faqsHeading ?? faqsHeading}
        description={chrome.faqsDescription}
        items={items}
        loading={loading}
      />
    </PortalPageContent>
  );
}
