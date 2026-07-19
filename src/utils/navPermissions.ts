// utils/navPermissions.ts
//
// Reads the flat "permission" blob from localStorage (set on login) and
// resolves dot-paths against it, e.g. "home" or "home.subNav.dashboard".

export type StoredPermissionNode = {
    view?: boolean;
    create?: boolean;
    update?: boolean;
    delete?: boolean;
    subNav?: Record<string, StoredPermissionNode>;
  };
  
  export type StoredPermissions = Record<string, StoredPermissionNode>;
  
  const PERMISSION_KEY = "permission";
  
  export function readStoredPermissions(): StoredPermissions | null {
    try {
      const raw = window.localStorage.getItem(PERMISSION_KEY);
      return raw ? (JSON.parse(raw) as StoredPermissions) : null;
    } catch {
      return null;
    }
  }
  
  /**
   * Resolves a dot-path like "home" or "home.subNav.dashboard" against the
   * stored permission object and returns its `view` flag.
   * - No path declared on the nav item -> always visible (true).
   * - Path declared but missing/unreadable from storage -> hidden (false), fail closed.
   */
  export function hasView(perms: StoredPermissions | null, path?: string): boolean {
    if (!path) return true;
    if (!perms) return false;
    const parts = path.split(".");
    let node: any = perms;
    for (const part of parts) {
      if (node == null) return false;
      node = node[part];
    }
    return node?.view === true;
  }