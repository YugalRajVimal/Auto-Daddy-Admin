import { FiChevronRight } from "react-icons/fi";

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
  active?: boolean;
  onClick?: () => void;
  className?: string;
};

export default function PortalSidebarButton({
  label,
  active = false,
  onClick,
  className = "",
}: PortalSidebarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-full border px-4 py-2.5 text-left text-sm font-bold uppercase tracking-wide transition-colors ${
        active
          ? "border-blue-700 bg-blue-600 text-white shadow-md"
          : "border-blue-600 bg-white/70 text-blue-600 hover:bg-white"
      } ${className}`}
    >
      <ListIcon />
      <span className="min-w-0 flex-1">{label}</span>
      <FiChevronRight className="shrink-0 text-base" aria-hidden />
    </button>
  );
}
