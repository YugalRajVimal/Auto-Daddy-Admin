import type { ShopSubNavAction } from "../../context/ShopPageChromeContext";
import type { ShopSidebarItem } from "./ShopSidebar";

type ShopSubNavProps = {
  items: ShopSidebarItem[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  actions?: ShopSubNavAction[];
  className?: string;
};

const itemBaseClass =
  "relative block whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors duration-150";

/** Section links under the primary tab bar; a caret on the rule marks the active section. */
export default function ShopSubNav({
  items,
  activeId,
  onSelect,
  actions = [],
  className = "",
}: ShopSubNavProps) {
  const hasEntries = items.length > 0 || actions.length > 0;

  return (
    <nav aria-label="Section" className={`relative ${className}`.trim()}>
      <ul className="flex min-h-10 flex-wrap items-end gap-x-1 gap-y-1 px-1 pb-2.5 sm:gap-x-3 lg:gap-x-6">
        {items.map((item) => {
          const active = activeId === item.id;
          return (
            <li key={item.id} className="relative shrink-0">
              <button
                type="button"
                onClick={() => onSelect?.(item.id)}
                aria-current={active ? "page" : undefined}
                className={`${itemBaseClass} ${
                  active
                    ? "bg-ad-bg-purple font-semibold text-ad-purple"
                    : "font-medium text-[#1f3aa0] hover:bg-gray-100 hover:text-ad-purple"
                }`}
              >
                {item.label}
              </button>
              {active ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute -bottom-[17px] left-1/2 z-10 size-3 -translate-x-1/2 rotate-45 border-l-2 border-t-2 border-ad-purple bg-ad-app-bg"
                />
              ) : null}
            </li>
          );
        })}
        {actions.map((action) => (
          <li key={action.id} className="shrink-0">
            <button
              type="button"
              onClick={action.onClick}
              className={`${itemBaseClass} font-medium text-[#1f3aa0] hover:bg-gray-100 hover:text-ad-purple`}
            >
              {action.label}
            </button>
          </li>
        ))}
        {!hasEntries ? <li aria-hidden className="h-8" /> : null}
      </ul>
      <div aria-hidden className="h-0.5 w-full rounded-full bg-gradient-to-r from-ad-purple via-ad-purple/70 to-ad-purple/20" />
    </nav>
  );
}
