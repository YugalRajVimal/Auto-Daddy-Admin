import type { Portal } from "../types";
import { RequireAuth } from "./RequireAuth";

interface RequirePortalProps {
  portal: Portal;
  children: React.ReactNode;
  signInPath?: string;
  unauthorizedPath?: string;
}

/** Ensures the logged-in user's role belongs to the given portal. */
export function RequirePortal({
  portal,
  children,
  signInPath,
  unauthorizedPath = "/admin/unauthorized",
}: RequirePortalProps) {
  return (
    <RequireAuth portal={portal} signInPath={signInPath} unauthorizedPath={unauthorizedPath}>
      {children}
    </RequireAuth>
  );
}

export default RequirePortal;
