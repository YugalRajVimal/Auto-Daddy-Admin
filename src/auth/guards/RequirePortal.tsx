import type { Portal } from "../types";
import { RequireAuth } from "./RequireAuth";

interface RequirePortalProps {
  portal: Portal;
  children: React.ReactNode;
  unauthorizedPath?: string;
}

/** Ensures the logged-in user's role belongs to the given portal. */
export function RequirePortal({
  portal,
  children,
  unauthorizedPath = "/admin/unauthorized",
}: RequirePortalProps) {
  return (
    <RequireAuth portal={portal} unauthorizedPath={unauthorizedPath}>
      {children}
    </RequireAuth>
  );
}

export default RequirePortal;
