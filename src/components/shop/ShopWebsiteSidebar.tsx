export type ShopWebsiteSection = "domain" | "preview" | "subscription";

type ShopWebsiteSidebarProps = {
  activeSection: ShopWebsiteSection;
  onSectionChange: (section: ShopWebsiteSection) => void;
};

const SECTIONS: { id: ShopWebsiteSection; label: string }[] = [
  { id: "domain", label: "Domain" },
  { id: "preview", label: "Website Preview" },
  { id: "subscription", label: "Subscription" },
];

function sectionButtonClass(active: boolean) {
  const base =
    "w-full rounded-full px-5 py-3 text-sm font-bold uppercase tracking-wide transition-colors";
  if (active) {
    return `${base} border border-gray-400 bg-[#cccccc] text-gray-700 shadow-sm`;
  }
  return `${base} border border-[#006600] bg-[#008000] text-white hover:bg-[#006600]`;
}

export default function ShopWebsiteSidebar({
  activeSection,
  onSectionChange,
}: ShopWebsiteSidebarProps) {
  return (
    <>
      {SECTIONS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSectionChange(id)}
          className={sectionButtonClass(activeSection === id)}
        >
          {label}
        </button>
      ))}
    </>
  );
}
