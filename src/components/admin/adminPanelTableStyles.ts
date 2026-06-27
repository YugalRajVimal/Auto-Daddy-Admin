/** Shared table styling matching AdminPages list tables (e.g. Services). */

export const ADMIN_PANEL_TABLE_CLASS = "w-full border-collapse text-sm";

export const ADMIN_PANEL_THEAD_ROW_CLASS = "bg-ad-purple text-white";

export const ADMIN_PANEL_TH_CLASS =
  "border border-ad-purple-dark px-3 py-2 text-left font-medium";

export const ADMIN_PANEL_TH_CHECKBOX_CLASS =
  "border border-ad-purple-dark px-2 py-2 text-left";

export const ADMIN_PANEL_TD_CLASS =
  "border border-gray-300 px-3 py-2 align-middle text-[13px] text-[#555]";

export const ADMIN_PANEL_TD_CHECKBOX_CLASS =
  "border border-gray-300 px-2 py-2 align-middle";

export const ADMIN_PANEL_TABLE_COMPACT_CLASS = "w-full border-collapse text-xs";

export const ADMIN_PANEL_TH_COMPACT_CLASS =
  "border border-ad-purple-dark px-2 py-1 text-left text-xs font-medium";

export const ADMIN_PANEL_TH_CHECKBOX_COMPACT_CLASS =
  "border border-ad-purple-dark px-2 py-1 text-left";

export const ADMIN_PANEL_TD_COMPACT_CLASS =
  "border border-gray-300 px-2 py-1 align-middle text-xs text-[#555]";

export const ADMIN_PANEL_TD_CHECKBOX_COMPACT_CLASS =
  "border border-gray-300 px-2 py-1 align-middle";

export type AdminPanelTableClasses = {
  table: string;
  th: string;
  thCheckbox: string;
  td: string;
  tdCheckbox: string;
};

export function adminPanelTableClasses(compact = false): AdminPanelTableClasses {
  return compact
    ? {
        table: ADMIN_PANEL_TABLE_COMPACT_CLASS,
        th: ADMIN_PANEL_TH_COMPACT_CLASS,
        thCheckbox: ADMIN_PANEL_TH_CHECKBOX_COMPACT_CLASS,
        td: ADMIN_PANEL_TD_COMPACT_CLASS,
        tdCheckbox: ADMIN_PANEL_TD_CHECKBOX_COMPACT_CLASS,
      }
    : {
        table: ADMIN_PANEL_TABLE_CLASS,
        th: ADMIN_PANEL_TH_CLASS,
        thCheckbox: ADMIN_PANEL_TH_CHECKBOX_CLASS,
        td: ADMIN_PANEL_TD_CLASS,
        tdCheckbox: ADMIN_PANEL_TD_CHECKBOX_CLASS,
      };
}

export function adminPanelRowClass(index: number): string {
  return index % 2 === 0 ? "bg-white" : "bg-gray-100";
}
