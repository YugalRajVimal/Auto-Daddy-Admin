import { InfoContentScreen } from "@/components/reusables";
import { ShopOwnerInfoStackShell } from "@/components/shop-owner/shop-owner-info-stack-shell";

export default function PrivacyPolicyPage() {
  return (
    <ShopOwnerInfoStackShell title="Privacy Policy">
      <InfoContentScreen
        title="Privacy Policy"
        fallbackHeading="Privacy Policy"
        fallbackDesc="Your privacy is important to us. All your data is handled securely and never shared with third parties without consent."
        selectContent={(dashboard) => dashboard?.privacyPolicy}
      />
    </ShopOwnerInfoStackShell>
  );
}
