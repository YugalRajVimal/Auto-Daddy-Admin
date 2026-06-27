import { ShopSidebarButton } from "./ShopSidebar";

export type ShopWebsiteSection = "domain" | "preview" | "subscription";

type ShopWebsiteSidebarProps = {
  activeSection: ShopWebsiteSection;
  onSectionChange: (section: ShopWebsiteSection) => void;
};

const SECTIONS: { id: ShopWebsiteSection; label: string }[] = [
  { id: "domain", label: "Domain" },
  { id: "preview", label: "My Website" },
  { id: "subscription", label: "Subscription" },
];

export default function ShopWebsiteSidebar({
  activeSection,
  onSectionChange,
}: ShopWebsiteSidebarProps) {
  return (
    <div className="flex flex-col gap-3">
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
