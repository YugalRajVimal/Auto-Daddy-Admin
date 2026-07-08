import { OwnerFaqsButton, ownerPageSidebarFooterClass } from "../owner/OwnerFaqsButton";
import { ownerPageSidebarClass } from "../owner/ownerLayoutStyles";

type HelpSection = "ticket-raised" | "resolved";

type ShopHelpSidebarProps = {
  activeSection: HelpSection;
  onSectionChange: (section: HelpSection) => void;
  onFaqsClick: () => void;
};

const PILL_BASE =
  "w-full rounded-full border px-5 py-3 text-sm font-bold uppercase tracking-wide transition-colors";

function sectionButtonClass(active: boolean, section: HelpSection) {
  if (section === "ticket-raised") {
    return active
      ? `${PILL_BASE} border-[#006600] bg-[#006600] text-white shadow-md`
      : `${PILL_BASE} border-[#006600] bg-transparent text-[#006600] hover:border-[#005500] hover:bg-[#006600] hover:text-white hover:shadow-md`;
  }

  return active
    ? `${PILL_BASE} border-ad-purple bg-ad-purple text-white shadow-md`
    : `${PILL_BASE} border-ad-purple bg-transparent text-ad-purple hover:border-ad-purple-dark hover:bg-ad-purple hover:text-white hover:shadow-md`;
}

export default function ShopHelpSidebar({
  activeSection,
  onSectionChange,
  onFaqsClick,
}: ShopHelpSidebarProps) {
  return (
    <aside className={ownerPageSidebarClass}>
      <div className="flex flex-col gap-3">
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
      </div>
      <div className={ownerPageSidebarFooterClass}>
        <OwnerFaqsButton onClick={onFaqsClick} />
      </div>
    </aside>
  );
}
