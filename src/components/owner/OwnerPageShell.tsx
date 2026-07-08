import type { ReactNode } from "react";
import type { OwnerPageChromeConfig } from "../../context/OwnerPageChromeContext";
import { useOwnerPageChrome } from "../../context/OwnerPageChromeContext";
import { ownerPageSidebarFooterClass } from "./OwnerFaqsButton";
import { shopSidebarButtonStackClass } from "../shop/shopSidebarStyles";
import { ownerPageSidebarClass } from "./ownerLayoutStyles";

export {
  ownerPageAddFormSubtitleClass,
  ownerPageHeaderClass,
  ownerPageLayoutClass,
  ownerPageMainClass,
  ownerPageSectionTitleClass,
  ownerPageSidebarClass,
  ownerPageTitleClass,
} from "./ownerLayoutStyles";

type OwnerPageSidebarProps = {
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
};

export function OwnerPageSidebar({ children, className = "", footer }: OwnerPageSidebarProps) {
  return (
    <aside className={`${ownerPageSidebarClass} lg:!h-auto lg:!max-h-none ${className}`.trim()}>
      <div className={`min-h-0 flex-1 overflow-y-auto pb-28 lg:pr-0.5 ${shopSidebarButtonStackClass}`}>
        {children}
      </div>
      {footer ? <div className={ownerPageSidebarFooterClass}>{footer}</div> : null}
    </aside>
  );
}

export function OwnerPageRefreshButton({
  onClick,
  label = "Refresh",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-ad-purple hover:bg-gray-50"
    >
      {label}
    </button>
  );
}

export function OwnerPageSearchInput({
  value,
  onChange,
  placeholder,
  id,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
}) {
  return (
    <input
      id={id}
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full min-w-[140px] max-w-[220px] rounded-full border border-gray-300 bg-gray-100 px-4 py-1.5 text-sm text-gray-800 placeholder:text-gray-500 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 sm:min-w-[180px] ${className}`.trim()}
    />
  );
}

type OwnerPageShellProps = OwnerPageChromeConfig & {
  children: ReactNode;
};

/** Registers page chrome with {@link OwnerPageLayout}; renders route content only. */
export default function OwnerPageShell({ children, ...chrome }: OwnerPageShellProps) {
  useOwnerPageChrome(chrome);

  return <>{children}</>;
}
