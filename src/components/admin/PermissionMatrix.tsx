import React from "react";
import {
  PERMISSION_TREE,
  BASE_ACTIONS,
  subNavAnyTrue,
  buildDefaultPermissions,
  type Permissions,
  type BaseAction,
  type SubNavPermission,
} from "../../config/permissionModules";

// Re-exported so existing imports (e.g. AdminProfile.tsx) keep working
// against the real tree-shaped permissions object.
export const DEFAULT_PERMS = buildDefaultPermissions;
export type { Permissions };

const thStyle: React.CSSProperties = {
  border: "1px solid #d2d6de", background: "#f9fafc", padding: "8px 10px",
  textAlign: "center", fontWeight: 700, fontSize: 12, color: "#333", whiteSpace: "nowrap",
};
const tdStyle: React.CSSProperties = {
  border: "1px solid #d2d6de", padding: "8px 10px", fontSize: 12, color: "#555", verticalAlign: "middle",
};

export function PermissionMatrix({
  permissions,
  onChange,
  readOnly,
  permissionAll = false,
}: {
  permissions: Permissions;
  onChange: (perms: Permissions) => void;
  readOnly?: boolean;
  permissionAll?: boolean;
}) {
  const isSuperAdmin = !!permissionAll;
  const locked = readOnly || isSuperAdmin;

  const getSub = (navKey: string, subKey: string): SubNavPermission =>
    isSuperAdmin
      ? { view: true, create: true, update: true, delete: true }
      : permissions[navKey]?.subNav?.[subKey] ?? { view: false, create: false, update: false, delete: false };

  const toggleAction = (navKey: string, subKey: string, action: BaseAction) => {
    if (locked) return;
    const nav = permissions[navKey] ?? { view: false, subNav: {} };
    const sub = nav.subNav[subKey] ?? { view: false, create: false, update: false, delete: false };
    const nextSub = { ...sub, [action]: !sub[action] };
    onChange({
      ...permissions,
      [navKey]: {
        ...nav,
        subNav: { ...nav.subNav, [subKey]: nextSub },
        view: nav.view || subNavAnyTrue(nextSub),
      },
    });
  };

  const toggleSubRow = (navKey: string, subKey: string) => {
    if (locked) return;
    const sub = getSub(navKey, subKey);
    const allOn = BASE_ACTIONS.every((a) => !!sub[a]);
    const nextSub: SubNavPermission = { view: !allOn, create: !allOn, update: !allOn, delete: !allOn };
    const nav = permissions[navKey] ?? { view: false, subNav: {} };
    onChange({
      ...permissions,
      [navKey]: {
        ...nav,
        subNav: { ...nav.subNav, [subKey]: nextSub },
        view: nav.view || subNavAnyTrue(nextSub),
      },
    });
  };

  const toggleAll = () => {
    if (locked) return;
    const allOn = Object.entries(PERMISSION_TREE).every(([navKey, navDef]) =>
      Object.keys(navDef.subNav).every((subKey) => BASE_ACTIONS.every((a) => !!getSub(navKey, subKey)[a]))
    );
    const next: Permissions = {};
    for (const [navKey, navDef] of Object.entries(PERMISSION_TREE)) {
      next[navKey] = { view: !allOn, subNav: {} };
      for (const subKey of Object.keys(navDef.subNav)) {
        next[navKey].subNav[subKey] = { view: !allOn, create: !allOn, update: !allOn, delete: !allOn };
      }
    }
    onChange(next);
  };

  const allOn = isSuperAdmin
    ? true
    : Object.entries(PERMISSION_TREE).every(([navKey, navDef]) =>
        Object.keys(navDef.subNav).every((subKey) => BASE_ACTIONS.every((a) => !!getSub(navKey, subKey)[a]))
      );

  return (
    <div className="overflow-x-auto">
      <div className="mb-2 flex justify-end">
        {!locked && (
          <button type="button" onClick={toggleAll}
            className="cursor-pointer border-none bg-transparent p-0 text-xs text-blue-700 underline">
            {allOn ? "Deselect All" : "Select All"}
          </button>
        )}
        {isSuperAdmin && (
          <span className="mr-2 text-xs font-bold text-green-700">Super Admin: All permissions enabled</span>
        )}
      </div>

      {Object.entries(PERMISSION_TREE).map(([navKey, navDef]) => (
        <div key={navKey} className="mb-4">
          <div className="mb-1 text-xs font-bold text-ad-purple">{navDef.label}</div>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th style={{ ...thStyle, textAlign: "left", width: 180 }}>Module</th>
                {BASE_ACTIONS.map((a) => (
                  <th key={a} style={{ ...thStyle, textTransform: "capitalize" }}>{a}</th>
                ))}
                {!locked && <th style={thStyle}>All</th>}
              </tr>
            </thead>
            <tbody>
              {Object.entries(navDef.subNav).map(([subKey, subDef], idx) => {
                const sub = getSub(navKey, subKey);
                const rowAllOn = BASE_ACTIONS.every((a) => !!sub[a]);
                return (
                  <tr key={subKey} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{subDef.label}</td>
                    {BASE_ACTIONS.map((a) => (
                      <td key={a} style={{ ...tdStyle, textAlign: "center" }}>
                        <span className={sub[a] ? "font-bold text-ad-green" : "font-bold text-red-600"}>
                          {sub[a] ? "✓" : "✗"}
                        </span>
                        {!locked && (
                          <input
                            type="checkbox"
                            checked={!!sub[a]}
                            onChange={() => toggleAction(navKey, subKey, a)}
                            className="ml-2 h-4 w-4 cursor-pointer accent-ad-purple"
                          />
                        )}
                      </td>
                    ))}
                    {!locked && (
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <button type="button" onClick={() => toggleSubRow(navKey, subKey)}
                          className={`cursor-pointer rounded border px-2 py-0.5 text-[11px] ${
                            rowAllOn ? "border-ad-purple bg-ad-purple text-white" : "border-ad-purple bg-white text-ad-purple"
                          }`}>
                          {rowAllOn ? "Clear" : "All"}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}