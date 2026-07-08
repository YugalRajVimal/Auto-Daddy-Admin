import React from "react";

export const MODULES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "users", label: "Users" },
  { key: "services", label: "Services" },
  { key: "categories", label: "Sub Services" },
  { key: "websiteTemplates", label: "Web - Temp" },
  { key: "dashboardData", label: "Dashboard Data" },
  { key: "carCompanies", label: "Car Companies" },
  { key: "provinces", label: "Provinces" },
  { key: "cities", label: "Cities" },
  { key: "domain", label: "Domain" },
  { key: "runningDeals", label: "Running Deals" },
  { key: "wallet", label: "Wallet" },
  { key: "inviteHelp", label: "Invite Help" },
  { key: "tasks", label: "Tasks" },
];

export const ACTIONS = ["view", "add", "edit", "delete"] as const;
export type Action = (typeof ACTIONS)[number];

export type ModulePermissions = Record<Action, boolean>;
export type Permissions = Record<string, ModulePermissions>;

export const DEFAULT_PERMS = (): Permissions =>
  Object.fromEntries(
    MODULES.map((m) => [m.key, { view: false, add: false, edit: false, delete: false }])
  );

const thStyle: React.CSSProperties = {
  border: "1px solid #d2d6de",
  background: "#f9fafc",
  padding: "10px 12px",
  textAlign: "left",
  fontWeight: 700,
  fontSize: 13,
  color: "#333",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  border: "1px solid #d2d6de",
  padding: "10px 12px",
  fontSize: 13,
  color: "#555",
  verticalAlign: "middle",
};

export function PermissionMatrix({
  permissions,
  onChange,
  readOnly,
}: {
  permissions: Permissions;
  onChange: (perms: Permissions) => void;
  readOnly?: boolean;
}) {
  const toggle = (mod: string, action: Action) => {
    onChange({ ...permissions, [mod]: { ...permissions[mod], [action]: !permissions[mod][action] } });
  };

  const toggleModule = (mod: string) => {
    const allOn = ACTIONS.every((a) => permissions[mod][a]);
    onChange({
      ...permissions,
      [mod]: Object.fromEntries(ACTIONS.map((a) => [a, !allOn])) as ModulePermissions,
    });
  };

  const toggleAll = () => {
    const totalOn = MODULES.every((m) => ACTIONS.every((a) => permissions[m.key]?.[a]));
    onChange(
      Object.fromEntries(
        MODULES.map((m) => [m.key, Object.fromEntries(ACTIONS.map((a) => [a, !totalOn]))])
      ) as Permissions
    );
  };

  const allOn = MODULES.every((m) => ACTIONS.every((a) => permissions[m.key]?.[a]));

  return (
    <div className="overflow-x-auto">
      <div className="mb-2 flex justify-end">
        {!readOnly && (
          <button
            type="button"
            onClick={toggleAll}
            className="cursor-pointer border-none bg-transparent p-0 text-xs text-blue-700 underline"
          >
            {allOn ? "Deselect All" : "Select All"}
          </button>
        )}
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th style={{ ...thStyle, width: 160 }}>Module</th>
            {ACTIONS.map((a) => (
              <th key={a} style={{ ...thStyle, textAlign: "center", textTransform: "capitalize" }}>
                {a}
              </th>
            ))}
            {!readOnly && <th style={{ ...thStyle, textAlign: "center" }}>All</th>}
          </tr>
        </thead>
        <tbody>
          {MODULES.map((mod, idx) => {
            const p = permissions[mod.key] || { view: false, add: false, edit: false, delete: false };
            const modAllOn = ACTIONS.every((a) => p[a]);
            return (
              <tr key={mod.key} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{mod.label}</td>
                {ACTIONS.map((a) => (
                  <td key={a} style={{ ...tdStyle, textAlign: "center" }}>
                    {readOnly ? (
                      <span className={p[a] ? "font-bold text-ad-green" : "font-bold text-red-600"}>
                        {p[a] ? "✓" : "✗"}
                      </span>
                    ) : (
                      <input
                        type="checkbox"
                        checked={!!p[a]}
                        onChange={() => toggle(mod.key, a)}
                        className="h-4 w-4 cursor-pointer accent-ad-purple"
                      />
                    )}
                  </td>
                ))}
                {!readOnly && (
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <button
                      type="button"
                      onClick={() => toggleModule(mod.key)}
                      className={`cursor-pointer rounded border px-2 py-0.5 text-[11px] ${
                        modAllOn
                          ? "border-ad-purple bg-ad-purple text-white"
                          : "border-ad-purple bg-white text-ad-purple"
                      }`}
                    >
                      {modAllOn ? "Clear" : "All"}
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
