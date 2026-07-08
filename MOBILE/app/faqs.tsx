import { InfoContentScreen } from "@/components/reusables";
import { ShopOwnerInfoStackShell } from "@/components/shop-owner/shop-owner-info-stack-shell";

export default function FaqsPage() {
  return (
    <ShopOwnerInfoStackShell title="FAQs">
      <InfoContentScreen
        title="FAQs"
        fallbackHeading="Frequently Asked Questions"
        fallbackDesc="1. What services do you provide?\n2. What payment methods are accepted?\n3. How do I book a service?"
        selectContent={(dashboard) => dashboard?.FAQs}
      />
    </ShopOwnerInfoStackShell>
  );
}
