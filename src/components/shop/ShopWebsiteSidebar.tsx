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

const PILL_BASE =
  "w-full rounded-full border px-5 py-3 text-sm font-bold uppercase tracking-wide transition-colors";

function sectionButtonClass(active: boolean) {
  return active
    ? `${PILL_BASE} border-[#006600] bg-[#006600] text-white shadow-md`
    : `${PILL_BASE} border-[#006600] bg-transparent text-[#006600] hover:border-[#005500] hover:bg-[#006600] hover:text-white hover:shadow-md`;
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
