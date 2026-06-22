import { useState } from "react";
import useAuth from "./useAuth";

/** Dev-only floating panel showing current auth session. */
export function AuthDebugPanel() {
  const auth = useAuth();
  const [open, setOpen] = useState(false);

  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] font-mono text-xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded bg-gray-900 px-2 py-1 text-white shadow-lg hover:bg-gray-700"
      >
        auth {auth.role ?? "—"}
      </button>
      {open && (
        <pre className="mt-1 max-h-64 max-w-sm overflow-auto rounded border border-gray-300 bg-white p-2 text-[10px] shadow-lg">
          {JSON.stringify(
            {
              role: auth.role,
              isAuthenticated: auth.isAuthenticated,
              isAdmin: auth.isAdmin,
              isLoading: auth.isLoading,
              permissions: auth.permissions,
              profile: auth.profile,
              tokenPresent: !!auth.token,
            },
            null,
            2
          )}
        </pre>
      )}
    </div>
  );
}

export default AuthDebugPanel;
