import { useEffect } from "react";
import { registerUnauthorizedHandler } from "../api/client";
import { AuthDebugPanel } from "./AuthDebugPanel";
import { useAuth } from "./useAuth";

/** Registers global auth side-effects (401 handler, dev panel). */
export function AuthSetup({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();

  useEffect(() => {
    registerUnauthorizedHandler(() => logout());
  }, [logout]);

  return (
    <>
      {children}
      <AuthDebugPanel />
    </>
  );
}

export default AuthSetup;
