import { ShopSidebarButton } from "./ShopSidebar";
import { shopSidebarButtonStackClass } from "./shopSidebarStyles";

export type ShopWebsiteSection = "overview" | "domain" | "preview" | "subscription";

type ShopWebsiteSidebarProps = {
  activeSection: ShopWebsiteSection;
  onSectionChange: (section: ShopWebsiteSection) => void;
};

const SECTIONS: { id: ShopWebsiteSection; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "domain", label: "Domain" },
  { id: "preview", label: "My Website" },
  { id: "subscription", label: "Subscription" },
];

export default function ShopWebsiteSidebar({
  activeSection,
  onSectionChange,
}: ShopWebsiteSidebarProps) {
  return (
    <div className={shopSidebarButtonStackClass}>
      {SECTIONS.map(({ id, label }) => (
        <ShopSidebarButton
          key={id}
          label={label}
          active={activeSection === id}
          onClick={() => onSectionChange(id)}
        />
      ))}
    </div>
  );
}
