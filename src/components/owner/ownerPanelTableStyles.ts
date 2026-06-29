import {
  adminPanelTableClasses,
  type AdminPanelTableClasses,
} from "../admin/adminPanelTableStyles";

const OWNER_TABLE_BASE = adminPanelTableClasses(true);

export const OWNER_PANEL_TABLE: AdminPanelTableClasses = {
  ...OWNER_TABLE_BASE,
  th: OWNER_TABLE_BASE.th.replace("px-2", "px-4"),
  td: OWNER_TABLE_BASE.td.replace("px-2", "px-4"),
};

export const OWNER_TABLE_HEAD_TH_CLASS = `${OWNER_PANEL_TABLE.th} h-9 py-0 align-middle`;
export const OWNER_TABLE_BODY_TD_CLASS = `${OWNER_PANEL_TABLE.td} h-9 py-0 align-middle whitespace-nowrap`;

export const OWNER_TABLE_SURFACE_CLASS =
  "shop-hero-surface overflow-hidden rounded border border-gray-300 bg-white shadow-sm";
