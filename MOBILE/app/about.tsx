import { InfoContentScreen } from "@/components/reusables";
import { ShopOwnerInfoStackShell } from "@/components/shop-owner/shop-owner-info-stack-shell";

export default function AboutPage() {
  return (
    <ShopOwnerInfoStackShell title="About Us">
      <InfoContentScreen
        title="About Us"
        fallbackHeading="About Our Auto Shop"
        fallbackDesc="We are committed to providing top-notch automobile services for all makes and models. Customer satisfaction is our priority."
        selectContent={(dashboard) => dashboard?.aboutUs}
      />
    </ShopOwnerInfoStackShell>
  );
}