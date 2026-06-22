import { InfoContentScreen } from "@/components/reusables";
import { ShopOwnerInfoStackShell } from "@/components/shop-owner/shop-owner-info-stack-shell";

export default function DisclaimerPage() {
  return (
    <ShopOwnerInfoStackShell title="Disclaimer">
      <InfoContentScreen
        title="Disclaimer"
        fallbackHeading="Disclaimer"
        fallbackDesc="All repairs are subject to part availability. Pricing may vary based on model and condition."
        selectContent={(dashboard) => dashboard?.Disclaimer}
      />
    </ShopOwnerInfoStackShell>
  );
}
