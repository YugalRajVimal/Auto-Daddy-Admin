import { OwnerSidebarFaqsSlot } from "../owner/OwnerFaqsButton";

type HelpSection = "ticket-raised" | "resolved";

type ShopHelpSidebarProps = {
  activeSection: HelpSection;
  onSectionChange: (section: HelpSection) => void;
  onFaqsClick: () => void;
  faqsStyle?: "owner" | "shop";
};

function sectionButtonClass(active: boolean, section: HelpSection) {
  const base = "w-full rounded-full px-5 py-3 text-sm font-bold uppercase tracking-wide transition-colors";
  if (active && section === "ticket-raised") {
    return `${base} border border-[#006600] bg-[#006600] text-white shadow-md`;
  }
  if (active && section === "resolved") {
    return `${base} border border-ad-purple bg-[#FFE4CC] text-ad-purple shadow-md`;
  }
  if (section === "ticket-raised") {
    return `${base} border border-[#006600] bg-white/70 text-[#006600] hover:bg-white`;
  }
  return `${base} border border-ad-purple bg-[#FFE4CC] text-ad-purple hover:bg-[#FFD9B3]`;
}

export default function ShopHelpSidebar({
  activeSection,
  onSectionChange,
  onFaqsClick,
  faqsStyle = "shop",
}: ShopHelpSidebarProps) {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-3 lg:w-[220px] xl:w-[260px] lg:min-h-[calc(100vh-220px)]">
      <button
        type="button"
        onClick={() => onSectionChange("ticket-raised")}
        className={sectionButtonClass(activeSection === "ticket-raised", "ticket-raised")}
      >
        Ticket Raised
      </button>
      <button
        type="button"
        onClick={() => onSectionChange("resolved")}
        className={sectionButtonClass(activeSection === "resolved", "resolved")}
      >
        Resolved
      </button>
      {faqsStyle === "owner" ? (
        <OwnerSidebarFaqsSlot onClick={onFaqsClick} />
      ) : (
        <div className="mt-auto flex flex-col gap-3 pt-6">
          <button
            type="button"
            onClick={onFaqsClick}
            className="w-full rounded-full border border-ad-purple bg-ad-purple px-5 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-ad-purple-dark"
          >
            FAQs
          </button>
        </div>
      )}
    </aside>
  );
}
