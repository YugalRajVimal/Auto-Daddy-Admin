import { InfoContentScreen } from "@/components/reusables";
import { DrawerInfoStackShell } from "@/components/reusables/layout/drawer-info-stack-shell";

export default function DocumentsPage() {
  return (
    <DrawerInfoStackShell title="Documents">
      <InfoContentScreen
        title="Documents"
        fallbackHeading="Important Documents"
        fallbackDesc="Here you'll find warranty, registration, and insurance documents required for various services."
        selectContent={(dashboard) => dashboard?.Documents}
      />
    </DrawerInfoStackShell>
  );
}
