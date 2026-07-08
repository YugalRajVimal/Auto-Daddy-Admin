import { FiChevronRight } from "react-icons/fi";
import { portalSidebarButtonClass } from "./portalSidebarStyles";

function ListIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden className="shrink-0">
      {[6, 10, 14].map((y) => (
        <g key={y}>
          <circle cx="4" cy={y} r="1.25" fill="currentColor" />
          <rect x="7" y={y - 0.75} width="9" height="1.5" rx="0.75" fill="currentColor" />
        </g>
      ))}
    </svg>
  );
}

export type PortalSidebarButtonProps = {
  label: string;
  /** Related content is currently shown for this button. */
  active?: boolean;
  /** Persistent filled style (e.g. while a sub-menu is open). */
  filled?: boolean;
  onClick?: () => void;
  className?: string;
};

export default function PortalSidebarButton({
  label,
  active = false,
  filled = false,
  onClick,
  className = "",
}: PortalSidebarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={portalSidebarButtonClass(active, filled, className)}
    >
      <ListIcon />
      <span className="min-w-0 flex-1">{label}</span>
      <FiChevronRight className="shrink-0 text-base" aria-hidden />
    </button>
  );
}
